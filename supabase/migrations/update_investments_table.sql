-- Migration: Update existing investments table to match admin requirements
-- This will add missing columns and update references

-- First, add the missing plan_slug column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'investments' 
        AND column_name = 'plan_slug'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE investments ADD COLUMN plan_slug TEXT;
        
        -- Copy data from plan to plan_slug if plan exists
        UPDATE investments SET plan_slug = plan WHERE plan IS NOT NULL;
        
        -- Add foreign key constraint to plans.slug
        ALTER TABLE investments 
        ADD CONSTRAINT investments_plan_slug_fkey 
        FOREIGN KEY (plan_slug) REFERENCES plans(slug);
        
        RAISE NOTICE 'plan_slug column added and constraint created';
    ELSE
        RAISE NOTICE 'plan_slug column already exists';
    END IF;
END
$$;

-- Add other missing columns for admin functionality
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS residual_levels INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_yield DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_yield DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_yield_calculated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_investments_plan_slug ON investments(plan_slug);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);

-- Enable RLS if not already enabled
DO $$
BEGIN
    -- Check if RLS is enabled by trying to disable it (will error if not enabled)
    BEGIN
        ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
        ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS re-enabled for investments';
    EXCEPTION WHEN OTHERS THEN
        -- If disabling fails, RLS wasn't enabled, so just enable it
        ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled for investments';
    END;
END
$$;

-- Add RLS policies for investments
DROP POLICY IF EXISTS "Admins can view all investments" ON investments;
CREATE POLICY "Admins can view all investments" ON investments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update investments" ON investments;
CREATE POLICY "Admins can update investments" ON investments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Investments table updated successfully';
END
$$;
