-- Verificar CHECK constraints na tabela deposits
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'deposits'
    AND tc.table_schema = 'public';

-- Verificar TRIGGERS na tabela deposits (usando pg_trigger)
SELECT 
    tgname,
    tgfoid::regclass::text as table_name,
    tgenabled,
    tgtype,
    tgisinternal,
    tgconstraint
FROM pg_trigger tg
WHERE tgrelid = 'deposits'::regclass
    AND tgisinternal = false;

-- Verificar RLS policies na tabela deposits
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'deposits';

-- Testar inserção COM TODOS OS CAMPOS OBRIGATÓRIOS
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
    '550e8400-e29b-41d4-a616-446655440999',
    '120e0011-ed71-4df6-a10e-5170f98ec439',
    500.00,
    'pix',
    'confirmed',
    'Teste valor 500 - COMPLETO',
    NOW(),
    NOW(),
    NOW()
);

-- Verificar se a inserção COMPLETA funcionou
SELECT amount, method, status, description FROM deposits WHERE id = '550e8400-e29b-41d4-a616-446655440999';

-- Limpar teste
DELETE FROM deposits WHERE id = '550e8400-e29b-41d4-a616-446655440999';
