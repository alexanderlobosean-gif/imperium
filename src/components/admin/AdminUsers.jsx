import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/planConfig';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowDownCircle, 
  DollarSign, 
  Plus,
  Trash2,
  Save,
  UserPlus
} from 'lucide-react';

// Fetch users (usando supabaseAdmin para bypass RLS)
const fetchUsers = async () => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch all user deposits (usando supabaseAdmin)
const fetchAllDeposits = async () => {
  const { data, error } = await supabaseAdmin
    .from('deposits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch all user withdrawals (usando supabaseAdmin)
const fetchAllWithdrawals = async () => {
  const { data, error } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Fetch all user investments (usando supabaseAdmin)
const fetchAllInvestments = async () => {
  const { data, error } = await supabaseAdmin
    .from('investments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Update user status (usando supabaseAdmin)
const updateUserStatus = async ({ userId, status }) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ status })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update user role (usando supabaseAdmin)
const updateUserRole = async ({ userId, role }) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete user (usando supabaseAdmin)
const deleteUser = async (userId) => {
  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return userId;
};

// Create new user (usando supabaseAdmin)
const createUser = async (userData) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      full_name: userData.full_name,
      email: userData.email,
      document_number: userData.document_number,
      phone: userData.phone,
      status: userData.status || 'active',
      role: userData.role || 'user',
      referral_code: userData.referral_code || null,
      referred_by: userData.referred_by || null,
      available_balance: 0,
      total_earned: 0
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update user details (usando supabaseAdmin)
const updateUserDetails = async ({ userId, userData }) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name: userData.full_name,
      email: userData.email,
      document_number: userData.document_number,
      phone: userData.phone,
      status: userData.status,
      role: userData.role,
      referral_code: userData.referral_code || null,
      referred_by: userData.referred_by || null
    })
    .eq('id', userId)
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    document_number: '',
    phone: '',
    status: 'active',
    role: 'user',
    referral_code: '',
    referred_by: ''
  });
  const [editUserData, setEditUserData] = useState({
    full_name: '',
    email: '',
    document_number: '',
    phone: '',
    status: 'active',
    role: 'user',
    referral_code: '',
    referred_by: ''
  });
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
  });

  const { data: allDeposits = [] } = useQuery({
    queryKey: ['admin-all-deposits'],
    queryFn: fetchAllDeposits,
  });

  const { data: allWithdrawals = [] } = useQuery({
    queryKey: ['admin-all-withdrawals'],
    queryFn: fetchAllWithdrawals,
  });

  const { data: allInvestments = [] } = useQuery({
    queryKey: ['admin-all-investments'],
    queryFn: fetchAllInvestments,
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Status do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role do usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar role: ' + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário excluído com sucesso!');
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error('Erro ao excluir usuário: ' + error.message);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário criado com sucesso!');
      setShowCreateDialog(false);
      setNewUser({
        full_name: '',
        email: '',
        document_number: '',
        phone: '',
        status: 'active',
        role: 'user',
        referral_code: '',
        referred_by: ''
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    },
  });

  const updateUserDetailsMutation = useMutation({
    mutationFn: updateUserDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Dados do usuário atualizados com sucesso!');
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar dados do usuário: ' + error.message);
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

  const handleDeleteUser = (userId) => {
    deleteUserMutation.mutate(userId);
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      full_name: user.full_name || '',
      email: user.email || '',
      document_number: user.document_number || '',
      phone: user.phone || '',
      status: user.status || 'active',
      role: user.role || 'user',
      referral_code: user.referral_code || '',
      referred_by: user.referred_by || ''
    });
    setShowEditDialog(true);
  };

  const handleUpdateUserDetails = () => {
    updateUserDetailsMutation.mutate({
      userId: selectedUser.id,
      userData: editUserData
    });
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
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
      <Badge variant={variants[status] || 'secondary'} className="className">
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
      <Badge variant={variants[role] || 'secondary'} className="className">
        {labels[role] || role}
      </Badge>
    );
  };

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalDeposits = allDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalWithdrawals = allWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalInvestments = allInvestments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingDeposits = allDeposits.filter(d => d.status === 'pending').length;
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize e gerencie todos os usuários do sistema
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuários</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Depositado</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDeposits)}</p>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalInvestments)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Depósitos Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{pendingDeposits}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                <p className="text-2xl font-bold text-red-600">{pendingWithdrawals}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="banned">Banido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Roles</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p>Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Usuário</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Saldo</th>
                    <th className="text-left p-4">Cadastro</th>
                    <th className="text-left p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{user.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.document_number && (
                            <p className="text-xs text-muted-foreground">CPF: {user.document_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(user.status)}</td>
                      <td className="p-4">{getRoleBadge(user.role)}</td>
                      <td className="p-4">
                        <p className="font-mono">{formatCurrency(user.available_balance || 0)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                          >
                            {user.status === 'active' ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{selectedUser.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <p className="font-medium">{selectedUser.document_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <div>{getRoleBadge(selectedUser.role)}</div>
                </div>
              </div>

              {/* Referral Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código de Indicação (próprio)</p>
                  <p className="font-medium">{selectedUser.referral_code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indicado por (ID)</p>
                  <p className="font-medium">{selectedUser.referred_by || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <p className="font-mono font-bold">{formatCurrency(selectedUser.available_balance || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ganho</p>
                  <p className="font-mono font-bold text-green-600">{formatCurrency(selectedUser.total_earned || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Ações</p>
                <div className="flex gap-2">
                  <Select
                    value={selectedUser.status}
                    onValueChange={(value) => handleUpdateStatus(selectedUser.id, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="banned">Banido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => handleUpdateRole(selectedUser.id, value)}
                  >
                    <SelectTrigger className="w-48">
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome Completo</label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="joao@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CPF/CNPJ</label>
              <Input
                value={newUser.document_number}
                onChange={(e) => setNewUser({...newUser, document_number: e.target.value})}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={newUser.status}
                  onValueChange={(value) => setNewUser({...newUser, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Código de Indicação (próprio)</label>
                <Input
                  value={newUser.referral_code}
                  onChange={(e) => setNewUser({...newUser, referral_code: e.target.value})}
                  placeholder="Código do usuário"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Indicado por</label>
                <Select
                  value={newUser.referred_by || "none"}
                  onValueChange={(value) => setNewUser({...newUser, referred_by: value === "none" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name} ({user.referral_code || "sem código"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending || !newUser.full_name || !newUser.email}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome Completo</label>
              <Input
                value={editUserData.full_name}
                onChange={(e) => setEditUserData({...editUserData, full_name: e.target.value})}
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                placeholder="joao@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CPF/CNPJ</label>
              <Input
                value={editUserData.document_number}
                onChange={(e) => setEditUserData({...editUserData, document_number: e.target.value})}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <Input
                value={editUserData.phone}
                onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={editUserData.status}
                  onValueChange={(value) => setEditUserData({...editUserData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="banned">Banido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <Select
                  value={editUserData.role}
                  onValueChange={(value) => setEditUserData({...editUserData, role: value})}
                >
                  <SelectTrigger>
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
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Código de Indicação (próprio)</label>
                <Input
                  value={editUserData.referral_code}
                  onChange={(e) => setEditUserData({...editUserData, referral_code: e.target.value})}
                  placeholder="Código do usuário"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Indicado por</label>
                <Select
                  value={editUserData.referred_by || "none"}
                  onValueChange={(value) => setEditUserData({...editUserData, referred_by: value === "none" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name} ({user.referral_code || "sem código"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateUserDetails}
              disabled={updateUserDetailsMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateUserDetailsMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Excluir Usuário</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.full_name}</strong>?
            </p>
            <p className="text-sm text-red-500">
              Esta ação não pode ser desfeita. Todos os dados do usuário serão permanentemente removidos.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => handleDeleteUser(selectedUser?.id)}
              disabled={deleteUserMutation.isPending}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteUserMutation.isPending ? 'Excluindo...' : 'Excluir Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
