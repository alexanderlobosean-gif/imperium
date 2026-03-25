import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/planConfig';
import { Plus, Edit, Trash2, Settings, TrendingUp, Users, Shield, Crown, Gem, Zap, Award } from 'lucide-react';

const ICONS = { Zap, TrendingUp, Award, Crown, Gem, Users, Shield };
const COLORS = ['blue', 'green', 'purple', 'amber', 'gold'];

const colorMap = {
  blue: 'border-blue-500/30 from-blue-500/10 to-transparent',
  green: 'border-green-500/30 from-green-500/10 to-transparent',
  purple: 'border-purple-500/30 from-purple-500/10 to-transparent',
  amber: 'border-amber-500/30 from-amber-500/10 to-transparent',
  gold: 'border-gold/30 from-gold/10 to-transparent',
};

const iconColorMap = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
  gold: 'text-gold',
};

// Fetch plans
const fetchPlans = async () => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
};

export default function AdminPlans() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const queryClient = useQueryClient();

  // Check if user has permission
  const hasPermission = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: fetchPlans,
    enabled: hasPermission, // Only fetch if user has permission
  });

  // Create/Update plan mutation
  const planMutation = useMutation({
    mutationFn: async (planData) => {
      if (editingPlan) {
        const { data, error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('plans')
          .insert(planData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-plans']);
      toast.success(editingPlan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast.error('Erro ao salvar plano: ' + error.message);
    },
  });

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (planId) => {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-plans']);
      toast.success('Plano excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir plano: ' + error.message);
    },
  });

  // Toggle plan status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ planId, isActive }) => {
      const { data, error } = await supabase
        .from('plans')
        .update({ is_active: isActive })
        .eq('id', planId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-plans']);
      toast.success('Status do plano atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleDelete = (plan) => {
    if (window.confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
      deleteMutation.mutate(plan.id);
    }
  };

  const handleToggleStatus = (plan) => {
    toggleStatusMutation.mutate({
      planId: plan.id,
      isActive: !plan.is_active
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const planData = {
      slug: formData.get('slug'),
      name: formData.get('name'),
      description: formData.get('description'),
      min_amount: parseFloat(formData.get('min_amount')),
      max_amount: parseFloat(formData.get('max_amount')),
      base_rate: parseFloat(formData.get('base_rate')) / 100, // Convert percentage to decimal
      min_rate: parseFloat(formData.get('min_rate')) / 100,
      max_rate: parseFloat(formData.get('max_rate')) / 100,
      rate_increment: parseFloat(formData.get('rate_increment')) / 100,
      client_share: parseInt(formData.get('client_share')),
      company_share: parseInt(formData.get('company_share')),
      direct_commission: parseInt(formData.get('direct_commission')),
      reinvestment_commission: parseInt(formData.get('reinvestment_commission')),
      residual_levels: parseInt(formData.get('residual_levels')),
      color: formData.get('color'),
      icon: formData.get('icon'),
      is_most_popular: formData.get('is_most_popular') === 'true',
      is_leadership: formData.get('is_leadership') === 'true',
      sort_order: parseInt(formData.get('sort_order')),
    };

    planMutation.mutate(planData);
  };

  const PlanCard = ({ plan }) => {
    const Icon = ICONS[plan.icon] || Zap;
    const colors = colorMap[plan.color] || colorMap.gold;
    const iconColor = iconColorMap[plan.color] || 'text-gold';

    return (
      <Card className={`relative border ${colors}`}>
        {plan.is_most_popular && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold text-primary-foreground text-xs font-bold">
            MAIS POPULAR
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background/50">
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={plan.is_active}
                onCheckedChange={() => handleToggleStatus(plan)}
              />
              <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                {plan.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Valor Mínimo</Label>
              <p className="font-medium">{formatCurrency(plan.min_amount)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Valor Máximo</Label>
              <p className="font-medium">{formatCurrency(plan.max_amount)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Taxa Base</Label>
              <p className="font-medium">{(plan.base_rate * 100).toFixed(2)}%</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Comissão Direta</Label>
              <p className="font-medium">{plan.direct_commission}%</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Níveis Residuais</Label>
              <p className="font-medium">{plan.residual_levels}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Divisão</Label>
              <p className="font-medium">{plan.client_share}% / {plan.company_share}%</p>
            </div>
          </div>
          
          {plan.is_leadership && (
            <Badge variant="outline" className="w-fit">
              Plano de Liderança
            </Badge>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(plan)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(plan)}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Planos</h1>
          <p className="text-muted-foreground">Configure os planos de investimento disponíveis</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingPlan?.slug}
                  placeholder="start, basic, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingPlan?.name}
                  placeholder="Start, Basic, etc."
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingPlan?.description}
                placeholder="Descrição do plano"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_amount">Valor Mínimo</Label>
                <Input
                  id="min_amount"
                  name="min_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingPlan?.min_amount}
                  required
                />
              </div>
              <div>
                <Label htmlFor="max_amount">Valor Máximo</Label>
                <Input
                  id="max_amount"
                  name="max_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingPlan?.max_amount}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="base_rate">Taxa Base (%)</Label>
                <Input
                  id="base_rate"
                  name="base_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={editingPlan ? (editingPlan.base_rate * 100) : ''}
                  placeholder="1.0"
                />
              </div>
              <div>
                <Label htmlFor="min_rate">Taxa Mínima (%)</Label>
                <Input
                  id="min_rate"
                  name="min_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={editingPlan ? (editingPlan.min_rate * 100) : ''}
                  placeholder="0.2"
                />
              </div>
              <div>
                <Label htmlFor="max_rate">Taxa Máxima (%)</Label>
                <Input
                  id="max_rate"
                  name="max_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={editingPlan ? (editingPlan.max_rate * 100) : ''}
                  placeholder="3.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_share">Share Cliente (%)</Label>
                <Input
                  id="client_share"
                  name="client_share"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editingPlan?.client_share}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company_share">Share Empresa (%)</Label>
                <Input
                  id="company_share"
                  name="company_share"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editingPlan?.company_share}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="direct_commission">Comissão Direta (%)</Label>
                <Input
                  id="direct_commission"
                  name="direct_commission"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editingPlan?.direct_commission}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reinvestment_commission">Comissão Reinvestimento (%)</Label>
                <Input
                  id="reinvestment_commission"
                  name="reinvestment_commission"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editingPlan?.reinvestment_commission}
                  required
                />
              </div>
              <div>
                <Label htmlFor="residual_levels">Níveis Residuais</Label>
                <Input
                  id="residual_levels"
                  name="residual_levels"
                  type="number"
                  min="0"
                  max="20"
                  defaultValue={editingPlan?.residual_levels}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Cor</Label>
                <Select name="color" defaultValue={editingPlan?.color}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="icon">Ícone</Label>
                <Select name="icon" defaultValue={editingPlan?.icon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ICONS).map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon.charAt(0).toUpperCase() + icon.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sort_order">Ordem</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  min="0"
                  defaultValue={editingPlan?.sort_order}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_most_popular"
                  name="is_most_popular"
                  defaultChecked={editingPlan?.is_most_popular}
                  value="true"
                />
                <Label htmlFor="is_most_popular">Mais Popular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_leadership"
                  name="is_leadership"
                  defaultChecked={editingPlan?.is_leadership}
                  value="true"
                />
                <Label htmlFor="is_leadership">Plano de Liderança</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingPlan(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={planMutation.isPending}
              >
                {planMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
