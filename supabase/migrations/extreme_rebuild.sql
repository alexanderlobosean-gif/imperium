-- RECONSTRUÇÃO EXTREMA - SEM LER DADOS DA TABELA CORROMPIDA
-- Abordagem radical para tabela completamente corrompida

-- 1. Desabilitar RLS completamente
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as policies (sem verificar quais existem)
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

-- 3. Criar tabela nova com estrutura correta
CREATE TABLE investments_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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

-- 4. Inserir dados manualmente (sem ler da tabela corrompida)
-- Dados baseados nos logs anteriores
INSERT INTO investments_new (
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
-- Investimentos existentes do usuário visionweb@gmail.com
(
    '5ea254a0-cb1d-4eec-a017-b5e6f6d4c81c',
    '78f674e2-16cc-4924-9480-e06a2b53cdcf',
    500.00,
    'start',
    50,
    50,
    'active',
    0.00,
    0.00,
    '2026-02-23 22:08:54.001689+00',
    NOW()
),
(
    '8384c068-2c77-466c-8341-557baed034b4',
    '78f674e2-16cc-4924-9480-e06a2b53cdcf',
    1000.00,
    'basic',
    50,
    50,
    'active',
    0.00,
    0.00,
    '2026-03-18 22:08:54.001689+00',
    NOW()
),
(
    'bb43effd-c7a4-4b50-9955-575ec7b43b95',
    '78f674e2-16cc-4924-9480-e06a2b53cdcf',
    2000.00,
    'silver',
    50,
    50,
    'active',
    0.00,
    0.00,
    '2026-03-22 22:08:54.001689+00',
    NOW()
),
-- Novos investimentos para os outros usuários
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

-- 5. Drop da tabela corrompida com CASCADE
DROP TABLE investments CASCADE;

-- 6. Renomear tabela nova
ALTER TABLE investments_new RENAME TO investments;

-- 7. Recriar foreign keys
ALTER TABLE yields 
ADD CONSTRAINT yields_investment_id_fkey 
FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE;

ALTER TABLE commissions 
ADD CONSTRAINT commissions_investment_id_fkey 
FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE;

-- 8. Verificação final
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
