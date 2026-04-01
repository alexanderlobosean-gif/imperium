import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { financialAPI } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Wallet, Copy, CheckCheck } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ProfitabilityClock from '@/components/dashboard/ProfitabilityClock';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import NetworkMembersTable from '@/components/dashboard/NetworkMembersTable';
import { formatCurrency, RESIDUAL_PERCENTAGES } from '@/lib/planConfig';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  // Redirect para login se não autenticado
  React.useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      console.log('Dashboard: Usuário não autenticado, redirecionando para login...');
      navigate('/login', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  // Não renderiza nada enquanto carrega ou se não autenticado
  if (isLoadingAuth || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  React.useEffect(() => {
    if (!user?.id) return;

    const processNewUser = async () => {
      const isNew = localStorage.getItem('just_registered') === 'true';
      const refCode = localStorage.getItem('referral_code');

      if (isNew) {
        localStorage.removeItem('just_registered');
        toast.success('🎉 Cadastro aprovado! Bem-vindo ao Imperium Club!', { duration: 6000 });
      }

      // Always try to link referral if code exists (even if just_registered was lost)
      if (refCode) {
        localStorage.removeItem('referral_code');
        try {
          // TODO: Implementar função de vinculação de indicação com Supabase
          console.log('Referral code to link:', refCode);
        } catch (e) {
          console.error('Erro ao vincular indicação:', e);
        }
      }
    };

    processNewUser().catch(console.error);
  }, [user?.id]);

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: networkMembers = [] } = useQuery({
    queryKey: ['network', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('referred_by', user?.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const txs = await financialAPI.getTransactions({ limit: 20 });
      return txs.slice(0, 10);
    },
    enabled: !!user?.id,
  });

  const networkMemberIds = networkMembers.map((m) => m.referred_id).filter(Boolean);

  const { data: networkInvestments = [] } = useQuery({
    queryKey: ['network-investments', networkMemberIds.join(',')],
    queryFn: async () => {
      const { data } = await supabase
        .from('investments')
        .select('*')
        .eq('status', 'active');
      return data || [];
    },
    enabled: networkMemberIds.length > 0,
  });

  const investmentByUser = {};
  networkInvestments.forEach((inv) => { investmentByUser[inv.user_id] = inv; });

  // Calcular totais reais a partir dos investimentos
  const totalInvested = investments.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const totalEarnings = investments.reduce((sum, i) => sum + (parseFloat(i.total_earned) || 0), 0);

  // Saldo disponível via API
  const { data: balanceData } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: async () => {
      return await financialAPI.getBalance();
    },
    enabled: !!user?.id,
  });

  const availableBalance = balanceData?.available_balance || 0;

  const activeInvestment = investments.find((i) => i.status === 'active');
  const networkEarnings = networkMembers.reduce((sum, m) => {
    const inv = investmentByUser[m.referred_id];
    const pct = (RESIDUAL_PERCENTAGES[m.level] || 0) / 100;
    return sum + (inv?.total_earned || 0) * pct;
  }, 0);
  const totalValue = availableBalance;

  const referralLink = user?.referral_code
    ? `${window.location.origin}/register?ref=${user.referral_code}`
    : '';

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, <span className="gold-text">{user?.full_name?.split(' ')[0] || 'Usuário'}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Bem-vindo ao seu painel Imperium Club</p>
      </div>

      {/* Referral link */}
      {referralLink && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-gold/20 bg-gold/5">
          <span className="text-xs text-muted-foreground flex-shrink-0">Seu link:</span>
          <span className="text-xs text-gold truncate flex-1">{referralLink}</span>
          <button onClick={handleCopyLink} className="flex-shrink-0 p-1.5 rounded-md hover:bg-gold/10 transition">
            {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gold" />}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Valor Investido" value={totalInvested} icon={TrendingUp} color="blue" subtitle="" />
        <StatsCard title="Rendimento" value={totalEarnings} icon={TrendingUp} color="green" subtitle="" />
        <StatsCard title="Ganhos de Rede" value={networkEarnings} icon={Users} color="purple" subtitle="" />
        <StatsCard title="Saldo Disponível" value={availableBalance} icon={Wallet} color="amber" subtitle="" />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfitabilityClock investment={activeInvestment} />
        <RecentTransactions transactions={transactions} />
      </div>

      {/* Network Members Table */}
      <NetworkMembersTable />
    </div>
  );
}