-- Migration: Add role column to profiles table
-- This adds the missing role column needed for SuperAdmin permissions

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index for role queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Update existing profiles to have 'user' role (safety measure)
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.role IS 'User role: user, admin, or super_admin';
