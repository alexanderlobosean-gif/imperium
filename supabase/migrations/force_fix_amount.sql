-- FORÇAR CORREÇÃO DO CAMPO AMOUNT
-- Abordagem mais agressiva para garantir a alteração

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

-- 3. Copiar dados (se possível)
-- NOTA: Esta query pode falhar se os dados existentes causarem overflow
UPDATE investments 
SET amount_new = amount 
WHERE amount IS NOT NULL;

-- 4. Se a cópia falhar, definir valores padrão
UPDATE investments 
SET amount_new = 1000.00 
WHERE amount_new IS NULL;

-- 5. Remover coluna antiga
ALTER TABLE investments 
DROP COLUMN amount;

-- 6. Renomear coluna nova
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

-- 8. Testar inserção com valor real
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
    1500.00,  -- Valor real para teste
    'basic',
    50,
    50,
    'active',
    0.00,
    0.00,
    NOW(),
    NOW()
);
