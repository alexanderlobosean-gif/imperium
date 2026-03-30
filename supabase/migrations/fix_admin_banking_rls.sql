-- Corrigir permissões RLS para AdminBanking
-- Se o usuário admin não conseguir ver as contas

-- 1. Desabilitar RLS temporariamente (para debug)
ALTER TABLE admin_banking_accounts DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se consegue ver as contas sem RLS
SELECT 
    'Contas sem RLS:' as info,
    COUNT(*) as count
FROM admin_banking_accounts 
WHERE is_active = TRUE;

-- 3. Reabilitar RLS com políticas mais permissivas
ALTER TABLE admin_banking_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes
DROP POLICY IF EXISTS "Admin pode ver contas bancárias" ON admin_banking_accounts;
DROP POLICY IF EXISTS "Admin pode inserir contas bancárias" ON admin_banking_accounts;
DROP POLICY IF EXISTS "Admin pode atualizar contas bancárias" ON admin_banking_accounts;
DROP POLICY IF EXISTS "Admin pode deletar contas bancárias" ON admin_banking_accounts;

-- 5. Criar políticas mais simples (baseadas em auth.uid())
CREATE POLICY "Admin pode ver contas bancárias"
    ON admin_banking_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin pode inserir contas bancárias"
    ON admin_banking_accounts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin pode atualizar contas bancárias"
    ON admin_banking_accounts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin pode deletar contas bancárias"
    ON admin_banking_accounts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 6. Testar acesso com RLS
SELECT 
    'Contas com RLS (após correção):' as info,
    COUNT(*) as count
FROM admin_banking_accounts 
WHERE is_active = TRUE;

-- 7. Verificar role do usuário atual
SELECT 
    'Seu role atual:' as info,
    role,
    email,
    full_name
FROM profiles 
WHERE id = auth.uid();
