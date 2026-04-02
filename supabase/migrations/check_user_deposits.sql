-- Verificar depósitos do usuário cristian@reacaonet.com.br (31a89355-2c2b-4966-9610-fb5c531c23ee)
-- Execute no SQL Editor do Supabase

-- Verificar todos os depósitos deste usuário
SELECT 
    id,
    user_id,
    amount,
    status,
    method,
    created_at,
    confirmed_at
FROM deposits 
WHERE user_id = '31a89355-2c2b-4966-9610-fb5c531c23ee'
ORDER BY created_at DESC;

-- Verificar depósitos com status 'confirmed'
SELECT 
    'Depósitos confirmados' as descricao,
    COUNT(*) as quantidade,
    SUM(amount) as total
FROM deposits 
WHERE user_id = '31a89355-2c2b-4966-9610-fb5c531c23ee'
AND status = 'confirmed';

-- Verificar todos os status distintos para este usuário
SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(amount) as total
FROM deposits 
WHERE user_id = '31a89355-2c2b-4966-9610-fb5c531c23ee'
GROUP BY status;
