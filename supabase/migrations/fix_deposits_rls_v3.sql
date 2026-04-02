-- Fix RLS policy - Alternative approach using text comparison
-- Execute no SQL Editor do Supabase

-- Primeiro, desabilitar RLS temporariamente para limpar
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view their own deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can update deposits" ON deposits;

-- Reabilitar RLS
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Criar política usando comparação de texto (convertendo UUID para texto)
CREATE POLICY "Users can view their own deposits" ON deposits
  FOR SELECT 
  USING (user_id = auth.uid()::text);

-- Criar política para admins
CREATE POLICY "Admins can view all deposits" ON deposits
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid()::text
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Criar política para admins atualizarem
CREATE POLICY "Admins can update deposits" ON deposits
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid()::text
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'deposits';
