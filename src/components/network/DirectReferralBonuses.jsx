import React from 'react';
import { useAuth } from '@/lib/AuthContext';
// import { base44 } from '@/api/base44Client'; // Removido - agora usa Supabase
import { supabase } from '@/lib/supabase'; // Adicionado
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/planConfig';
import { Gift } from 'lucide-react';
import { format } from 'date-fns';

export default function DirectReferralBonuses() {
  const { user } = useAuth();

  const { data: bonuses = [], isLoading } = useQuery({
    queryKey: ['referral-bonuses', user?.id],
    queryFn: () => base44.entities.Transaction.filter(
      { user_id: user?.id, type: 'referral_bonus' },
      '-created_date',
      50
    ),
    enabled: !!user?.id,
  });

  const totalBonuses = bonuses.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Gift className="w-4 h-4 text-gold" />
          Ganhos de Indicação Direta (10%)
        </h3>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total recebido</p>
          <p className="text-lg font-bold text-gold">{formatCurrency(totalBonuses)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
      ) : bonuses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum bônus de indicação recebido ainda
        </p>
      ) : (
        <div className="space-y-2">
          {bonuses.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{b.description || 'Bônus de indicação'}</p>
                <p className="text-xs text-muted-foreground">
                  {b.created_date ? format(new Date(b.created_date), 'dd/MM/yyyy HH:mm') : ''}
                </p>
              </div>
              <p className="text-sm font-bold text-gold">+{formatCurrency(b.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}