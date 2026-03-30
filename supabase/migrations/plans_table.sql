-- Migration: Create plans table for SuperAdmin management
-- This table will store all investment plans that can be managed by SuperAdmin

-- Drop table if exists (for development)
DROP TABLE IF EXISTS plans CASCADE;

-- Create plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL, -- start, basic, silver, gold, imperium, leadership_100, leadership_2000
  
  -- Basic Information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_leadership BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Investment Limits
  min_amount DECIMAL(10,2) NOT NULL,
  max_amount DECIMAL(10,2) NOT NULL,
  
  -- Rates Configuration
  base_rate DECIMAL(5,4) DEFAULT 0.0000, -- Daily rate (e.g., 1.0% = 0.0100)
  min_rate DECIMAL(5,4) DEFAULT 0.0000, -- Minimum daily rate
  max_rate DECIMAL(5,4) DEFAULT 0.0000, -- Maximum daily rate
  rate_increment DECIMAL(5,4) DEFAULT 0.0000, -- Rate increment per day
  
  -- Profit Sharing
  client_share INTEGER DEFAULT 50, -- Percentage for client (0-100)
  company_share INTEGER DEFAULT 50, -- Percentage for company (0-100)
  
  -- Commissions
  direct_commission INTEGER DEFAULT 10, -- Direct referral commission (%)
  reinvestment_commission INTEGER DEFAULT 10, -- Reinvestment commission (%)
  
  -- Network Configuration
  residual_levels INTEGER DEFAULT 0, -- Number of residual levels (0-20)
  
  -- Visual Configuration
  color VARCHAR(20) DEFAULT 'gold', -- blue, green, purple, amber, gold
  icon VARCHAR(50) DEFAULT 'Zap', -- Lucide icon name
  
  -- Special Settings
  is_most_popular BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_min_max_amount CHECK (max_amount >= min_amount),
  CONSTRAINT check_shares_total CHECK (
    (client_share + company_share = 100) OR 
    (client_share = 0 AND company_share = 0 AND is_leadership = true)
  ),
  CONSTRAINT check_shares_range CHECK (
    (client_share BETWEEN 0 AND 100 AND company_share BETWEEN 0 AND 100) OR
    (client_share = 0 AND company_share = 0 AND is_leadership = true)
  ),
  CONSTRAINT check_rates_order CHECK (max_rate >= base_rate AND base_rate >= min_rate),
  CONSTRAINT check_commissions_range CHECK (direct_commission BETWEEN 0 AND 100 AND reinvestment_commission BETWEEN 0 AND 100),
  CONSTRAINT check_residual_levels CHECK (residual_levels BETWEEN 0 AND 20),
  CONSTRAINT check_sort_order CHECK (sort_order >= 0)
);

-- Create indexes
CREATE INDEX idx_plans_slug ON plans(slug);
CREATE INDEX idx_plans_active ON plans(is_active);
CREATE INDEX idx_plans_sort_order ON plans(sort_order);
CREATE INDEX idx_plans_min_amount ON plans(min_amount);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS (Row Level Security)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only users with admin or super_admin role can manage plans
CREATE POLICY "Admin full access to plans" ON plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Everyone can read active plans
CREATE POLICY "Everyone can read active plans" ON plans
  FOR SELECT USING (is_active = true);

-- Insert initial plans data (matching planConfig.js)
INSERT INTO plans (
  slug, name, min_amount, max_amount, base_rate, min_rate, max_rate, rate_increment,
  client_share, company_share, direct_commission, reinvestment_commission, residual_levels,
  color, icon, is_most_popular, is_leadership, sort_order
) VALUES
(
  'start', 'Start', 10.00, 99.00, 0.0100, 0.0020, 0.0300, 0.0002,
  50, 50, 10, 10, 0, 'blue', 'Zap', false, false, 1
),
(
  'basic', 'Basic', 100.00, 299.00, 0.0120, 0.0020, 0.0300, 0.0002,
  60, 40, 10, 10, 2, 'green', 'TrendingUp', false, false, 2
),
(
  'silver', 'Silver', 300.00, 999.00, 0.0140, 0.0020, 0.0300, 0.0002,
  65, 35, 10, 10, 3, 'purple', 'Award', false, false, 3
),
(
  'gold', 'Gold', 1000.00, 4999.00, 0.0170, 0.0020, 0.0300, 0.0002,
  70, 30, 10, 10, 20, 'amber', 'Crown', false, false, 4
),
(
  'imperium', 'Imperium', 5000.00, 10000.00, 0.0200, 0.0020, 0.0300, 0.0002,
  75, 25, 10, 10, 20, 'gold', 'Gem', true, false, 5
),
(
  'leadership_100', 'Liderança $100', 100.00, 100.00, 0.0000, 0.0000, 0.0000, 0.0000,
  0, 0, 10, 10, 0, 'purple', 'Users', false, true, 6
),
(
  'leadership_2000', 'Liderança $2.000', 2000.00, 2000.00, 0.0000, 0.0000, 0.0000, 0.0000,
  0, 0, 10, 10, 20, 'gold', 'Shield', false, true, 7
);

-- Create a view for easy plan selection based on amount
CREATE OR REPLACE VIEW plan_amount_view AS
SELECT 
  slug,
  name,
  min_amount,
  max_amount,
  color,
  icon,
  is_most_popular,
  sort_order
FROM plans 
WHERE is_active = true 
ORDER BY sort_order, min_amount;

-- Create a function to get plan by amount (matching getPlanForAmount logic)
CREATE OR REPLACE FUNCTION get_plan_for_amount(amount DECIMAL(10,2))
RETURNS TABLE(slug VARCHAR(50), name VARCHAR(100)) AS $$
BEGIN
  RETURN QUERY
  SELECT p.slug, p.name
  FROM plans p
  WHERE p.is_active = true
    AND amount >= p.min_amount
    AND amount <= p.max_amount
  ORDER BY p.sort_order DESC, p.min_amount DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE plans IS 'Investment plans configuration managed by SuperAdmin';
COMMENT ON COLUMN plans.slug IS 'Unique identifier for the plan (used in code)';
COMMENT ON COLUMN plans.name IS 'Display name of the plan';
COMMENT ON COLUMN plans.min_amount IS 'Minimum investment amount';
COMMENT ON COLUMN plans.max_amount IS 'Maximum investment amount';
COMMENT ON COLUMN plans.base_rate IS 'Daily base rate (decimal, e.g., 1% = 0.0100)';
COMMENT ON COLUMN plans.client_share IS 'Percentage of profit for client';
COMMENT ON COLUMN plans.company_share IS 'Percentage of profit for company';
COMMENT ON COLUMN plans.residual_levels IS 'Number of residual commission levels';
COMMENT ON COLUMN plans.color IS 'UI theme color (blue, green, purple, amber, gold)';
COMMENT ON COLUMN plans.icon IS 'Lucide React icon name';
