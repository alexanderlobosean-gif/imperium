-- Corrigir user_id específico que está causando conflito
-- ID: 120e0011-ed71-4df6-a10e-5170f98ec439

-- 1. Verificar qual usuário está usando este user_id
SELECT 
    p.id as profile_id,
    p.user_id,
    p.email,
    p.full_name,
    p.referral_code,
    p.referred_by,
    p.created_at
FROM public.profiles p 
WHERE p.user_id = '120e0011-ed71-4df6-a10e-5170f98ec439';

-- 2. Verificar se há usuário auth correspondente
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at
FROM auth.users u 
WHERE u.id = '120e0011-ed71-4df6-a10e-5170f98ec439';

-- 3. Deletar o perfil problemático
DELETE FROM public.profiles 
WHERE user_id = '120e0011-ed71-4df6-a10e-5170f98ec439';

-- 4. Verificar se foi deletado
SELECT COUNT(*) as deleted_count 
FROM public.profiles 
WHERE user_id = '120e0011-ed71-4df6-a10e-5170f98ec439';

-- 5. Tentar criar novo perfil com user_id único
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    referral_code,
    referred_by,
    status,
    created_at,
    updated_at
) VALUES (
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    'teste_fix@imperium.com',
    'Teste Fix User ID',
    'FIX123',
    NULL,
    'active',
    NOW(),
    NOW()
);

-- 6. Verificar se o novo perfil foi criado
SELECT 
    p.id,
    p.user_id,
    p.email,
    p.referral_code,
    p.referred_by
FROM public.profiles p 
WHERE p.email = 'teste_fix@imperium.com';
