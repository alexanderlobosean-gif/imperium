-- Diagnóstico completo da tabela profiles

-- 1. Verificar estrutura completa
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se referral_code existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        AND column_name = 'referral_code'
) as has_referral_code;

-- 3. Verificar se referred_by existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        AND column_name = 'referred_by'
) as has_referred_by;

-- 4. Verificar dados recentes
SELECT 
    user_id,
    email,
    full_name,
    referral_code,
    referred_by,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- 5. Verificar se há algum dado
SELECT COUNT(*) as total_profiles FROM profiles;
