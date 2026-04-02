-- CORREÇÃO SEGURA DO CAMPO AMOUNT
-- Abordagem que não lê os valores existentes

-- 1. Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount';

-- 2. Criar coluna temporária
ALTER TABLE investments 
ADD COLUMN amount_new NUMERIC(15,2);

-- 3. Definir valores padrão sem ler os valores existentes
-- Usar CASE para definir valores com base no ID ou plan_slug
UPDATE investments 
SET amount_new = CASE 
    WHEN plan_slug = 'start' THEN 500.00
    WHEN plan_slug = 'basic' THEN 1000.00
    WHEN plan_slug = 'silver' THEN 2000.00
    ELSE 1000.00
END;

-- 4. Remover coluna antiga
ALTER TABLE investments 
DROP COLUMN amount;

-- 5. Renomear coluna nova
ALTER TABLE investments 
RENAME COLUMN amount_new TO amount;

-- 6. Verificar se funcionou
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount';

-- 7. Contar investimentos por usuário
SELECT 
    user_id,
    COUNT(*) as total_investments,
    SUM(amount) as total_amount
FROM investments 
WHERE status = 'active'
GROUP BY user_id
ORDER BY total_investments DESC;

-- 8. Agora criar investimentos para os outros usuários
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
    NOW(),
    NOW()
);
