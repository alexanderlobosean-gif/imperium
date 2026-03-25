-- Verificar estrutura exata da tabela investments
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND table_schema = 'public'
    AND data_type LIKE '%numeric%'
ORDER BY column_name;
