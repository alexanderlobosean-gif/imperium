-- Script para criar depósitos de teste para verificar comissões
-- Execute no SQL Editor do Supabase

-- Inserir depósitos para o usuário principal (31a89355-2c2b-4966-9610-fb5c531c23ee)
INSERT INTO deposits (user_id, amount, method, status, transaction_hash, description, confirmed_at, created_at, updated_at)
VALUES 
    ('31a89355-2c2b-4966-9610-fb5c531c23ee', '1500.00', 'pix', 'confirmed', 'tx_test_user_001', 'Depósito de teste para comissões', NOW(), NOW(), NOW()),
    ('31a89355-2c2b-4966-9610-fb5c531c23ee', '2500.00', 'bank_transfer', 'confirmed', 'tx_test_user_002', 'Depósito de teste para comissões', NOW(), NOW(), NOW());

-- Inserir depósitos para os membros da rede (quem foi indicado por 31a89355-2c2b-4966-9610-fb5c531c23ee)
-- Usuário: teste_fix@imperium.com (user_id: 120e0011-ed71-4df6-a10e-5170f98ec439)
INSERT INTO deposits (user_id, amount, method, status, transaction_hash, description, confirmed_at, created_at, updated_at)
VALUES 
    ('120e0011-ed71-4df6-a10e-5170f98ec439', '500.00', 'pix', 'confirmed', 'tx_network_001', 'Depósito membro rede - Nível 1', NOW(), NOW(), NOW()),
    ('120e0011-ed71-4df6-a10e-5170f98ec439', '800.00', 'pix', 'confirmed', 'tx_network_002', 'Depósito membro rede - Nível 1', NOW(), NOW(), NOW());

-- Usuário: teste1@teste.com (user_id: 96253f43-f8b5-496e-a613-9c77f77e392b)
INSERT INTO deposits (user_id, amount, method, status, transaction_hash, description, confirmed_at, created_at, updated_at)
VALUES 
    ('96253f43-f8b5-496e-a613-9c77f77e392b', '1200.00', 'bank_transfer', 'confirmed', 'tx_network_003', 'Depósito membro rede - Nível 1', NOW(), NOW(), NOW()),
    ('96253f43-f8b5-496e-a613-9c77f77e392b', '600.00', 'pix', 'confirmed', 'tx_network_004', 'Depósito membro rede - Nível 1', NOW(), NOW(), NOW());

-- Verificar depósitos criados
SELECT 
    d.*,
    p.full_name,
    p.email,
    p.referred_by
FROM deposits d
JOIN profiles p ON d.user_id = p.user_id
WHERE d.user_id IN (
    '31a89355-2c2b-4966-9610-fb5c531c23ee',
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    '96253f43-f8b5-496e-a613-9c77f77e392b'
)
ORDER BY d.created_at DESC;
