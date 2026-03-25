import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/planConfig';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Wallet, ExternalLink } from 'lucide-react';

// Fetch withdrawals
const fetchWithdrawals = async () => {
  const { data, error } = await supabase
    .from('withdrawals')
    .select(`
      *,
      users!inner(
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Update withdrawal status
const updateWithdrawalStatus = async ({ withdrawalId, status, adminNotes }) => {
  const { data, error } = await supabase
    .from('withdrawals')
    .update({ 
      status,
      admin_notes: adminNotes,
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
    })
    .eq('id', withdrawalId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export default function AdminWithdrawals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: fetchWithdrawals,
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateWithdrawalStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-withdrawals']);
      toast.success('Status do saque atualizado!');
      setShowWithdrawalDialog(false);
      setSelectedWithdrawal(null);
      setAdminNotes('');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.transaction_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.destination_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || withdrawal.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleViewWithdrawal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowWithdrawalDialog(true);
  };

  const handleUpdateStatus = (newStatus) => {
    updateStatusMutation.mutate({
      withdrawalId: selectedWithdrawal.id,
      status: newStatus,
      adminNotes: adminNotes
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      rejected: 'destructive',
      cancelled: 'outline'
    };
    
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getMethodBadge = (method) => {
    const labels = {
      pix: 'PIX',
      bank_transfer: 'Transferência',
      crypto: 'Cripto'
    };
    
    return (
      <Badge variant="outline">
        {labels[method] || method}
      </Badge>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Saques</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e aprove todos os saques do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar saques..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="bank_transfer">Transferência</SelectItem>
              <SelectItem value="crypto">Cripto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredWithdrawals.map((withdrawal) => (
          <Card key={withdrawal.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{withdrawal.users?.full_name || 'Usuário'}</h3>
                      <p className="text-sm text-muted-foreground">{withdrawal.users?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(withdrawal.status)}
                      {getMethodBadge(withdrawal.method)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de Processamento</p>
                      <p className="font-medium">{formatCurrency(withdrawal.processing_fee || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor Líquido</p>
                      <p className="font-medium">{formatCurrency(withdrawal.amount - (withdrawal.processing_fee || 0))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">{new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Endereço de Destino</p>
                    <p className="font-mono text-xs bg-secondary/50 p-2 rounded">{withdrawal.destination_address}</p>
                  </div>
                  
                  {withdrawal.transaction_hash && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Hash da Transação</p>
                      <p className="font-mono text-xs">{withdrawal.transaction_hash}</p>
                    </div>
                  )}
                  
                  {withdrawal.admin_notes && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Notas do Admin</p>
                      <p className="text-sm bg-secondary/50 p-2 rounded">{withdrawal.admin_notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewWithdrawal(withdrawal)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  
                  {withdrawal.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowWithdrawalDialog(true);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setAdminNotes('');
                          setShowWithdrawalDialog(true);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdrawal Details Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Saque</DialogTitle>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{selectedWithdrawal.users?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.users?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Processamento</p>
                  <p className="font-medium">{formatCurrency(selectedWithdrawal.processing_fee || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Líquido</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedWithdrawal.amount - (selectedWithdrawal.processing_fee || 0))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método</p>
                  <div className="mt-1">{getMethodBadge(selectedWithdrawal.method)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Saque</p>
                  <p className="font-medium">{new Date(selectedWithdrawal.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmação</p>
                  <p className="font-medium">
                    {selectedWithdrawal.confirmed_at 
                      ? new Date(selectedWithdrawal.confirmed_at).toLocaleString('pt-BR')
                      : 'Pendente'
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Endereço de Destino</p>
                <p className="font-mono text-xs bg-secondary/50 p-2 rounded">{selectedWithdrawal.destination_address}</p>
              </div>
              
              {selectedWithdrawal.transaction_hash && (
                <div>
                  <p className="text-sm text-muted-foreground">Hash da Transação</p>
                  <p className="font-mono text-xs bg-secondary/50 p-2 rounded">{selectedWithdrawal.transaction_hash}</p>
                </div>
              )}
              
              {selectedWithdrawal.status === 'pending' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notas do Admin</p>
                  <Input
                    placeholder="Adicione notas sobre esta aprovação/rejeição..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
              Cancelar
            </Button>
            {selectedWithdrawal?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Processando...' : 'Rejeitar'}
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('confirmed')}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Processando...' : 'Aprovar'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
