# Supabase Local - Setup Completo

## 1. Instalar Docker (se ainda não tiver)
# Baixe Docker Desktop para Windows
# https://www.docker.com/products/docker-desktop

## 2. Instalar Supabase CLI
# Abrir PowerShell como Administrador
iwr -useb https://supabase.com/install.ps1 | iex

## 3. Verificar instalação
docker --version
supabase --version

## 4. Iniciar Supabase Local
cd c:/Users/cristian.macena/Documents/Projetos/imperium
supabase init
supabase start

## 5. Anotar chaves geradas (vão aparecer no terminal)
# EXEMPLO:
# API URL: http://localhost:54321
# Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## 6. Acessar Studio Local
# http://localhost:54321/project/default/_sql
# Usuário: supabase_admin
# Senha: (gerada no setup)

## 7. Exportar estrutura do projeto atual
# Conectar ao projeto atual
supabase link --project-ref okazavmygdoglzpsgxgv

# Gerar migration com estrutura completa
supabase db diff --schema public --use-migra > supabase/migrations/20240329_initial_schema.sql

# Desconectar do projeto atual
supabase unlink

## 8. Aplicar estrutura localmente
supabase db push

## 9. Configurar ambiente local
# Criar .env.local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_LOCAL
VITE_SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_LOCAL

## 10. Testar imediatamente
npm run dev
# Acessar: http://localhost:5173
# Testar cadastro sem rate limit!
