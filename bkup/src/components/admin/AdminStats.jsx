import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/planConfig';
import { Users, DollarSign, TrendingUp, Clock } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';

export default function AdminStats() {
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['admin-investments'],
    queryFn: () => base44.entities.Investment.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 50),
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const pendingUsers = users.filter((u) => u.status === 'pending').length;
  const totalInvested = investments.filter((i) => i.status === 'active').reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingDeposits = transactions.filter((t) => t.type === 'deposit' && t.status === 'pending').length;
  const pendingWithdrawals = transactions.filter((t) => t.type === 'withdrawal' && t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatsCard title="Total Usuários" value={totalUsers} icon={Users} color="blue" isCurrency={false} />
        <StatsCard title="Usuários Ativos" value={activeUsers} icon={Users} color="green" isCurrency={false} />
        <StatsCard title="Pendentes Ativação" value={pendingUsers} icon={Clock} color="amber" isCurrency={false} />
        <StatsCard title="Total Investido" value={totalInvested} icon={DollarSign} color="gold" />
        <StatsCard title="Depósitos Pendentes" value={pendingDeposits} icon={TrendingUp} color="green" isCurrency={false} />
        <StatsCard title="Saques Pendentes" value={pendingWithdrawals} icon={TrendingUp} color="purple" isCurrency={false} />
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Atividade Recente</h3>
        <div className="space-y-2">
          {transactions.slice(0, 10).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{tx.user_name || tx.user_email}</p>
                <p className="text-xs text-muted-foreground capitalize">{tx.type?.replace(/_/g, ' ')} - {tx.status}</p>
              </div>
              <p className={`text-sm font-semibold ${['deposit', 'yield'].includes(tx.type) ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade</p>
          )}
        </div>
      </div>
    </div>
  );
}