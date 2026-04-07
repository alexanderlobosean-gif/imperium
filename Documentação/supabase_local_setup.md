# Supabase Local - Docker Setup

## Instalação Rápida

### 1. Instalar Docker
```bash
# Windows
# Baixe e instale Docker Desktop
# https://www.docker.com/products/docker-desktop

# Verificar instalação
docker --version
```

### 2. Instalar Supabase CLI
```bash
# Windows (PowerShell)
iwr -useb https://supabase.com/install.ps1 | iex

# Verificar instalação
supabase --version
```

### 3. Iniciar Supabase Local
```bash
# No diretório do projeto
cd c:/Users/cristian.macena/Documents/Projetos/imperium

# Iniciar Supabase local
supabase init
supabase start
```

### 4. Configurar Variáveis de Ambiente
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Migrar Tabelas
```bash
# Exportar do Supabase Cloud
supabase db diff --schema public --use-migra

# Importar para local
supabase db push
```

### 6. Testar Sistema
```bash
# Acessar Studio Local
http://localhost:54321/project/default/_sql

# Testar cadastro sem rate limit
```

## Vantagens

✅ Sem rate limit
✅ Desenvolvimento rápido
✅ Dados locais
✅ Full controle
✅ Grátis para desenvolvimento

## Desvantagens

❌ Setup inicial
❌ Dados não persistem entre reinícios (por padrão)
❌ Precisa sincronizar com produção

## Comandos Úteis

```bash
# Parar Supabase
supabase stop

# Resetar dados
supabase db reset

# Ver logs
supabase logs

# Acessar banco diretamente
supabase db shell
```
