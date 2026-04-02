-- VERIFICAR ESTRUTURA REAL DA TABELA INVESTMENTS
-- Diagnosticar por que valores grandes causam overflow

-- 1. Verificar estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount'
ORDER BY ordinal_position;

-- 2. Verificar valores existentes na tabela
SELECT 
    id,
    user_id,
    amount,
    plan_slug,
    status,
    created_at
FROM investments 
ORDER BY amount DESC;

-- 3. Testar inserção com valor pequeno
BEGIN;
    -- Criar tabela de teste
    CREATE TEMP TABLE test_investment (
        amount NUMERIC(5,4)
    );
    
    -- Testar inserção
    INSERT INTO test_investment (amount) VALUES (9.99);
    
    -- Verificar se funcionou
    SELECT * FROM test_investment;
    
    -- Limpar
    DROP TABLE test_investment;
ROLLBACK;

-- 4. Tentar inserção direta com valor mínimo
-- NOTA: Esta query pode falhar, mas vamos tentar
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
) VALUES (
    gen_random_uuid(),
    '88d01414-3384-4e25-8fba-64d90bb17dd7',
    1.00,  -- Valor mínimo para teste
    'basic',
    50,
    50,
    'active',
    0.00,
    0.00,
    NOW(),
    NOW()
);
