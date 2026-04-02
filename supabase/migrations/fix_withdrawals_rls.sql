-- Configurar RLS para tabela withdrawals - Admin pode ver e atualizar saques
-- Execute no SQL Editor do Supabase

-- Habilitar RLS na tabela withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;

-- Política: Usuários podem ver seus próprios saques
CREATE POLICY "Users can view their own withdrawals" ON withdrawals
  FOR SELECT 
  USING (user_id::text = auth.uid()::text);

-- Política: Usuários podem criar saques
CREATE POLICY "Users can create withdrawals" ON withdrawals
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Política: Admins podem ver todos os saques
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Política: Admins podem atualizar saques (aprovar/rejeitar)
CREATE POLICY "Admins can update withdrawals" ON withdrawals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Verificar políticas criadas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'withdrawals';
