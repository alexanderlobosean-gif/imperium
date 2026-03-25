import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CAREER_LEVELS, formatCurrency } from '@/lib/planConfig';
import { Award, CheckCircle, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Career() {
  const { user } = useAuth();
  const currentVP = user?.career_vp || 0;
  const currentLevel = user?.career_level || 'none';

  const currentLevelIndex = CAREER_LEVELS.findIndex(
    (l) => l.title.toLowerCase().replace(/\s+/g, '_') === currentLevel
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plano Imperial de Carreira</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Premiação mensal por vendas diretas - $1 = 1 VP
        </p>
      </div>

      {/* Current VP */}
      <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent p-6 gold-glow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Seu VP atual</p>
            <p className="text-3xl font-bold gold-text">{currentVP.toLocaleString()} VP</p>
          </div>
          <Award className="w-10 h-10 text-gold" />
        </div>
        {currentLevel !== 'none' && (
          <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
            <p className="text-sm font-semibold text-gold">
              Título atual: {CAREER_LEVELS[currentLevelIndex]?.title || 'Nenhum'}
            </p>
          </div>
        )}
      </div>

      {/* Career levels */}
      <div className="space-y-4">
        {CAREER_LEVELS.map((level, index) => {
          const isUnlocked = currentVP >= level.vp;
          const isCurrent = index === currentLevelIndex;
          const progress = Math.min((currentVP / level.vp) * 100, 100);

          return (
            <div
              key={level.level}
              className={`rounded-xl border p-5 transition-all ${
                isCurrent
                  ? 'border-gold/40 bg-gold/5 gold-glow'
                  : isUnlocked
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isUnlocked ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-bold ${isCurrent ? 'gold-text' : 'text-foreground'}`}>
                      {level.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">Nível {level.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gold">{formatCurrency(level.prize)}</p>
                  <p className="text-xs text-muted-foreground">em banca</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Meta VP</p>
                  <p className="text-sm font-semibold text-foreground">{level.vp.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Linhas</p>
                  <p className="text-sm font-semibold text-foreground">{level.lines}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Mín/linha</p>
                  <p className="text-sm font-semibold text-foreground">{level.minPerLine}%</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{currentVP.toLocaleString()} / {level.vp.toLocaleString()} VP</span>
                  <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}