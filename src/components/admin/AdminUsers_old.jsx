import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
// import { base44 } from '@/api/base44Client'; // Removido - agora usa Supabase
import { supabase } from '@/lib/supabase'; // Adicionado
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/planConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, UserCheck, Trash2, Edit, Shield, Eye } from 'lucide-react';
import { impersonation } from '@/lib/impersonation';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Busca relações nível 1 para saber o patrocinador de cada usuário
  const { data: relations = [] } = useQuery({
    queryKey: ['admin-network-relations'],
    queryFn: () => base44.entities.NetworkRelation.list(),
  });

  // Mapa: referred_id/referred_email → sponsor name (apenas nível 1 = patrocinador direto)
  const sponsorMapById = {};
  const sponsorMapByEmail = {};
  relations
    .filter((r) => Number(r.level) === 1)
    .forEach((r) => {
      if (r.referred_id) sponsorMapById[r.referred_id] = r.user_name || r.user_email;
      if (r.referred_email) sponsorMapByEmail[r.referred_email] = r.user_name || r.user_email;
    });

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário atualizado');
      setEditUser(null);
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário removido');
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user) => {
    setEditUser(user);
    setEditForm({
      role: user.role || 'user',
      status: user.status || 'pending',
      total_invested: user.total_invested || 0,
      available_balance: user.available_balance || 0,
    });
  };

  const handleActivate = (user) => {
    updateUser.mutate({ id: user.id, data: { status: 'active' } });
  };

  const statusColors = {
    active: 'bg-green-500/10 text-green-400 border-green-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    suspended: 'bg-red-500/10 text-red-400 border-red-500/30',
    blocked: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{u.full_name || 'Sem nome'}</p>
                {u.role === 'admin' && <Shield className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              {(sponsorMapById[u.id] || sponsorMapByEmail[u.email]) && (
                <p className="text-xs text-gold truncate">👤 Patrocinador: {sponsorMapById[u.id] || sponsorMapByEmail[u.email]}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={statusColors[u.status || 'pending']}>
                  {u.status || 'pending'}
                </Badge>
                <span className="text-xs text-muted-foreground">Investido: {formatCurrency(u.total_invested || 0)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {u.status !== 'active' && (
                <Button size="sm" variant="outline" onClick={() => handleActivate(u)} className="text-green-400 border-green-500/30 hover:bg-green-500/10">
                  <UserCheck className="w-4 h-4" />
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => impersonation.start(u)} className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10" title="Visualizar como este usuário">
                <Eye className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteUser.mutate(u.id)} className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{editUser?.full_name} - {editUser?.email}</p>
            <div>
              <label className="text-sm font-medium text-foreground">Função</label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Total Investido</label>
              <Input
                type="number"
                value={editForm.total_invested}
                onChange={(e) => setEditForm({ ...editForm, total_invested: parseFloat(e.target.value) || 0 })}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Saldo Disponível</label>
              <Input
                type="number"
                value={editForm.available_balance}
                onChange={(e) => setEditForm({ ...editForm, available_balance: parseFloat(e.target.value) || 0 })}
                className="mt-1 bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button
              onClick={() => updateUser.mutate({ id: editUser.id, data: editForm })}
              className="bg-gold hover:bg-gold-hover text-primary-foreground"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}