-- Criar usuário de teste para testar indicações
-- Execute no Studio Local: http://127.0.0.1:54323

-- 1. Criar usuário na auth.users
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
    'indicador@imperium.test',
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

-- 2. Criar perfil correspondente (referral code será gerado automaticamente)
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'indicador@imperium.test'),
    'indicador@imperium.test',
    'Usuário Indicador Teste',
    'active',
    NOW(),
    NOW()
);

-- 3. Verificar se foi criado e obter referral_code
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    p.referral_code,
    p.referred_by,
    p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'indicador@imperium.test';
