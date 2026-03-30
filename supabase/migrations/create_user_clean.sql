-- Criar usuário completamente novo para testes
-- Execute isso no SQL Editor do Supabase

-- 1. Verificar IDs existentes
SELECT id, email FROM auth.users WHERE email LIKE '%@imperium.com' ORDER BY created_at DESC;

-- 2. Deletar TODOS os usuários de teste (CASCADE)
DELETE FROM public.profiles WHERE email LIKE '%@imperium.com';
DELETE FROM auth.users WHERE email LIKE '%@imperium.com';

-- 3. Criar usuário com email único (timestamp)
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
    'teste_' || EXTRACT(EPOCH FROM NOW())::text || '@imperium.com',
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
    (SELECT id FROM auth.users WHERE email = 'teste_' || EXTRACT(EPOCH FROM NOW())::text || '@imperium.com'),
    'teste_' || EXTRACT(EPOCH FROM NOW())::text || '@imperium.com',
    'Usuário Teste ' || EXTRACT(EPOCH FROM NOW())::text,
    'TESTE' || SUBSTRING(EXTRACT(EPOCH FROM NOW())::text, -4, 4),
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
WHERE u.email = 'teste_' || EXTRACT(EPOCH FROM NOW())::text || '@imperium.com';

-- 6. Verificar se há conflitos
SELECT COUNT(*) as total_conflicts FROM auth.users WHERE email LIKE '%@imperium.com';
