import React from 'react';
import { useAuth } from '@/lib/AuthContext';
// import { base44 } from '@/api/base44Client'; // Removido - agora usa Supabase
import { supabase } from '@/lib/supabase'; // Adicionado
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
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

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
      const [deposits, withdrawals] = await Promise.all([
        supabase
          .from('deposits')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);
      
      const allTransactions = [
        ...(deposits.data || []).map(d => ({ ...d, type: 'deposit' })),
        ...(withdrawals.data || []).map(w => ({ ...w, type: 'withdrawal' }))
      ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      return allTransactions.slice(0, 10);
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

  const activeInvestment = investments.find((i) => i.status === 'active');
  const totalInvested = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalEarnings = user?.total_earnings || 0;
  const networkEarnings = networkMembers.reduce((sum, m) => {
    const inv = investmentByUser[m.referred_id];
    const pct = (RESIDUAL_PERCENTAGES[m.level] || 0) / 100;
    return sum + (inv?.total_earned || 0) * pct;
  }, 0);
  // Saldo disponível = saldo aportado (deposits aprovados - planos comprados) + rendimentos + ganhos de rede
  const depositBalance = user?.available_balance || 0;
  const availableBalance = depositBalance + totalEarnings + networkEarnings;
  const totalValue = availableBalance;

  const referralLink = user?.referral_code
    ? `${window.location.origin}?ref=${user.referral_code}`
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
        <StatsCard title="Valor Investido" value={totalInvested} icon={TrendingUp} color="blue" />
        <StatsCard title="Rendimento" value={totalEarnings} icon={TrendingUp} color="green" />
        <StatsCard title="Ganhos de Rede" value={networkEarnings} icon={Users} color="purple" />
        <StatsCard title="Saldo Disponível" value={availableBalance} icon={Wallet} color="amber" />
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