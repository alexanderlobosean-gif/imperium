import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/planConfig';

// Fetch dashboard statistics (usando supabaseAdmin para bypass RLS)
const fetchDashboardStats = async () => {
  const [
    usersResult,
    depositsResult,
    withdrawalsResult,
    investmentsResult,
    yieldsResult,
    profilesResult
  ] = await Promise.all([
    // Total users
    supabaseAdmin.from('profiles').select('id').eq('status', 'active'),
    // Total deposits
    supabaseAdmin.from('deposits').select('amount').eq('status', 'confirmed'),
    // Total withdrawals
    supabaseAdmin.from('withdrawals').select('amount').eq('status', 'confirmed'),
    // Active investments
    supabaseAdmin.from('investments').select('amount, status').eq('status', 'active'),
    // Today's yields
    supabaseAdmin.from('yields').select('amount').gte('date', new Date().toISOString().split('T')[0]),
    // Wallet data - total available balance
    supabaseAdmin.from('profiles').select('available_balance, total_earned, total_invested, total_withdrawn')
  ]);

  const totalWalletBalance = profilesResult.data?.reduce((sum, p) => sum + parseFloat(p.available_balance || 0), 0) || 0;
  const totalEarned = profilesResult.data?.reduce((sum, p) => sum + parseFloat(p.total_earned || 0), 0) || 0;
  const totalInvested = profilesResult.data?.reduce((sum, p) => sum + parseFloat(p.total_invested || 0), 0) || 0;
  const totalWithdrawn = profilesResult.data?.reduce((sum, p) => sum + parseFloat(p.total_withdrawn || 0), 0) || 0;

  const stats = {
    totalUsers: usersResult.data?.length || 0,
    totalDeposits: depositsResult.data?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0,
    totalWithdrawals: withdrawalsResult.data?.reduce((sum, w) => sum + parseFloat(w.amount), 0) || 0,
    activeInvestments: investmentsResult.data?.reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0,
    todayYields: yieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.amount), 0) || 0,
    activeInvestmentsCount: investmentsResult.data?.length || 0,
    // New wallet stats
    totalWalletBalance: totalWalletBalance,
    totalEarned: totalEarned,
    totalInvested: totalInvested,
    totalWithdrawn: totalWithdrawn,
  };

  // Calculate net balance
  stats.netBalance = stats.totalDeposits - stats.totalWithdrawals;

  // Get recent activity
  const [recentDeposits, recentWithdrawals, recentUsers] = await Promise.all([
    supabaseAdmin.from('deposits').select('*').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('withdrawals').select('*').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)
  ]);

  stats.recentActivity = [
    ...recentDeposits.data?.map(d => ({ ...d, type: 'deposit' })) || [],
    ...recentWithdrawals.data?.map(w => ({ ...w, type: 'withdrawal' })) || [],
    ...recentUsers.data?.map(u => ({ ...u, type: 'user' })) || []
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  return stats;
};

export default function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Saldo Total da Carteira',
      value: formatCurrency(stats?.totalWalletBalance || 0),
      icon: Wallet,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Investido',
      value: formatCurrency(stats?.totalInvested || 0),
      icon: TrendingUp,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
      borderColor: 'border-gold/30',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Total Ganho em Rendimentos',
      value: formatCurrency(stats?.totalEarned || 0),
      icon: ArrowUpRight,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      change: '+20%',
      changeType: 'positive'
    },
    {
      title: 'Total Depositado',
      value: formatCurrency(stats?.totalDeposits || 0),
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Sacado',
      value: formatCurrency(stats?.totalWithdrawals || 0),
      icon: Wallet,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Investimentos Ativos',
      value: formatCurrency(stats?.activeInvestments || 0),
      icon: TrendingUp,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
      borderColor: 'border-gold/30',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Rendimentos Hoje',
      value: formatCurrency(stats?.todayYields || 0),
      icon: ArrowUpRight,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      change: '+20%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do sistema Imperium Club
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`border ${stat.borderColor} bg-gradient-to-br ${stat.bgColor} to-transparent`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-background/50`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center text-xs ${stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.changeType === 'positive' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {stat.change}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'deposit' ? 'bg-green-400' :
                    activity.type === 'withdrawal' ? 'bg-red-400' : 'bg-blue-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {activity.type === 'deposit' ? 'Depósito' :
                       activity.type === 'withdrawal' ? 'Saque' : 'Novo Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.type === 'user' ? activity.full_name || activity.email : 
                       activity.type === 'deposit' ? `R$ ${parseFloat(activity.amount || 0).toFixed(2)}` :
                       `R$ ${parseFloat(activity.amount || 0).toFixed(2)}`}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
