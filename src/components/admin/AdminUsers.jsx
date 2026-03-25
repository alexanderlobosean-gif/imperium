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
import { Users, Search, Filter, Eye, Edit, Ban, CheckCircle, XCircle, Clock } from 'lucide-react';

// Fetch users
const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Update user status
const updateUserStatus = async ({ userId, status }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update user role
const updateUserRole = async ({ userId, role }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Status do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Role do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar role: ' + error.message);
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.document_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleUpdateStatus = (userId, newStatus) => {
    updateStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleUpdateRole = (userId, newRole) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
      banned: 'destructive'
    };
    
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso',
      banned: 'Banido'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getRoleBadge = (role) => {
    const variants = {
      user: 'secondary',
      admin: 'default',
      super_admin: 'destructive'
    };
    
    const labels = {
      user: 'Usuário',
      admin: 'Admin',
      super_admin: 'Super Admin'
    };
    
    return (
      <Badge variant={variants[role] || 'secondary'}>
        {labels[role] || role}
      </Badge>
    );
  };

  const getKYCBadge = (kycStatus) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      verification_required: 'outline'
    };
    
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      verification_required: 'Verificação Req.'
    };
    
    return (
      <Badge variant={variants[kycStatus] || 'secondary'}>
        {labels[kycStatus] || kycStatus}
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
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e gerencie todos os usuários do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
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
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="suspended">Suspensos</SelectItem>
              <SelectItem value="banned">Banidos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="user">Usuários</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="super_admin">Super Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{user.full_name || 'Sem nome'}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.status)}
                      {getRoleBadge(user.role)}
                      {getKYCBadge(user.kyc_status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">CPF/CNPJ</p>
                      <p className="font-medium">{user.document_number || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Telefone</p>
                      <p className="font-medium">{user.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saldo</p>
                      <p className="font-medium">{formatCurrency(user.available_balance || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Investido</p>
                      <p className="font-medium">{formatCurrency(user.total_invested || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <Clock className="w-3 h-3" />
                    <span>Cadastro: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                    {user.last_login && (
                      <>
                        <span>•</span>
                        <span>Último login: {new Date(user.last_login).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewUser(user)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  
                  {user.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(user.user_id, 'inactive')}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Suspender
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(user.user_id, 'active')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Ativar
                    </Button>
                  )}
                  
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => handleUpdateRole(user.user_id, newRole)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{selectedUser.full_name || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium">{selectedUser.document_number || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedUser.phone || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KYC</p>
                  <div className="mt-1">{getKYCBadge(selectedUser.kyc_status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código de Indicação</p>
                  <p className="font-medium">{selectedUser.referral_code || 'Não gerado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <p className="font-medium">{formatCurrency(selectedUser.available_balance || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Investido</p>
                  <p className="font-medium">{formatCurrency(selectedUser.total_invested || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sacado</p>
                  <p className="font-medium">{formatCurrency(selectedUser.total_withdrawn || 0)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Último Login</p>
                  <p className="font-medium">
                    {selectedUser.last_login 
                      ? new Date(selectedUser.last_login).toLocaleString('pt-BR')
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
