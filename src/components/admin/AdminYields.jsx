import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/planConfig';
import { Search, Filter, TrendingUp, Calendar, DollarSign, Users, Activity, Settings, RefreshCw } from 'lucide-react';

// Fetch yields data (padrão simples como AdminDeposits)
const fetchYieldsData = async () => {
  console.log('🔍 Buscando dados de rendimentos...');
  
  // Buscar rendimentos com JOIN apenas para dados do usuário
  const { data: yieldsData, error: yieldsError } = await supabaseAdmin
    .from('yields')
    .select(`
      *,
      profiles!inner(
        full_name,
        email
      )
    `)
    .order('date', { ascending: false });

  if (yieldsError) {
    console.error('❌ Erro ao buscar rendimentos:', yieldsError);
    throw yieldsError;
  }

  // Buscar investimentos ativos
  const { data: investmentsData, error: investmentsError } = await supabaseAdmin
    .from('investments')
    .select('*, user_id')  // Incluir user_id na query
    .eq('status', 'active');  // Sem RLS - supabaseAdmin já bypassa

  if (investmentsError) {
    console.error('❌ Erro ao buscar investimentos:', investmentsError);
    throw investmentsError;
  }

  // DEBUG: Mostrar todos os investimentos encontrados
  console.log('🔍 DEBUG: Investimentos encontrados:', investmentsData?.length || 0);
  investmentsData?.forEach((inv, index) => {
    console.log(`🔍 Investimento ${index + 1}:`, {
      id: inv.id,
      user_id: inv.user_id,
      amount: inv.amount,
      plan_slug: inv.plan_slug,
      status: inv.status
    });
  });

  // Buscar rendimentos de hoje
  const { data: todayYieldsData, error: todayYieldsError } = await supabaseAdmin
    .from('yields')
    .select('amount, client_yield, company_yield')
    .gte('date', new Date().toISOString().split('T')[0]);

  if (todayYieldsError) {
    console.error('❌ Erro ao buscar rendimentos de hoje:', todayYieldsError);
    throw todayYieldsError;
  }

  console.log('📊 Rendimentos encontrados:', yieldsData?.length || 0);
  console.log('📈 Investimentos ativos:', investmentsData?.length || 0);
  console.log('💰 Rendimentos de hoje:', todayYieldsData?.length || 0);
  
  // Mostrar primeiros rendimentos para debug
  if (yieldsData && yieldsData.length > 0) {
    console.log('🔍 Primeiros rendimentos:', yieldsData.slice(0, 3));
  }

  const stats = {
    totalYields: yieldsData?.reduce((sum, y) => sum + parseFloat(y.amount || 0), 0) || 0,
    totalClientYields: yieldsData?.reduce((sum, y) => sum + parseFloat(y.client_yield || 0), 0) || 0,
    totalCompanyYields: yieldsData?.reduce((sum, y) => sum + parseFloat(y.company_yield || 0), 0) || 0,
    todayYields: todayYieldsData?.reduce((sum, y) => sum + parseFloat(y.amount || 0), 0) || 0,
    todayClientYields: todayYieldsData?.reduce((sum, y) => sum + parseFloat(y.client_yield || 0), 0) || 0,
    todayCompanyYields: todayYieldsData?.reduce((sum, y) => sum + parseFloat(y.company_yield || 0), 0) || 0,
    activeInvestments: investmentsData?.length || 0,
    totalYieldsCount: yieldsData?.length || 0,
  };

  return {
    yields: yieldsData || [],
    stats,
    investments: investmentsData || []
  };
};

// Apply daily yield to all active investments (usando supabaseAdmin)
const applyDailyYield = async ({ rate }) => {
  console.log('🚀 Iniciando aplicação de rendimento diário');
  console.log('📊 Taxa de rendimento:', rate);
  
  // Get all active investments
  const { data: investments, error: investmentsError } = await supabaseAdmin
    .from('investments')
    .select('*')
    .eq('status', 'active');

  if (investmentsError) {
    console.error('❌ Erro ao buscar investimentos:', investmentsError);
    throw investmentsError;
  }

  console.log('📈 Investimentos ativos encontrados:', investments?.length || 0);
  
  const results = [];
  const today = new Date().toISOString().split('T')[0];
  console.log('📅 Data de processamento:', today);

  // Process each investment
  for (let i = 0; i < investments.length; i++) {
    const investment = investments[i];
    console.log(`\n🔄 Processando investimento ${i + 1}/${investments.length}`);
    console.log('💰 Valor do investimento:', investment.amount);
    console.log('👤 Usuário:', investment.user_id);
    console.log('📋 Plano:', investment.plan_slug);
    console.log('🔍 DEBUG: investment.user_id é NULL?', investment.user_id === null);
    
    const dailyYield = parseFloat(investment.amount) * parseFloat(rate);
    const clientYield = dailyYield * (investment.client_share / 100);
    const companyYield = dailyYield * (investment.company_share / 100);
    
    console.log('💸 Rendimento diário calculado:', dailyYield);
    console.log('👤 Rendimento cliente:', clientYield);
    console.log('🏢 Rendimento empresa:', companyYield);

    // Create yield record
    console.log('💾 Criando registro de rendimento...');
    const { data: yieldRecord, error: yieldError } = await supabaseAdmin
      .from('yields')
      .insert({
        investment_id: investment.id,
        user_id: investment.user_id,
        amount: dailyYield,
        rate: parseFloat(rate),
        client_yield: clientYield,
        company_yield: companyYield,
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (yieldError) {
      console.error('❌ Erro ao criar registro de rendimento:', yieldError);
      throw yieldError;
    }

    console.log('✅ Registro de rendimento criado:', yieldRecord.id);

    // Update investment totals
    console.log('🔄 Atualizando totais do investimento...');
    const { error: updateError } = await supabaseAdmin
      .from('investments')
      .update({
        daily_yield: dailyYield,
        total_yield: (parseFloat(investment.total_yield || 0) + dailyYield),
        last_yield_calculated: new Date().toISOString()
      })
      .eq('id', investment.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar investimento:', updateError);
      throw updateError;
    }

    console.log('✅ Investimento atualizado com sucesso');

    // Update user total earned
    console.log('👤 Atualizando totais do usuário...');
    
    // Primeiro buscar os dados atuais do perfil
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('total_earned')
      .eq('id', investment.user_id)
      .single();

    let currentTotal = 0;
    
    // Se perfil não existe, criar automaticamente
    if (profileError && profileError.code === 'PGRST116') {
      console.log('⚠️ Perfil não encontrado, criando automaticamente...');
      
      // Criar perfil básico sem dados do auth
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: investment.user_id,
          user_id: investment.user_id,  // Adicionar user_id também
          full_name: 'Usuário ' + investment.user_id.substring(0, 8),
          email: 'user' + investment.user_id.substring(0, 8) + '@imperium.com',
          total_earned: 0,
          status: 'active'
        })
        .select('total_earned')
        .single();
        
      if (createError) {
        // Se erro for de duplicidade, tentar buscar o perfil existente
        if (createError.code === '23505') {
          console.log('⚠️ Perfil já existe, buscando dados existentes...');
          const { data: existingProfile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('total_earned')
            .eq('user_id', investment.user_id)  // Buscar por user_id
            .single();
          
          if (fetchError) {
            console.error('❌ Erro ao buscar perfil existente:', fetchError);
            throw fetchError;
          }
          
          currentTotal = parseFloat(existingProfile?.total_earned || 0);
          console.log('✅ Perfil existente encontrado');
        } else {
          console.error('❌ Erro ao criar perfil:', createError);
          throw createError;
        }
      } else {
        currentTotal = parseFloat(newProfile?.total_earned || 0);
        console.log('✅ Perfil criado automaticamente');
      }
    } else if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      throw profileError;
    } else {
      // Usar perfil existente
      currentTotal = parseFloat(userProfile?.total_earned || 0);
    }

    const newTotal = currentTotal + clientYield;

    console.log(`📊 Saldo anterior: ${currentTotal}`);
    console.log(`📊 Saldo atual: ${newTotal}`);

    const { error: userUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        total_earned: newTotal
      })
      .eq('id', investment.user_id);

    if (userUpdateError) {
      console.error('❌ Erro ao atualizar usuário:', userUpdateError);
      throw userUpdateError;
    }

    console.log('✅ Usuário atualizado com sucesso');

    results.push(yieldRecord);
  }

  console.log(`\n🎉 Processamento concluído!`);
  console.log(`📊 Total de investimentos processados: ${results.length}`);
  console.log(`💰 Total de rendimentos aplicados: ${results.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)}`);
  
  return results;
};

export default function AdminYields() {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showYieldDialog, setShowYieldDialog] = useState(false);
  const [dailyRate, setDailyRate] = useState('0.01');
  const queryClient = useQueryClient();

  const { data: yieldsData, isLoading } = useQuery({
    queryKey: ['admin-yields-data'],
    queryFn: fetchYieldsData,
  });

  const applyYieldMutation = useMutation({
    mutationFn: applyDailyYield,
    onSuccess: (results) => {
      queryClient.invalidateQueries(['admin-yields-data']);
      toast.success(`Rendimento diário aplicado para ${results.length} investimentos!`);
      setShowYieldDialog(false);
      setDailyRate('0.01');
      console.log('✅ Modal fechado automaticamente após sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao aplicar rendimento: ' + error.message);
      console.error('❌ Erro no applyDailyYield:', error);
    },
  });

  const filteredYields = yieldsData?.yields?.filter(yieldItem => {
    const matchesSearch = yieldItem.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         yieldItem.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         yieldItem.amount?.toString().includes(searchTerm.toLowerCase());
    
    // Filtro de plano simplificado - vamos remover por enquanto
    const matchesPlan = planFilter === 'all'; // Temporariamente ignorar filtro de plano
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const yieldDate = new Date(yieldItem.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = yieldDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = yieldDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = yieldDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesPlan && matchesDate;
  });

  const getPlanBadge = (planSlug) => {
    const colors = {
      start: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      basic: 'bg-green-500/10 text-green-400 border-green-500/30',
      silver: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      gold: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      imperium: 'bg-gold/10 text-gold border-gold/30',
    };
    
    return (
      <Badge variant="outline" className={colors[planSlug] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}>
        {planSlug?.charAt(0).toUpperCase() + planSlug?.slice(1) || planSlug}
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
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Rendimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e aplique rendimentos diários para todos os investimentos
          </p>
        </div>
        <Button
          onClick={() => setShowYieldDialog(true)}
          className="bg-gold hover:bg-gold/90 text-black"
        >
          <Settings className="w-4 h-4 mr-2" />
          Aplicar Rendimento do Dia
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-background/50">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(yieldsData?.stats?.totalYields || 0)}</p>
              <p className="text-xs text-muted-foreground">Total de Rendimentos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-background/50">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(yieldsData?.stats?.totalClientYields || 0)}</p>
              <p className="text-xs text-muted-foreground">Rendimentos Clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-background/50">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(yieldsData?.stats?.totalCompanyYields || 0)}</p>
              <p className="text-xs text-muted-foreground">Rendimentos Empresa</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-background/50">
                <Calendar className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +20%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(yieldsData?.stats?.todayYields || 0)}</p>
              <p className="text-xs text-muted-foreground">Rendimentos Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar rendimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="start">Start</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="imperium">Imperium</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Yields List */}
      <div className="grid gap-4">
        {filteredYields?.slice(0, 50).map((yieldRecord) => (
          <Card key={yieldRecord.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{yieldRecord.profiles?.full_name || 'Usuário'}</h3>
                      <p className="text-sm text-muted-foreground">{yieldRecord.profiles?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPlanBadge(yieldRecord.investments?.plan_slug)}
                      <Badge variant="outline">
                        {new Date(yieldRecord.date).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Rendimento Total</p>
                      <p className="font-medium">{formatCurrency(yieldRecord.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rendimento Cliente</p>
                      <p className="font-medium text-green-400">{formatCurrency(yieldRecord.client_yield)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rendimento Empresa</p>
                      <p className="font-medium text-purple-400">{formatCurrency(yieldRecord.company_yield)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa</p>
                      <p className="font-medium">{(yieldRecord.rate * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredYields?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum rendimento encontrado com os filtros selecionados.</p>
        </div>
      )}

      {/* Apply Daily Yield Dialog */}
      <Dialog open={showYieldDialog} onOpenChange={setShowYieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Rendimento Diário</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Esta ação irá aplicar o rendimento diário para todos os investimentos ativos.
              </p>
              <p className="text-sm text-muted-foreground">
                Investimentos ativos: <span className="font-medium">{yieldsData?.stats?.activeInvestments || 0}</span>
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Taxa de Rendimento Diária (%)</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="0.01"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: 0.01 = 1%, 0.02 = 2%
              </p>
            </div>
            
            <div className="bg-secondary/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="space-y-1 text-sm">
                <p>Para um investimento de R$ 1.000,00:</p>
                <p>Rendimento total: {formatCurrency(1000 * parseFloat(dailyRate || 0))}</p>
                <p>Cliente recebe: {formatCurrency(1000 * parseFloat(dailyRate || 0) * 0.5)}</p>
                <p>Empresa recebe: {formatCurrency(1000 * parseFloat(dailyRate || 0) * 0.5)}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowYieldDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => applyYieldMutation.mutate({ rate: dailyRate })}
              disabled={applyYieldMutation.isPending}
              className="bg-gold hover:bg-gold/90 text-black"
            >
              {applyYieldMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Aplicar Rendimento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
