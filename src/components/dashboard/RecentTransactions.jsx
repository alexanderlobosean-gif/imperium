import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/planConfig';
import { ArrowDownCircle, ArrowUpCircle, Send, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentTransactions({ transactions = [], limit = 5 }) {
  const { t } = useTranslation();

  const TYPE_CONFIG = {
    deposit: { label: t('transactions.types.deposit'), icon: ArrowDownCircle, color: 'text-green-400' },
    withdrawal: { label: t('transactions.types.withdrawal'), icon: ArrowUpCircle, color: 'text-red-400' },
    transfer: { label: t('transactions.types.transfer'), icon: Send, color: 'text-blue-400' },
    yield: { label: t('transactions.types.yield'), icon: TrendingUp, color: 'text-gold' },
    network_bonus: { label: t('transactions.types.network_bonus'), icon: Users, color: 'text-purple-400' },
    referral_bonus: { label: t('transactions.types.referral_bonus'), icon: Users, color: 'text-purple-400' },
    reinvestment: { label: t('transactions.types.reinvestment'), icon: RefreshCw, color: 'text-blue-400' },
    penalty: { label: t('transactions.types.penalty'), icon: ArrowUpCircle, color: 'text-red-400' },
    career_bonus: { label: t('transactions.types.career_bonus'), icon: TrendingUp, color: 'text-amber-400' },
    investment: { label: t('transactions.types.investment'), icon: TrendingUp, color: 'text-gold' },
  };

  const STATUS_LABELS = {
    pending: { label: t('status.pending'), color: 'bg-amber-500/10 text-amber-400' },
    approved: { label: t('status.approved'), color: 'bg-green-500/10 text-green-400' },
    rejected: { label: t('status.rejected'), color: 'bg-red-500/10 text-red-400' },
    completed: { label: t('status.completed'), color: 'bg-blue-500/10 text-blue-400' },
    active: { label: t('status.active'), color: 'bg-green-500/10 text-green-400' },
  };

  const items = transactions.slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.recentTransactions')}</h3>
        <p className="text-sm text-muted-foreground text-center py-8">{t('transactions.empty')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.recentTransactions')}</h3>
      <div className="space-y-3">
        {items.map((tx) => {
          const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.deposit;
          const status = STATUS_LABELS[tx.status] || STATUS_LABELS.pending;
          const isCredit = ['deposit', 'yield', 'network_bonus', 'referral_bonus', 'career_bonus'].includes(tx.type);

          return (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary`}>
                  <config.icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.created_date ? format(new Date(tx.created_date), 'dd/MM/yyyy HH:mm') : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                  {isCredit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}