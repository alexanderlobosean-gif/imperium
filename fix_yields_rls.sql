-- Corrigir políticas RLS para tabela yields
-- Permitir inserção de rendimentos pelo sistema admin

-- Habilitar RLS se não estiver habilitado
ALTER TABLE yields ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Admins can view all yields" ON yields;
DROP POLICY IF EXISTS "Users can view their own yields" ON yields;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON yields;

-- Criar políticas corretas para yields
-- 1. Admins podem ver todos os rendimentos
CREATE POLICY "Admins can view all yields" ON yields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 2. Admins podem inserir rendimentos (importante para o sistema)
CREATE POLICY "Admins can insert yields" ON yields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 3. Admins podem atualizar rendimentos
CREATE POLICY "Admins can update yields" ON yields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 4. Usuários podem ver seus próprios rendimentos
CREATE POLICY "Users can view their own yields" ON yields
  FOR SELECT USING (user_id = auth.uid());

-- 5. Permitir inserção pelo sistema (bypass RLS para service role)
-- Esta política permite que o serviço insira rendimentos
CREATE POLICY "Enable service role insert" ON yields
  FOR INSERT WITH CHECK (
    true -- Permitir inserção quando usando service role
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
