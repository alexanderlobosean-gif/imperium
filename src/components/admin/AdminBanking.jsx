import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Check,
  X
} from 'lucide-react';

// Fetch admin banking accounts (usando supabaseAdmin para bypass RLS)
const fetchAdminBankingAccounts = async () => {
  const { data, error } = await supabaseAdmin
    .from('admin_banking_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create admin banking account
const createAdminBankingAccount = async (accountData) => {
  const { data, error } = await supabase
    .from('admin_banking_accounts')
    .insert({
      ...accountData,
      is_active: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update admin banking account
const updateAdminBankingAccount = async (id, accountData) => {
  const { data, error } = await supabase
    .from('admin_banking_accounts')
    .update({
      ...accountData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete admin banking account
const deleteAdminBankingAccount = async (id) => {
  const { error } = await supabase
    .from('admin_banking_accounts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

export default function AdminBanking() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-banking-accounts'],
    queryFn: fetchAdminBankingAccounts,
  });

  const createMutation = useMutation({
    mutationFn: createAdminBankingAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banking-accounts'] });
      setShowForm(false);
      setEditingAccount(null);
      alert('Conta bancária criada com sucesso!');
    },
    onError: (error) => {
      alert(`Erro ao criar conta: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminBankingAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banking-accounts'] });
      setShowForm(false);
      setEditingAccount(null);
      alert('Conta bancária atualizada com sucesso!');
    },
    onError: (error) => {
      alert(`Erro ao atualizar conta: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminBankingAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banking-accounts'] });
      alert('Conta bancária desativada com sucesso!');
    },
    onError: (error) => {
      alert(`Erro ao desativar conta: ${error.message}`);
    }
  });

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const accountData = {
      bank_name: formData.get('bank_name'),
      account_type: formData.get('account_type'),
      bank_agency: formData.get('bank_agency'),
      bank_account: formData.get('bank_account'),
      account_holder: formData.get('account_holder'),
      document_cpf: formData.get('document_cpf'),
      pix_key: formData.get('pix_key'),
      pix_key_type: formData.get('pix_key_type'),
      is_default: formData.get('is_default') === 'on'
    };

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: accountData });
    } else {
      createMutation.mutate(accountData);
    }
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
        <h1 className="text-2xl font-bold text-foreground">Contas Bancárias</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as contas bancárias para recebimento de depósitos
        </p>
      </div>

      {/* Add New Account Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {accounts?.length || 0} contas cadastradas
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingAccount(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </Button>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts?.map((account) => (
          <Card key={account.id} className="relative">
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
                    <Badge variant="secondary">Padrão</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingAccount(account);
                      setShowForm(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(account.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
                      onClick={() => handleCopy(account.bank_agency, 'agency-' + account.id)}
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
                      onClick={() => handleCopy(account.bank_account, 'account-' + account.id)}
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
                  <Label className="text-xs text-muted-foreground">CPF</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{account.document_cpf}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(account.document_cpf, 'cpf-' + account.id)}
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
                      onClick={() => handleCopy(account.pix_key, 'pix-' + account.id)}
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_name">Nome do Banco</Label>
                    <Input
                      id="bank_name"
                      name="bank_name"
                      defaultValue={editingAccount?.bank_name}
                      placeholder="Ex: Banco do Brasil"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_type">Tipo de Conta</Label>
                    <Select name="account_type" defaultValue={editingAccount?.account_type}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Conta Poupança</SelectItem>
                        <SelectItem value="pagamento">Conta Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bank_agency">Agência</Label>
                    <Input
                      id="bank_agency"
                      name="bank_agency"
                      defaultValue={editingAccount?.bank_agency}
                      placeholder="0001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_account">Número da Conta</Label>
                    <Input
                      id="bank_account"
                      name="bank_account"
                      defaultValue={editingAccount?.bank_account}
                      placeholder="12345-6"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_holder">Nome do Titular</Label>
                    <Input
                      id="account_holder"
                      name="account_holder"
                      defaultValue={editingAccount?.account_holder}
                      placeholder="João da Silva"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="document_cpf">CPF do Titular</Label>
                    <Input
                      id="document_cpf"
                      name="document_cpf"
                      defaultValue={editingAccount?.document_cpf}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pix_key_type">Tipo de Chave PIX</Label>
                    <Select name="pix_key_type" defaultValue={editingAccount?.pix_key_type}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pix_key">Chave PIX</Label>
                    <Input
                      id="pix_key"
                      name="pix_key"
                      defaultValue={editingAccount?.pix_key}
                      placeholder="Digite a chave PIX"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    defaultChecked={editingAccount?.is_default}
                    className="rounded"
                  />
                  <Label htmlFor="is_default">Definir como conta padrão</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Salvando...'
                      : editingAccount
                      ? 'Atualizar'
                      : 'Criar'
                    }
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAccount(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
