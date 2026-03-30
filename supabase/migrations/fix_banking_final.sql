-- Script final para corrigir AdminBanking
-- Resolve problema de user_id nulo

-- 1. Atualizar Cristian com dados bancários simples
UPDATE profiles 
SET 
    bank_name = 'Banco do Brasil',
    bank_agency = '0001',
    bank_account = '12345-6',
    pix_key = 'cristian.macena@imperium.test',
    crypto_wallet = '0x1234567890123456789012345678901234567890',
    verification_level = 'verified',
    updated_at = NOW()
WHERE id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';

-- 2. Verificar se Cristian já existe em auth.users
SELECT 
    'Verificando usuário em auth.users:' as info,
    COUNT(*) as count
FROM auth.users 
WHERE id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';

-- 3. Criar usuário Ana Oliveira (se não existir)
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    phone,
    created_at,
    updated_at
) 
SELECT 
    '550e8400-e29b-4d0d-a7e8-5f8e1b3a2c1',
    'ana.oliveira@imperium.test',
    NOW(),
    '+55 11 98765-4321',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'ana.oliveira@imperium.test'
);

-- 4. Inserir profile para Ana Oliveira
INSERT INTO profiles (
    id,
    user_id,
    full_name,
    email,
    phone,
    birth_date,
    role,
    status,
    verification_level,
    bank_name,
    bank_agency,
    bank_account,
    pix_key,
    crypto_wallet,
    available_balance,
    total_earned,
    total_invested,
    total_withdrawn,
    created_at,
    updated_at
) 
SELECT 
    '550e8400-e29b-4d0d-a7e8-5f8e1b3a2c1',
    '550e8400-e29b-4d0d-a7e8-5f8e1b3a2c1',
    'Ana Oliveira',
    'ana.oliveira@imperium.test',
    '+55 11 98765-4321',
    '1992-03-10',
    'user',
    'active',
    'verified',
    'Itaú Unibanco',
    '1234',
    '54321-0',
    'ana.oliveira@pix.com',
    '0x9876543210987654321098765432109876543210',
    300.00,
    50.00,
    500.00,
    100.00,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = 'ana.oliveira@imperium.test'
);

-- 5. Criar usuário Carlos Pereira (se não existir)
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    phone,
    created_at,
    updated_at
) 
SELECT 
    '660f9500-f39c-4e1e-b8f9-6a9f2c4b3d2',
    'carlos.pereira@imperium.test',
    NOW(),
    '+55 21 12345-6789',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'carlos.pereira@imperium.test'
);

-- 6. Inserir profile para Carlos Pereira
INSERT INTO profiles (
    id,
    user_id,
    full_name,
    email,
    phone,
    birth_date,
    role,
    status,
    verification_level,
    bank_name,
    bank_agency,
    bank_account,
    pix_key,
    crypto_wallet,
    available_balance,
    total_earned,
    total_invested,
    total_withdrawn,
    created_at,
    updated_at
) 
SELECT 
    '660f9500-f39c-4e1e-b8f9-6a9f2c4b3d2',
    '660f9500-f39c-4e1e-b8f9-6a9f2c4b3d2',
    'Carlos Pereira',
    'carlos.pereira@imperium.test',
    '+55 21 12345-6789',
    '1988-07-22',
    'user',
    'active',
    'verified',
    'Bradesco',
    '0001',
    '11122-3',
    'carlos.pereira@pix.com',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890',
    450.00,
    75.00,
    750.00,
    150.00,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = 'carlos.pereira@imperium.test'
);

-- 7. Verificar resultados finais
SELECT 
    'Status final:' as info,
    'Total usuários ativos:' as description,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active'

UNION ALL

SELECT 
    'Status final:' as info,
    'Usuários com dados bancários:' as description,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active' 
    AND bank_name IS NOT NULL 
    AND bank_name != ''

UNION ALL

SELECT 
    'Status final:' as info,
    'Usuários verificados:' as description,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active' 
    AND verification_level = 'verified';
