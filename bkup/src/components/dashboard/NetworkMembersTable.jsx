import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, RESIDUAL_PERCENTAGES } from '@/lib/planConfig';
import { Users } from 'lucide-react';

export default function NetworkMembersTable() {
  const { user } = useAuth();

  const { data: networkMembers = [] } = useQuery({
    queryKey: ['network', user?.id],
    queryFn: () => base44.entities.NetworkRelation.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: allInvestments = [] } = useQuery({
    queryKey: ['all-investments'],
    queryFn: () => base44.entities.Investment.filter({ status: 'active' }),
    enabled: !!user?.id,
  });

  // Map investment by user_id
  const investmentByUser = {};
  allInvestments.forEach((inv) => {
    investmentByUser[inv.user_id] = inv;
  });

  const totalInvested = networkMembers.reduce((sum, m) => {
    const inv = investmentByUser[m.referred_id];
    return sum + (inv?.amount || 0);
  }, 0);

  const totalYield = totalInvested * 0.01;

  if (networkMembers.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-400" />
        Membros da Rede — Rendimento do Dia (1%)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Nível</th>
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Nome</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Investido</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Rendimento (1%)</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Total Gerado</th>
            </tr>
          </thead>
          <tbody>
            {networkMembers.sort((a, b) => a.level - b.level).map((member) => {
              const inv = investmentByUser[member.referred_id];
              const invested = inv?.amount || 0;
              const dailyYield = invested * 0.01;
              const levelPct = (RESIDUAL_PERCENTAGES[member.level] || 0) / 100;
              const myEarning = (inv?.total_earned || 0) * levelPct;
              return (
                <tr key={member.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                  <td className="py-2 px-3">
                    <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      N{member.level}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <p className="font-medium text-foreground">{member.referred_name}</p>
                    <p className="text-xs text-muted-foreground">{member.referred_email}</p>
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-gold">
                    {invested > 0 ? formatCurrency(invested) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-green-400">
                    {invested > 0 ? `+${formatCurrency(dailyYield)}` : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-2 px-3 text-right text-muted-foreground">
                    <span className="text-xs text-muted-foreground mr-1">({(levelPct * 100).toFixed(1)}%)</span>
                    {formatCurrency(myEarning)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={2} className="py-3 px-3 text-sm font-semibold text-foreground">Total</td>
              <td className="py-3 px-3 text-right font-bold text-gold">{formatCurrency(totalInvested)}</td>
              <td className="py-3 px-3 text-right font-bold text-green-400">+{formatCurrency(totalYield)}</td>
              <td className="py-3 px-3 text-right font-bold text-muted-foreground">
                {formatCurrency(networkMembers.reduce((s, m) => {
                const inv = investmentByUser[m.referred_id];
                const pct = (RESIDUAL_PERCENTAGES[m.level] || 0) / 100;
                return s + (inv?.total_earned || 0) * pct;
              }, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}