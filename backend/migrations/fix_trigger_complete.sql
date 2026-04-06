-- Fix trigger to handle all required columns properly
-- The trigger must insert user_id (from NEW.id), email, and full_name

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with all required fields from auth.users
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,                    -- user_id from auth.users
    NEW.email,                 -- email from auth.users
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)  -- full_name from metadata or fallback to email
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger function
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';
