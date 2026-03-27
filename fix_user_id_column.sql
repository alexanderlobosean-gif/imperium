-- CORRIGIR CAMPO user_id TEXT → UUID
-- Remover RLS policy primeiro, depois alterar coluna

-- 1. Verificar políticas atuais
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

-- 2. Remover TODAS as policies da tabela investments (abordagem mais agressiva)
-- Primeiro, listar todas as policies para ver exatamente quais existem
SELECT policyname FROM pg_policies WHERE tablename = 'investments';

-- Agora remover todas as policies encontradas
DROP POLICY IF EXISTS "Users access own investments" ON investments;
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert their own investments" ON investments;
DROP POLICY IF EXISTS "Users can update own investments" ON investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;
DROP POLICY IF EXISTS "Service role full access" ON investments;
DROP POLICY IF EXISTS "Admin can access all investments" ON investments;

-- Se ainda houver policies, desabilitar RLS temporariamente
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- 3. Verificar estrutura atual do campo
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'user_id';

-- 4. Alterar tipo da coluna user_id de TEXT para UUID
ALTER TABLE investments 
ALTER COLUMN user_id 
TYPE UUID USING user_id::uuid;

-- 5. Verificar se a alteração funcionou
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND column_name = 'user_id';

-- 6. Recriar a policy com tipo correto
CREATE POLICY "Users access own investments" ON investments
FOR ALL
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- 7. Verificar dados existentes
SELECT 
    id,
    user_id,
    amount,
    plan_slug,
    status
FROM investments 
ORDER BY created_at;

-- 8. Contar investimentos por usuário
SELECT 
    user_id,
    COUNT(*) as total_investments,
    SUM(amount) as total_amount
FROM investments 
WHERE status = 'active'
GROUP BY user_id
ORDER BY total_investments DESC;
