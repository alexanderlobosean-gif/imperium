import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
// import { base44 } from '@/api/base44Client'; // Removido - agora usa Supabase
import { supabase } from '@/lib/supabase'; // Adicionado
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency, getWithdrawalPenalty, RESIDUAL_PERCENTAGES } from '@/lib/planConfig';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, Send, Wallet as WalletIcon } from 'lucide-react';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

export default function Wallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'deposit';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxid, setDepositTxid] = useState('');

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawWallet, setWithdrawWallet] = useState(user?.crypto_wallet || '');
  const [withdrawType, setWithdrawType] = useState('yield');

  // Transfer
  const [transferAmount, setTransferAmount] = useState('');
  const [transferEmail, setTransferEmail] = useState('');

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ user_id: user?.id }, '-created_date', 20),
    enabled: !!user?.id,
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: () => base44.entities.Investment.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user?.id,
  });

  const { data: networkMembers = [] } = useQuery({
    queryKey: ['network', user?.id],
    queryFn: () => base44.entities.NetworkRelation.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: networkInvestments = [] } = useQuery({
    queryKey: ['network-investments', networkMembers.map((m) => m.referred_id).join(',')],
    queryFn: () => base44.entities.Investment.filter({ status: 'active' }),
    enabled: networkMembers.length > 0,
  });

  const investmentByUser = {};
  networkInvestments.forEach((inv) => { investmentByUser[inv.user_id] = inv; });

  const totalEarnings = user?.total_earnings || 0;
  const depositBalance = user?.available_balance || 0;
  const networkEarnings = networkMembers.reduce((sum, m) => {
    const inv = investmentByUser[m.referred_id];
    const pct = (RESIDUAL_PERCENTAGES[m.level] || 0) / 100;
    return sum + (inv?.total_earned || 0) * pct;
  }, 0);
  const availableBalance = depositBalance + totalEarnings + networkEarnings;

  const createTransaction = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Solicitação enviada com sucesso!');
    },
  });

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!depositTxid.trim()) {
      toast.error('Informe o Hash (TXID) da transação');
      return;
    }
    createTransaction.mutate({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      type: 'deposit',
      amount: parseFloat(depositAmount),
      net_amount: parseFloat(depositAmount),
      status: 'pending',
      txid: depositTxid,
      description: 'Depósito via cripto',
    });
    setDepositAmount('');
    setDepositTxid('');
    setShowQR(false);
    setAcceptedTerms(false);
  };

  const handleWithdraw = () => {
    const now = new Date();
    if (now.getDay() !== 6) {
      toast.error('Saques são permitidos apenas aos sábados');
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!withdrawWallet.trim()) {
      toast.error('Informe o endereço da carteira cripto');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const fee = amount * 0.05;
    let penalty = 0;

    if (withdrawType === 'capital' && investments.length > 0) {
      const inv = investments[0];
      const daysSinceInvestment = Math.floor((now - new Date(inv.activation_date)) / (1000 * 60 * 60 * 24));
      const penaltyRate = getWithdrawalPenalty(daysSinceInvestment);
      penalty = amount * (penaltyRate / 100);
    }

    const netAmount = amount - fee - penalty;

    createTransaction.mutate({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      type: 'withdrawal',
      amount,
      fee,
      penalty,
      net_amount: netAmount,
      status: 'pending',
      crypto_wallet: withdrawWallet,
      description: `Saque de ${withdrawType === 'capital' ? 'capital' : 'rendimento'}`,
    });
    setWithdrawAmount('');
  };

  const handleTransfer = () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!transferEmail.trim()) {
      toast.error('Informe o email do destinatário');
      return;
    }

    createTransaction.mutate({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      type: 'transfer',
      amount: parseFloat(transferAmount),
      net_amount: parseFloat(transferAmount),
      fee: 0,
      status: 'pending',
      transfer_to_email: transferEmail,
      description: 'Transferência interna',
    });
    setTransferAmount('');
    setTransferEmail('');
  };

  const isSaturday = new Date().getDay() === 6;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie depósitos, saques e transferências</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Saldo Disponível</p>
          <p className="text-2xl font-bold gold-text">{formatCurrency(availableBalance)}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary border border-border w-full grid grid-cols-3">
          <TabsTrigger value="deposit" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400">
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Depositar
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400">
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Sacar
          </TabsTrigger>
          <TabsTrigger value="transfer" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
            <Send className="w-4 h-4 mr-2" /> Transferir
          </TabsTrigger>
        </TabsList>

        {/* DEPOSIT */}
        <TabsContent value="deposit">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {!showQR ? (
              <>
                <h3 className="font-semibold text-foreground">Depositar Fundos</h3>
                <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 text-sm text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">Termos e Condições</p>
                  <p>• Os depósitos serão confirmados manualmente pela equipe.</p>
                  <p>• A rentabilidade inicia 24h após a confirmação.</p>
                  <p>• Saques são permitidos apenas aos sábados com taxa de 5%.</p>
                  <p>• O teto de ganho é de 300% do valor investido.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={acceptedTerms}
                    onCheckedChange={setAcceptedTerms}
                    id="terms"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    Li e aceito os termos e condições
                  </label>
                </div>
                <Button
                  onClick={() => setShowQR(true)}
                  disabled={!acceptedTerms}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Continuar para Depósito
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-foreground">Envie o pagamento</h3>
                <div className="text-center p-6 rounded-lg bg-secondary border border-border">
                  <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center text-black">
                      <WalletIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs">QR Code da carteira</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground break-all font-mono">
                    bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Valor (USD)</label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Hash de Confirmação (TXID)</label>
                  <Input
                    value={depositTxid}
                    onChange={(e) => setDepositTxid(e.target.value)}
                    placeholder="Cole o TXID aqui"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={createTransaction.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {createTransaction.isPending ? 'Enviando...' : 'Confirmar Depósito'}
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        {/* WITHDRAW */}
        <TabsContent value="withdraw">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Solicitar Saque</h3>
            {!isSaturday && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                Saques são permitidos apenas aos sábados
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant={withdrawType === 'yield' ? 'default' : 'outline'}
                onClick={() => setWithdrawType('yield')}
                className={withdrawType === 'yield' ? 'bg-gold text-primary-foreground' : ''}
                size="sm"
              >
                Rendimento
              </Button>
              <Button
                variant={withdrawType === 'capital' ? 'default' : 'outline'}
                onClick={() => setWithdrawType('capital')}
                className={withdrawType === 'capital' ? 'bg-gold text-primary-foreground' : ''}
                size="sm"
              >
                Capital
              </Button>
            </div>
            {withdrawType === 'capital' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 space-y-1">
                <p className="font-semibold">Penalidades por saque de capital:</p>
                <p>• Até 30 dias: 30% de multa</p>
                <p>• 31 a 60 dias: 20% de multa</p>
                <p>• 61 a 90 dias: 10% de multa</p>
                <p>• A partir de 91 dias: sem multa</p>
                <p>• Taxa de saque: 5% (sempre)</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Valor (USD)</label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Carteira Cripto</label>
              <Input
                value={withdrawWallet}
                onChange={(e) => setWithdrawWallet(e.target.value)}
                placeholder="Endereço da carteira"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={createTransaction.isPending || !isSaturday}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {createTransaction.isPending ? 'Processando...' : 'Solicitar Saque'}
            </Button>
          </div>
        </TabsContent>

        {/* TRANSFER */}
        <TabsContent value="transfer">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Transferência Interna</h3>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo disponível</p>
                <p className="text-lg font-bold text-blue-400">{formatCurrency(availableBalance)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Sem taxas para transferências entre contas</p>
            <div>
              <label className="text-sm font-medium text-foreground">Email do Destinatário</label>
              <Input
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valor (USD)</label>
              <Input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <Button
              onClick={handleTransfer}
              disabled={createTransaction.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createTransaction.isPending ? 'Transferindo...' : 'Transferir'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rendimento de Rede */}
      {networkEarnings > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Rendimento de Rede</p>
                <p className="text-xs text-muted-foreground">Ganhos sobre os rendimentos da equipe ({networkMembers.length} membros)</p>
              </div>
            </div>
            <p className="text-lg font-bold text-purple-400">+{formatCurrency(networkEarnings)}</p>
          </div>
        </div>
      )}

      <RecentTransactions transactions={transactions} limit={10} />
    </div>
  );
}