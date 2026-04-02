-- Script ultra-simples para AdminBanking
-- Apenas atualiza Cristian e cria usuários básicos

-- 1. Atualizar Cristian com dados bancários
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

-- 2. Criar Ana Oliveira - método simples
-- Primeiro criar em auth.users
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    phone,
    created_at,
    updated_at
) 
SELECT 
    '550e8400e29b4d0da7e85f8e1b3a2c1',
    'ana.oliveira@imperium.test',
    NOW(),
    '+55 11 98765-4321',
    NOW(),
    NOW()
ON CONFLICT (email) DO NOTHING;

-- Depois criar em profiles
INSERT INTO profiles (
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
    (SELECT id FROM auth.users WHERE email = 'ana.oliveira@imperium.test' LIMIT 1),
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
ON CONFLICT (email) DO NOTHING;

-- 3. Criar Carlos Pereira - método simples
-- Primeiro criar em auth.users
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    phone,
    created_at,
    updated_at
) 
SELECT 
    '660f9500f39c4e1eb8f96a9f2c4b3d2',
    'carlos.pereira@imperium.test',
    NOW(),
    '+55 21 12345-6789',
    NOW(),
    NOW()
ON CONFLICT (email) DO NOTHING;

-- Depois criar em profiles
INSERT INTO profiles (
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
    (SELECT id FROM auth.users WHERE email = 'carlos.pereira@imperium.test' LIMIT 1),
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
ON CONFLICT (email) DO NOTHING;

-- 4. Verificar resultados
SELECT 
    'Usuários com dados bancários:' as info,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active' 
    AND bank_name IS NOT NULL 
    AND bank_name != '';

-- 5. Listar usuários para verificação
SELECT 
    id,
    full_name,
    email,
    bank_name,
    pix_key,
    available_balance,
    created_at
FROM profiles 
WHERE status = 'active' 
    AND bank_name IS NOT NULL 
    AND bank_name != ''
ORDER BY created_at DESC
LIMIT 5;
