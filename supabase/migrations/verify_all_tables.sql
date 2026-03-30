-- VERIFICAÇÃO COMPLETA DE TODAS AS TABELAS DO SISTEMA
-- Execute no Studio Local: http://127.0.0.1:54323

-- 1. Verificar todas as tabelas do schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar estrutura de cada tabela principal
-- 2.1 Tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2.2 Tabela investments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2.3 Tabela deposits
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'deposits' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2.4 Tabela withdrawals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'withdrawals' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2.5 Tabela network_relations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'network_relations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se há dados nas tabelas
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM public.profiles

UNION ALL

SELECT 
    'investments' as table_name,
    COUNT(*) as row_count
FROM public.investments

UNION ALL

SELECT 
    'deposits' as table_name,
    COUNT(*) as row_count
FROM public.deposits

UNION ALL

SELECT 
    'withdrawals' as table_name,
    COUNT(*) as row_count
FROM public.withdrawals

UNION ALL

SELECT 
    'network_relations' as table_name,
    COUNT(*) as row_count
FROM public.network_relations;

-- 4. Verificar índices importantes
SELECT 
    indexname as index_name,
    tablename as table_name,
    indexdef as index_definition
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'investments', 'deposits', 'withdrawals', 'network_relations')
ORDER BY tablename, indexname;

-- 5. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'investments', 'deposits', 'withdrawals', 'network_relations')
ORDER BY tablename, policyname;

-- 6. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'investments', 'deposits', 'withdrawals', 'network_relations')
ORDER BY tablename;

-- 7. Verificar funções criadas
SELECT 
    proname as function_name,
    prosrc as source_code,
    prolang as language
FROM pg_proc 
WHERE proname IN ('generate_referral_code', 'set_referral_code')
ORDER BY proname;

-- 8. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation as event_type,
    event_object_table as table_name,
    action_timing as timing,
    action_condition as condition,
    action_statement as statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN ('profiles', 'investments', 'deposits', 'withdrawals', 'network_relations')
ORDER BY event_object_table, trigger_name;

-- 9. Verificar extensões instaladas
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- 10. Verificar constraints importantes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('profiles', 'investments', 'deposits', 'withdrawals', 'network_relations')
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;
