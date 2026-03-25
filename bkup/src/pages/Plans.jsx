import React, { useState } from 'react';
import { PLANS, formatCurrency, getPlanForAmount } from '@/lib/planConfig';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PlanCard from '@/components/plans/PlanCard';
import ActiveInvestments from '@/components/plans/ActiveInvestments';
import InvestmentSuccessModal from '@/components/plans/InvestmentSuccessModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Plans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [successInvestment, setSuccessInvestment] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const investMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('createInvestment', {
        amount: data.amount,
        plan: data.plan,
        base_rate: data.base_rate,
        current_daily_rate: data.current_daily_rate,
        client_share: data.client_share,
        company_share: data.company_share,
        unlocked_levels: data.unlocked_levels,
      });
      return response.data.investment;
    },
    onSuccess: (investment) => {
      setSuccessInvestment(investment);
      setShowSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setShowDialog(false);
      setSelectedPlan(null);
      setAmount('');
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao realizar investimento.');
    },
  });

  const handleSelectPlan = (planKey) => {
    setSelectedPlan(planKey);
    setAmount('');
    setShowDialog(true);
  };

  const handleInvest = () => {
    const plan = PLANS[selectedPlan];
    const value = parseFloat(amount);

    if (!value || value < plan.min || value > plan.max) {
      toast.error(`Valor deve estar entre ${formatCurrency(plan.min)} e ${formatCurrency(plan.max)}`);
      return;
    }

    const availableBalance = user?.available_balance || 0;
    if (value > availableBalance) {
      toast.error(`Saldo insuficiente. Disponível: ${formatCurrency(availableBalance)}`);
      return;
    }

    const unlockedLevels = Math.min(Math.floor(value / 100), 20);

    investMutation.mutate({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      plan: selectedPlan,
      amount: value,
      status: 'pending',
      base_rate: plan.baseRate,
      current_daily_rate: plan.minRate || 0.2,
      earning_cap: value * 3,
      client_share: plan.clientShare,
      company_share: plan.companyShare,
      unlocked_levels: unlockedLevels,
      deposit_confirmed: false,
    });
  };

  const planEntries = Object.entries(PLANS).filter(([k]) => !k.startsWith('leadership'));
  const leadershipEntries = Object.entries(PLANS).filter(([k]) => k.startsWith('leadership'));
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planos de Investimento</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para seus objetivos</p>
      </div>

      <ActiveInvestments />

      <div>
        <h2 className="text-xl font-bold text-foreground">Planos Disponíveis</h2>
        <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para seus objetivos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-0">
        {planEntries.map(([key, plan]) => (
          <PlanCard key={key} planKey={key} plan={plan} onSelect={handleSelectPlan} />
        ))}
      </div>

      {isAdmin && leadershipEntries.length > 0 && (
        <>
          <div>
            <h2 className="text-xl font-bold text-foreground">Contas de Liderança</h2>
            <p className="text-sm text-muted-foreground mt-1">Para quem quer ganhar com a rede sem rentabilidade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leadershipEntries.map(([key, plan]) => (
              <PlanCard key={key} planKey={key} plan={plan} onSelect={handleSelectPlan} />
            ))}
          </div>
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Investir no plano {selectedPlan ? PLANS[selectedPlan]?.name : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Faixa: {formatCurrency(PLANS[selectedPlan].min)} - {formatCurrency(PLANS[selectedPlan].max)}
                </p>
                <p className="text-sm font-semibold text-green-400">
                  Saldo: {formatCurrency(user?.available_balance || 0)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Valor do investimento (USD)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: ${PLANS[selectedPlan].min}`}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              {amount && parseFloat(amount) >= 100 && (
                <p className="text-xs text-muted-foreground">
                  Níveis liberados: {Math.min(Math.floor(parseFloat(amount) / 100), 20)}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleInvest}
              disabled={investMutation.isPending}
              className="bg-gold hover:bg-gold-hover text-primary-foreground"
            >
              {investMutation.isPending ? 'Processando...' : 'Confirmar Investimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvestmentSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        investment={successInvestment}
        plan={selectedPlan ? PLANS[selectedPlan] : null}
      />
    </div>
  );
}