-- Verificar informações do banco de dados atual
SELECT 
    current_database(),
    current_user,
    version();

-- Verificar se as tabelas existem
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('deposits', 'investments', 'profiles', 'yields')
    AND table_schema = 'public'
ORDER BY table_name;

-- Verificar estrutura ATUAL do campo amount em deposits
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'deposits' 
    AND column_name = 'amount'
    AND table_schema = 'public';

-- Forçar refresh do cache e verificar novamente
ANALYZE deposits;

-- Tentar alteração com FORCE (se suportado)
DO $$
BEGIN
    -- Tentativa de alteração forçada
    EXECUTE 'ALTER TABLE public.deposits ALTER COLUMN amount TYPE NUMERIC(15,2)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro na alteração: %', SQLERRM;
END $$;

-- Verificar se a alteração forçada funcionou
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'deposits' 
    AND column_name = 'amount'
    AND table_schema = 'public';
