import React from 'react';
// import { base44 } from '@/api/base44Client'; // Removido - agora usa Supabase
import { supabase } from '@/lib/supabase'; // Adicionado
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/planConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDeposits() {
  const queryClient = useQueryClient();

  const { data: deposits = [] } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: () => base44.entities.Transaction.filter({ type: 'deposit' }, '-created_date', 50),
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Transação atualizada');
    },
  });

  const handleApprove = async (deposit) => {
    updateTransaction.mutate({
      id: deposit.id,
      data: {
        status: 'approved',
        processed_date: new Date().toISOString(),
      },
    });

    // Update user balance — apenas credita saldo disponível (cliente usará para comprar plano)
    const users = await base44.entities.User.filter({ email: deposit.user_email });
    if (users.length > 0) {
      const u = users[0];
      await base44.entities.User.update(u.id, {
        available_balance: (u.available_balance || 0) + deposit.amount,
        status: 'active',
      });
    }

  };

  const handleReject = (deposit) => {
    updateTransaction.mutate({
      id: deposit.id,
      data: {
        status: 'rejected',
        processed_date: new Date().toISOString(),
      },
    });
  };

  const pending = deposits.filter((d) => d.status === 'pending');
  const processed = deposits.filter((d) => d.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          Depósitos Pendentes
          {pending.length > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">{pending.length}</Badge>
          )}
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum depósito pendente</p>
        ) : (
          <div className="space-y-3">
            {pending.map((d) => (
              <div key={d.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.user_name || d.user_email}</p>
                    <p className="text-xs text-muted-foreground">{d.user_email}</p>
                  </div>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(d.amount)}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>TXID: <span className="font-mono text-foreground">{d.txid || 'N/A'}</span></span>
                  <span>{d.created_date ? format(new Date(d.created_date), 'dd/MM/yyyy HH:mm') : ''}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleApprove(d)} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                    <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(d)} className="text-red-400 border-red-500/30 hover:bg-red-500/10 flex-1">
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Histórico de Depósitos</h3>
        <div className="space-y-2">
          {processed.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{d.user_name || d.user_email}</p>
                <p className="text-xs text-muted-foreground">
                  {d.created_date ? format(new Date(d.created_date), 'dd/MM/yyyy') : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(d.amount)}</p>
                <Badge variant="outline" className={d.status === 'approved' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}>
                  {d.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
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