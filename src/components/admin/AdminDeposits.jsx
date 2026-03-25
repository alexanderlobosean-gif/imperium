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
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, DollarSign, FileText } from 'lucide-react';

// Fetch deposits
const fetchDeposits = async () => {
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      profiles!inner(
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Update deposit status
const updateDepositStatus = async ({ depositId, status, adminNotes }) => {
  const { data, error } = await supabase
    .from('deposits')
    .update({ 
      status,
      admin_notes: adminNotes,
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
    })
    .eq('id', depositId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export default function AdminDeposits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: fetchDeposits,
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateDepositStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-deposits']);
      toast.success('Status do depósito atualizado!');
      setShowDepositDialog(false);
      setSelectedDeposit(null);
      setAdminNotes('');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = deposit.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.transaction_hash?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || deposit.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleViewDeposit = (deposit) => {
    setSelectedDeposit(deposit);
    setShowDepositDialog(true);
  };

  const handleUpdateStatus = (newStatus) => {
    updateStatusMutation.mutate({
      depositId: selectedDeposit.id,
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
      crypto: 'Cripto',
      credit_card: 'Cartão'
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
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Depósitos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e aprove todos os depósitos do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar depósitos..."
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
              <SelectItem value="credit_card">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDeposits.map((deposit) => (
          <Card key={deposit.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{deposit.profiles?.full_name || 'Usuário'}</h3>
                      <p className="text-sm text-muted-foreground">{deposit.profiles?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(deposit.status)}
                      {getMethodBadge(deposit.method)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-medium">{formatCurrency(deposit.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hash da Transação</p>
                      <p className="font-mono text-xs">{deposit.transaction_hash || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">{new Date(deposit.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confirmação</p>
                      <p className="font-medium">
                        {deposit.confirmed_at 
                          ? new Date(deposit.confirmed_at).toLocaleDateString('pt-BR')
                          : 'Pendente'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {deposit.description && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="text-sm">{deposit.description}</p>
                    </div>
                  )}
                  
                  {deposit.proof_url && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Comprovante</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(deposit.proof_url, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Ver Comprovante
                      </Button>
                    </div>
                  )}
                  
                  {deposit.admin_notes && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Notas do Admin</p>
                      <p className="text-sm bg-secondary/50 p-2 rounded">{deposit.admin_notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDeposit(deposit)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  
                  {deposit.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setSelectedDeposit(deposit);
                          setShowDepositDialog(true);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedDeposit(deposit);
                          setAdminNotes('');
                          setShowDepositDialog(true);
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

      {/* Deposit Details Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Depósito</DialogTitle>
          </DialogHeader>
          
          {selectedDeposit && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{selectedDeposit.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDeposit.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedDeposit.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método</p>
                  <div className="mt-1">{getMethodBadge(selectedDeposit.method)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Depósito</p>
                  <p className="font-medium">{new Date(selectedDeposit.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hash da Transação</p>
                  <p className="font-mono text-xs">{selectedDeposit.transaction_hash || 'Não informado'}</p>
                </div>
              </div>
              
              {selectedDeposit.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm bg-secondary/50 p-2 rounded">{selectedDeposit.description}</p>
                </div>
              )}
              
              {selectedDeposit.proof_url && (
                <div>
                  <p className="text-sm text-muted-foreground">Comprovante</p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedDeposit.proof_url, '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Ver Comprovante
                  </Button>
                </div>
              )}
              
              {selectedDeposit.status === 'pending' && (
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
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
              Cancelar
            </Button>
            {selectedDeposit?.status === 'pending' && (
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
