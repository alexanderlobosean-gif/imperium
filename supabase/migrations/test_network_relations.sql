-- Script para testar a query de network_relations
-- CORRIGIDO: Adicionado cast para UUID

-- 1. Buscar relações de rede com CAST
SELECT 
    nr.*,
    p.full_name,
    p.email
FROM network_relations nr
LEFT JOIN profiles p ON nr.referred_id::uuid = p.user_id
WHERE nr.referrer_id = '31a89355-2c2b-4966-9610-fb5c531c23ee'::uuid
ORDER BY nr.level ASC;

-- 2. Verificar se a tabela network_relations existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'network_relations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Contar total de relações para o referrer
SELECT 
    'Total de relações:' as info,
    COUNT(*) as count
FROM network_relations 
WHERE referrer_id = '31a89355-2c2b-4966-9610-fb5c531c23ee';

-- 4. Ver todas as relações sem join (query simples)
SELECT * 
FROM network_relations 
WHERE referrer_id = '31a89355-2c2b-4966-9610-fb5c531c23ee';

-- 5. Verificar se os referred_id existem na tabela profiles (com CAST)
SELECT 
    nr.referred_id,
    p.user_id as profile_exists,
    p.full_name,
    p.email
FROM network_relations nr
LEFT JOIN profiles p ON nr.referred_id::uuid = p.user_id
WHERE nr.referrer_id = '31a89355-2c2b-4966-9610-fb5c531c23ee'::uuid;
