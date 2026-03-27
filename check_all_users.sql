-- VERIFICAR TODOS OS USUÁRIOS E INVESTIMENTOS
-- Diagnosticar por que só aparece um usuário

-- 1. Verificar todos os usuários na tabela profiles
SELECT 
    id,
    full_name,
    email,
    created_at,
    status
FROM profiles
ORDER BY created_at;

-- 2. Verificar todos os investimentos com detalhes
SELECT 
    i.id,
    i.user_id,
    p.full_name as usuario_nome,
    p.email as usuario_email,
    i.amount,
    i.plan_slug,
    i.status,
    i.created_at
FROM investments i
LEFT JOIN profiles p ON i.user_id::text = p.id::text
ORDER BY i.created_at;

-- 3. Contar investimentos por usuário
SELECT 
    i.user_id,
    p.full_name,
    p.email,
    COUNT(*) as total_investments,
    SUM(i.amount) as total_amount
FROM investments i
LEFT JOIN profiles p ON i.user_id::text = p.id::text
GROUP BY i.user_id, p.full_name, p.email
ORDER BY total_investments DESC;

-- 4. Verificar usuários na auth (se possível)
-- NOTA: Esta query pode não funcionar dependendo das permissões
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at
LIMIT 10;
