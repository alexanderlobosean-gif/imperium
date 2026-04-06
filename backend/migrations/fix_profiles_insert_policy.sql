-- Fix: Add INSERT policy for profiles table
-- This allows the trigger to create profiles when users sign up

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Política: Permitir inserção de novos perfis (via trigger ou cadastro)
DROP POLICY IF EXISTS "Allow insert for new users" ON profiles;
CREATE POLICY "Allow insert for new users" ON profiles
    FOR INSERT WITH CHECK (true);

-- Manter políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can view all profiles" ON profiles;
CREATE POLICY "Service role can view all profiles" ON profiles
    FOR SELECT USING (auth.role() = 'service_role');

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
