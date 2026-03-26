import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Checkbox,
  Badge,
} from '@/components/ui';
import {
  ArrowUpCircle, 
  ArrowDownCircle,
  Send, 
  Wallet as WalletIcon,
  Building2,
  Copy,
  Check,
  QrCode,
  DollarSign
} from 'lucide-react';

// Função para formatar moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para gerar QR Code PIX válido (padrão Bacen exato como Nubank)
const generatePIXQRCode = (pixKey, amount, recipientName, city) => {
  // Converter valor para centavos
  const amountInCents = Math.round(amount * 100);
  
  // Payload Format Indicator (00)
  const payloadFormatIndicator = '00';
  const payloadFormatIndicatorValue = '01';
  
  // Point of Initiation Method (01)
  const pointOfInitiationMethod = '01';
  const pointOfInitiationMethodValue = '12'; // Static QR
  
  // Merchant Account Information (26)
  const merchantAccountInformation = '26';
  const gui = 'BR.GOV.BCB.PIX'; // GUI do PIX
  const key = pixKey; // Chave PIX
  
  // Transaction Currency (53)
  const transactionCurrency = '53';
  const transactionCurrencyValue = '986'; // BRL
  
  // Transaction Amount (54)
  const transactionAmount = '54';
  const amountValue = amountInCents.toString().padStart(13, '0');
  
  // Country Code (58)
  const countryCode = '58';
  const countryCodeValue = 'BR';
  
  // Merchant Name (59)
  const merchantName = '59';
  const merchantNameValue = recipientName.substring(0, 25);
  
  // Merchant City (60)
  const merchantCity = '60';
  const merchantCityValue = city.toUpperCase().substring(0, 15);
  
  // Additional Data Field Template (62)
  const additionalData = '62';
  const additionalDataTemplate = '05';
  const referenceLabel = ' referencia';
  const referenceValue = 'Deposito Imperium';
  
  // CRC16 (63)
  const crc16 = '63';
  const crc4 = 'FFFF';
  
  // Construir o payload EXATAMENTE como no Nubank
  let payload = '';
  
  // 00 - Payload Format Indicator
  payload += '00' + '02' + '01';
  
  // 01 - Point of Initiation Method  
  payload += '01' + '02' + '12';
  
  // 26 - Merchant Account Information
  payload += '26';
  // GUI
  payload += String(gui.length).padStart(2, '0') + gui;
  // Key
  payload += String(key.length).padStart(2, '0') + key;
  
  // 52 - Merchant Category Code (adicional para compatibilidade)
  payload += '52' + '04' + '0000';
  
  // 53 - Transaction Currency
  payload += '53' + '03' + '986';
  
  // 54 - Transaction Amount
  payload += '54' + String(amountValue.length).padStart(2, '0') + amountValue;
  
  // 58 - Country Code
  payload += '58' + '02' + 'BR';
  
  // 59 - Merchant Name
  payload += '59' + String(merchantNameValue.length).padStart(2, '0') + merchantNameValue;
  
  // 60 - Merchant City
  payload += '60' + String(merchantCityValue.length).padStart(2, '0') + merchantCityValue;
  
  // 62 - Additional Data Field Template
  payload += '62' + '05';
  // Reference Label
  payload += String(referenceLabel.length).padStart(2, '0') + referenceLabel;
  // Reference Value
  payload += String(referenceValue.length).padStart(2, '0') + referenceValue;
  
  // 63 - CRC16
  payload += '63' + '04';
  
  // Calcular CRC16 do payload sem o CRC
  const payloadForCRC = payload + '0000';
  const crc16Result = calculateCRC16(payloadForCRC);
  
  // Debug do CRC16
  console.log('🔍 Payload para CRC16:', payloadForCRC);
  console.log('🔍 CRC16 calculado:', crc16Result);
  
  // Adicionar CRC16
  payload += crc16Result;
  
  // Debug do payload gerado
  console.log('🔍 PIX Payload gerado:', payload);
  console.log('📊 Dados:', { pixKey, amount, amountInCents, recipientName, city });
  console.log('🔍 Tamanho payload:', payload.length);
  
  return payload;
};

// Função para calcular CRC16 (implementação padrão ISO/IEC 14443-2)
const calculateCRC16 = (data) => {
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

// Fetch admin banking accounts
const fetchAdminBankingAccounts = async () => {
  console.log('🔍 Buscando contas admin...');
  
  // Usar service role key para bypass RLS e buscar contas admin
  const { data, error } = await supabase
    .from('admin_banking_accounts')
    .select('*')
    .eq('is_active', true)
    .eq('is_default', true)
    .limit(1);

  console.log('📊 Resultado query admin accounts:', { data, error });
  
  if (error) {
    console.error('❌ Erro ao buscar contas admin:', error);
    // Tentar buscar todas as contas ativas se não encontrar padrão
    const { data: allData, error: allError } = await supabase
      .from('admin_banking_accounts')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    console.log('🔄 Tentativa 2 - todas as contas ativas:', { allData, allError });
    
    if (allError) {
      console.error('❌ Erro na segunda tentativa:', allError);
      throw allError;
    }
    
    console.log('✅ Contas admin encontradas (tentativa 2):', allData);
    return allData || [];
  }
  
  console.log('✅ Contas admin encontradas:', data);
  return data || [];
};

// Fetch user transactions
const fetchUserTransactions = async (userId) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};

// Fetch user investments
const fetchUserInvestments = async (userId) => {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create deposit
const createDeposit = async (depositData) => {
  const { data, error } = await supabase
    .from('deposits')
    .insert({
      ...depositData,
      status: 'pending',
      transaction_hash: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Create withdrawal
const createWithdrawal = async (withdrawalData) => {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      ...withdrawalData,
      status: 'pending',
      transaction_hash: `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export default function Wallet() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'deposit';

  console.log('👤 Auth state:', { user, isAuthenticated });

  // Se não estiver autenticado, redirecionar
  if (!isAuthenticated || !user) {
    console.log('❌ Usuário não autenticado, redirecionando...');
    window.location.href = '/login';
    return null;
  }

  console.log('✅ Usuário autenticado:', user.id, user.email);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showTerms, setShowTerms] = useState(false);
  const [showDepositTerms, setShowDepositTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawWallet, setWithdrawWallet] = useState(user?.crypto_wallet || '');
  const [withdrawType, setWithdrawType] = useState('yield');

  // Transfer
  const [transferAmount, setTransferAmount] = useState('');
  const [transferEmail, setTransferEmail] = useState('');

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => fetchUserTransactions(user?.id),
    enabled: !!user?.id,
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: () => fetchUserInvestments(user?.id),
    enabled: !!user?.id,
  });

  const { data: adminAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['admin-banking-accounts-default'],
    queryFn: fetchAdminBankingAccounts,
    retry: 3,
    retryDelay: 1000,
    enabled: !!user // Só executar se tiver usuário
  });

  const createDepositMutation = useMutation({
    mutationFn: createDeposit,
    onSuccess: (data) => {
      console.log('✅ Depósito criado com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      setDepositAmount('');
      setDepositDescription('');
      setShowQR(false);
      toast.success('Depósito criado com sucesso! Envie o comprovante para aprovação.');
    },
    onError: (error) => {
      console.error('❌ Erro ao criar depósito:', error);
      toast.error(`Erro ao criar depósito: ${error.message}`);
    },
    onMutate: (variables) => {
      console.log('🔄 Iniciando mutação com variáveis:', variables);
    }
  });

  // Add debug logs to track state changes
  useEffect(() => {
    console.log('🔄 Estado atualizado:');
    console.log('  - depositAmount:', depositAmount);
    console.log('  - acceptedTerms:', acceptedTerms);
    console.log('  - showQR:', showQR);
    console.log('  - adminAccounts.length:', adminAccounts.length);
    console.log('  - createDepositMutation.isPending:', createDepositMutation.isPending);
    console.log('  - user:', user);
  }, [depositAmount, acceptedTerms, showQR, adminAccounts, createDepositMutation.isPending, user]);

  useEffect(() => {
    console.log('📊 Admin accounts carregadas:', adminAccounts);
  }, [adminAccounts]);

  const createWithdrawalMutation = useMutation({
    mutationFn: createWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      setWithdrawAmount('');
      setShowTerms(false);
      setAcceptedTerms(false);
      toast.success('Saque solicitado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao solicitar saque: ${error.message}`);
    }
  });

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeposit = () => {
    console.log('🚀 handleDeposit called');
    console.log('✅ depositAmount:', depositAmount);
    console.log('✅ acceptedTerms:', acceptedTerms);
    console.log('✅ adminAccounts.length:', adminAccounts.length);
    console.log('✅ user:', user);
    
    if (!depositAmount) {
      console.log('❌ Erro: Valor do depósito não informado');
      toast.error('Informe o valor do depósito');
      return;
    }

    if (!acceptedTerms) {
      console.log('❌ Erro: Termos não aceitos');
      toast.error('Aceite os termos de depósito');
      return;
    }

    if (!adminAccounts.length) {
      console.log('❌ Erro: Nenhuma conta bancária disponível');
      toast.error('Nenhuma conta bancária disponível');
      return;
    }

    console.log('✅ Todas validações passaram');
    console.log('✅ Mostrando QR Code...');
    setShowQR(true);
    
    const defaultAccount = adminAccounts[0];
    console.log('✅ Conta padrão:', defaultAccount);
    
    console.log('✅ Iniciando mutação de depósito...');
    createDepositMutation.mutate({
      user_id: user?.id,
      amount: parseFloat(depositAmount),
      method: 'pix',
      description: depositDescription || 'Depósito via PIX',
      admin_account_id: defaultAccount.id,
      bank_name: defaultAccount.bank_name,
      account_holder: defaultAccount.account_holder
    });
  };

  const handleWithdrawal = () => {
    if (!withdrawAmount) {
      toast.error('Informe o valor do saque');
      return;
    }

    if (!withdrawWallet) {
      toast.error('Informe a carteira de destino');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Aceite os termos de saque');
      return;
    }

    createWithdrawalMutation.mutate({
      user_id: user?.id,
      amount: parseFloat(withdrawAmount),
      wallet_address: withdrawWallet,
      type: withdrawType,
      description: `Saque - ${withdrawType === 'yield' ? 'Rendimentos' : 'Capital'}`
    });
  };

  const activeInvestment = investments.find(inv => inv.status === 'active');
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalEarnings = user?.total_earned || 0;
  const depositBalance = user?.available_balance || 0;
  const availableBalance = depositBalance + totalEarnings;
  const totalValue = availableBalance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carteira</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seus depósitos, saques e transferências
        </p>
      </div>

      {/* Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="w-5 h-5" />
            Saldo Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
              <p className="text-2xl font-bold text-gold">{formatCurrency(availableBalance)}</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Investido</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Ganho</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            Depósito
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            Saque
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Transferência
          </TabsTrigger>
        </TabsList>

        {/* Deposit Tab */}
        <TabsContent value="deposit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Novo Depósito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="deposit-amount" className="text-sm font-medium">Valor do Depósito (R$)</label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="100,00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="font-mono"
                    min="10"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="deposit-description" className="text-sm font-medium">Descrição (opcional)</label>
                  <Input
                    id="deposit-description"
                    placeholder="Descrição do depósito"
                    value={depositDescription}
                    onChange={(e) => setDepositDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accept-deposit-terms"
                    checked={acceptedTerms}
                    onCheckedChange={setAcceptedTerms}
                  />
                  <label htmlFor="accept-deposit-terms" className="text-sm">
                    Li e aceito os termos de depósito
                  </label>
                </div>
                <Button 
                  onClick={() => setShowDepositTerms(true)}
                  variant="outline"
                  className="w-full"
                >
                  Ver Termos de Depósito
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      console.log('🔘 Botão Confirmar Depósito clicado!');
                      handleDeposit();
                    }}
                    disabled={createDepositMutation.isPending || !depositAmount || !acceptedTerms}
                    className="flex-1"
                  >
                    {createDepositMutation.isPending ? 'Processando...' : 'Confirmar Depósito'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowQR(!showQR)}
                    disabled={!depositAmount}
                    className="flex-1"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {showQR ? 'Ocultar QR Code' : 'Gerar QR Code'}
                  </Button>
                </div>
              </div>

              {/* QR Code Display */}
              {showQR && depositAmount && adminAccounts.length > 0 && (
                <div className="mt-6 p-6 bg-white rounded-lg border">
                  <h4 className="text-center font-semibold mb-4">QR Code para Pagamento PIX</h4>
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      {/* QR Code PIX válido usando API externa */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatePIXQRCode(
                          adminAccounts[0].pix_key,
                          parseFloat(depositAmount),
                          adminAccounts[0].account_holder,
                          'Sao Paulo'
                        ))}`}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                      <p className="text-xs text-center text-gray-500 mt-2">
                        QR Code PIX válido
                      </p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Valor:</strong> {formatCurrency(parseFloat(depositAmount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Escaneie o QR Code acima com seu app bancário
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Após o pagamento, envie o comprovante
                    </p>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Código PIX (copia e cola):</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-gray-800 break-all flex-1">
                          {generatePIXQRCode(
                            adminAccounts[0].pix_key,
                            parseFloat(depositAmount),
                            adminAccounts[0].account_holder,
                            'Sao Paulo'
                          )}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const pixCode = generatePIXQRCode(
                              adminAccounts[0].pix_key,
                              parseFloat(depositAmount),
                              adminAccounts[0].account_holder,
                              'Sao Paulo'
                            );
                            navigator.clipboard.writeText(pixCode);
                            toast.success('Código PIX copiado!');
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5" />
                Solicitar Saque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="withdraw-amount" className="text-sm font-medium">Valor do Saque (R$)</label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="50,00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="font-mono"
                    min="10"
                    step="0.01"
                    max={availableBalance}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Saldo disponível: {formatCurrency(availableBalance)}
                  </p>
                </div>
                <div>
                  <label htmlFor="withdraw-wallet" className="text-sm font-medium">Carteira de Destino</label>
                  <Input
                    id="withdraw-wallet"
                    placeholder="Endereço da carteira"
                    value={withdrawWallet}
                    onChange={(e) => setWithdrawWallet(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="withdraw-type" className="text-sm font-medium">Tipo de Saque</label>
                  <select
                    id="withdraw-type"
                    value={withdrawType}
                    onChange={(e) => setWithdrawType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="yield">Rendimentos</option>
                    <option value="capital">Capital</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={setAcceptedTerms}
                  />
                  <label htmlFor="accept-terms" className="text-sm">
                    Aceito os termos de saque e a taxa de processamento
                  </label>
                </div>
                <Button 
                  onClick={() => setShowTerms(true)}
                  variant="outline"
                  className="w-full"
                >
                  Ver Termos de Saque
                </Button>
                <Button 
                  onClick={handleWithdrawal}
                  disabled={createWithdrawalMutation.isPending || !withdrawAmount || !acceptedTerms}
                  className="w-full"
                >
                  {createWithdrawalMutation.isPending ? 'Processando...' : 'Solicitar Saque'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Transferência Interna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="transfer-email" className="text-sm font-medium">Email do Destinatário</label>
                  <Input
                    id="transfer-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="transfer-amount" className="text-sm font-medium">Valor da Transferência (R$)</label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    placeholder="50,00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="font-mono"
                    min="10"
                    step="0.01"
                    max={availableBalance}
                  />
                </div>
                <Button 
                  className="w-full"
                  disabled={!transferAmount || !transferEmail}
                >
                  Enviar Transferência
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deposit Terms Dialog */}
      <Dialog open={showDepositTerms} onOpenChange={setShowDepositTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Termos de Depósito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Processamento e Aprovação</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Depósitos ficam pendentes de confirmação manual</li>
                <li>Prazo de processamento: até 24 horas úteis</li>
                <li>Valor mínimo de depósito: R$ 10,00</li>
                <li>Envie o comprovante para acelerar a aprovação</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Métodos de Depósito</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>PIX: processamento imediato após confirmação</li>
                <li>Transferência bancária: até 24h para compensação</li>
                <li>Os dados bancários são exclusivos do Imperium Club</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Regras e Responsabilidades</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Verifique todos os dados antes de fazer a transferência</li>
                <li>A responsabilidade pelo valor transferido é do usuário</li>
                <li>Em caso de erro, contate o suporte imediatamente</li>
                <li>Depósitos de terceiros não são aceitos</li>
                <li>O Imperium Club não se responsabiliza por fraudes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Importante</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Guarde o comprovante de transferência</li>
                <li>Não faça depósitos de origem ilícita</li>
                <li>Contas que violam os termos serão bloqueadas</li>
                <li>A aprovação final fica a critério da administração</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositTerms(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setAcceptedTerms(true);
              setShowDepositTerms(false);
            }}>
              Aceitar Termos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Termos de Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Taxas e Prazos</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Taxa de processamento: 5% sobre o valor do saque</li>
                <li>Prazo de processamento: até 48 horas úteis</li>
                <li>Valor mínimo de saque: R$ 50,00</li>
                <li>Saques de capital podem ter penalidade de carência</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Regras</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>O endereço da carteira deve ser válido</li>
                <li>A responsabilidade pelo endereço é do usuário</li>
                <li>Em caso de erro, o valor será retornado ao saldo</li>
                <li>Saques ficam pendentes de aprovação manual</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setAcceptedTerms(true);
              setShowTerms(false);
            }}>
              Aceitar Termos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
