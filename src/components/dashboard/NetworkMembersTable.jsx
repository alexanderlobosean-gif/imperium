import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { financialAPI } from '@/services/api'; // Usar API em vez de Supabase direto
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, getCommissionRate } from '@/lib/planConfig';
import { Users } from 'lucide-react';

export default function NetworkMembersTable() {
  const { user } = useAuth();

  // Usar API para buscar rede e investimentos (bypass RLS)
  const { data: networkData = {}, isLoading: isLoadingNetwork, error: networkError } = useQuery({
    queryKey: ['network', user?.id],
    queryFn: async () => {
      if (!user?.id) return { network: [], indirectInvestments: {} };
      
      console.log('Buscando dados da rede via API para user:', user.id);
      
      const data = await financialAPI.getNetwork();
      console.log('Dados da rede recebidos:', data);
      
      return data;
    },
    enabled: !!user?.id,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const networkMembers = networkData.network || [];
  // indirectInvestments já vem como { user_id: investment } da API
  const investmentByUser = networkData.indirectInvestments || {};

  // Converter indirectInvestments (objeto) para array
  const allInvestments = Object.values(investmentByUser);

  // Debug logs
  console.log('🔍 DEBUG NetworkMembersTable:');
  console.log('  - networkMembers:', networkMembers);
  console.log('  - allInvestments:', allInvestments);
  console.log('  - investmentByUser:', investmentByUser);

  const totalInvested = (Array.isArray(networkMembers) ? networkMembers : []).reduce((sum, m) => {
    const inv = investmentByUser[m.referred_id];
    console.log(`  - Membro ${m.referred_name} (${m.referred_id}):`, inv);
    return sum + (inv?.amount || 0);
  }, 0);

  const totalYield = totalInvested * 0.01;

  if (networkMembers.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-400" />
        Network Members — Daily Yield (1%)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Level</th>
              <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Name</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Invested</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Yield (1%)</th>
              <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Total Generated</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(networkMembers) ? networkMembers : []).sort((a, b) => a.level - b.level).map((member) => {
              const inv = investmentByUser[member.referred_id];
              const invested = inv?.amount || 0;
              const dailyYield = invested * 0.01;
              const levelPct = getCommissionRate(member.level);
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
                {formatCurrency((Array.isArray(networkMembers) ? networkMembers : []).reduce((s, m) => {
                const inv = investmentByUser[m.referred_id];
                const pct = getCommissionRate(m.level);
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