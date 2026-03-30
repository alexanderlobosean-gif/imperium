-- Criar usuário manualmente para testes
-- Execute isso no SQL Editor do Supabase

-- 1. Verificar se usuário já existe
SELECT COUNT(*) as user_exists FROM auth.users WHERE email = 'teste@imperium.com';

-- 2. Deletar usuário existente (se necessário)
DELETE FROM auth.users WHERE email = 'teste@imperium.com';
DELETE FROM public.profiles WHERE email = 'teste@imperium.com';

-- 3. Criar novo usuário na auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
) VALUES (
    gen_random_uuid(),
    'teste@imperium.com',
    crypt('senha123', 'my_secret_key'),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{}',
    '{}',
    false,
    'authenticated',
    'authenticated'
);

-- 4. Criar perfil correspondente
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
    (SELECT id FROM auth.users WHERE email = 'teste@imperium.com'),
    'teste@imperium.com',
    'Usuário Teste',
    'TESTE123',
    NULL,
    'active',
    NOW(),
    NOW()
);

-- 5. Verificar criação
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    p.referral_code,
    p.referred_by
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'teste@imperium.com';
