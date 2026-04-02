-- Fix RLS policies for deposits table
-- Execute no SQL Editor do Supabase

-- Habilitar RLS na tabela deposits (se ainda não estiver)
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Remover política existente se houver
DROP POLICY IF EXISTS "Users can view their own deposits" ON deposits;

-- Criar política para usuários verem seus próprios depósitos
CREATE POLICY "Users can view their own deposits" ON deposits
  FOR SELECT 
  USING (user_id::uuid = auth.uid());

-- Também permitir que admins vejam todos os depósitos
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;

CREATE POLICY "Admins can view all deposits" ON deposits
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::uuid = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Verificar políticas criadas
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
