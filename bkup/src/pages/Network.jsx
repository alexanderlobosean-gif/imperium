import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, User, TrendingUp, Copy, CheckCheck } from 'lucide-react';
import { formatCurrency, getUnlockedLevels, RESIDUAL_PERCENTAGES } from '@/lib/planConfig';
import { Badge } from '@/components/ui/badge';
import StatsCard from '@/components/dashboard/StatsCard';
import DirectReferralBonuses from '@/components/network/DirectReferralBonuses';
import { toast } from 'sonner';

export default function Network() {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const { data: networkMembers = [] } = useQuery({
    queryKey: ['network', user?.id],
    queryFn: () => base44.entities.NetworkRelation.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: () => base44.entities.Investment.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const directMembers = networkMembers.filter((m) => m.level === 1);
  const indirectMembers = networkMembers.filter((m) => m.level > 1);

  const indirectIds = indirectMembers.map((m) => m.referred_id).filter(Boolean);

  const { data: indirectInvestments = [] } = useQuery({
    queryKey: ['indirect-investments', indirectIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        indirectIds.map((id) => base44.entities.Investment.filter({ user_id: id, status: 'active' }))
      );
      const map = {};
      indirectIds.forEach((id, i) => { if (results[i]?.[0]) map[id] = results[i][0].amount; });
      return map;
    },
    enabled: indirectIds.length > 0,
  });
  const totalGenerated = networkMembers.reduce((sum, m) => sum + (m.total_generated || 0), 0);
  const activeInvestment = investments[0];
  const unlockedLevels = activeInvestment?.unlocked_levels || 0;

  const referralLink = user?.referral_code
    ? `${window.location.origin}?ref=${user.referral_code}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha Rede</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seus indicados e ganhos de rede</p>
      </div>

      {/* Referral link */}
      {referralLink && (
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-sm font-medium text-foreground mb-2">Seu link de indicação</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-gold font-mono"
            />
            <button onClick={handleCopy} className="p-2 rounded-lg bg-gold/10 hover:bg-gold/20 transition">
              {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gold" />}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Indicados Diretos" value={directMembers.length} icon={User} color="blue" isCurrency={false} />
        <StatsCard title="Indicados Indiretos" value={indirectMembers.length} icon={Users} color="purple" isCurrency={false} />
        <StatsCard title="Total Gerado" value={totalGenerated} icon={TrendingUp} color="green" />
        <StatsCard title="Níveis Liberados" value={`${unlockedLevels} / 20`} icon={Users} color="gold" isCurrency={false} />
      </div>

      {/* Direct members */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" /> Indicados Diretos (N1)
        </h3>
        {directMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum indicado direto ainda. Compartilhe seu link!
          </p>
        ) : (
          <div className="space-y-2">
            {directMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{member.referred_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{member.referred_email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30 mb-1">N1</Badge>
                  <p className="text-xs font-semibold text-green-400">{formatCurrency(member.total_generated || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Referral Bonuses */}
      <DirectReferralBonuses />

      {/* Commission summary by level */}
      {indirectMembers.length > 0 && (() => {
        const byLevel = {};
        indirectMembers.forEach((m) => {
          const lvl = m.level;
          if (!byLevel[lvl]) byLevel[lvl] = { count: 0, total: 0 };
          byLevel[lvl].count += 1;
          byLevel[lvl].total += m.total_generated || 0;
        });
        return (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> Comissões por Nível
            </h3>
            <div className="space-y-2">
              {Object.keys(byLevel).sort((a, b) => a - b).map((lvl) => (
                <div key={lvl} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-purple-400 border-purple-500/30">N{lvl}</Badge>
                    <p className="text-sm text-muted-foreground">{byLevel[lvl].count} membro(s)</p>
                    <span className="text-xs text-amber-400 font-medium">{RESIDUAL_PERCENTAGES[lvl] || 0}%</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Comissão gerada</p>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(byLevel[lvl].total * ((RESIDUAL_PERCENTAGES[lvl] || 0) / 100))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Indirect members */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" /> Indicados Indiretos
        </h3>
        {indirectMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum indicado indireto ainda
          </p>
        ) : (
          <div className="space-y-2">
            {indirectMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{member.referred_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{member.referred_email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-purple-400 border-purple-500/30 mb-1">N{member.level}</Badge>
                  {indirectInvestments[member.referred_id] != null && (
                    <p className="text-xs text-muted-foreground">Investiu: <span className="text-gold font-semibold">{formatCurrency(indirectInvestments[member.referred_id])}</span></p>
                  )}
                  <p className="text-xs font-semibold text-green-400">Bônus: {formatCurrency((member.total_generated || 0) * ((RESIDUAL_PERCENTAGES[member.level] || 0) / 100))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}