-- CORRIGIR PRECISION DO CAMPO AMOUNT
-- Alterar para NUMERIC(15,2) para suportar valores reais

-- 1. Verificar estrutura atual (sem SELECT direto)
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount';

-- 2. Alterar precision do campo amount
ALTER TABLE investments 
ALTER COLUMN amount 
TYPE NUMERIC(15,2);

-- 3. Verificar se a alteração funcionou
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'amount';

-- 4. Agora testar leitura dos valores existentes
SELECT 
    id,
    user_id,
    amount,
    plan_slug,
    status
FROM investments 
ORDER BY amount DESC;

-- 5. Contar investimentos por usuário
SELECT 
    user_id,
    COUNT(*) as total_investments,
    SUM(amount) as total_amount
FROM investments 
WHERE status = 'active'
GROUP BY user_id
ORDER BY total_investments DESC;
