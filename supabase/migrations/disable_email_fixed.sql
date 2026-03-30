-- Desabilitar confirmação de email (versão corrigida)
-- Execute isso no SQL Editor do Supabase Dashboard

-- 1. Confirmar todos os usuários pendentes (mais importante)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Verificar usuários confirmados
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name IN ('referral_code', 'referred_by', 'user_id')
ORDER BY ordinal_position;
