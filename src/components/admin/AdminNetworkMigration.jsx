import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminAPI } from '@/services/api';
import { toast } from 'sonner';
import { Network, RefreshCw, Search, DollarSign } from 'lucide-react';

export default function AdminNetworkMigration() {
  const [migrating, setMigrating] = useState(false);
  const [multiLevelCreating, setMultiLevelCreating] = useState(false);
  const [checkingSchema, setCheckingSchema] = useState(false);
  const [checkingCommissions, setCheckingCommissions] = useState(false);
  const [result, setResult] = useState(null);
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [commissionsInfo, setCommissionsInfo] = useState(null);

  const handleCheckSchema = async () => {
    setCheckingSchema(true);
    try {
      const data = await adminAPI.checkNetworkSchema();
      setSchemaInfo(data);
      toast.success('Schema verificado! Ver console.');
      console.log('Schema da tabela network_relations:', data);
    } catch (error) {
      console.error('Erro ao verificar schema:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setCheckingSchema(false);
    }
  };

  const handleCheckCommissions = async () => {
    setCheckingCommissions(true);
    try {
      const data = await adminAPI.checkCommissions();
      setCommissionsInfo(data);
      toast.success(`Encontradas ${data.count || 0} comissões! Ver console.`);
      console.log('Comissões:', data);
    } catch (error) {
      console.error('Erro ao verificar comissões:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setCheckingCommissions(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const data = await adminAPI.migrateNetworkRelations();
      setResult(data);
      toast.success(`Migração concluída! ${data.migrated} relações criadas`);
    } catch (error) {
      console.error('Erro na migração:', error);
      toast.error('Erro ao migrar: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleCreateMultiLevel = async () => {
    setMultiLevelCreating(true);
    try {
      const data = await adminAPI.createMultiLevelRelations();
      toast.success(`Relações multi-nível criadas! ${data.created} novas relações`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setMultiLevelCreating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Network className="w-5 h-5 text-gold" />
        <h3 className="font-semibold text-foreground">Migração de Rede</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Migra dados de indicações da tabela <code>profiles</code> para <code>network_relations</code>.
        Primeiro clique em "Verificar Schema" para ver as colunas da tabela.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleCheckSchema} 
          disabled={checkingSchema}
          variant="outline"
        >
          <Search className={`w-4 h-4 mr-2 ${checkingSchema ? 'animate-pulse' : ''}`} />
          {checkingSchema ? 'Verificando...' : 'Verificar Schema'}
        </Button>

        <Button 
          onClick={handleCheckCommissions} 
          disabled={checkingCommissions}
          variant="outline"
          className="text-green-600"
        >
          <DollarSign className={`w-4 h-4 mr-2 ${checkingCommissions ? 'animate-pulse' : ''}`} />
          {checkingCommissions ? 'Verificando...' : 'Verificar Comissões'}
        </Button>

        <Button 
          onClick={handleMigrate} 
          disabled={migrating}
          className="bg-gold hover:bg-gold/90 text-black"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${migrating ? 'animate-spin' : ''}`} />
          {migrating ? 'Migrando...' : 'Migrar Nível 1'}
        </Button>
        
        <Button 
          onClick={handleCreateMultiLevel} 
          disabled={multiLevelCreating}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${multiLevelCreating ? 'animate-spin' : ''}`} />
          {multiLevelCreating ? 'Criando...' : 'Criar Níveis 2-5'}
        </Button>
      </div>

      {commissionsInfo && (
        <div className="text-sm space-y-1 bg-secondary/50 p-3 rounded-lg">
          <p className="font-semibold">Comissões no sistema:</p>
          <p><strong>Total:</strong> {commissionsInfo.count || 0}</p>
          <p><strong>Colunas:</strong> {commissionsInfo.sampleColumns?.join(', ') || 'N/A'}</p>
          {commissionsInfo.commissions?.length > 0 && (
            <p className="text-green-600">✅ {commissionsInfo.commissions.length} comissões encontradas</p>
          )}
          {commissionsInfo.commissions?.length === 0 && (
            <p className="text-amber-500">⚠️ Nenhuma comissão encontrada. Faça um investimento para gerar comissões.</p>
          )}
        </div>
      )}

      {schemaInfo && (
        <div className="text-sm space-y-1 bg-secondary/50 p-3 rounded-lg">
          <p className="font-semibold">Schema da tabela network_relations:</p>
          {schemaInfo.columns ? (
            <p><strong>Colunas:</strong> {schemaInfo.columns.join(', ')}</p>
          ) : schemaInfo.error ? (
            <p className="text-red-400"><strong>Erro:</strong> {schemaInfo.error}</p>
          ) : (
            <pre className="text-xs overflow-auto">{JSON.stringify(schemaInfo, null, 2)}</pre>
          )}
        </div>
      )}

      {result && (
        <div className="text-sm space-y-1 bg-secondary/50 p-3 rounded-lg">
          <p><strong>Processados:</strong> {result.totalProcessed}</p>
          <p><strong>Migrados:</strong> {result.migrated}</p>
          <p><strong>Erros:</strong> {result.errors}</p>
          {result.errorDetails?.length > 0 && (
            <p className="text-red-400 text-xs">Ver console para detalhes de erros</p>
          )}
        </div>
      )}
    </div>
  );
}
