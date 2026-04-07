# Supabase Local - ÚNICA Solução Real para Rate Limit

## Por que é a única solução?
✅ Rate limit = 0 (local não tem limites)
✅ Mesmo container em produção
✅ Mesmas migrations
✅ Zero bloqueios
✅ Desenvolvimento ilimitado

## Setup Completo (15 minutos)

### 1. Instalar Docker
```bash
# Windows - Download Docker Desktop
https://www.docker.com/products/docker-desktop
```

### 2. Instalar Supabase CLI
```bash
# PowerShell (Admin)
iwr -useb https://supabase.com/install.ps1 | iex
```

### 3. Iniciar Supabase Local
```bash
# No diretório do projeto
cd c:/Users/cristian.macena/Documents/Projetos/imperium

# Iniciar Supabase
supabase init
supabase start

# Anote as chaves geradas
```

### 4. Exportar Estrutura do Projeto Atual
```bash
# Conectar ao projeto atual
supabase link --project-ref okazavmygdoglzpsgxgv

# Gerar migration com estrutura atual
supabase db diff --schema public > supabase/migrations/20240329_initial_schema.sql

# Desconectar
supabase unlink
```

### 5. Aplicar Estrutura Localmente
```bash
# Aplicar migrations no ambiente local
supabase db push

# Verificar se tudo funcionou
supabase db shell
\dt
```

### 6. Configurar Ambiente Local
```bash
# .env.local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7. Testar Imediatamente
```bash
# Iniciar app
npm run dev

# Testar cadastro sem rate limit
# Acessar: http://localhost:5173
```

## Workflow Produção

### Desenvolvimento (Local):
- Testes ilimitados
- Sem rate limit
- Dados locais
- Migrations versionadas

### Produção (Supabase Cloud):
```bash
# Quando pronto para produção:
supabase link --project-ref NOVO-PROJETO-PROD
supabase db push
```

## Comandos Essenciais
```bash
# Iniciar desenvolvimento
supabase start

# Ver status
supabase status

# Acessar banco
supabase db shell

# Resetar dados
supabase db reset

# Gerar nova migration
supabase db diff --schema public > nova_migration.sql

# Parar
supabase stop
```

## URLs Importantes
- Studio Local: http://localhost:54321/project/default/_sql
- API Local: http://localhost:54321/rest/v1/
- Auth Local: http://localhost:54321/auth/v1/

## Vantagens Reais:
✅ ZERO rate limit
✅ Testes ilimitados
✅ Mesmo schema produção
✅ Migrations automáticas
✅ Team development
✅ Rollback fácil

## Tempo Total:
- Instalação: 10 minutos
- Setup: 5 minutos
- Testes: Imediatos

## Resultado Final:
Desenvolvimento local sem NENHUMA limitação + produção idêntica com Supabase Cloud.
