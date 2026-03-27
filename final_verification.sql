-- VERIFICAÇÃO FINAL SIMPLES - QUAL BANCO ESTAMOS USANDO?

-- 1. Informações do banco atual
SELECT 
    '=== INFORMAÇÕES DO BANCO ===' as info,
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version;

-- 2. Verificar estrutura ATUAL do campo amount em deposits
SELECT 
    '=== ESTRUTURA ATUAL DO CAMPO amount ===' as info,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'deposits' 
    AND column_name = 'amount'
    AND table_schema = 'public';

-- 3. Contar registros existentes em deposits
SELECT 
    '=== REGISTROS EXISTENTES EM deposits ===' as info,
    COUNT(*) as total_records,
    MAX(amount) as max_amount,
    MIN(amount) as min_amount
FROM deposits;

-- 4. Teste FINAL com valor alto para confirmar precisão
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
    999.99,
    'pix',
    'confirmed',
    'Teste final - valor máximo',
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING
RETURNING amount, description;
