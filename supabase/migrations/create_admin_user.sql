-- Criar usuário admin para teste
-- Se não houver usuários admin no sistema

-- 1. Verificar se Cristian existe
SELECT 
    'Cristian existe?' as info,
    id,
    email,
    full_name,
    role,
    status
FROM profiles 
WHERE email = 'cristian.macena@imperium.test';

-- 2. Atualizar Cristian para admin
UPDATE profiles 
SET 
    role = 'admin',
    status = 'active',
    updated_at = NOW()
WHERE email = 'cristian.macena@imperium.test';

-- 3. Verificar resultado
SELECT 
    'Cristian atualizado para admin:' as info,
    id,
    email,
    full_name,
    role,
    status
FROM profiles 
WHERE email = 'cristian.macena@imperium.test';

-- 4. Criar usuário admin se não existir
INSERT INTO profiles (
    id,
    user_id,
    full_name,
    email,
    role,
    status,
    verification_level,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'Admin Imperium',
    'admin@imperium.test',
    'admin',
    'active',
    'verified',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'admin@imperium.test'
);

-- 5. Verificar todos os admins
SELECT 
    'Todos os usuários admin:' as info,
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;
