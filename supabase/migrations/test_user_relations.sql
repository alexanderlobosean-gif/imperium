-- Teste direto: Verificar se existem relações para o usuário
-- Execute este script no SQL Editor do Supabase

-- Verificar se existe alguma relação para o user_id específico
SELECT 
    'Total de relações para este user_id' as descricao,
    COUNT(*) as total
FROM network_relations 
WHERE user_id = '31a89355-2c2b-4966-9610-fb5c531c23ee';

-- Ver todas as relações deste usuário (se houver)
SELECT *
FROM network_relations 
WHERE user_id = '31a89355-2c2b-4966-9610-fb5c531c23ee';

-- Verificar se existem relações onde ele é o REFERRED (foi indicado por alguém)
SELECT 
    'Relações onde ele foi indicado (referred)' as descricao,
    COUNT(*) as total
FROM network_relations 
WHERE referred_id = '31a89355-2c2b-4966-9610-fb5c531c23ee';

-- Listar todas as relações onde ele foi indicado
SELECT *
FROM network_relations 
WHERE referred_id = '31a89355-2c2b-4966-9610-fb5c531c23ee';
