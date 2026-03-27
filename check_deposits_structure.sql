-- Verificar estrutura atual da tabela deposits
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deposits' 
    AND column_name = 'amount'
ORDER BY ordinal_position;

-- Verificar estrutura completa da tabela deposits
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'deposits'
ORDER BY ordinal_position;

-- Tentar inserir um valor de teste para verificar o limite
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
    gen_random_uuid(),
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    9.99,
    'pix',
    'confirmed',
    'Teste valor máximo',
    NOW(),
    NOW(),
    NOW()
);

-- Verificar se o teste funcionou
SELECT amount FROM deposits WHERE description = 'Teste valor máximo';
