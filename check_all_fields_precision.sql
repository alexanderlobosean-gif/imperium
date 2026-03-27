-- Verificar precisão de TODOS os campos usados na inserção
SELECT 
    'deposits' as table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'deposits'
    AND column_name IN ('id', 'user_id', 'amount', 'method', 'status', 'description', 'confirmed_at', 'created_at', 'updated_at')
UNION ALL
SELECT 
    'profiles' as table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'profiles'
    AND column_name IN ('total_invested', 'available_balance')
UNION ALL
SELECT 
    'investments' as table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'investments'
    AND column_name IN ('amount', 'client_share', 'company_share', 'daily_yield', 'total_yield')
ORDER BY table_name, column_name;

-- Testar inserção com valor maior para identificar o campo problemático
-- Usando UUID válido gerado pela função
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
    '550e8400-e29b-41d4-a616-446655440000'::uuid,
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    500.00,
    'pix',
    'confirmed',
    'Teste valor 500',
    NOW(),
    NOW(),
    NOW()
);

-- Verificar se inseriu
SELECT amount, description FROM deposits WHERE id = '550e8400-e29b-41d4-a616-446655440000';
