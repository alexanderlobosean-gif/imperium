# Neon Database - Alternativa ao Supabase

## Por que Neon?
✅ PostgreSQL puro
✅ Sem rate limit de auth
✅ Branching instantâneo
✅ Serverless escalável
✅ API compatível com Supabase

## Setup (10 minutos)

### 1. Criar Projeto Neon
```
1. Acessar: https://neon.tech
2. Criar projeto: imperium-dev
3. Copiar connection string
4. Criar branch de desenvolvimento
```

### 2. Configurar Auth Próprio
```javascript
// src/auth/customAuth.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class CustomAuth {
  async signUp(email, password, metadata) {
    // Sem rate limit - controle próprio
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir usuário
    const user = await db.query(
      'INSERT INTO users (email, password, metadata) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, metadata]
    );
    
    // Gerar token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    
    return { user, token };
  }
  
  async signIn(email, password) {
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Credenciais inválidas');
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    return { user, token };
  }
}
```

### 3. Schema PostgreSQL
```sql
-- Schema completo para Neon
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    email TEXT NOT NULL,
    full_name TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES profiles(user_id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outras tabelas...
CREATE TABLE investments (...);
CREATE TABLE deposits (...);
CREATE TABLE network_relations (...);
```

### 4. Configurar App
```javascript
// src/lib/neonDb.js
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
```

### 5. Migrations
```javascript
// scripts/migrate.js
import fs from 'fs';
import { query } from '../src/lib/neonDb.js';

async function migrate() {
  const migrations = fs.readdirSync('./migrations').sort();
  
  for (const migration of migrations) {
    const sql = fs.readFileSync(`./migrations/${migration}`, 'utf8');
    await query(sql);
    console.log(`Migration ${migration} applied`);
  }
}
```

## Workflow Produção

### Desenvolvimento (Neon Dev):
```bash
# Branch de desenvolvimento
neon branches create dev --project-id seu-projeto

# Configurar .env.local
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require

# Testar sem limites
npm run dev
```

### Produção (Neon Prod):
```bash
# Branch de produção
neon branches create prod --project-id seu-projeto

# Deploy automático
npm run build && npm run deploy
```

## Vantagens:
✅ PostgreSQL puro
✅ Sem rate limit de auth
✅ Branching instantâneo
✅ Controle total
✅ Escalável
✅ Mais barato que Supabase

## Desvantagens:
❌ Precisa implementar auth próprio
❌ Menos "batteries included"
❌ Setup inicial maior

## Preços:
- Dev: Grátis
- Produção: ~$20/mês (vs $25+ Supabase)

## Tempo Setup:
- Neon: 10 minutos
- Auth custom: 30 minutos
- Total: 40 minutos
