-- Verificar e corrigir problemas de autenticação e permissões

-- 1. Verificar se há usuários na tabela profiles
SELECT 
    'Total de usuários em profiles:' as info,
    COUNT(*) as count
FROM profiles;

-- 2. Verificar usuários ativos
SELECT 
    'Usuários ativos:' as info,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active';

-- 3. Verificar usuários com role admin
SELECT 
    'Usuários admin:' as info,
    COUNT(*) as count
FROM profiles 
WHERE role IN ('admin', 'super_admin');

-- 4. Listar todos os usuários admin
SELECT 
    'Usuários admin detalhados:' as info,
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- 5. Verificar se o usuário atual existe em profiles
SELECT 
    'Usuário atual em profiles:' as info,
    id,
    email,
    full_name,
    role,
    status
FROM profiles 
WHERE id = auth.uid();

-- 6. Se não houver admin, criar um admin para teste
-- (Descomente se necessário)
/*
UPDATE profiles 
SET role = 'admin'
WHERE email = 'cristian.macena@imperium.test';
*/

-- 7. Verificar contas bancárias admin
SELECT 
    'Contas bancárias admin:' as info,
    COUNT(*) as count
FROM admin_banking_accounts 
WHERE is_active = TRUE;

-- 8. Listar contas bancárias (sem RLS para debug)
SELECT 
    'Contas bancárias detalhadas:' as info,
    id,
    bank_name,
    account_holder,
    is_default,
    is_active,
    created_at
FROM admin_banking_accounts 
ORDER BY created_at DESC;
