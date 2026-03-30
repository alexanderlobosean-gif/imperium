-- Desabilitar RLS temporariamente para testar AdminBanking
-- Se as contas não aparecem na interface

-- 1. Desabilitar RLS na tabela admin_banking_accounts
ALTER TABLE admin_banking_accounts DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se consegue acessar as contas
SELECT 
    'Contas com RLS desabilitado:' as info,
    COUNT(*) as count
FROM admin_banking_accounts 
WHERE is_active = TRUE;

-- 3. Listar contas para confirmar
SELECT 
    'Contas disponíveis:' as info,
    id,
    bank_name,
    account_holder,
    is_default,
    is_active,
    created_at
FROM admin_banking_accounts 
WHERE is_active = TRUE
ORDER BY created_at DESC;

-- 4. Se funcionar, reabilitar RLS com políticas corrigidas
-- (Execute este passo apenas após testar a interface)

-- Reabilitar RLS
-- ALTER TABLE admin_banking_accounts ENABLE ROW LEVEL SECURITY;

-- Criar política simplificada que permite admin ver tudo
-- CREATE POLICY "Admin full access" ON admin_banking_accounts
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE profiles.id = auth.uid() 
--             AND profiles.role IN ('admin', 'super_admin')
--         )
--     );
