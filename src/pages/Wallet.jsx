import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { financialAPI } from '@/services/api';
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
  ArrowUpRight,
  ArrowDownLeft,
  Send, 
  Wallet as WalletIcon,
  Building2,
  Copy,
  Check,
  QrCode,
  DollarSign,
  Clock
} from 'lucide-react';

// Funções utilitárias
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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
  
  // Simplificar: buscar apenas contas ativas
  const { data, error } = await supabase
    .from('admin_banking_accounts')
    .select('*')
    .eq('is_active', true)
    .limit(1);

  console.log('📊 Resultado query admin accounts:', { data, error });
  
  if (error) {
    console.error('❌ Erro ao buscar contas admin:', error);
    // Retornar array vazio em vez de throw para não quebrar a UI
    return [];
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

// Find user by email
const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, full_name')
    .eq('email', email)
    .single();
  
  if (error) throw new Error('Usuário não encontrado');
  return data;
};

// Fetch user transfers
const fetchUserTransfers = async (userId) => {
  const { data, error } = await supabase
    .from('transfers')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};

// Create transfer via API backend
const createTransfer = async (transferData) => {
  return await financialAPI.transfer(transferData);
};

// Create deposit via API backend
const createDeposit = async (depositData) => {
  return await financialAPI.deposit(depositData);
};

// Create withdrawal via API backend
const createWithdrawal = async (withdrawalData) => {
  return await financialAPI.withdrawal(withdrawalData);
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
  
  // Transfer verification
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingTransferId, setPendingTransferId] = useState(null);
  const [isInitiatingTransfer, setIsInitiatingTransfer] = useState(false);

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

  // Buscar depósitos confirmados para calcular saldo real
  const { data: confirmedDeposits = [] } = useQuery({
    queryKey: ['confirmed-deposits', user?.id],
    queryFn: async () => {
      console.log('🔍 Buscando depósitos para user_id:', user?.id);
      const { data, error } = await supabase
        .from('deposits')
        .select('amount, id, created_at, status, description')
        .eq('user_id', user?.id)
        .eq('status', 'confirmed');
      if (error) {
        console.error('❌ Erro ao buscar depósitos:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      console.log('✅ Depósitos encontrados:', data?.length || 0, data);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Buscar saques do usuário
  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      console.log('🔍 Buscando saques para user_id:', user?.id);
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Erro ao buscar saques:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      console.log('✅ Saques encontrados:', data?.length || 0, data);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: adminAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['admin-banking-accounts'],
    queryFn: fetchAdminBankingAccounts,
    retry: 2,
    retryDelay: 2000,
    staleTime: 300000, // 5 minutos
    cacheTime: 600000, // 10 minutos
    enabled: !!user // Só executar se tiver usuário
  });

  // Query para buscar transferências do usuário
  const { data: transfers = [], isLoading: isLoadingTransfers } = useQuery({
    queryKey: ['transfers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await fetchUserTransfers(user.id);
      return data;
    },
    enabled: !!user?.id,
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

  // Create withdrawal mutation
  const createWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalData) => {
      console.log('🚀 createWithdrawalMutation chamada:', withdrawalData);
      console.log('  - user?.id:', user?.id);
      
      try {
        const { data, error } = await supabase
          .from('withdrawals')
          .insert({
            user_id: user?.id,
            amount: withdrawalData.amount,
            method: 'pix',
            destination_address: withdrawalData.wallet_address,
            status: 'pending'
          })
          .select()
          .single();
        
        console.log('📊 Resposta do Supabase:', { data, error });
        
        if (error) {
          console.error('❌ Erro do Supabase:', error);
          throw error;
        }
        
        console.log('✅ Saque criado com sucesso:', data);
        return data;
      } catch (err) {
        console.error('❌ Erro na mutation:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('✅ onSuccess chamado:', data);
      toast.success('Saque solicitado com sucesso! Aguarde aprovação.');
      setWithdrawAmount('');
      setWithdrawWallet('');
      setAcceptedTerms(false);
      // Refetch withdrawals list
      queryClient.invalidateQueries({ queryKey: ['withdrawals', user?.id] });
    },
    onError: (error) => {
      console.error('❌ onError chamado:', error);
      toast.error(`Erro ao solicitar saque: ${error.message}`);
    }
  });

  // Mutation para iniciar transferência (envia email com código)
  const initiateTransferMutation = useMutation({
    mutationFn: async (transferData) => {
      console.log('🚀 Iniciando transferência:', transferData);
      const response = await financialAPI.initiateTransfer({
        amount: transferData.amount,
        recipient_email: transferData.email,
        description: transferData.description
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Código enviado:', data);
      setPendingTransferId(data.transfer_id);
      setShowVerificationDialog(true);
      toast.success('Código de verificação enviado para seu email!');
    },
    onError: (error) => {
      console.error('❌ Erro ao iniciar transferência:', error);
      toast.error(`Erro: ${error.message}`);
    }
  });

  // Mutation para confirmar transferência com código
  const confirmTransferMutation = useMutation({
    mutationFn: async ({ transferId, code }) => {
      console.log('� Confirmando transferência:', { transferId, code });
      const response = await financialAPI.confirmTransfer({
        transfer_id: transferId,
        verification_code: code
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Transferência confirmada:', data);
      toast.success('Transferência realizada com sucesso!');
      setShowVerificationDialog(false);
      setVerificationCode('');
      setPendingTransferId(null);
      setTransferAmount('');
      setTransferEmail('');
      // Atualizar saldo na tela
      refetchBalance();
      // Invalidar queries para forçar refresh de dados
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['confirmed-deposits', user?.id] });
    },
    onError: (error) => {
      console.error('❌ Erro ao confirmar:', error);
      toast.error(`Código inválido ou expirado: ${error.message}`);
    }
  });

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
    console.log('🚀 handleWithdrawal chamado!');
    console.log('  - withdrawAmount:', withdrawAmount);
    console.log('  - withdrawWallet:', withdrawWallet);
    console.log('  - acceptedTerms:', acceptedTerms);
    
    if (!withdrawAmount) {
      console.log('❌ Erro: Valor não informado');
      toast.error('Informe o valor do saque');
      return;
    }

    if (!withdrawWallet) {
      console.log('❌ Erro: Carteira não informada');
      toast.error('Informe a carteira de destino');
      return;
    }

    if (!acceptedTerms) {
      console.log('❌ Erro: Termos não aceitos');
      toast.error('Aceite os termos de saque');
      return;
    }

    console.log('✅ Todos validações passaram, enviando...');
    try {
      createWithdrawalMutation.mutate({
        user_id: user?.id,
        amount: parseFloat(withdrawAmount),
        wallet_address: withdrawWallet,
        type: withdrawType,
        description: `Saque - ${withdrawType === 'yield' ? 'Rendimentos' : 'Capital'}`
      });
    } catch (err) {
      console.error('❌ Erro ao chamar mutation:', err);
      toast.error(`Erro inesperado: ${err.message}`);
    }
  };

  const handleTransfer = async () => {
    console.log('🚀 handleTransfer chamado!');
    console.log('  - transferAmount:', transferAmount);
    console.log('  - transferEmail:', transferEmail);

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      console.log('❌ Erro: Valor não informado');
      toast.error('Informe o valor da transferência');
      return;
    }

    if (!transferEmail) {
      console.log('❌ Erro: Email não informado');
      toast.error('Informe o email do destinatário');
      return;
    }

    if (transferEmail === user?.email) {
      console.log('❌ Erro: Não pode transferir para si mesmo');
      toast.error('Não é possível transferir para você mesmo');
      return;
    }

    console.log('✅ Todas validações passaram, iniciando transferência...');
    setIsInitiatingTransfer(true);
    
    initiateTransferMutation.mutate({
      email: transferEmail,
      amount: parseFloat(transferAmount),
      description: `Transferência para ${transferEmail}`
    }, {
      onSettled: () => setIsInitiatingTransfer(false)
    });
  };
  
  const handleConfirmTransfer = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }
    
    confirmTransferMutation.mutate({
      transferId: pendingTransferId,
      code: verificationCode
    });
  };

  // Buscar saldo da API
  const { data: balanceData, refetch: refetchBalance } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: async () => {
      return await financialAPI.getBalance();
    },
    enabled: !!user?.id,
  });

  const activeInvestment = investments.find(inv => inv.status === 'active');
  const totalInvested = investments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const totalEarnings = investments.reduce((sum, inv) => sum + (parseFloat(inv.total_earned) || 0), 0);
  const totalDeposits = confirmedDeposits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const availableBalance = balanceData?.available_balance || 0;
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

          {/* Listagem de Depósitos */}
          {confirmedDeposits.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5" />
                  Histórico de Depósitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {confirmedDeposits.map((deposit, index) => (
                    <div 
                      key={deposit.id || `deposit-${index}`} 
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {formatCurrency(parseFloat(deposit.amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(deposit.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          deposit.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : deposit.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {deposit.status === 'approved' 
                            ? 'Aprovado' 
                            : deposit.status === 'rejected'
                            ? 'Rejeitado'
                            : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5" />
                  Histórico de Depósitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-4">
                  Nenhum depósito encontrado. Faça seu primeiro depósito acima.
                </p>
              </CardContent>
            </Card>
          )}
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

                {/* Aviso sobre saques aos sábados */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Observação Importante</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Os saques são processados e repassados <strong>exclusivamente aos sábados</strong>. 
                        Solicitações feitas durante a semana serão agendadas para o próximo sábado.
                      </p>
                    </div>
                  </div>
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
                    className="w-full p-2 border rounded-md bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="yield" className="bg-background text-foreground">Rendimentos</option>
                    <option value="capital" className="bg-background text-foreground">Capital</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={setAcceptedTerms}
                  />
                  <label htmlFor="accept-terms" className="text-sm">
                    Li e aceito os termos de saque
                  </label>
                </div>

                {/* Mensagem informativa quando termos não aceitos */}
                {!acceptedTerms && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    Clique em "Ver Termos de Saque" e aceite-os para habilitar o botão de solicitação
                  </p>
                )}

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
                  onClick={handleTransfer}
                  className="w-full"
                  disabled={!transferAmount || !transferEmail || isInitiatingTransfer}
                >
                  {isInitiatingTransfer ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Enviando código...
                    </>
                  ) : (
                    'Enviar Transferência'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Listagem de Transferências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Histórico de Transferências
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransfers ? (
                <p className="text-center text-muted-foreground py-4">Carregando...</p>
              ) : transfers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma transferência realizada ainda.
                </p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {transfers.map((transfer) => {
                    const isOutgoing = transfer.from_user_id === user?.id;
                    return (
                      <div
                        key={transfer.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isOutgoing 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            isOutgoing ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            {isOutgoing ? (
                              <ArrowUpRight className="w-4 h-4 text-red-600" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {isOutgoing ? 'Enviado para' : 'Recebido de'} {transfer.to_email || transfer.from_email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(transfer.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            isOutgoing ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isOutgoing ? '-' : '+'} R$ {parseFloat(transfer.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant={transfer.status === 'completed' ? 'success' : 'default'}>
                            {transfer.status === 'completed' ? 'Concluída' : transfer.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Listagem de Saques */}
      {withdrawals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              Histórico de Saques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {withdrawals.map((withdrawal, index) => (
                <div 
                  key={withdrawal.id || `withdrawal-${index}`} 
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(parseFloat(withdrawal.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {withdrawal.type === 'yield' ? 'Rendimentos' : 'Capital'} • {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      Carteira: {withdrawal.wallet_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      withdrawal.status === 'approved' 
                        ? 'bg-green-100 text-green-700' 
                        : withdrawal.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {withdrawal.status === 'approved' 
                        ? 'Aprovado' 
                        : withdrawal.status === 'rejected'
                        ? 'Rejeitado'
                        : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              Histórico de Saques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">
              Nenhum saque encontrado. Faça sua primeira solicitação acima.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Diálogo de Verificação de Código */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Verificação de Transferência
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Digite o código de 6 dígitos enviado para seu email
            </p>
            <div className="flex justify-center">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest w-40"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              O código expira em 10 minutos
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={verificationCode.length !== 6 || confirmTransferMutation.isPending}
              className="w-full sm:w-auto bg-gold hover:bg-gold/90"
            >
              {confirmTransferMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Confirmando...
                </>
              ) : (
                'Confirmar Transferência'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
