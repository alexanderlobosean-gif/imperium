-- Script para verificar colunas da tabela network_relations no Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- Opção 1: Ver colunas via information_schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'network_relations'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- Opção 2: Ver estrutura completa da tabela (se tiver permissão)
-- \d network_relations

-- Opção 3: Criar função para retornar colunas (útil para a API)
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT
    FROM 
        information_schema.columns c
    WHERE 
        c.table_name = p_table_name
        AND c.table_schema = 'public'
    ORDER BY 
        c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Testar a função
SELECT * FROM get_table_columns('network_relations');
