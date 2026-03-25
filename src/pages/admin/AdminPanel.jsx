import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Users, Wallet, TrendingUp, CheckCircle, Settings } from 'lucide-react';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminDeposits from '@/components/admin/AdminDeposits';
import AdminWithdrawals from '@/components/admin/AdminWithdrawals';
import AdminStats from '@/components/admin/AdminStats';
import AdminYields from '@/components/admin/AdminYields';
import AdminPlans from '@/components/admin/AdminPlans';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Apenas administradores podem acessar este painel
            {user?.role === 'admin' && ' (você é admin)'}
            {user?.role === 'super_admin' && ' (você é super_admin)'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Seu role atual: {user?.role || 'não encontrado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-gold" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gestão completa do sistema Imperium Club</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary border border-border grid grid-cols-6 w-full">
          <TabsTrigger value="stats" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
            <TrendingUp className="w-4 h-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
            <Users className="w-4 h-4 mr-2" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="deposits" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400">
            <Wallet className="w-4 h-4 mr-2" /> Depósitos
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400">
            <CheckCircle className="w-4 h-4 mr-2" /> Saques
          </TabsTrigger>
          <TabsTrigger value="yields" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400">
            <TrendingUp className="w-4 h-4 mr-2" /> Rendimentos
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">
            <Settings className="w-4 h-4 mr-2" /> Planos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats"><AdminStats /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="deposits"><AdminDeposits /></TabsContent>
        <TabsContent value="withdrawals"><AdminWithdrawals /></TabsContent>
        <TabsContent value="yields"><AdminYields /></TabsContent>
        <TabsContent value="plans"><AdminPlans /></TabsContent>
      </Tabs>
    </div>
  );
}