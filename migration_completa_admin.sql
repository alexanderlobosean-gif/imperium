-- MIGRAÇÃO COMPLETA: Sistema Admin Imperium
-- Este script consolida todas as migrações anteriores e adiciona as tabelas admin
-- Execute este script uma vez no Supabase SQL Editor

-- ========================================
-- 1. ATUALIZAR TABELA PROFILES EXISTENTE
-- ========================================

-- Adicionar campos bancários (se não existirem)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_agency TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS crypto_wallet TEXT;

-- Adicionar campo role (se não existir)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Adicionar campos admin (se não existirem)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_invested DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earned DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS direct_referrals INTEGER DEFAULT 0;

-- Garantir que todos os perfis existentes tenham role = 'user'
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- ========================================
-- 2. ATUALIZAR TABELA INVESTMENTS EXISTENTE
-- ========================================

-- Adicionar plan_slug se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'investments' 
        AND column_name = 'plan_slug'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE investments ADD COLUMN plan_slug TEXT;
        
        -- Copiar dados de plan para plan_slug se existirem
        UPDATE investments SET plan_slug = plan WHERE plan IS NOT NULL AND plan_slug IS NULL;
        
        RAISE NOTICE 'plan_slug column added to investments';
    END IF;
END
$$;

-- Adicionar campos admin se não existirem
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS residual_levels INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_yield DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_yield DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_yield_calculated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Criar índices para investments
CREATE INDEX IF NOT EXISTS idx_investments_plan_slug ON investments(plan_slug);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);

-- ========================================
-- 3. CRIAR TABELAS ADMIN
-- ========================================

-- Tabela de depósitos
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

-- Tabela de saques
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

-- Tabela de rendimentos diários
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

-- ========================================
-- 4. ÍNDICES PARA TABELAS ADMIN
-- ========================================

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

CREATE INDEX IF NOT EXISTS idx_yields_investment_id ON yields(investment_id);
CREATE INDEX IF NOT EXISTS idx_yields_user_id ON yields(user_id);
CREATE INDEX IF NOT EXISTS idx_yields_date ON yields(date);

-- ========================================
-- 5. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS para tabelas admin
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE yields ENABLE ROW LEVEL SECURITY;

-- Para investments, verificar se já tem RLS
DO $$
BEGIN
    BEGIN
        ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
        ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN
        ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
    END;
END
$$;

-- ========================================
-- 6. POLÍTICAS RLS PARA ADMIN
-- ========================================

-- Deposits
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;
CREATE POLICY "Admins can view all deposits" ON deposits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update deposits" ON deposits;
CREATE POLICY "Admins can update deposits" ON deposits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Withdrawals
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
CREATE POLICY "Admins can update withdrawals" ON withdrawals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Investments
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

-- Yields
DROP POLICY IF EXISTS "Admins can view all yields" ON yields;
CREATE POLICY "Admins can view all yields" ON yields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ========================================
-- 7. TRIGGERS PARA updated_at
-- ========================================

-- Função trigger
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS set_deposits_timestamp ON deposits;
CREATE TRIGGER set_deposits_timestamp
BEFORE UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_withdrawals_timestamp ON withdrawals;
CREATE TRIGGER set_withdrawals_timestamp
BEFORE UPDATE ON withdrawals
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_investments_timestamp ON investments;
CREATE TRIGGER set_investments_timestamp
BEFORE UPDATE ON investments
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ========================================
-- 8. ATUALIZAR REFERÊNCIAS
-- ========================================

-- Adicionar constraint para plan_slug se ainda não existir
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'investments' 
        AND constraint_name = 'investments_plan_slug_fkey'
        AND table_schema = 'public'
    ) THEN
        -- Tentar adicionar a constraint
        BEGIN
            ALTER TABLE investments 
            ADD CONSTRAINT investments_plan_slug_fkey 
            FOREIGN KEY (plan_slug) REFERENCES plans(slug);
            
            RAISE NOTICE 'Foreign key constraint created for plan_slug';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create foreign key constraint (plans.slug may not exist): %', SQLERRM;
        END;
    END IF;
END
$$;

-- ========================================
-- 9. COMENTÁRIOS
-- ========================================

COMMENT ON TABLE deposits IS 'User deposit records';
COMMENT ON TABLE withdrawals IS 'User withdrawal records';
COMMENT ON TABLE investments IS 'User investment records';
COMMENT ON TABLE yields IS 'Daily yield calculations';

-- ========================================
-- 10. FINALIZAÇÃO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO COMPLETA CONCLUÍDA!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabelas atualizadas: profiles, investments';
    RAISE NOTICE 'Tabelas criadas: deposits, withdrawals, yields';
    RAISE NOTICE 'RLS configurado para todas as tabelas';
    RAISE NOTICE 'Políticas admin criadas';
    RAISE NOTICE 'Índices criados para performance';
    RAISE NOTICE 'Triggers updated_at configurados';
    RAISE NOTICE '========================================';
END
$$;
