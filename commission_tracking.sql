-- Migration: Add commission tracking tables
-- This will ensure all commissions are properly tracked when yields are applied

-- Create commission tracking table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  source_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE, -- Who referred this user
  investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
  yield_id UUID REFERENCES yields(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('direct', 'residual', 'reinvestment')),
  amount DECIMAL(20,8) NOT NULL,
  percentage DECIMAL(5,4) NOT NULL,
  level INTEGER DEFAULT 1, -- For residual commissions
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create commission history table for tracking
CREATE TABLE IF NOT EXISTS commission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  previous_balance DECIMAL(20,8) NOT NULL,
  new_balance DECIMAL(20,8) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_source_user_id ON commissions(source_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_investment_id ON commissions(investment_id);
CREATE INDEX IF NOT EXISTS idx_commissions_yield_id ON commissions(yield_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_commission_history_commission_id ON commission_history(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_history_user_id ON commission_history(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_history_created_at ON commission_history(created_at);

-- Enable RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commissions
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
CREATE POLICY "Admins can view all commissions" ON commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Users can view their own commissions" ON commissions;
CREATE POLICY "Users can view their own commissions" ON commissions
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for commission history
DROP POLICY IF EXISTS "Admins can view all commission history" ON commission_history;
CREATE POLICY "Admins can view all commission history" ON commission_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Users can view their own commission history" ON commission_history;
CREATE POLICY "Users can view their own commission history" ON commission_history
  FOR SELECT USING (user_id = auth.uid());

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_commissions_timestamp ON commissions;
CREATE TRIGGER set_commissions_timestamp
BEFORE UPDATE ON commissions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add trigger for commission_history
DROP TRIGGER IF EXISTS set_commission_history_timestamp ON commission_history;
CREATE TRIGGER set_commission_history_timestamp
BEFORE UPDATE ON commission_history
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Comments
COMMENT ON TABLE commissions IS 'Commission tracking for direct, residual and reinvestment commissions';
COMMENT ON TABLE commission_history IS 'Historical tracking of all commission payments and balance changes';
