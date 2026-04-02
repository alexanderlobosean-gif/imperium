-- CRIAR INVESTIMENTOS PARA USUÁRIOS SEM INVESTIMENTOS
-- user_id já está como UUID, agora criar investimentos para todos

-- 1. Verificar investimentos atuais por usuário
SELECT 
    i.user_id,
    p.email,
    COUNT(*) as total_investments,
    SUM(i.amount) as total_amount
FROM investments i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.status = 'active'
GROUP BY i.user_id, p.email
ORDER BY total_investments DESC;

-- 2. Verificar quais usuários não têm investimentos
SELECT 
    p.id,
    p.email,
    COUNT(i.id) as investment_count
FROM profiles p
LEFT JOIN investments i ON p.id = i.user_id AND i.status = 'active'
GROUP BY p.id, p.email
HAVING COUNT(i.id) = 0
ORDER BY p.email;

-- 3. Criar investimentos para os usuários sem investimentos
INSERT INTO investments (
    id,
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
-- Investimento para coachfinanceirobrasil@gmail.com
(
    gen_random_uuid(),
    '88d01414-3384-4e25-8fba-64d90bb17dd7',
    1500.00,
    'basic',
    50,
    50,
    'active',
    0.00,
    0.00,
    NULL,
    NOW(),
    NOW()
),
-- Investimento para ana.oliveira@imperium.test
(
    gen_random_uuid(),
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    800.00,
    'start',
    50,
    50,
    'active',
    0.00,
    0.00,
    NULL,
    NOW(),
    NOW()
),
-- Investimento para carlos.pereira@imperium.test
(
    gen_random_uuid(),
    'd5445d82-d3f9-4f59-bb02-e79c1c0a2809',
    2500.00,
    'silver',
    50,
    50,
    'active',
    0.00,
    0.00,
    NULL,
    NOW(),
    NOW()
);

-- 4. Verificação final - todos os usuários com investimentos
SELECT 
    i.user_id,
    p.email,
    COUNT(*) as total_investments,
    SUM(i.amount) as total_amount
FROM investments i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.status = 'active'
GROUP BY i.user_id, p.email
ORDER BY total_investments DESC;
