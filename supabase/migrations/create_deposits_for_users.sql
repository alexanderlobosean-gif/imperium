-- Script para criar depósitos para usuários
-- Baseado nos dados fornecidos
-- Valores originais restaurados após alteração do campo amount

-- Inserir depósitos para Ana Oliveira
INSERT INTO deposits (
    id,
    user_id,
    amount,
    method,
    status,
    description,
    confirmed_at,
    created_at,
    updated_at
) VALUES 
(
    '753e207f-c7b8-4f91-bf0d-9cd94c065a7f',
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    500.00,
    'pix',
    'confirmed',
    'Depósito inicial - Ana Oliveira',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),

-- Inserir depósitos para Carlos Pereira  
(
    '9a3acb75-8e15-4391-bd77-20405aae9970',
    'd5445d82-d3f9-4f59-bb02-e79c1c0a2809',
    1000.00,
    'bank_transfer',
    'confirmed',
    'Depósito inicial - Carlos Pereira',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),

-- Inserir depósitos para Cristian (já existe, mas vamos adicionar mais)
(
    '7ac72871-ea73-4a8d-b218-5b7bdcd39d07',
    '78f674e2-16cc-4924-9480-e06a2b53cdcf',
    2000.00,
    'pix',
    'confirmed',
    'Depósito adicional - Cristian Nunes',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),

-- Inserir depósitos para Leandro
(
    'e2f2bbb5-6bde-415b-89e8-bdf6fa704979',
    '88d01414-3384-4e25-8fba-64d90bb17dd7',
    1500.00,
    'bank_transfer',
    'confirmed',
    'Depósito inicial - Leandro Siqueira',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
);

-- Atualizar totais dos perfis
UPDATE profiles 
SET 
    total_invested = CAST(total_invested AS NUMERIC) + 500.00,
    available_balance = CAST(available_balance AS NUMERIC) + 500.00
WHERE id = '120e0011-ed71-4df6-a10e-5170f98ec439';

UPDATE profiles 
SET 
    total_invested = CAST(total_invested AS NUMERIC) + 1000.00,
    available_balance = CAST(available_balance AS NUMERIC) + 1000.00
WHERE id = 'd5445d82-d3f9-4f59-bb02-e79c1c0a2809';

UPDATE profiles 
SET 
    total_invested = CAST(total_invested AS NUMERIC) + 2000.00,
    available_balance = CAST(available_balance AS NUMERIC) + 2000.00
WHERE id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';

UPDATE profiles 
SET 
    total_invested = CAST(total_invested AS NUMERIC) + 1500.00,
    available_balance = CAST(available_balance AS NUMERIC) + 1500.00
WHERE id = '88d01414-3384-4e25-8fba-64d90bb17dd7';

-- Criar investimentos para os usuários (baseado nos depósitos)
INSERT INTO investments (
    user_id,
    amount,
    plan_slug,
    client_share,
    company_share,
    status,
    daily_yield,
    total_yield,
    last_yield_calculated,
    created_at,
    updated_at
) VALUES 
-- Ana Oliveira - Plano Basic
(
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    500.00,
    'basic',
    50.0,
    50.0,
    'active',
    0.00,
    0.00,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
),

-- Carlos Pereira - Plano Silver
(
    'd5445d82-d3f9-4f59-bb02-e79c1c0a2809',
    1000.00,
    'silver',
    60.0,
    40.0,
    'active',
    0.00,
    0.00,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),

-- Cristian Nunes - Plano Gold
(
    '78f674e2-16cc-4924-9480-e06a2b53cdcf',
    2000.00,
    'gold',
    70.0,
    30.0,
    'active',
    0.00,
    0.00,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '1 day'
),

-- Leandro Siqueira - Plano Basic
(
    '88d01414-3384-4e25-8fba-64d90bb17dd7',
    1500.00,
    'basic',
    50.0,
    50.0,
    'active',
    0.00,
    0.00,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '1 day'
);

-- Verificar resultados
SELECT 
    p.full_name,
    p.email,
    d.amount as deposit_amount,
    d.status as deposit_status,
    i.amount as investment_amount,
    i.plan_slug,
    i.status as investment_status
FROM profiles p
LEFT JOIN deposits d ON p.id = d.user_id
LEFT JOIN investments i ON p.id = i.user_id
WHERE p.id IN (
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    'd5445d82-d3f9-4f59-bb02-e79c1c0a2809',
    '78f674e2-16cc-4924-9480-e06a2b53cdcf',
    '88d01414-3384-4e25-8fba-64d90bb17dd7'
)
ORDER BY p.full_name;
