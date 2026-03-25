-- Corrigir políticas RLS para yields - Versão Corrigida
-- Usando sintaxe correta para políticas RLS

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins can view all yields" ON yields;
DROP POLICY IF EXISTS "Admins can insert yields" ON yields;
DROP POLICY IF EXISTS "Admins can update yields" ON yields;
DROP POLICY IF EXISTS "Users can view their own yields" ON yields;
DROP POLICY IF EXISTS "Enable service role insert" ON yields;

-- Criar política para admin baseada em verificação de perfil
CREATE POLICY "Admin insert policy" ON yields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Criar política para admin ver todos
CREATE POLICY "Admin select policy" ON yields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
    OR user_id = auth.uid()
  );

-- Criar política para admin atualizar
CREATE POLICY "Admin update policy" ON yields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Criar política para usuários verem seus próprios rendimentos
CREATE POLICY "User select policy" ON yields
  FOR SELECT USING (user_id = auth.uid());

-- Política para service role (inserção automatizada)
CREATE POLICY "Service role insert policy" ON yields
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'yields' 
ORDER BY policyname;
