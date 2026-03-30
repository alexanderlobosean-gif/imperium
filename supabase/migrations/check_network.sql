-- Verificar estrutura da tabela network_relations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'network_relations' 
ORDER BY ordinal_position;

-- Verificar se há registros em network_relations
SELECT COUNT(*) as total_relations FROM network_relations;

-- Verificar últimos registros (se houver)
SELECT * FROM network_relations ORDER BY created_at DESC LIMIT 10;

-- Verificar perfis com indicação
SELECT 
    user_id,
    full_name,
    email,
    referral_code,
    referred_by,
    created_at
FROM profiles 
WHERE referred_by IS NOT NULL 
ORDER BY created_at DESC LIMIT 10;
