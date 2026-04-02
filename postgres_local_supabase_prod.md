# PostgreSQL Local + Supabase Produção

## Setup Local (PostgreSQL Puro)

### 1. Instalar PostgreSQL Local
```bash
# Windows - Baixe e instale:
# https://www.postgresql.org/download/windows/

# Ou via Docker:
docker run --name postgres-dev -e POSTGRES_PASSWORD=dev123 -p 5432:5432 -d postgres:15
```

### 2. Configurar Banco Local
```bash
# Criar banco
psql -U postgres -c "CREATE DATABASE imperium_dev;"

# Conectar
psql -U postgres -d imperium_dev
```

### 3. Script de Schema Completo
```sql
-- Criar schema local (baseado no Supabase)
-- Salvar como: local_schema.sql

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabelas
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
    email TEXT NOT NULL,
    full_name TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(user_id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outras tabelas...
CREATE TABLE public.investments (...);
CREATE TABLE public.deposits (...);
CREATE TABLE public.network_relations (...);

-- Índices
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);
```

### 4. Configurar App para Local
```javascript
// src/lib/database.js
const isDevelopment = process.env.NODE_ENV === 'development';

const config = isDevelopment ? {
  // PostgreSQL local
  host: 'localhost',
  port: 5432,
  database: 'imperium_dev',
  user: 'postgres',
  password: 'dev123'
} : {
  // Supabase produção
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY
};

// Usar PostgreSQL local em dev, Supabase em prod
if (isDevelopment) {
  // Conectar com PostgreSQL direto
  const { Pool } = require('pg');
  const pool = new Pool(config);
} else {
  // Usar Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
}
```

### 5. Migration Script
```javascript
// scripts/migrate-to-prod.js
const fs = require('fs');

async function migrateToProduction() {
  // 1. Exportar schema local
  const schema = fs.readFileSync('./local_schema.sql', 'utf8');
  
  // 2. Aplicar no Supabase produção
  // Via dashboard ou API
  
  // 3. Migrar dados importantes
  // Usar scripts específicos
  
  console.log('Migration completed!');
}
```

## Workflow de Desenvolvimento

### Desenvolvimento Local:
```bash
# Iniciar PostgreSQL
docker start postgres-dev

# Rodar migrations locais
psql -U postgres -d imperium_dev -f local_schema.sql

# Desenvolver sem limites
npm run dev
```

### Para Produção:
```bash
# 1. Gerar schema atualizado
npm run generate-schema

# 2. Aplicar no Supabase
npm run migrate-prod

# 3. Testar produção
npm run build && npm run preview
```

## Vantagens:
✅ PostgreSQL local completo
✅ Sem rate limit em desenvolvimento
✅ Schema idêntico à produção
✅ Migrations controladas
✅ Ferramentas PostgreSQL disponíveis

## Desvantagens:
❌ Setup inicial maior
❌ Precisa manter dois configs
❌ Auth local vs Supabase (diferenças)

## Recomendação:
Use esta opção se você já tem experiência com PostgreSQL
e quer controle total do ambiente local.
