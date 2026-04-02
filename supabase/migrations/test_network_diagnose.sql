-- Script para testar a query de network_relations
-- CORRIGIDO: Verificar estrutura real da tabela primeiro

-- 1. Verificar estrutura da tabela network_relations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'network_relations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver todas as relações (sem filtro para ver os dados)
SELECT * FROM network_relations LIMIT 10;

-- 3. Buscar relações onde o usuário é o REFERRED (indicado)
-- Se você quer ver quem INDICOU o usuário
SELECT 
    nr.*,
    p.full_name,
    p.email
FROM network_relations nr
LEFT JOIN profiles p ON nr.referred_id::uuid = p.user_id
WHERE nr.referred_id = '31a89355-2c2b-4966-9610-fb5c531c23ee'
ORDER BY nr.level ASC;

-- 4. Buscar relações onde o usuário é quem INDICA (se houver coluna para isso)
-- Primeiro verifique na query 1 qual é o nome da coluna correta
-- Se for 'user_id' ou outro nome, ajuste abaixo:
-- SELECT * FROM network_relations WHERE user_id = '31a89355-2c2b-4966-9610-fb5c531c23ee';
