-- Script para alterar o tamanho do campo amount na tabela deposits
-- Permitir valores maiores (precisão aumentada)

-- Alterar o campo amount para NUMERIC(15,2) - suporta até 999.999.999.999,99
ALTER TABLE deposits 
ALTER COLUMN amount TYPE NUMERIC(15,2);

-- Alterar o campo amount na tabela investments também para consistência
ALTER TABLE investments 
ALTER COLUMN amount TYPE NUMERIC(15,2);

-- Alterar campos relacionados em profiles para suportar valores maiores
ALTER TABLE profiles 
ALTER COLUMN total_invested TYPE NUMERIC(15,2),
ALTER COLUMN available_balance TYPE NUMERIC(15,2),
ALTER COLUMN total_withdrawn TYPE NUMERIC(15,2),
ALTER COLUMN total_earned TYPE NUMERIC(15,2);

-- Alterar campos em yields para suportar valores maiores
ALTER TABLE yields 
ALTER COLUMN amount TYPE NUMERIC(15,2),
ALTER COLUMN client_yield TYPE NUMERIC(15,2),
ALTER COLUMN company_yield TYPE NUMERIC(15,2);

-- Verificar as alterações
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name IN ('deposits', 'investments', 'profiles', 'yields')
    AND column_name IN ('amount', 'total_invested', 'available_balance', 'total_withdrawn', 'total_earned', 'client_yield', 'company_yield')
ORDER BY table_name, column_name;
