#!/bin/bash
# Setup Automático Supabase Local

echo "🚀 Iniciando setup do Supabase Local..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker Desktop primeiro."
    exit 1
fi

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "📦 Instalando Supabase CLI..."
    iwr -useb https://supabase.com/install.ps1 | iex
fi

# Iniciar Supabase
echo "🔧 Iniciando Supabase Local..."
supabase init
supabase start

# Anotar chaves
echo "🔑 Chaves geradas:"
supabase status

# Conectar ao projeto atual para exportar schema
echo "📤 Exportando schema do projeto atual..."
supabase link --project-ref okazavmygdoglzpsgxgv
supabase db diff --schema public --use-migra > supabase/migrations/20240329_initial_schema.sql
supabase unlink

# Aplicar migrations localmente
echo "📥 Aplicando migrations localmente..."
supabase db push

# Verificar se tudo funcionou
echo "✅ Verificando setup..."
supabase status

echo "🎉 Setup completo!"
echo "🌐 Studio Local: http://localhost:54321/project/default/_sql"
echo "🚀 API Local: http://localhost:54321/rest/v1/"
echo "🔐 Auth Local: http://localhost:54321/auth/v1/"
echo ""
echo "📋 Próximos passos:"
echo "1. Atualize .env.local com as chaves geradas"
echo "2. Execute: npm run dev"
echo "3. Teste cadastro sem rate limit!"
