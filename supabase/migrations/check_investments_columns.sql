-- Verificar estrutura real da tabela investments
-- Execute no SQL Editor do Supabase

-- Listar todas as colunas da tabela investments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'investments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ou usar pg_catalog
SELECT 
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END as is_nullable,
    pg_get_expr(d.adbin, d.adrelid) as default_value
FROM pg_catalog.pg_attribute a
LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid = d.adrelid AND a.attnum = d.adnum)
WHERE a.attrelid = 'investments'::regclass
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY a.attnum;
