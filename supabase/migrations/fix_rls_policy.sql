-- CORRIGIR RLS POLICY PARA SUPABASE ADMIN - VERSÃO SIMPLES
-- Permitir que supabaseAdmin acesse todos os investimentos

-- 1. Desabilitar RLS temporariamente
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
DROP POLICY IF EXISTS "Users can update own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
DROP POLICY IF EXISTS "Admin can access all investments" ON investments;
DROP POLICY IF EXISTS "Service role full access" ON investments;
DROP POLICY IF EXISTS "Users access own investments" ON investments;

-- 3. Criar política para service role (admin) - abordagem simples
CREATE POLICY "Service role full access" ON investments
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Criar política para usuários normais
CREATE POLICY "Users access own investments" ON investments
FOR ALL
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- 5. Reabilitar RLS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- 6. Verificar as políticas aplicadas
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

-- 7. Testar acesso direto (sem auth)
SELECT 
    COUNT(*) as total_investments,
    COUNT(DISTINCT user_id) as usuarios_distintos,
    STRING_AGG(DISTINCT user_id::text, ', ') as usuarios_ids
FROM investments 
WHERE status = 'active';
