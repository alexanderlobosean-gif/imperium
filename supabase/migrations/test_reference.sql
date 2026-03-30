-- Test script to check the reference constraint
-- This will help identify the exact issue

-- Test if we can create a simple investment record
-- This will fail if there's a reference issue

-- First, let's see if there are any plans in the table
SELECT COUNT(*) as plan_count FROM plans;

-- Try to create a test investment (this might fail)
DO $$
BEGIN
    -- Try to create a test investment to see if the reference works
    INSERT INTO investments (user_id, plan_slug, amount, status, base_rate, current_daily_rate, client_share, company_share)
    VALUES (
        '00000000-0000-0000-0000-000000000000', -- dummy UUID
        'start', -- assuming there's a plan with slug 'start'
        100.00,
        'active',
        0.01,
        0.01,
        50,
        50
    );
    RAISE NOTICE 'Test investment created successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test investment: %', SQLERRM;
END
$$;

-- Check if the investments table exists
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'investments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
