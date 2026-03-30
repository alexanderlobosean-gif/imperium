-- Migration: Create admin tables for deposits, withdrawals, investments, and yields
-- This script creates the additional tables needed for admin functionality
-- Assumes profiles table already exists with admin fields

-- First, ensure plans table exists and has the correct structure
-- If plans table doesn't exist, create it with basic structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans' AND table_schema = 'public') THEN
        CREATE TABLE plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            is_leadership BOOLEAN DEFAULT false,
            sort_order INTEGER DEFAULT 0,
            min_amount DECIMAL(10,2) NOT NULL,
            max_amount DECIMAL(10,2) NOT NULL,
            base_rate DECIMAL(5,4) DEFAULT 0.0000,
            min_rate DECIMAL(5,4) DEFAULT 0.0000,
            max_rate DECIMAL(5,4) DEFAULT 0.0000,
            rate_increment DECIMAL(5,4) DEFAULT 0.0000,
            client_share INTEGER DEFAULT 50,
            company_share INTEGER DEFAULT 50,
            direct_commission INTEGER DEFAULT 10,
            reinvestment_commission INTEGER DEFAULT 10,
            residual_levels INTEGER DEFAULT 0,
            color VARCHAR(20) DEFAULT 'blue',
            icon VARCHAR(50) DEFAULT 'trending-up',
            is_most_popular BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('pix', 'bank_transfer', 'crypto', 'credit_card')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  transaction_hash TEXT UNIQUE,
  proof_url TEXT,
  description TEXT,
  admin_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('pix', 'bank_transfer', 'crypto')),
  destination_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  transaction_hash TEXT UNIQUE,
  admin_notes TEXT,
  processing_fee DECIMAL(20,8) DEFAULT 0,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create investments table (for yields)
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  plan_slug TEXT NOT NULL REFERENCES plans(slug),
  amount DECIMAL(20,8) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  base_rate DECIMAL(8,6) NOT NULL,
  current_daily_rate DECIMAL(8,6) NOT NULL,
  client_share INTEGER NOT NULL,
  company_share INTEGER NOT NULL,
  residual_levels INTEGER DEFAULT 0,
  daily_yield DECIMAL(20,8) DEFAULT 0,
  total_yield DECIMAL(20,8) DEFAULT 0,
  last_yield_calculated TIMESTAMPTZ,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create yields table (daily yield records)
CREATE TABLE IF NOT EXISTS yields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  rate DECIMAL(8,6) NOT NULL,
  client_yield DECIMAL(20,8) NOT NULL,
  company_yield DECIMAL(20,8) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_plan_slug ON investments(plan_slug);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);

CREATE INDEX IF NOT EXISTS idx_yields_investment_id ON yields(investment_id);
CREATE INDEX IF NOT EXISTS idx_yields_user_id ON yields(user_id);
CREATE INDEX IF NOT EXISTS idx_yields_date ON yields(date);

-- Enable RLS
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE yields ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Deposits table
CREATE POLICY "Admins can view all deposits" ON deposits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update deposits" ON deposits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Withdrawals table
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update withdrawals" ON withdrawals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Investments table
CREATE POLICY "Admins can view all investments" ON investments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update investments" ON investments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Yields table
CREATE POLICY "Admins can view all yields" ON yields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_deposits_timestamp
BEFORE UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_withdrawals_timestamp
BEFORE UPDATE ON withdrawals
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_investments_timestamp
BEFORE UPDATE ON investments
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Comments
COMMENT ON TABLE deposits IS 'User deposit records';
COMMENT ON TABLE withdrawals IS 'User withdrawal records';
COMMENT ON TABLE investments IS 'User investment records';
COMMENT ON TABLE yields IS 'Daily yield calculations';
