-- Migration COMPLETA - Todas as tabelas do projeto atual
-- Baseado no dump do projeto: okazavmygdoglzpsgxgv

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabelas que já existem (verificadas)
-- profiles, investments, deposits, withdrawals, network_relations

-- Tabelas que faltam:

-- 1. admin_banking_accounts
CREATE TABLE IF NOT EXISTS public.admin_banking_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    agency TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_type TEXT DEFAULT 'corrente',
    holder_name TEXT NOT NULL,
    holder_cpf TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. commission_history
CREATE TABLE IF NOT EXISTS public.commission_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    commission_type TEXT NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    percentage DECIMAL(5,4) NOT NULL,
    investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. commissions
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
    commission_amount DECIMAL(20,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. plans
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    min_amount DECIMAL(20,2) NOT NULL,
    max_amount DECIMAL(20,2) NOT NULL,
    daily_rate DECIMAL(5,4) NOT NULL,
    total_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_leadership BOOLEAN DEFAULT false,
    level INTEGER DEFAULT 1,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. transactions (tabela geral de transações)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    description TEXT,
    reference_id UUID,
    reference_table TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    theme TEXT DEFAULT 'light',
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. user_wallets
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(20,2) DEFAULT 0.00,
    available_balance DECIMAL(20,2) DEFAULT 0.00,
    frozen_balance DECIMAL(20,2) DEFAULT 0.00,
    total_deposited DECIMAL(20,2) DEFAULT 0.00,
    total_withdrawn DECIMAL(20,2) DEFAULT 0.00,
    total_earned DECIMAL(20,2) DEFAULT 0.00,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. yields
CREATE TABLE IF NOT EXISTS public.yields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    amount DECIMAL(20,2) NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- View que falta:
-- 9. plan_amount_view
CREATE OR REPLACE VIEW public.plan_amount_view AS
SELECT 
    p.id,
    p.name,
    p.min_amount,
    p.max_amount,
    p.daily_rate,
    p.total_days,
    p.is_active,
    p.is_leadership,
    p.level,
    p.icon,
    p.color
FROM public.plans p;

-- Índices para as novas tabelas
CREATE INDEX IF NOT EXISTS idx_admin_banking_accounts_active ON public.admin_banking_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_history_user_id ON public.commission_history(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_history_source_user_id ON public.commission_history(source_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referral_id ON public.commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_leadership ON public.plans(is_leadership);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_yields_investment_id ON public.yields(investment_id);
CREATE INDEX IF NOT EXISTS idx_yields_date ON public.yields(date);
CREATE INDEX IF NOT EXISTS idx_yields_status ON public.yields(status);

-- Row Level Security para novas tabelas
ALTER TABLE public.admin_banking_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yields ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para novas tabelas
CREATE POLICY "Users can view admin_banking_accounts" ON public.admin_banking_accounts FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert admin_banking_accounts" ON public.admin_banking_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update admin_banking_accounts" ON public.admin_banking_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view commission_history" ON public.commission_history FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert commission_history" ON public.commission_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update commission_history" ON public.commission_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view commissions" ON public.commissions FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert commissions" ON public.commissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update commissions" ON public.commissions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Users can insert plans" ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update plans" ON public.plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view user_settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert user_settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update user_settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view user_wallets" ON public.user_wallets FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert user_wallets" ON public.user_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update user_wallets" ON public.user_wallets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view yields" ON public.yields FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert yields" ON public.yields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update yields" ON public.yields FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Functions que faltam
CREATE OR REPLACE FUNCTION public.create_profile_with_referral(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_referral_code TEXT
)
RETURNS UUID AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name, 
        referral_code, 
        status
    ) VALUES (
        p_user_id, 
        p_email, 
        p_full_name, 
        COALESCE(p_referral_code, generate_referral_code()), 
        'active'
    )
    RETURNING id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_plan_for_amount(amount NUMERIC)
RETURNS TABLE (
    id UUID,
    name TEXT,
    min_amount DECIMAL,
    max_amount DECIMAL,
    daily_rate DECIMAL,
    total_days INTEGER,
    is_active BOOLEAN,
    is_leadership BOOLEAN,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.min_amount,
        p.max_amount,
        p.daily_rate,
        p.total_days,
        p.is_active,
        p.is_leadership,
        p.level
    FROM public.plans p
    WHERE p.is_active = true
        AND amount >= p.min_amount
        AND amount <= p.max_amount
    ORDER BY p.min_amount DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar user_settings para novo usuário
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Criar user_wallets para novo usuário
    INSERT INTO public.user_wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Criar perfil para novo usuário
    INSERT INTO public.profiles (user_id, email, full_name, status)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'active')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_admin_banking_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers que faltam
CREATE TRIGGER handle_new_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_admin_banking_accounts_updated_at_trigger
    BEFORE UPDATE ON public.admin_banking_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admin_banking_accounts_updated_at();

CREATE TRIGGER update_commission_history_updated_at_trigger
    BEFORE UPDATE ON public.commission_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at_trigger
    BEFORE UPDATE ON public.commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at_trigger
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at_trigger
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at_trigger
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at_trigger
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yields_updated_at_trigger
    BEFORE UPDATE ON public.yields
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
