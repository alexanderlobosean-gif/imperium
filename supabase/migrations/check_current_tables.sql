-- VERIFICAÇÃO RÁPIDA DAS TABELAS ATUAIS
-- Execute no Studio Local: http://127.0.0.1:54323

-- 1. Verificar todas as tabelas existentes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Contar registros em cada tabela
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
