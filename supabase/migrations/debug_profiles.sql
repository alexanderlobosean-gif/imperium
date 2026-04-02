-- Verificar e corrigir problemas na tabela profiles
-- Script para diagnosticar e corrigir dados bancários

-- 1. Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name IN ('bank_name', 'bank_agency', 'bank_account', 'pix_key', 'crypto_wallet')
ORDER BY column_name;

-- 2. Contar usuários com dados bancários
SELECT 
    'Total de usuários ativos:' as info,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active';

-- 3. Contar usuários com dados bancários preenchidos
SELECT 
    'Usuários com nome do banco:' as info,
    COUNT(*) as count
FROM profiles 
WHERE status = 'active' 
    AND bank_name IS NOT NULL 
    AND bank_name != '';

-- 4. Verificar se há dados nulos causando problemas
SELECT 
    id,
    full_name,
    email,
    bank_name,
    pix_key,
    status,
    created_at
FROM profiles 
WHERE status = 'active'
    AND (bank_name IS NULL OR pix_key IS NULL OR bank_name = '' OR pix_key = '')
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar se há ciclos de referência
SELECT 
    p1.id,
    p1.full_name,
    p1.email,
    p1.referred_by,
    p2.full_name as referred_by_name,
    p2.referred_by as referred_by_level2
FROM profiles p1
LEFT JOIN profiles p2 ON p1.referred_by = p2.id
WHERE p1.status = 'active'
LIMIT 10;
