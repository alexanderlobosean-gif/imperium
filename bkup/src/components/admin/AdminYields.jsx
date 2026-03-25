import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/planConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminYields() {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: investments = [] } = useQuery({
    queryKey: ['admin-investments-active'],
    queryFn: () => base44.entities.Investment.filter({ status: 'active' }),
  });

  const totalToDistribute = investments.reduce((sum, inv) => {
    const dailyRate = parseFloat(rate) || 0;
    return sum + (inv.amount * dailyRate / 100);
  }, 0);

  const handleApplyYield = async () => {
    const dailyRate = parseFloat(rate);
    if (!dailyRate || dailyRate <= 0 || dailyRate > 10) {
      toast.error('Informe uma taxa válida entre 0.01% e 10%');
      return;
    }

    setProcessing(true);
    try {
      for (const inv of investments) {
        const yieldAmount = inv.amount * dailyRate / 100;
        const newTotalEarned = (inv.total_earned || 0) + yieldAmount;
        const capReached = inv.earning_cap > 0 && newTotalEarned >= inv.earning_cap;

        // Update investment
        await base44.entities.Investment.update(inv.id, {
          total_earned: capReached ? inv.earning_cap : newTotalEarned,
          current_daily_rate: dailyRate,
          days_without_withdrawal: (inv.days_without_withdrawal || 0) + 1,
          status: capReached ? 'completed' : 'active',
          cap_percentage_reached: inv.earning_cap > 0
            ? Math.min((newTotalEarned / inv.earning_cap) * 100, 100)
            : 0,
        });

        // Create yield transaction
        await base44.entities.Transaction.create({
          user_id: inv.user_id,
          user_email: inv.user_email,
          user_name: inv.user_name,
          type: 'yield',
          amount: capReached ? Math.max(inv.earning_cap - (inv.total_earned || 0), 0) : yieldAmount,
          net_amount: capReached ? Math.max(inv.earning_cap - (inv.total_earned || 0), 0) : yieldAmount,
          status: 'completed',
          investment_id: inv.id,
          description: `Rendimento diário de ${dailyRate}% - ${format(new Date(), 'dd/MM/yyyy')}`,
        });

        // Update user total_earnings
        const user = await base44.entities.User.list();
        const targetUser = user.find(u => u.id === inv.user_id);
        if (targetUser) {
          const earnedNow = capReached ? Math.max(inv.earning_cap - (inv.total_earned || 0), 0) : yieldAmount;
          await base44.entities.User.update(targetUser.id, {
            total_earnings: (targetUser.total_earnings || 0) + earnedNow,
          });
        }
      }

      toast.success(`Rendimento de ${dailyRate}% aplicado para ${investments.length} investimento(s)!`);
      queryClient.invalidateQueries({ queryKey: ['admin-investments-active'] });
      setRate('');
    } catch (error) {
      toast.error('Erro ao aplicar rendimentos: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Apply yield form */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gold" />
          Aplicar Rendimento do Dia
        </h3>

        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1 block">
                Taxa de Rendimento (%)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="10"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Ex: 0.30"
                className="bg-secondary border-border"
              />
            </div>
            <Button
              onClick={handleApplyYield}
              disabled={processing || !rate || investments.length === 0}
              className="bg-gold hover:bg-gold-hover text-primary-foreground"
            >
              {processing ? 'Processando...' : 'Aplicar Rendimento'}
            </Button>
          </div>

          {rate && parseFloat(rate) > 0 && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Investimentos ativos</p>
                <p className="text-xl font-bold text-foreground">{investments.length}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Taxa aplicada</p>
                <p className="text-xl font-bold text-gold">{parseFloat(rate).toFixed(2)}%</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Total a distribuir</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(totalToDistribute)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active investments list */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">
          Investimentos Ativos ({investments.length})
        </h3>
        {investments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum investimento ativo</p>
        ) : (
          <div className="space-y-2">
            {investments.map((inv) => {
              const preview = rate ? inv.amount * parseFloat(rate) / 100 : 0;
              return (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.user_name || inv.user_email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{inv.plan} — {formatCurrency(inv.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(inv.total_earned || 0)} ganho</p>
                    {preview > 0 && (
                      <p className="text-xs text-green-400">+{formatCurrency(preview)} hoje</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}