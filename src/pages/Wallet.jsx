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
  CheckCircle,
  QrCode,
  DollarSign,
  Clock
} from 'lucide-react';

// Utility functions
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

// Function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Function to generate valid PIX QR Code (exact Bacen standard like Nubank)
const generatePIXQRCode = (pixKey, amount, recipientName, city) => {
  // Convert value to cents
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
  const referenceLabel = 'referência';
  const referenceValue = 'Depósito Imperium';
  
  // CRC16 (63)
  const crc16 = '63';
  const crc4 = 'FFFF';
  
  // Construir o payload EXATAMENTE como no Nubank
  let payload = '';
  
  // 00 - Payload Format Indicator
  payload += '00' + '02' + '01';
  
  // 01 - Point of Initiation Method (opcional, omitido)
  // payload += '01' + '02' + '12';
  
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
  
  // 54 - Transaction Amount (opcional)
  // payload += '54' + String(amountValue.length).padStart(2, '0') + amountValue;
  
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
  
  // Debug generated payload
  console.log('🔍 PIX Payload gerado:', payload);
  console.log('📊 Dados:', { pixKey, amount, amountInCents, recipientName, city });
  console.log('🔍 Tamanho payload:', payload.length);
  
  return payload;
};

// Function to calculate CRC16 (standard ISO/IEC 14443-2 implementation)
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

// Fetch admin banking accounts via API
const fetchAdminBankingAccounts = async () => {
  console.log('🔍 Buscando contas admin via API...');
  try {
    const response = await financialAPI.getAdminAccounts();
    console.log('✅ Contas admin encontradas:', response.accounts);
    return response.accounts || [];
  } catch (error) {
    console.error('❌ Erro ao buscar contas admin:', error);
    return [];
  }
};

// Fetch user transactions via API
const fetchUserTransactions = async () => {
  const response = await financialAPI.getTransactions({ limit: 20 });
  return response.transactions || [];
};

// Fetch user investments via API
const fetchUserInvestments = async () => {
  const response = await financialAPI.getInvestments({ status: 'active' });
  return response.investments || [];
};

// Fetch user deposits via API
const fetchUserDeposits = async () => {
  const response = await financialAPI.getDeposits({});
  return response.deposits || [];
};

// Fetch user withdrawals via API
const fetchUserWithdrawals = async () => {
  const response = await financialAPI.getWithdrawals();
  return response.withdrawals || [];
};

// Fetch user transfers via API
const fetchUserTransfers = async () => {
  const response = await financialAPI.getTransfers({ limit: 20 });
  return response.transfers || [];
};

// Find user by email via API
const findUserByEmail = async (email) => {
  // Usar API ao invés de Supabase direto
  const response = await fetch('/api/auth/find-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!response.ok) throw new Error('Usuário não encontrado');
  return response.json();
};

// Create transfer via API backend
const createTransfer = async (transferData) => {
  return await financialAPI.transfer(transferData);
};

// Create withdrawal via API backend
const createWithdrawal = async (withdrawalData) => {
  return await financialAPI.withdrawal(withdrawalData);
};

export default function Wallet() {
  // Função de tradução local (removendo i18n)
  const t = (key) => {
    const translations = {
      'wallet.title': 'Wallet',
      'wallet.subtitle': 'Manage your deposits, withdrawals and transfers',
      'wallet.totalBalance': 'Total Balance',
      'wallet.availableBalance': 'Available Balance',
      'wallet.totalEarned': 'Total Earned',
      'wallet.newDeposit': 'New Deposit',
      'wallet.depositAmount': 'Deposit Amount',
      'wallet.descriptionOptional': 'Description (Optional)',
      'wallet.depositDescriptionPlaceholder': 'Enter a description (optional)',
      'wallet.acceptTerms': 'I accept the deposit terms',
      'wallet.withdrawalMethod': 'Withdrawal Method',
      'wallet.withdrawalType': 'Withdrawal Type',
      'wallet.acceptWithdrawalTerms': 'I have read and accept the withdrawal terms',
      'wallet.balance': 'Balance',
      'wallet.available': 'Available',
      'wallet.pending': 'Pending',
      'wallet.total': 'Total',
      'wallet.deposit': 'Deposit',
      'wallet.withdraw': 'Withdraw',
      'wallet.transfer': 'Transfer',
      'wallet.reinvest': 'Reinvest',
      'wallet.history': 'History',
      'wallet.pix': 'PIX',
      'wallet.crypto': 'Crypto',
      'wallet.bank': 'Bank Transfer',
      'wallet.amount': 'Amount',
      'wallet.minDeposit': 'Min Deposit',
      'wallet.maxDeposit': 'Max Deposit',
      'wallet.minWithdraw': 'Min Withdraw',
      'wallet.maxWithdraw': 'Max Withdraw',
      'wallet.fee': 'Fee',
      'wallet.netAmount': 'Net Amount',
      'wallet.processingTime': 'Processing Time',
      'wallet.destination': 'Destination',
      'wallet.confirm': 'Confirm',
      'wallet.cancel': 'Cancel',
      'wallet.processing': 'Processing...',
      'wallet.success': 'Success',
      'wallet.error': 'Error',
      'wallet.insufficientBalance': 'Insufficient balance',
      'wallet.invalidAmount': 'Invalid amount',
      'wallet.selectMethod': 'Select a method',
      'wallet.enterAmount': 'Enter amount',
      'wallet.qrCode': 'QR Code',
      'wallet.copyCode': 'Copy Code',
      'wallet.copied': 'Copied!',
      'wallet.status.pending': 'Pending',
      'wallet.status.processing': 'Processing',
      'wallet.status.completed': 'Completed',
      'wallet.status.failed': 'Failed',
      'wallet.status.cancelled': 'Cancelled',
      'wallet.type.deposit': 'Deposit',
      'wallet.type.withdrawal': 'Withdrawal',
      'wallet.type.transfer': 'Transfer',
      'wallet.type.yield': 'Yield',
      'wallet.type.bonus': 'Bonus',
      'wallet.type.referral': 'Referral',
      'wallet.noTransactions': 'No transactions yet',
      'wallet.viewAll': 'View all',
      'wallet.depositTime': 'Instant',
      'wallet.withdrawalTime': '24-48 hours',
      'wallet.transferTime': 'Instant',
      'wallet.pixKey': 'PIX Key',
      'wallet.bankDetails': 'Bank Details',
      'wallet.account': 'Account',
      'wallet.agency': 'Agency',
      'wallet.bankName': 'Bank',
      'wallet.holderName': 'Holder Name',
      'wallet.document': 'Document',
      'wallet.noPixKey': 'No PIX key registered',
      'wallet.addPixKey': 'Add PIX key',
      'wallet.edit': 'Edit',
      'wallet.save': 'Save',
      'wallet.delete': 'Delete',
      'wallet.depositSuccess': 'Deposit requested successfully',
      'wallet.withdrawalSuccess': 'Withdrawal requested successfully',
      'wallet.transferSuccess': 'Transfer completed successfully',
      'wallet.depositError': 'Error requesting deposit',
      'wallet.withdrawalError': 'Error requesting withdrawal',
      'wallet.transferError': 'Error completing transfer',
      'wallet.invalidPixKey': 'Invalid PIX key',
      'wallet.pixKeyAdded': 'PIX key added successfully',
      'wallet.pixKeyUpdated': 'PIX key updated successfully',
      'wallet.pixKeyDeleted': 'PIX key deleted successfully',
      'wallet.pixKeyError': 'Error processing PIX key',
      'wallet.recipient': 'Recipient',
      'wallet.recipientEmail': 'Recipient Email',
      'wallet.enterRecipient': 'Enter recipient email',
      'wallet.selfTransferError': 'Cannot transfer to yourself',
      'wallet.userNotFound': 'User not found',
      'wallet.transferTo': 'Transfer to',
      'wallet.amountToTransfer': 'Amount to transfer',
      'wallet.availableForWithdrawal': 'Available for withdrawal',
      'wallet.pendingBalance': 'Pending balance',
      'wallet.yieldEarnings': 'Yield earnings',
      'wallet.networkEarnings': 'Network earnings',
      'wallet.totalEarnings': 'Total earnings',
      'wallet.investedAmount': 'Invested amount',
      'wallet.activeInvestments': 'Active investments',
      'wallet.completedInvestments': 'Completed investments',
      'wallet.totalInvested': 'Total invested',
      'wallet.profit': 'Profit',
      'wallet.roi': 'ROI',
      'wallet.dailyYield': 'Daily yield',
      'wallet.monthlyYield': 'Monthly yield',
      'wallet.annualYield': 'Annual yield',
      'wallet.lastUpdate': 'Last update',
      'wallet.nextYield': 'Next yield',
      'wallet.in': 'in',
      'wallet.hours': 'hours',
      'wallet.minutes': 'minutes',
      'wallet.seconds': 'seconds',
      'wallet.ago': 'ago',
      'wallet.today': 'Today',
      'wallet.yesterday': 'Yesterday',
      'wallet.thisWeek': 'This week',
      'wallet.thisMonth': 'This month',
      'wallet.lastMonth': 'Last month',
      'wallet.customRange': 'Custom range',
      'wallet.filter': 'Filter',
      'wallet.clear': 'Clear',
      'wallet.apply': 'Apply',
      'wallet.date': 'Date',
      'wallet.type': 'Type',
      'wallet.status': 'Status',
      'wallet.description': 'Description',
      'wallet.from': 'From',
      'wallet.to': 'To',
      'wallet.you': 'You',
      'wallet.sender': 'Sender',
      'wallet.receiver': 'Receiver',
      'wallet.transactionId': 'Transaction ID',
      'wallet.reference': 'Reference',
      'wallet.notes': 'Notes',
      'wallet.details': 'Details',
      'wallet.close': 'Close',
      'wallet.back': 'Back',
      'wallet.continue': 'Continue',
      'wallet.previous': 'Previous',
      'wallet.next': 'Next',
      'wallet.page': 'Page',
      'wallet.of': 'of',
      'wallet.showing': 'Showing',
      'wallet.results': 'results',
      'wallet.perPage': 'per page',
      'wallet.all': 'All'
    };
    return translations[key] || key;
  };

  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'deposit';

  console.log('👤 Auth state:', { user, isAuthenticated });

  // If not authenticated, redirect
  if (!isAuthenticated || !user) {
    console.log('❌ ' + t('errors.unauthorized'));
    window.location.href = '/login';
    return null;
  }

  console.log('✅ User authenticated:', user.id, user.email);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showTerms, setShowTerms] = useState(false);
  const [showDepositTerms, setShowDepositTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // USDT Deposit
  const [showUSDTDeposit, setShowUSDTDeposit] = useState(false);
  const [usdtQRCode, setUsdtQRCode] = useState(null);
  const [usdtWallet, setUsdtWallet] = useState('');
  const [pendingDepositId, setPendingDepositId] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [showDepositSuccessModal, setShowDepositSuccessModal] = useState(false);

  // Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('usdt'); // 'usdt' | 'pix'
  const [withdrawWallet, setWithdrawWallet] = useState(user?.crypto_wallet || '');
  const [withdrawType, setWithdrawType] = useState('yield');
  const [showWithdrawSuccessModal, setShowWithdrawSuccessModal] = useState(false);

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
    queryFn: fetchUserTransactions,
    enabled: !!user?.id,
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: fetchUserInvestments,
    enabled: !!user?.id,
  });

  // Fetch confirmed deposits via API
  const { data: confirmedDeposits = [] } = useQuery({
    queryKey: ['confirmed-deposits', user?.id],
    queryFn: fetchUserDeposits,
    enabled: !!user?.id,
  });

  // Fetch user withdrawals via API
  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: fetchUserWithdrawals,
    enabled: !!user?.id,
  });

  const { data: adminAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['admin-banking-accounts'],
    queryFn: fetchAdminBankingAccounts,
    retry: 2,
    retryDelay: 2000,
    staleTime: 300000, // 5 minutos
    enabled: !!user // Only run if user exists
  });

  // Query to fetch user transfers via API
  const { data: transfers = [], isLoading: isLoadingTransfers } = useQuery({
    queryKey: ['transfers', user?.id],
    queryFn: fetchUserTransfers,
    enabled: !!user?.id,
  });

  const createDepositMutation = useMutation({
    mutationFn: async (depositData) => {
      console.log('🚀 Creating deposit:', depositData);
      return await financialAPI.createUSDTDeposit(depositData);
    },
    onSuccess: (data) => {
      console.log('✅ Deposit created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      setDepositAmount('');
      setDepositDescription('');
      setShowQR(false);
      toast.success('Deposit created successfully! Send the receipt for approval.');
    },
    onError: (error) => {
      console.error('❌ Error creating deposit:', error);
      toast.error(`Error creating deposit: ${error.message}`);
    },
    onMutate: (variables) => {
      console.log('🔄 Starting mutation with variables:', variables);
    }
  });

  // Mutation for USDT deposit
  const createUSDTDepositMutation = useMutation({
    mutationFn: async (depositData) => {
      console.log('🚀 Creating USDT deposit:', depositData);
      return await financialAPI.createUSDTDeposit(depositData);
    },
    onSuccess: (data) => {
      console.log('✅ USDT deposit created - COMPLETE DATA:', data);
      console.log('  - deposit:', data.deposit);
      console.log('  - instructions:', data.instructions);
      console.log('  - qr_code_url:', data.deposit?.qr_code_url);
      console.log('  - wallet:', data.instructions?.wallet);
      console.log('  - deposit_id:', data.deposit?.id);
      
      if (!data.deposit?.qr_code_url) {
        console.error('❌ ERROR: qr_code_url not found in response!');
        toast.error('Error: QR Code not returned by server');
        return;
      }
      
      setUsdtQRCode(data.deposit.qr_code_url);
      setUsdtWallet(data.instructions.wallet);
      setPendingDepositId(data.deposit.id);
      setShowUSDTDeposit(true);
      toast.success('QR Code generated! Send USDT to the wallet and wait for approval.');
    },
    onError: (error) => {
      console.error('❌ Error creating USDT deposit:', error);
      toast.error(`Error: ${error.message}`);
    }
  });

  // Add debug logs to track state changes
  useEffect(() => {
    console.log('🔄 State updated:');
    console.log('  - depositAmount:', depositAmount);
    console.log('  - acceptedTerms:', acceptedTerms);
    console.log('  - showQR:', showQR);
    console.log('  - adminAccounts.length:', adminAccounts.length);
    console.log('  - createDepositMutation.isPending:', createDepositMutation.isPending);
    console.log('  - user:', user);
  }, [depositAmount, acceptedTerms, showQR, adminAccounts, createDepositMutation.isPending, user]);

  useEffect(() => {
    console.log('📊 Admin accounts loaded:', adminAccounts);
  }, [adminAccounts]);

  useEffect(() => {
    console.log('🔄 showUSDTDeposit changed:', showUSDTDeposit);
    console.log('   - usdtQRCode:', usdtQRCode ? 'present' : 'null');
    console.log('   - usdtWallet:', usdtWallet);
    console.log('   - pendingDepositId:', pendingDepositId);
  }, [showUSDTDeposit, usdtQRCode, usdtWallet, pendingDepositId]);

  // Create withdrawal mutation
  const createWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalData) => {
      console.log('🚀 createWithdrawalMutation called:', withdrawalData);
      console.log('  - user?.id:', user?.id);
      
      try {
        const response = await financialAPI.withdrawal(withdrawalData);
        
        console.log('📊 API response:', response);
        
        if (response.error) {
          console.error('❌ API error:', response.error);
          throw new Error(response.error);
        }
        
        console.log('✅ Withdrawal created successfully:', response.withdrawal);
        return response.withdrawal;
      } catch (err) {
        console.error('❌ Error in mutation:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('✅ onSuccess called:', data);
      toast.success('Withdrawal requested successfully! Please wait for approval.');
      setWithdrawAmount('');
      setWithdrawWallet('');
      setAcceptedTerms(false);
      // Show success modal
      setShowWithdrawSuccessModal(true);
      // Refetch withdrawals list
      queryClient.invalidateQueries({ queryKey: ['withdrawals', user?.id] });
    },
    onError: (error) => {
      console.error('❌ onError called:', error);
      
      // Extract error message from API
      const errorMessage = error.message || error.error || 'Unknown error';
      
      // Specific handling for different error types
      if (errorMessage.includes('Saldo insuficiente') || errorMessage.includes('Insufficient balance')) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Insufficient Balance</span>
            <span className="text-sm">You do not have sufficient balance to make this withdrawal.</span>
            <span className="text-xs text-gray-400 mt-1">Check your available balance in your wallet.</span>
          </div>,
          { duration: 5000 }
        );
      } else if (errorMessage.includes('valor mínimo') || errorMessage.includes('minimum')) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Minimum Amount Not Met</span>
            <span className="text-sm">The requested amount is below the minimum allowed.</span>
          </div>,
          { duration: 5000 }
        );
      } else if (errorMessage.includes('limite') || errorMessage.includes('limit')) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Limit Exceeded</span>
            <span className="text-sm">You have exceeded the allowed withdrawal limit.</span>
          </div>,
          { duration: 5000 }
        );
      } else {
        // Generic error with API message
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Error Requesting Withdrawal</span>
            <span className="text-sm">{errorMessage}</span>
          </div>,
          { duration: 5000 }
        );
      }
    }
  });

  // Mutation to initiate transfer (sends email with code)
  const initiateTransferMutation = useMutation({
    mutationFn: async (transferData) => {
      console.log('🚀 Initiating transfer:', transferData);
      const response = await financialAPI.initiateTransfer({
        amount: transferData.amount,
        recipient_email: transferData.email,
        description: transferData.description
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Code sent:', data);
      setPendingTransferId(data.transfer_id);
      setShowVerificationDialog(true);
      toast.success('Verification code sent to your email!');
    },
    onError: (error) => {
      console.error('❌ Error initiating transfer:', error);
      toast.error(`Error: ${error.message}`);
    }
  });

  // Mutation to confirm transfer with code
  const confirmTransferMutation = useMutation({
    mutationFn: async ({ transferId, code }) => {
      console.log('🔄 Confirming transfer:', { transferId, code });
      const response = await financialAPI.confirmTransfer({
        transfer_id: transferId,
        verification_code: code
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Transfer confirmed:', data);
      toast.success('Transfer completed successfully!');
      setShowVerificationDialog(false);
      setVerificationCode('');
      setPendingTransferId(null);
      setTransferAmount('');
      setTransferEmail('');
      // Update balance on screen
      refetchBalance();
      // Invalidate queries to force data refresh
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['confirmed-deposits', user?.id] });
    },
    onError: (error) => {
      console.error('❌ Error confirming:', error);
      toast.error(`Invalid or expired code: ${error.message}`);
    }
  });

  // Mutation to send USDT deposit Transaction Hash
  const submitTransactionHashMutation = useMutation({
    mutationFn: async ({ depositId, transactionHash }) => {
      console.log('🚀 Sending Transaction Hash:', { depositId, transactionHash });
      const response = await financialAPI.submitTransactionHash({
        deposit_id: depositId,
        transaction_hash: transactionHash
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Transaction Hash sent:', data);
      toast.success('Request Sent Successfully!');
      setTransactionHash('');
      // Close deposit tab (same as Close button)
      setShowUSDTDeposit(false);
      setUsdtQRCode(null);
      setDepositAmount('');
      setAcceptedTerms(false);
      setPendingDepositId(null);
      // Show success modal
      setShowDepositSuccessModal(true);
      // Invalidate queries to force history refresh
      queryClient.invalidateQueries({ queryKey: ['confirmed-deposits', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
    onError: (error) => {
      console.error('❌ Error sending Transaction Hash:', error);
      toast.error(`Error sending: ${error.message}`);
    }
  });

  const handleDeposit = () => {
    console.log('🚀 handleDeposit USDT called');
    console.log('✅ depositAmount:', depositAmount);
    console.log('✅ acceptedTerms:', acceptedTerms);
    console.log('✅ user:', user);
    
    if (!depositAmount) {
      console.log('❌ Error: Deposit amount not provided');
      toast.error('Enter the deposit amount');
      return;
    }

    if (!acceptedTerms) {
      console.log('❌ Error: Terms not accepted');
      toast.error('Accept the deposit terms');
      return;
    }

    console.log('✅ All validations passed');
    console.log('✅ Starting USDT deposit...');
    
    // Create USDT deposit
    createUSDTDepositMutation.mutate({
      amount: parseFloat(depositAmount)
    });
  };

  const handleWithdrawal = () => {
    console.log('🚀 handleWithdrawal called!');
    console.log('  - withdrawAmount:', withdrawAmount);
    console.log('  - withdrawWallet:', withdrawWallet);
    console.log('  - acceptedTerms:', acceptedTerms);
    
    if (!withdrawAmount) {
      console.log('❌ Error: Amount not provided');
      toast.error('Amount not provided! Please enter the amount you want to withdraw.', {
        description: 'The minimum withdrawal amount is R$ 10.00.',
        duration: 5000
      });
      return;
    }

    if (!withdrawWallet) {
      console.log('❌ Error: Wallet not provided');
      toast.error(`Wallet not provided! Please enter the ${withdrawMethod === 'usdt' ? 'USDT (BEP20)' : 'PIX'} wallet address.`, {
        description: 'Please check if you entered the address correctly.',
        duration: 5000
      });
      return;
    }

    if (!acceptedTerms) {
      console.log('❌ Error: Terms not accepted');
      toast.error('Terms not accepted! You need to accept the withdrawal terms to continue.', {
        description: 'Check the checkbox below the terms.',
        duration: 5000
      });
      return;
    }

    console.log('✅ All validations passed, sending to backend...');
    
    // Send withdrawal to backend
    createWithdrawalMutation.mutate({
      amount: parseFloat(withdrawAmount),
      method: withdrawMethod,
      destination_address: withdrawWallet
    });
  };

  const handleTransfer = async () => {
    console.log('🚀 handleTransfer called!');
    console.log('  - transferAmount:', transferAmount);
    console.log('  - transferEmail:', transferEmail);

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      console.log('❌ Error: Amount not provided');
      toast.error('Enter the transfer amount');
      return;
    }

    if (!transferEmail) {
      console.log('❌ Error: Email not provided');
      toast.error('Enter the recipient email');
      return;
    }

    if (transferEmail === user?.email) {
      console.log('❌ Error: Cannot transfer to yourself');
      toast.error('You cannot transfer to yourself');
      return;
    }

    console.log('✅ All validations passed, starting transfer...');
    setIsInitiatingTransfer(true);
    
    initiateTransferMutation.mutate({
      email: transferEmail,
      amount: parseFloat(transferAmount),
      description: `Transfer to ${transferEmail}`
    }, {
      onSettled: () => setIsInitiatingTransfer(false)
    });
  };
  
  const handleConfirmTransfer = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    
    confirmTransferMutation.mutate({
      transferId: pendingTransferId,
      code: verificationCode
    });
  };

  // Fetch balance from API
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
        <h1 className="text-2xl font-bold text-foreground">{t('wallet.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('wallet.subtitle') || 'Manage your deposits, withdrawals and transfers'}
        </p>
      </div>

      {/* Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="w-5 h-5" />
            {t('wallet.totalBalance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('wallet.availableBalance')}</p>
              <p className="text-2xl font-bold text-gold">{formatCurrency(availableBalance)}</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('wallet.totalInvested')}</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{t('wallet.totalEarned')}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            {t('wallet.deposit')}
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            {t('wallet.withdraw')}
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            {t('wallet.transfer')}
          </TabsTrigger>
        </TabsList>

        {/* Deposit Tab */}
        <TabsContent value="deposit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {t('wallet.newDeposit')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="deposit-amount" className="text-sm font-medium">{t('wallet.depositAmount')}</label>
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
                  <label htmlFor="deposit-description" className="text-sm font-medium">{t('wallet.descriptionOptional')}</label>
                  <Input
                    id="deposit-description"
                    placeholder={t('wallet.depositDescriptionPlaceholder')}
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
                    {t('wallet.acceptTerms')}
                  </label>
                </div>
                <Button 
                  onClick={() => setShowDepositTerms(true)}
                  variant="outline"
                  className="w-full"
                >
                  {t('wallet.viewDepositTerms')}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      console.log('🔘 Confirm USDT Deposit button clicked!');
                      handleDeposit();
                    }}
                    disabled={createUSDTDepositMutation.isPending || !depositAmount || !acceptedTerms}
                    className="flex-1"
                  >
                    {createUSDTDepositMutation.isPending ? t('wallet.generatingQR') : t('wallet.generateQRUSDT')}
                  </Button>
                </div>
              </div>

              {/* QR Code Display */}
              {showQR && depositAmount && adminAccounts.length > 0 && (
                <div className="mt-6 p-6 bg-white rounded-lg border">
                  <h4 className="text-center font-semibold mb-4">{t('wallet.qrCodeForPIX')}</h4>
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
                        {t('wallet.qrCodeValid')}
                      </p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('wallet.amount')}:</strong> {formatCurrency(parseFloat(depositAmount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('wallet.scanQRWithBankApp')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('wallet.sendReceiptAfterPayment')}
                    </p>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">{t('wallet.pixCopyPasteCode')}</p>
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
                            toast.success(t('wallet.pixCodeCopied'));
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* USDT QR Code Display */}
              {showUSDTDeposit && usdtQRCode && (
                <div className="mt-6 p-6 bg-white rounded-lg border border-yellow-200 bg-yellow-50">
                  <h4 className="text-center font-semibold mb-4 text-yellow-800">
                    <DollarSign className="w-5 h-5 inline mr-2" />
                    USDT Deposit - Awaiting Approval
                  </h4>
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <img 
                        src={usdtQRCode}
                        alt="QR Code USDT"
                        className="w-48 h-48"
                      />
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Scan to copy wallet
                      </p>
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-muted-foreground mb-1">USDT Wallet (BEP20):</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-gray-800 break-all flex-1">
                          {usdtWallet}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(usdtWallet);
                            toast.success('USDT Wallet copied!');
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-yellow-800">
                      <strong>Amount:</strong> {formatCurrency(parseFloat(depositAmount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      1. Send USDT to the wallet above
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2. Wait for admin confirmation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      3. Balance will be credited automatically
                    </p>
                    {pendingDepositId && (
                      <p className="text-xs text-gray-500">
                        Deposit ID: {pendingDepositId}
                      </p>
                    )}
                    {/* Transaction Hash Input */}
                    <div className="bg-white p-3 rounded-lg shadow-sm mt-4 border border-gray-200">
                      <label htmlFor="transaction-hash" className="text-xs text-gray-700 mb-1 block font-medium">
                        Transaction Hash (TXID):
                      </label>
                      <Input
                        id="transaction-hash"
                        placeholder="Paste the blockchain transaction hash"
                        value={transactionHash}
                        onChange={(e) => setTransactionHash(e.target.value)}
                        className="text-sm font-mono bg-white text-gray-900 border-gray-300 placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        After sending USDT, paste the Transaction Hash here
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        if (!transactionHash.trim()) {
                          toast.error('Enter the Transaction Hash');
                          return;
                        }
                        submitTransactionHashMutation.mutate({
                          depositId: pendingDepositId,
                          transactionHash: transactionHash.trim()
                        });
                      }}
                      disabled={!pendingDepositId || !transactionHash.trim() || submitTransactionHashMutation.isPending}
                      className="mt-2 w-full"
                      variant="default"
                    >
                      {submitTransactionHashMutation.isPending ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Sending...
                        </>
                      ) : (
                        'Send Transaction Hash'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowUSDTDeposit(false);
                        setUsdtQRCode(null);
                        setDepositAmount('');
                        setAcceptedTerms(false);
                        setTransactionHash('');
                        setPendingDepositId(null);
                      }}
                      className="mt-2"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deposit List */}
          {confirmedDeposits.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5" />
                  Deposit History
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
                        {deposit.transaction_hash && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            TX: {deposit.transaction_hash.substring(0, 20)}...
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          deposit.status === 'confirmed' || deposit.status === 'approved'
                            ? 'bg-green-100 text-green-700' 
                            : deposit.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {deposit.status === 'confirmed' || deposit.status === 'approved'
                            ? 'Confirmed' 
                            : deposit.status === 'rejected'
                            ? 'Rejected'
                            : 'Pending'}
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
                  Deposit History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-4">
                  No deposits found. Make your first deposit above.
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
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="withdraw-amount" className="text-sm font-medium">
                    Withdrawal Amount (R$)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="50,00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className={`font-mono ${!withdrawAmount ? 'border-red-500 focus:ring-red-500' : ''}`}
                    min="10"
                    step="0.01"
                    max={availableBalance}
                  />
                  {!withdrawAmount ? (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Enter the withdrawal amount (minimum: R$ 10.00)
                    </p>
                  ) : parseFloat(withdrawAmount) < 10 ? (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Minimum withdrawal amount is R$ 10.00
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Available balance: {formatCurrency(availableBalance)}
                    </p>
                  )}
                </div>

                {/* Note about Saturday withdrawals */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important Note</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Withdrawals are processed and transferred <strong>exclusively on Saturdays</strong>. 
                        Requests made during the week will be scheduled for the next Saturday.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="withdraw-method" className="text-sm font-medium">Withdrawal Method</label>
                  <select
                    id="withdraw-method"
                    value={withdrawMethod}
                    onChange={(e) => {
                      setWithdrawMethod(e.target.value);
                      setWithdrawWallet(''); // Clear the field when changing method
                    }}
                    className="w-full p-2 border rounded-md bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="usdt" className="bg-background text-foreground">USDT (BEP20)</option>
                    <option value="pix" className="bg-background text-foreground">PIX</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="withdraw-wallet" className="text-sm font-medium">
                    {withdrawMethod === 'usdt' ? 'USDT Wallet (BEP20)' : 'PIX Key'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    id="withdraw-wallet"
                    placeholder={withdrawMethod === 'usdt' ? 'USDT wallet address' : 'PIX Key (CPF, CNPJ, Email, Mobile or Random Key)'}
                    value={withdrawWallet}
                    onChange={(e) => setWithdrawWallet(e.target.value)}
                    className={!withdrawWallet && withdrawAmount ? 'border-red-500 focus:ring-red-500' : ''}
                  />
                  {!withdrawWallet && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Enter the wallet address to receive the withdrawal
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="withdraw-type" className="text-sm font-medium">Withdrawal Type</label>
                  <select
                    id="withdraw-type"
                    value={withdrawType}
                    onChange={(e) => setWithdrawType(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="yield" className="bg-background text-foreground">Earnings</option>
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
                    I have read and accept the withdrawal terms
                  </label>
                </div>

                {/* Mensagem informativa quando termos não aceitos */}
                {!acceptedTerms && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Withdrawal Terms Not Accepted
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Click on "View Withdrawal Terms", read and accept them to enable the request button.
                      </p>
                    </div>
                  </div>
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
                
                {/* Mensagem explicando por que o botão está desabilitado */}
                {(!withdrawAmount || !withdrawWallet || !acceptedTerms) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Para solicitar o saque, preencha:</span>
                      <br />
                      {!withdrawAmount && '• Valor do saque (mínimo R$ 10,00)'}
                      {!withdrawAmount && !withdrawWallet && <br />}
                      {!withdrawWallet && '• Endereço da carteira de destino'}
                      {!withdrawWallet && !acceptedTerms && <br />}
                      {!acceptedTerms && '• Aceite os termos de saque'}
                    </p>
                  </div>
                )}
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
            <DialogTitle>Deposit Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Processing and Approval</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Deposits are pending manual confirmation</li>
                <li>Processing time: up to 24 business hours</li>
                <li>Minimum deposit amount: R$ 10.00</li>
                <li>Send the receipt to speed up approval</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Deposit Methods</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>PIX: immediate processing after confirmation</li>
                <li>Bank transfer: up to 24h for compensation</li>
                <li>The bank details are exclusive to Imperium Club</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Rules and Responsibilities</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Verify all data before making the transfer</li>
                <li>The user is responsible for the transferred amount</li>
                <li>In case of error, contact support immediately</li>
                <li>Third-party deposits are not accepted</li>
                <li>Imperium Club is not responsible for fraud</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Important</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Keep the transfer receipt</li>
                <li>Do not make deposits from illicit sources</li>
                <li>Accounts that violate the terms will be blocked</li>
                <li>Final approval is at the discretion of the administration</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositTerms(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setAcceptedTerms(true);
              setShowDepositTerms(false);
            }}>
              Accept Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdrawal Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Fees and Deadlines</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Processing fee: 5% on the withdrawal amount</li>
                <li>Processing time: up to 48 business hours</li>
                <li>Minimum withdrawal amount: R$ 50.00</li>
                <li>Capital withdrawals may have penalty</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Rules</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>The wallet address must be valid</li>
                <li>The user is responsible for the address</li>
                <li>In case of error, the amount will be returned to the balance</li>
                <li>Withdrawals are pending manual approval</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setAcceptedTerms(true);
              setShowTerms(false);
            }}>
              Accept Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal List */}
      {withdrawals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              Withdrawal History
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
                      {withdrawal.type === 'yield' ? 'Earnings' : 'Capital'} • {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      Wallet: {withdrawal.wallet_address}
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
                        ? 'Approved' 
                        : withdrawal.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
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
              Withdrawal History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">
              No withdrawals found. Make your first request above.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Code Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Transfer Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Enter the 6-digit code sent to your email
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
              The code expires in 10 minutes
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={verificationCode.length !== 6 || confirmTransferMutation.isPending}
              className="w-full sm:w-auto bg-gold hover:bg-gold/90"
            >
              {confirmTransferMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Confirming...
                </>
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal for Deposit */}
      <Dialog open={showDepositSuccessModal} onOpenChange={setShowDepositSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Request Sent Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-700 mb-2">
              Your deposit has been registered and is awaiting confirmation.
            </p>
            <p className="text-sm text-gray-500">
              Balance will be credited automatically after admin approval.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowDepositSuccessModal(false)}
              className="w-full bg-gold hover:bg-gold/90"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal for Withdrawal */}
      <Dialog open={showWithdrawSuccessModal} onOpenChange={setShowWithdrawSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Withdrawal Requested Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-700 mb-2">
              Your withdrawal request has been sent and is awaiting processing.
            </p>
            
            {/* Processing fee information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-amber-800 font-medium">
                Processing Fee: 5%
              </p>
              <p className="text-xs text-amber-700 mt-1">
                A 5% fee will be charged on the withdrawal amount for transaction processing.
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              The net amount will be transferred within 48 business hours after approval.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowWithdrawSuccessModal(false)}
              className="w-full bg-gold hover:bg-gold/90"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
