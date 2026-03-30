-- Script rápido para corrigir AdminBanking
-- Resolve problema de looping com dados mínimos

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

-- 2. Criar 2 usuários simples para teste
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
) VALUES 
(
    gen_random_uuid(),
    gen_random_uuid(),
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
),
(
    gen_random_uuid(),
    gen_random_uuid(),
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
);

-- 3. Verificar resultados
SELECT 
    'Usuários com dados bancários:' as info,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active' 
    AND bank_name IS NOT NULL 
    AND bank_name != '';

-- 4. Listar usuários para verificação
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
