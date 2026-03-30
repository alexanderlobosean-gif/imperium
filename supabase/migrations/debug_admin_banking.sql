-- Verificar e corrigir problemas de acesso ao AdminBanking

-- 1. Verificar se a tabela foi criada
SELECT 
    'Tabela admin_banking_accounts existe:' as info,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_name = 'admin_banking_accounts';

-- 2. Verificar se há contas na tabela
SELECT 
    'Contas na tabela:' as info,
    COUNT(*) as count
FROM admin_banking_accounts 
WHERE is_active = TRUE;

-- 3. Verificar o role do usuário atual
SELECT 
    'Role do usuário atual:' as info,
    role,
    email,
    full_name
FROM profiles 
WHERE id = auth.uid();

-- 4. Verificar se o usuário é admin
SELECT 
    'Usuário é admin?' as info,
    CASE 
        WHEN role IN ('admin', 'super_admin') THEN 'SIM'
        ELSE 'NÃO'
    END as is_admin,
    role,
    email
FROM profiles 
WHERE id = auth.uid();

-- 5. Listar todas as contas (sem RLS para debug)
SELECT 
    'Todas as contas (debug):' as info,
    id,
    bank_name,
    account_holder,
    is_default,
    is_active,
    created_at
FROM admin_banking_accounts 
ORDER BY created_at DESC;

-- 6. Testar RLS manualmente
SELECT 
    'Teste RLS - contas visíveis:' as info,
    COUNT(*) as count
FROM admin_banking_accounts 
WHERE is_active = TRUE;

-- 7. Verificar políticas RLS
SELECT 
    'Políticas RLS existentes:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'admin_banking_accounts';
