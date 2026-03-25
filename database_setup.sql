-- SQL para criar as tabelas no Supabase
-- Execute este script no painel do Supabase (SQL Editor)

-- Create investments table
CREATE TABLE investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('start', 'basic', 'silver', 'gold', 'imperium', 'leadership_100', 'leadership_2000')),
  amount DECIMAL(20,8) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  activation_date TIMESTAMPTZ,
  current_daily_rate DECIMAL(5,4) DEFAULT 0.2,
  base_rate DECIMAL(5,4),
  days_without_withdrawal INTEGER DEFAULT 0,
  total_earned DECIMAL(20,8) DEFAULT 0,
  earning_cap DECIMAL(20,8),
  cap_percentage_reached DECIMAL(5,4) DEFAULT 0,
  client_share DECIMAL(5,4),
  company_share DECIMAL(5,4),
  unlocked_levels INTEGER DEFAULT 0,
  weekly_earnings DECIMAL(20,8) DEFAULT 0,
  deposit_confirmed BOOLEAN DEFAULT FALSE,
  referral_bonus_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for investments
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_plan ON investments(plan);
CREATE INDEX idx_investments_activation_date ON investments(activation_date);

-- Create network_relations table
CREATE TABLE network_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  referred_id TEXT NOT NULL,
  referred_email TEXT,
  referred_name TEXT,
  level INTEGER NOT NULL,
  total_generated DECIMAL(20,8) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for network_relations
CREATE INDEX idx_network_relations_user_id ON network_relations(user_id);
CREATE INDEX idx_network_relations_referred_id ON network_relations(referred_id);
CREATE INDEX idx_network_relations_level ON network_relations(level);
CREATE INDEX idx_network_relations_status ON network_relations(status);

-- Create unique constraint to prevent duplicate relationships
CREATE UNIQUE INDEX idx_network_relations_unique ON network_relations(user_id, referred_id);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'yield', 'network_bonus', 'referral_bonus', 'reinvestment', 'penalty', 'career_bonus')),
  amount DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  penalty DECIMAL(20,8) DEFAULT 0,
  net_amount DECIMAL(20,8),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  description TEXT,
  txid TEXT, -- Hash de confirmação para depósitos
  crypto_wallet TEXT,
  transfer_to_user_id TEXT,
  transfer_to_email TEXT,
  investment_id TEXT,
  related_user_id TEXT,
  admin_notes TEXT,
  processed_by TEXT,
  processed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_investment_id ON transactions(investment_id);

-- Enable RLS (Row Level Security)
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for investments
CREATE POLICY "Users can view their own investments" ON investments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own investments" ON investments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own investments" ON investments
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policies for network_relations
CREATE POLICY "Users can view their network relations" ON network_relations
  FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = referred_id);

CREATE POLICY "Users can insert network relations" ON network_relations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_relations_updated_at BEFORE UPDATE ON network_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
