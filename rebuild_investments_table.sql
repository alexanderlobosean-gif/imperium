-- RECONSTRUIR TABELA INVESTMENTS COMPLETAMENTE
-- Solução definitiva para o problema de corrompimento

-- 1. Criar backup da estrutura atual
CREATE TABLE investments_backup AS 
SELECT 
    id,
    user_id,
    plan_slug,
    client_share,
    company_share,
    status,
    daily_yield,
    total_yield,
    last_yield_calculated,
    created_at,
    updated_at
FROM investments;

-- 2. Drop da tabela corrompida com CASCADE
DROP TABLE investments CASCADE;

-- 3. Recriar tabela com structure correta
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    plan_slug VARCHAR(50) NOT NULL DEFAULT 'basic',
    client_share INTEGER NOT NULL DEFAULT 50,
    company_share INTEGER NOT NULL DEFAULT 50,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    daily_yield NUMERIC(10,8) NOT NULL DEFAULT 0.00,
    total_yield NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    last_yield_calculated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Restaurar dados do backup (sem amount)
INSERT INTO investments (
    id,
    user_id,
    plan_slug,
    client_share,
    company_share,
    status,
    daily_yield,
    total_yield,
    last_yield_calculated,
    created_at,
    updated_at,
    amount  -- Agora com valores corretos
) SELECT 
    id,
    user_id::uuid,  -- Conversão explícita para UUID
    plan_slug,
    client_share,
    company_share,
    status,
    daily_yield,
    total_yield,
    last_yield_calculated,
    created_at,
    updated_at,
    CASE 
        WHEN plan_slug = 'start' THEN 500.00
        WHEN plan_slug = 'basic' THEN 1000.00
        WHEN plan_slug = 'silver' THEN 2000.00
        ELSE 1000.00
    END as amount
FROM investments_backup;

-- 5. Limpar backup
DROP TABLE investments_backup;

-- 6. Verificar estrutura
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount';

-- 7. Verificar dados
SELECT 
    user_id,
    COUNT(*) as total_investments,
    SUM(amount) as total_amount
FROM investments 
WHERE status = 'active'
GROUP BY user_id
ORDER BY total_investments DESC;

-- 8. Criar investimentos para os outros usuários
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

-- 9. Recriar dependências (foreign keys)
-- Recriar foreign key na tabela yields
ALTER TABLE yields 
ADD CONSTRAINT yields_investment_id_fkey 
FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE;

-- Recriar foreign key na tabela commissions
ALTER TABLE commissions 
ADD CONSTRAINT commissions_investment_id_fkey 
FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE;

-- 10. Verificação final
SELECT 
    i.user_id,
    p.email,
    COUNT(*) as total_investments,
    SUM(i.amount) as total_amount
FROM investments i
LEFT JOIN profiles p ON i.user_id::text = p.id::text
WHERE i.status = 'active'
GROUP BY i.user_id, p.email
ORDER BY total_investments DESC;
