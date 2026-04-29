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
    queryFn: async () => {
      console.log('🔍 Fetching direct commissions for user:', user?.id);
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('commission_type', 'direct')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching referral bonuses:', error);
        return [];
      }
      
      console.log('✅ Commissions found:', data?.length || 0, data);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalBonuses = bonuses.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Gift className="w-4 h-4 text-gold" />
          Direct Referral Earnings (10%)
        </h3>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total received</p>
          <p className="text-lg font-bold text-gold">{formatCurrency(totalBonuses)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : bonuses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No referral bonuses received yet
        </p>
      ) : (
        <div className="space-y-2">
          {bonuses.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{b.description || 'Referral bonus'}</p>
                <p className="text-xs text-muted-foreground">
                  {b.created_at ? format(new Date(b.created_at), 'dd/MM/yyyy HH:mm') : ''}
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