# Supabase Local → Produção Workflow

## Setup Local (Desenvolvimento)

### 1. Instalar Supabase CLI
```bash
# Windows (PowerShell)
iwr -useb https://supabase.com/install.ps1 | iex
```

### 2. Iniciar Projeto Local
```bash
cd imperium
supabase init
supabase start
```

### 3. Exportar Estrutura do Projeto Atual
```bash
# Conectar ao projeto atual
supabase link --project-ref okazavmygdoglzpsgxgv

# Gerar migrations
supabase db diff --schema public --use-migra > supabase/migrations/20240329_initial_schema.sql
```

### 4. Aplicar Estrutura Local
```bash
# Desconectar do projeto atual
supabase unlink

# Aplicar migrations localmente
supabase db push
```

### 5. Configurar Ambiente Local
```bash
# .env.local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_LOCAL
```

## Workflow Produção

### 1. Desenvolvimento Local
- Testes ilimitados (sem rate limit)
- Dados locais
- Migrations versionadas

### 2. Migração para Produção
```bash
# Quando pronto para produção:
supabase db push --linked
# Ou exportar migrations e aplicar manualmente
```

### 3. Deploy Automatizado
```sql
-- Migrations podem ser aplicadas via:
-- 1. Supabase CLI
-- 2. SQL direto no dashboard
-- 3. GitHub Actions (automático)
```

## Vantagens:
✅ Desenvolvimento ilimitado localmente
✅ Mesmas migrations em produção
✅ Versionamento de schema
✅ Rollback fácil
✅ Equipe pode desenvolver localmente

## Estrutura de Arquivos:
```
imperium/
├── supabase/
│   ├── migrations/
│   │   ├── 20240329_initial_schema.sql
│   │   ├── 20240329_add_referral_system.sql
│   │   └── ...
│   ├── functions/
│   └── config.toml
├── src/
└── .env.local
```

## Comandos Úteis:
```bash
# Iniciar desenvolvimento
supabase start

# Gerar nova migration
supabase db diff --schema public > supabase/migrations/nova_migration.sql

# Aplicar migrations
supabase db push

# Resetar banco local
supabase db reset

# Ver status
supabase status
```
