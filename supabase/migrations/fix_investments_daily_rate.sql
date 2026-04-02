-- Corrigir o campo current_daily_rate na tabela investments
-- Alterar para suportar taxas maiores (ex: 0.01 = 1%)

ALTER TABLE investments 
ALTER COLUMN current_daily_rate TYPE NUMERIC(10,8);

-- Verificar a correção
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'investments'
    AND column_name = 'current_daily_rate';

-- Testar inserção com taxa de 1%
INSERT INTO investments (
    user_id,
    amount,
    plan_slug,
    client_share,
    company_share,
    status,
    current_daily_rate,
    daily_yield,
    total_yield,
    last_yield_calculated,
    created_at,
    updated_at
) VALUES 
(
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    500.00,
    'basic',
    50.0,
    50.0,
    'active',
    0.01000000,
    0.00,
    0.00,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
);

-- Verificar se inseriu
SELECT amount, current_daily_rate FROM investments WHERE user_id = '120e0011-ed71-4df6-a10e-5170f98ec439' AND plan_slug = 'basic';
