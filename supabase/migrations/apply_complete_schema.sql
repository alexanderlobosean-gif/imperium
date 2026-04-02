-- Execute este SQL no Studio Local: http://127.0.0.1:54323
-- Copie e cole todo o conteúdo do arquivo 20240329_complete_schema.sql

-- Verificar se as novas tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Contar registros em todas as tabelas
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
FROM public.network_relations

UNION ALL

SELECT 
    'admin_banking_accounts' as table_name,
    COUNT(*) as row_count
FROM public.admin_banking_accounts

UNION ALL

SELECT 
    'commission_history' as table_name,
    COUNT(*) as row_count
FROM public.commission_history

UNION ALL

SELECT 
    'commissions' as table_name,
    COUNT(*) as row_count
FROM public.commissions

UNION ALL

SELECT 
    'plans' as table_name,
    COUNT(*) as row_count
FROM public.plans

UNION ALL

SELECT 
    'transactions' as table_name,
    COUNT(*) as row_count
FROM public.transactions

UNION ALL

SELECT 
    'user_settings' as table_name,
    COUNT(*) as row_count
FROM public.user_settings

UNION ALL

SELECT 
    'user_wallets' as table_name,
    COUNT(*) as row_count
FROM public.user_wallets

UNION ALL

SELECT 
    'yields' as table_name,
    COUNT(*) as row_count
FROM public.yields;
