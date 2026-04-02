-- ORDEM DE EXECUÇÃO DAS MIGRAÇÕES
-- Execute estes scripts em ordem no Supabase SQL Editor

-- 1. PRIMEIRO: Executar a migração completa admin
-- \i migration_completa_admin.sql

-- 2. SEGUNDO: Executar o rastreamento de comissões
-- \i commission_tracking.sql

-- 3. TERCEIRO: Verificar se tudo funcionou
-- \i verification_script.sql

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar todas as tabelas criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles', 'investments', 'plans', 'deposits', 
        'withdrawals', 'yields', 'commissions', 'commission_history'
    )
ORDER BY table_name;

-- Verificar colunas importantes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'investments', 'yields', 'commissions')
    AND column_name IN (
        'role', 'status', 'available_balance', 'total_earned', 'plan_slug',
        'amount', 'client_yield', 'company_yield', 'commission_type'
    )
ORDER BY table_name, column_name;
