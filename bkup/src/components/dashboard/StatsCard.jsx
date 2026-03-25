import React from 'react';
import { formatCurrency } from '@/lib/planConfig';

export default function StatsCard({ title, value, icon: Icon, color = 'gold', isCurrency = true, subtitle }) {
  const colorMap = {
    gold: 'from-gold/20 to-gold/5 border-gold/20 text-gold',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  };

  const colors = colorMap[color] || colorMap.gold;
  const parts = colors.split(' ');

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colors} p-5`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">
            {isCurrency ? formatCurrency(value) : value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-background/50`}>
            <Icon className={`w-5 h-5 ${parts[parts.length - 1]}`} />
          </div>
        )}
      </div>
    </div>
  );
}