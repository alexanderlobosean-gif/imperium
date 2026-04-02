# Novo Projeto Supabase - Solução Definitiva

## Por que novo projeto?
- Rate limit resetado (100% limpo)
- Mesma estrutura e configuração
- Mesmo container em produção
- Zero impacto no projeto atual

## Passos:

### 1. Criar Novo Projeto
```
1. Acessar: https://supabase.com/dashboard
2. Criar novo projeto: imperium-dev
3. Mesma região: us-east-1
4. Aguardar setup (2-3 minutos)
```

### 2. Configurar Estrutura
```sql
-- Copiar estrutura do projeto atual
-- Usar SQL export do projeto atual

-- Criar tabelas
CREATE TABLE profiles (...);
CREATE TABLE investments (...);
CREATE TABLE deposits (...);
-- etc.

-- Configurar RLS
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
-- etc.
```

### 3. Migrar Dados (se necessário)
```sql
-- Exportar dados importantes do projeto atual
-- Importar para novo projeto
```

### 4. Atualizar Variáveis de Ambiente
```bash
# .env.local
VITE_SUPABASE_URL=https://NOVO-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=NOVA-ANON-KEY
```

### 5. Configurar Rate Limit Alto
```
Authentication → Settings → Rate Limits
- Rate limit per IP: 10000
- Email sent per minute: 1000
- Email sent per hour: 10000
```

## Vantagens:
✅ Rate limit 100% limpo
✅ Mesma estrutura em produção
✅ Zero impacto no projeto atual
✅ Testes ilimitados
✅ Mesmo container quando subir

## Migração para Produção:
1. Exportar estrutura do dev
2. Importar para produção
3. Atualizar URLs
4. Pronto!

## Tempo estimado:
- Setup: 5 minutos
- Configuração: 10 minutos
- Testes: Imediatos
