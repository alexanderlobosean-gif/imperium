import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/planConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InvestmentSuccessModal({ open, onClose, investment, plan }) {
  if (!investment || !plan) return null;

  const activationDate = new Date(investment.activation_date);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-foreground text-xl">Investimento Realizado!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Plano</p>
            <p className="text-lg font-bold text-gold">{plan.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Valor Investido</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(investment.amount)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Teto de Ganho</p>
              <p className="text-lg font-bold text-amber-400">{formatCurrency(investment.earning_cap)}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Ativação</p>
            <p className="text-sm font-semibold text-foreground">
              {format(activationDate, 'dd \'de\' MMMM \'às\' HH:mm', { locale: ptBR })}
            </p>
          </div>

          {investment.unlocked_levels > 0 && (
            <div className="p-3 rounded-lg bg-purple-500/10">
              <p className="text-xs text-purple-400 mb-1 uppercase tracking-wider">Níveis de Rede Liberados</p>
              <p className="text-lg font-bold text-purple-400">{investment.unlocked_levels}</p>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-gold hover:bg-gold-hover text-primary-foreground"
        >
          Entendi, Obrigado!
        </Button>
      </DialogContent>
    </Dialog>
  );
}