-- Diagnóstico crítico: Inconsistência entre auth.users e profiles

-- 1. Verificar inconsistência
SELECT 
    'auth_users' as table_name,
    COUNT(*) as count
FROM auth.users 
WHERE email LIKE '%@imperium.com'

UNION ALL

SELECT 
    'profiles' as table_name,
    COUNT(*) as count
FROM public.profiles 
WHERE email LIKE '%@imperium.com'

UNION ALL

-- 2. Encontrar user_ids órfãos (em profiles mas não em auth.users)
SELECT 
    p.user_id,
    p.email,
    p.created_at as profile_created,
    'ORPHANED_PROFILE' as issue
FROM public.profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL 
    AND p.email LIKE '%@imperium.com'

UNION ALL

-- 3. Encontrar user_ids faltando (em auth.users mas não em profiles)
SELECT 
    u.id,
    u.email,
    u.created_at as auth_created,
    'MISSING_PROFILE' as issue
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL 
    AND u.email LIKE '%@imperium.com';

-- 4. Verificar constraints na tabela profiles
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'profiles'
    AND tc.constraint_type = 'UNIQUE';
