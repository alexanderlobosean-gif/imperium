-- Simple test to verify the fix
-- This should work without syntax errors

DO $$
BEGIN
    RAISE NOTICE 'Test syntax fix working';
END
$$;
