import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { financialAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CreditCard, 
  QrCode, 
  Download, 
  Copy,
  Check,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/planConfig';

// Fetch admin banking accounts for user deposits
const fetchAdminBankingAccounts = async () => {
  const { data, error } = await supabase
    .from('admin_banking_accounts')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create deposit via API backend
const createDeposit = async (depositData) => {
  return await financialAPI.deposit(depositData);
};

export default function Deposit() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-banking-accounts-deposit'],
    queryFn: fetchAdminBankingAccounts,
  });

  const createDepositMutation = useMutation({
    mutationFn: createDeposit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-deposits'] });
      setDepositAmount('');
      setDepositDescription('');
      setShowQRCode(false);
      alert('Depósito criado com sucesso! Envie o comprovante para aprovação.');
    },
    onError: (error) => {
      alert(`Erro ao criar depósito: ${error.message}`);
    }
  });

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateDeposit = () => {
    if (!selectedAccount || !depositAmount) {
      alert('Selecione uma conta e informe o valor do depósito');
      return;
    }

    const { user } = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
    
    createDepositMutation.mutate({
      user_id: user?.id,
      amount: parseFloat(depositAmount),
      method: 'pix',
      description: depositDescription || 'Depósito via PIX',
      admin_account_id: selectedAccount.id,
      bank_name: selectedAccount.bank_name,
      account_holder: selectedAccount.account_holder
    });
  };

  const generateQRCodeData = (account, amount) => {
    const pixData = {
      key: account.pix_key,
      amount: parseFloat(amount).toFixed(2),
      description: depositDescription || `Depósito Imperium Club`,
      merchant: account.account_holder,
      transaction_id: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    return JSON.stringify(pixData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Depósito</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deposite fundos em sua conta usando as contas bancárias do Imperium Club
        </p>
      </div>

      {/* Alert */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Instruções de Depósito</h3>
              <p className="text-sm text-blue-700 mt-1">
                1. Selecione uma conta bancária abaixo<br/>
                2. Informe o valor do depósito<br/>
                3. Faça a transferência PIX para os dados da conta selecionada<br/>
                4. Após o pagamento, clique em "Criar Depósito" e envie o comprovante
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts?.map((account) => (
          <Card 
            key={account.id} 
            className={`cursor-pointer transition-all ${
              selectedAccount?.id === account.id 
                ? 'ring-2 ring-gold border-gold' 
                : 'hover:border-gold/50'
            }`}
            onClick={() => setSelectedAccount(account)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  <div>
                    <CardTitle className="text-lg">{account.bank_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{account.account_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.is_default && (
                    <Badge variant="secondary">Recomendada</Badge>
                  )}
                  {selectedAccount?.id === account.id && (
                    <div className="w-4 h-4 rounded-full bg-gold"></div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Titular</Label>
                  <p className="font-medium">{account.account_holder}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Agência</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{account.bank_agency}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(account.bank_agency, 'agency-' + account.id);
                      }}
                    >
                      {copiedField === 'agency-' + account.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Conta</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{account.bank_account}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(account.bank_account, 'account-' + account.id);
                      }}
                    >
                      {copiedField === 'account-' + account.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{account.document_cpf}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(account.document_cpf, 'cpf-' + account.id);
                      }}
                    >
                      {copiedField === 'cpf-' + account.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chave PIX ({account.pix_key_type})</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{account.pix_key}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(account.pix_key, 'pix-' + account.id);
                      }}
                    >
                      {copiedField === 'pix-' + account.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deposit Form */}
      {selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Criar Depósito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deposit-amount">Valor do Depósito (R$)</Label>
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
                <Label htmlFor="deposit-description">Descrição (opcional)</Label>
                <Input
                  id="deposit-description"
                  placeholder="Descrição do depósito"
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateDeposit}
                  disabled={createDepositMutation.isPending || !depositAmount}
                  className="flex-1"
                >
                  {createDepositMutation.isPending ? 'Criando...' : 'Criar Depósito'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQRCode(!showQRCode)}
                  disabled={!depositAmount}
                  className="flex-1"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQRCode ? 'Ocultar QR Code' : 'Gerar QR Code'}
                </Button>
              </div>
            </div>

            {/* QR Code Display */}
            {showQRCode && depositAmount && (
              <div className="mt-6 p-6 bg-white rounded-lg border">
                <h4 className="text-center font-semibold mb-4">QR Code para Pagamento PIX</h4>
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <QrCode className="w-32 h-32 text-gray-400" />
                    <p className="text-xs text-center text-gray-500 mt-2">
                      QR Code simulado
                    </p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Valor:</strong> {formatCurrency(parseFloat(depositAmount))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Chave PIX:</strong> {selectedAccount.pix_key}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Escaneie o QR Code ou copie a chave PIX acima
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
