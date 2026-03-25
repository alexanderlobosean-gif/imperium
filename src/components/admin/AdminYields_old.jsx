import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/planConfig';
import { Search, Filter, TrendingUp, Calendar, DollarSign, Users, Activity } from 'lucide-react';

// Fetch yields data
const fetchYieldsData = async () => {
  const [
    yieldsResult,
    investmentsResult,
    todayYieldsResult
  ] = await Promise.all([
    // All yields
    supabase
      .from('yields')
      .select(`
        *,
        users!inner(
          full_name,
          email
        ),
        investments!inner(
          plan_slug
        )
      `)
      .order('date', { ascending: false }),
    // Active investments
    supabase.from('investments').select('*').eq('status', 'active'),
    // Today's yields
    supabase
      .from('yields')
      .select('amount, client_yield, company_yield')
      .gte('date', new Date().toISOString().split('T')[0])
  ]);

  const stats = {
    totalYields: yieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.amount || 0), 0) || 0,
    totalClientYields: yieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.client_yield || 0), 0) || 0,
    totalCompanyYields: yieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.company_yield || 0), 0) || 0,
    todayYields: todayYieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.amount || 0), 0) || 0,
    todayClientYields: todayYieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.client_yield || 0), 0) || 0,
    todayCompanyYields: todayYieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.company_yield || 0), 0) || 0,
    activeInvestments: investmentsResult.data?.length || 0,
    totalYieldsCount: yieldsResult.data?.length || 0,
  };

  return {
    yields: yieldsResult.data || [],
    stats,
    investments: investmentsResult.data || []
  };
};

export default function AdminYields() {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: yieldsData, isLoading } = useQuery({
    queryKey: ['admin-yields-data'],
    queryFn: fetchYieldsData,
  });

  const filteredYields = yieldsData?.yields?.filter(yieldItem => {
    const matchesSearch = yieldItem.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         yieldItem.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         yieldItem.investments?.plan_slug?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter === 'all' || yieldItem.investments?.plan_slug === planFilter;
    
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Rendimentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize todos os rendimentos gerados pelo sistema
        </p>
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
    </div>
  );
}
