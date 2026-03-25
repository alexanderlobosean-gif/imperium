import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/planConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => base44.entities.Transaction.filter({ type: 'withdrawal' }, '-created_date', 50),
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      toast.success('Saque atualizado');
    },
  });

  const handleApprove = async (withdrawal) => {
    updateTransaction.mutate({
      id: withdrawal.id,
      data: { status: 'approved', processed_date: new Date().toISOString() },
    });

    // Deduct from user balance
    const users = await base44.entities.User.filter({ email: withdrawal.user_email });
    if (users.length > 0) {
      const u = users[0];
      await base44.entities.User.update(u.id, {
        available_balance: Math.max(0, (u.available_balance || 0) - withdrawal.amount),
      });
    }
  };

  const handleReject = (withdrawal) => {
    updateTransaction.mutate({
      id: withdrawal.id,
      data: { status: 'rejected', processed_date: new Date().toISOString() },
    });
  };

  const pending = withdrawals.filter((w) => w.status === 'pending');
  const processed = withdrawals.filter((w) => w.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          Saques Pendentes
          {pending.length > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">{pending.length}</Badge>
          )}
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum saque pendente</p>
        ) : (
          <div className="space-y-3">
            {pending.map((w) => (
              <div key={w.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{w.user_name || w.user_email}</p>
                    <p className="text-xs text-muted-foreground">{w.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-400">{formatCurrency(w.amount)}</p>
                    {w.fee > 0 && <p className="text-xs text-muted-foreground">Taxa: {formatCurrency(w.fee)}</p>}
                    {w.penalty > 0 && <p className="text-xs text-red-400">Multa: {formatCurrency(w.penalty)}</p>}
                    <p className="text-xs text-green-400">Líquido: {formatCurrency(w.net_amount)}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>Carteira: <span className="font-mono text-foreground break-all">{w.crypto_wallet || 'N/A'}</span></span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleApprove(w)} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                    <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(w)} className="text-red-400 border-red-500/30 hover:bg-red-500/10 flex-1">
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Histórico de Saques</h3>
        <div className="space-y-2">
          {processed.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{w.user_name || w.user_email}</p>
                <p className="text-xs text-muted-foreground">
                  {w.created_date ? format(new Date(w.created_date), 'dd/MM/yyyy') : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(w.amount)}</p>
                <Badge variant="outline" className={w.status === 'approved' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}>
                  {w.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                </Badge>
              </div>
            </div>
          ))}
          {processed.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum histórico</p>
          )}
        </div>
      </div>
    </div>
  );
}