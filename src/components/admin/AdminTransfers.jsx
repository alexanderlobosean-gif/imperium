import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/planConfig';
import { Search, Filter, ArrowRightLeft, Send, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

// Fetch transfers via API
const fetchTransfers = async () => {
  const data = await adminAPI.getTransfers();
  return data.transfers;
};

export default function AdminTransfers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['admin-transfers'],
    queryFn: fetchTransfers,
  });

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.sender?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.sender?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.recipient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.recipient?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const variants = {
      pending: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock, label: 'Pendente' },
      completed: { color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle, label: 'Concluída' },
      cancelled: { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Cancelada' },
      expired: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: XCircle, label: 'Expirada' },
    };
    
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge variant="outline" className={`${variant.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="w-5 h-5 text-gold" />
              <CardTitle className="text-foreground">Transferências entre Usuários</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {transfers.length} transferências
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Data</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Remetente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Destinatário</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Valor</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhuma transferência encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                      <td className="py-3 px-4 text-sm text-foreground">
                        {formatDate(transfer.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {transfer.sender?.full_name || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transfer.sender?.email || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ArrowDownLeft className="w-4 h-4 text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {transfer.recipient?.full_name || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transfer.recipient?.email || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-gold">
                          {formatCurrency(transfer.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(transfer.status)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-foreground truncate max-w-[200px]">
                          {transfer.description || '-'}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredTransfers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total filtrado:</span>
                  <span className="font-semibold text-foreground">{filteredTransfers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Valor total:</span>
                  <span className="font-semibold text-gold">
                    {formatCurrency(filteredTransfers.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
