-- CRIAR INVESTIMENTOS PARA TODOS OS USUÁRIOS
-- Garantir que todos os usuários tenham investimentos ativos

-- 1. Inserir investimentos para os outros 3 usuários (valores reais agora que NUMERIC(15,2) está corrigido)
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
    1500.00,  -- Valor real agora permitido
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
    800.00,   -- Valor real agora permitido
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
    2500.00,  -- Valor real agora permitido
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

-- 2. Verificar todos os investimentos agora
SELECT 
    i.id,
    i.user_id,
    p.email as usuario_email,
    i.amount,
    i.plan_slug,
    i.status,
    i.created_at
FROM investments i
LEFT JOIN profiles p ON i.user_id::text = p.id::text
WHERE i.status = 'active'
ORDER BY p.email, i.amount;

-- 3. Contar investimentos por usuário
SELECT 
    p.email,
    COUNT(*) as total_investments,
    SUM(i.amount) as total_amount
FROM investments i
LEFT JOIN profiles p ON i.user_id::text = p.id::text
WHERE i.status = 'active'
GROUP BY p.email
ORDER BY total_investments DESC;
