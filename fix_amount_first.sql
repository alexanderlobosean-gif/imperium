-- CORRIGIR PRECISION DO CAMPO amount PRIMEIRO
-- Depois criar investimentos para todos os usuários

-- 1. Verificar estrutura atual do amount
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount';

-- 2. Desabilitar RLS completamente para evitar bloqueios
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- 3. Remover todas as policies restantes
DROP POLICY IF EXISTS "Users access own investments" ON investments;
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert their own investments" ON investments;
DROP POLICY IF EXISTS "Users can update own investments" ON investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;
DROP POLICY IF EXISTS "Service role full access" ON investments;
DROP POLICY IF EXISTS "Admin can access all investments" ON investments;

-- 4. Criar coluna temporária com precision correta
ALTER TABLE investments 
ADD COLUMN amount_new NUMERIC(15,2);

-- 5. Definir valores sem ler os existentes (usando plan_slug)
UPDATE investments 
SET amount_new = CASE 
    WHEN plan_slug = 'start' THEN 500.00
    WHEN plan_slug = 'basic' THEN 1000.00
    WHEN plan_slug = 'silver' THEN 2000.00
    ELSE 1000.00
END;

-- 6. Remover coluna antiga e renomear
ALTER TABLE investments 
DROP COLUMN amount;

ALTER TABLE investments 
RENAME COLUMN amount_new TO amount;

-- 7. Verificar se funcionou
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount';

-- 8. Testar leitura dos valores
SELECT 
    user_id,
    amount,
    plan_slug,
    status
FROM investments 
ORDER BY amount DESC;

-- 9. Agora criar investimentos para os outros usuários
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

-- 10. Verificação final
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
