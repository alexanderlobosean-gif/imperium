import React from 'react';
import { Zap, TrendingUp, Award, Crown, Gem, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/planConfig';

const ICONS = { Zap, TrendingUp, Award, Crown, Gem, Users, Shield };

const colorMap = {
  blue: 'border-blue-500/30 from-blue-500/10 to-transparent',
  green: 'border-green-500/30 from-green-500/10 to-transparent',
  purple: 'border-purple-500/30 from-purple-500/10 to-transparent',
  amber: 'border-amber-500/30 from-amber-500/10 to-transparent',
  gold: 'border-gold/30 from-gold/10 to-transparent',
};

const iconColorMap = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
  gold: 'text-gold',
};

export default function PlanCard({ plan, planKey, onSelect }) {
  const Icon = ICONS[plan.icon] || Zap;
  const colors = colorMap[plan.color] || colorMap.gold;
  const iconColor = iconColorMap[plan.color] || 'text-gold';

  return (
    <div className={`relative rounded-xl border bg-gradient-to-br ${colors} p-6 transition-all hover:scale-[1.02] hover:shadow-lg`}>
      {plan.name === 'Imperium' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold text-primary-foreground text-xs font-bold">
          MAIS POPULAR
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-background/50">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(plan.min)} - {formatCurrency(plan.max)}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {!plan.isLeadership ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rentabilidade</span>
              <span className="font-semibold text-foreground">{plan.minRate}% a {plan.baseRate}%/dia</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Incremento</span>
              <span className="font-semibold text-foreground">+{plan.increment}%/dia</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limite</span>
              <span className="font-semibold text-foreground">{plan.maxRate}%/dia</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Divisão</span>
              <span className="font-semibold text-foreground">{plan.clientShare}/{plan.companyShare}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comissão direta</span>
              <span className="font-semibold text-foreground">{plan.directCommission}%</span>
            </div>
            {plan.residualLevels > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Níveis residuais</span>
                <span className="font-semibold text-foreground">Até {plan.residualLevels}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-semibold text-foreground">Conta Liderança</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rendimento</span>
              <span className="font-semibold text-muted-foreground">Sem rendimento</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bônus de rede</span>
              <span className="font-semibold text-foreground">
                {plan.residualLevels ? `Até ${plan.residualLevels} níveis` : 'Diretos apenas'}
              </span>
            </div>
          </>
        )}
      </div>

      <Button
        onClick={() => onSelect(planKey)}
        className="w-full bg-gold hover:bg-gold-hover text-primary-foreground font-semibold"
      >
        Investir Agora
      </Button>
    </div>
  );
}