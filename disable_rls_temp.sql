-- SOLUÇÃO FINAL: DESABILITAR RLS TEMPORARIAMENTE
-- Permitir acesso total à tabela investments

-- 1. Desabilitar RLS completamente
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- 2. Verificar acesso total
SELECT 
    COUNT(*) as total_investments,
    COUNT(DISTINCT user_id) as usuarios_distintos,
    STRING_AGG(DISTINCT user_id::text, ', ') as usuarios_ids
FROM investments 
WHERE status = 'active';

-- 3. Verificar políticas atuais
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
WHERE tablename = 'investments'
ORDER BY policyname;

-- 4. Verificar se RLS está desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'investments';
