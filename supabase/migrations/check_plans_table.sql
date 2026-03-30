-- Simple verification script to check if plans table exists and has slug column
-- Run this first to diagnose the issue

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'plans' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
