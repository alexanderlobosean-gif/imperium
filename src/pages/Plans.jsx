import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, getPlanForAmount } from '@/lib/planConfig';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { financialAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlanCard from '@/components/plans/PlanCard';
import ActiveInvestments from '@/components/plans/ActiveInvestments';
import InvestmentSuccessModal from '@/components/plans/InvestmentSuccessModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Fetch plans from database via API
const fetchPlans = async () => {
  const data = await financialAPI.getPlans();
  return data.plans || [];
};

export default function Plans() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [successInvestment, setSuccessInvestment] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch plans from database
  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  });
  
  // Filtrar planos: não-admin só vê planos não-liderança
  const plans = allPlans.filter(plan => {
    // Se é plano de liderança e usuário não é admin, esconder
    if (plan.is_leadership && user?.role !== 'admin') {
      return false;
    }
    return true;
  });
  
  // Fetch confirmed deposits to calculate real available balance via API
  const { data: confirmedDeposits = [], error: depositsError } = useQuery({
    queryKey: ['confirmed-deposits', user?.id],
    queryFn: async () => {
      console.log('Fetching confirmed deposits via API for user:', user?.id);
      const transactions = await financialAPI.getTransactions({ type: 'deposit', status: 'confirmed' });
      return transactions.filter(t => t.status === 'confirmed');
    },
    enabled: !!user?.id,
  });
  
  if (depositsError) {
    console.error('Deposits query error:', depositsError);
  }
  
  // Fetch user investments via API
  const { data: investments = [], error: investmentsError } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      console.log('Fetching investments via API for user:', user?.id);
      const data = await financialAPI.getInvestments();
      return data.investments || [];
    },
    enabled: !!user?.id,
  });
  
  if (investmentsError) {
    console.error('Investments query error:', investmentsError);
  }
  
  // Buscar saldo real da API
  const { data: balanceData } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: async () => {
      return await financialAPI.getBalance();
    },
    enabled: !!user?.id,
  });
  
  const availableBalance = balanceData?.available_balance || 0;
  const totalInvested = investments.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  
  console.log('Balance from API:', { availableBalance, totalInvested });
  
  // Function to generate network commissions (direct and indirect)
  const generateNetworkCommissions = async (investment) => {
    try {
      const investmentAmount = parseFloat(investment.amount);
      
      // Get the full referral chain (up to 5 levels)
      let currentUserId = investment.user_id;
      let level = 1;
      const maxLevels = 5;
      
      while (level <= maxLevels) {
        // Get user's profile to find who referred them
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('referred_by')
          .eq('user_id', currentUserId)
          .single();
        
        if (!userProfile?.referred_by) {
          console.log(`No referrer found at level ${level} for user:`, currentUserId);
          break;
        }
        
        const referrerId = userProfile.referred_by;
        
        // Calculate commission rate based on level
        // Level 1: 10%, Level 2: 5%, Level 3: 3%, Level 4: 2%, Level 5: 1%
        const commissionRates = { 1: 0.10, 2: 0.05, 3: 0.03, 4: 0.02, 5: 0.01 };
        const commissionRate = commissionRates[level] || 0;
        const commissionAmount = investmentAmount * commissionRate;
        
        if (commissionAmount > 0) {
          // Create commission record - matching actual table schema
          const { error: commissionError } = await supabase
            .from('commissions')
            .insert({
              user_id: referrerId,
              source_user_id: investment.user_id,
              investment_id: investment.id,
              amount: commissionAmount,
              percentage: commissionRate * 100,
              commission_type: level === 1 ? 'direct' : 'residual',
              level: level,
              status: 'pending',
              created_at: new Date().toISOString(),
            });
          
          if (commissionError) {
            console.error(`Error creating level ${level} commission:`, commissionError);
          } else {
            console.log(`Level ${level} commission created:`, commissionAmount, 'for referrer:', referrerId);
          }
        }
        
        // Move up the chain
        currentUserId = referrerId;
        level++;
      }
    } catch (err) {
      console.error('Error generating network commissions:', err);
    }
  };

  const investMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating investment via API with data:', data);
      console.log('User ID:', user?.id);
      console.log('Plan data:', data?.plan);
      
      // Usar API para criar investimento
      const result = await financialAPI.createInvestment({
        plan_slug: data?.plan?.slug || data?.plan?.id || 'basic',
        amount: data?.amount,
        client_share: data?.plan?.client_share || 50,
        company_share: data?.plan?.company_share || 50,
        daily_yield: data?.plan?.base_rate || 0.01,
      });
      
      console.log('Investment created via API:', result);
      return result.investment;
    },
    onSuccess: async (investment) => {
      console.log('Investment mutation success:', investment);
      
      // Generate network commissions for this investment
      if (investment && investment.id) {
        await generateNetworkCommissions(investment);
      }
      
      setSuccessInvestment(investment);
      setShowSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['network'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowDialog(false);
      setSelectedPlan(null);
      setAmount('');
      toast.success('Investimento criado com sucesso!');
    },
    onError: (err) => {
      console.error('Investment mutation error:', err);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      toast.error(err?.message || 'Erro ao realizar investimento.');
    },
  });

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setAmount('');
    setShowDialog(true);
  };

  const handleInvest = () => {
    const plan = selectedPlan;
    const value = parseFloat(amount);

    if (!value || value < plan.min_amount || value > plan.max_amount) {
      toast.error(t('plans.valueBetween', { min: formatCurrency(plan.min_amount), max: formatCurrency(plan.max_amount) }));
      return;
    }

    if (value > availableBalance) {
      toast.error(t('plans.insufficientBalance', { balance: formatCurrency(availableBalance) }));
      return;
    }

    investMutation.mutate({
      plan: plan,
      amount: value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('plans.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('plans.subtitle')}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('plans.availableBalance')}</p>
            <p className="text-2xl font-bold text-gold">{formatCurrency(availableBalance)}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{t('plans.balance')}: {formatCurrency(availableBalance)}</p>
            <p>{t('plans.invested')}: {formatCurrency(totalInvested)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={{
              ...plan,
              min: plan.min_amount,
              max: plan.max_amount,
              baseRate: plan.base_rate * 100, // Convert to percentage
              minRate: plan.min_rate * 100,
              maxRate: plan.max_rate * 100,
              clientShare: plan.client_share,
              companyShare: plan.company_share,
              directCommission: plan.direct_commission,
              reinvestmentCommission: plan.reinvestment_commission,
              residualLevels: plan.residual_levels,
              color: plan.color,
              icon: plan.icon,
              isMostPopular: plan.is_most_popular,
              isLeadership: plan.is_leadership,
            }}
            onSelect={() => handleSelectPlan(plan)}
          />
        ))}
      </div>

      <ActiveInvestments />

      <InvestmentSuccessModal
        investment={successInvestment}
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('plans.confirmInvestment')}</DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('plans.selectedPlan')}</p>
                <p className="font-medium">{selectedPlan.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">{t('plans.minAmount')}</p>
                <p className="font-medium">{formatCurrency(selectedPlan.min_amount)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">{t('plans.maxAmount')}</p>
                <p className="font-medium">{formatCurrency(selectedPlan.max_amount)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('plans.investmentAmount')}</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('plans.enterAmount')}
                  min={selectedPlan.min_amount}
                  max={selectedPlan.max_amount}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('plans.cancel')}
            </Button>
            <Button 
              onClick={handleInvest} 
              disabled={investMutation.isPending}
            >
              {investMutation.isPending ? t('plans.processing') : t('plans.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
