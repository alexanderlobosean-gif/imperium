-- Teste completo de inserção passo a passo
-- Para identificar exatamente qual campo está causando o erro

-- 1. Verificar todos os campos da tabela deposits
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'deposits'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Testar inserção com valor mínimo primeiro
INSERT INTO deposits (
    id,
    user_id,
    amount,
    method,
    status,
    description,
    confirmed_at,
    created_at,
    updated_at
) VALUES 
(
    '550e8400-e29b-41d4-a616-446655440001',
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    10.00,
    'pix',
    'confirmed',
    'Teste valor 10',
    NOW(),
    NOW(),
    NOW()
);

-- 3. Verificar se inseriu
SELECT 'Teste 10: ' || amount as resultado FROM deposits WHERE id = '550e8400-e29b-41d4-a616-446655440001';

-- 4. Testar inserção com valor médio
INSERT INTO deposits (
    id,
    user_id,
    amount,
    method,
    status,
    description,
    confirmed_at,
    created_at,
    updated_at
) VALUES 
(
    '550e8400-e29b-41d4-a616-446655440002',
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    100.00,
    'pix',
    'confirmed',
    'Teste valor 100',
    NOW(),
    NOW(),
    NOW()
);

-- 5. Verificar se inseriu
SELECT 'Teste 100: ' || amount as resultado FROM deposits WHERE id = '550e8400-e29b-41d4-a616-446655440002';

-- 6. Testar inserção com valor grande
INSERT INTO deposits (
    id,
    user_id,
    amount,
    method,
    status,
    description,
    confirmed_at,
    created_at,
    updated_at
) VALUES 
(
    '550e8400-e29b-41d4-a616-446655440003',
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    500.00,
    'pix',
    'confirmed',
    'Teste valor 500',
    NOW(),
    NOW(),
    NOW()
);

-- 7. Verificar se inseriu
SELECT 'Teste 500: ' || amount as resultado FROM deposits WHERE id = '550e8400-e29b-41d4-a616-446655440003';

-- 8. Limpar testes
DELETE FROM deposits WHERE description LIKE 'Teste valor %';

-- 9. Verificar estrutura da tabela investments também
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'investments'
    AND table_schema = 'public'
    AND column_name IN ('amount', 'current_daily_rate')
ORDER BY ordinal_position;
