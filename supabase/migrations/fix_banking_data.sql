-- Script para corrigir e popular dados bancários
-- Resolve problemas de looping no AdminBanking

-- 1. Atualizar usuários teste com dados bancários completos
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

-- 2. Criar mais usuários de teste com dados bancários
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
    '550e8400-e29b-4d0d-a7e8-5f8e1b3a2c1'::uuid, -- ID único
    '550e8400-e29b-4d0d-a7e8-5f8e1b3a2c1'::uuid,
    'Maria Silva',
    'maria.silva@imperium.test',
    '+55 11 98765-4321',
    '1990-05-15',
    'user',
    'active',
    'verified',
    'Itaú Unibanco',
    '1234',
    '54321-0',
    'maria.silva@pix.com',
    '0x9876543210987654321098765432109876543210',
    500.00,
    150.00,
    1000.00,
    200.00,
    NOW(),
    NOW()
),
(
    '660f9500-f39c-4e1e-b8f9-6a9f2c4b3d2'::uuid, -- ID único
    '660f9500-f39c-4e1e-b8f9-6a9f2c4b3d2'::uuid,
    'João Santos',
    'joao.santos@imperium.test',
    '+55 21 12345-6789',
    '1985-08-20',
    'user',
    'active',
    'verified',
    'Caixa Econômica Federal',
    '0001',
    '11122-3',
    'joao.santos@pix.com',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890',
    750.00,
    225.00,
    1500.00,
    300.00,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar resultados
SELECT 
    'Usuários atualizados com dados bancários:' as info,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active' 
    AND bank_name IS NOT NULL 
    AND bank_name != '';

-- 4. Listar todos os usuários ativos com dados bancários
SELECT 
    id,
    full_name,
    email,
    bank_name,
    bank_agency,
    pix_key,
    verification_level,
    available_balance,
    created_at
FROM profiles 
WHERE status = 'active' 
    AND bank_name IS NOT NULL 
    AND bank_name != ''
ORDER BY created_at DESC;

-- 5. Limpar possíveis ciclos de referência
UPDATE profiles 
SET referred_by = NULL 
WHERE id IN (SELECT p1.id 
              FROM profiles p1 
              WHERE p1.referred_by IS NOT NULL 
                AND p1.referred_by IN (
                  SELECT p2.id 
                  FROM profiles p2 
                  WHERE p2.referred_by = p1.id
                ));

-- 6. Verificar se há usuários sem role definido
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL OR role = '';

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
