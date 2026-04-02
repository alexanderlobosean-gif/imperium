-- Fix RLS policy with explicit cast for user_id
-- Execute no SQL Editor do Supabase

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;

-- Criar política para usuários verem seus próprios depósitos (com cast explícito)
CREATE POLICY "Users can view their own deposits" ON deposits
  FOR SELECT 
  USING (user_id::uuid = auth.uid());

-- Criar política para admins verem todos os depósitos (com cast explícito)
CREATE POLICY "Admins can view all deposits" ON deposits
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::uuid = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Verificar políticas atualizadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'deposits';
