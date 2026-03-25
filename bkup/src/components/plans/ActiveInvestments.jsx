import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, PLANS } from '@/lib/planConfig';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  completed: { label: 'Concluído', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
};

export default function ActiveInvestments() {
  const { user } = useAuth();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: () => base44.entities.Investment.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  if (isLoading) return null;
  if (investments.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold" />
          Meus Investimentos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seus investimentos ativos e histórico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investments.map((inv) => {
          const plan = PLANS[inv.plan];
          const status = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
          const capPercent = inv.earning_cap > 0
            ? Math.min(((inv.total_earned || 0) / inv.earning_cap) * 100, 100)
            : 0;

          return (
            <div key={inv.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{plan?.name || inv.plan}</p>
                  <p className="text-2xl font-bold gold-text mt-1">{formatCurrency(inv.amount)}</p>
                </div>
                <Badge className={`text-xs border ${status.color}`}>{status.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Taxa Diária</p>
                  <p className="font-semibold text-gold">{(inv.current_daily_rate || 0).toFixed(2)}%</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Ganho</p>
                  <p className="font-semibold text-green-400">{formatCurrency(inv.total_earned || 0)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Teto (300%)</p>
                  <p className="font-semibold text-foreground">{formatCurrency(inv.earning_cap || 0)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Dias s/ saque</p>
                  <p className="font-semibold text-foreground">{inv.days_without_withdrawal || 0}</p>
                </div>
              </div>

              {inv.earning_cap > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso do teto</span>
                    <span>{capPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-gold-hover"
                      style={{ width: `${capPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {inv.activation_date && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Ativado em {format(new Date(inv.activation_date), 'dd/MM/yyyy')}
                </p>
              )}
              {!inv.activation_date && inv.status === 'pending' && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Aguardando confirmação do depósito
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}