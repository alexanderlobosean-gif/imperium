import React, { useState, useEffect } from 'react';
import { PLANS } from '@/lib/planConfig';

function CountdownCircle({ seconds }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / 60) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#F2A71B"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative text-3xl font-bold gold-text">{seconds}</span>
    </div>
  );
}

const MINUTE_INCREMENT = 0.000013889;

function getMinutesSinceActivation(investment) {
  const activationDate = investment?.activation_date;
  if (!activationDate) return 0;
  const now = new Date();
  const activated = new Date(activationDate);
  return Math.max(0, Math.floor((now - activated) / 60000));
}

export default function ProfitabilityClock({ investment }) {
  const [seconds, setSeconds] = useState(60 - new Date().getSeconds());
  const [minutesElapsed, setMinutesElapsed] = useState(() => getMinutesSinceActivation(investment));

  useEffect(() => {
    setMinutesElapsed(getMinutesSinceActivation(investment));
  }, [investment?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setMinutesElapsed(getMinutesSinceActivation(investment));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [investment?.id]);

  if (!investment || investment.status !== 'active') {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground text-sm">Nenhum investimento ativo</p>
        <p className="text-xs text-muted-foreground mt-1">Adquira um plano para começar</p>
      </div>
    );
  }

  const planConfig = PLANS[investment.plan] || {};
  const baseRate = planConfig.baseRate || investment.base_rate || 1.0;
  const maxRate = planConfig.maxRate || 3.0;
  const increment = planConfig.increment || 0.020;
  const daysWithoutWithdrawal = investment.days_without_withdrawal || 0;

  const currentMaxRate = Math.min(baseRate + daysWithoutWithdrawal * increment, maxRate);
  const liveRate = Math.min(currentMaxRate + minutesElapsed * MINUTE_INCREMENT, maxRate);
  const nextMinuteRate = Math.min(liveRate + MINUTE_INCREMENT, maxRate);
  const nextDayRate = Math.min(currentMaxRate + increment, maxRate);
  const progressPercent = (liveRate / maxRate) * 100;

  const capPercent = investment.earning_cap > 0
    ? ((investment.total_earned || 0) / investment.earning_cap) * 100
    : 0;

  return (
    <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-6 gold-glow">
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Rentabilidade Atual
        </h3>
        <div className="text-4xl font-bold gold-text mb-1">{liveRate.toFixed(6)}%</div>
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-xs text-green-400">→ {nextMinuteRate.toFixed(6)}%</span>
          <span className="text-xs text-muted-foreground">no próximo minuto</span>
        </div>
        <p className="text-xs text-muted-foreground">Taxa atual (atualiza a cada minuto)</p>
      </div>

      {/* Countdown */}
      <div className="mb-4">
        <p className="text-xs text-center text-muted-foreground mb-2">Próximo incremento em</p>
        <CountdownCircle seconds={seconds} />
        <p className="text-xs text-center text-muted-foreground mt-2">+0.000013889% a cada minuto</p>
      </div>

      {/* Info rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <span className="text-xs text-muted-foreground">Ganhando agora</span>
          <span className="text-sm font-bold text-green-400">{liveRate.toFixed(6)}% ao dia</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <span className="text-xs text-muted-foreground">Após 24h sem saque</span>
          <span className="text-sm font-semibold text-gold">{nextDayRate.toFixed(2)}% ao dia</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <span className="text-xs text-muted-foreground">Dias sem saque</span>
          <span className="text-sm font-semibold text-foreground">{daysWithoutWithdrawal} dias</span>
        </div>
      </div>

      {/* Cap progress bar */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Progresso do teto (300%)</span>
          <span className="text-xs font-medium text-gold">{capPercent.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-hover transition-all duration-500"
            style={{ width: `${Math.min(capPercent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">Progresso taxa (Máx {maxRate}%)</span>
          <span className="text-xs font-medium text-gold">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden mt-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-gold transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}