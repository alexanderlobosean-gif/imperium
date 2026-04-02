-- Fix RLS policy - Force both sides to text
-- Execute no SQL Editor do Supabase

-- Desabilitar RLS
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas
DROP POLICY IF EXISTS "Users can view their own deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can update deposits" ON deposits;

-- Reabilitar RLS
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Política: usuários veem seus próprios depósitos
-- Forçar conversão de ambos os lados para texto
CREATE POLICY "Users can view their own deposits" ON deposits
  FOR SELECT 
  USING (user_id::text = auth.uid()::text);

-- Política: admins veem todos os depósitos
CREATE POLICY "Admins can view all deposits" ON deposits
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Verificar políticas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'deposits';
