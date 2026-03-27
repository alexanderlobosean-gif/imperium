-- VERIFICAR ESTRUTURA DA TABELA profiles
-- Diagnosticar por que user_id está vindo como NULL

-- 1. Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND column_name IN ('id', 'user_id')
ORDER BY column_name;

-- 2. Verificar se existe coluna id vs user_id
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 3. Verificar dados existentes na tabela profiles
SELECT 
    id,
    user_id,
    email,
    full_name,
    status
FROM profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar qual é a chave primária
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles'
    AND tc.constraint_type = 'PRIMARY KEY';
