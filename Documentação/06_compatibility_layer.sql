-- ============================================================
-- 06_COMPATIBILITY_LAYER.SQL
-- Adaptação da arquitetura enterprise para sistema EXISTENTE
-- Este script cria compatibilidade sem quebrar o funcionamento atual
-- ============================================================

-- ============================================================
-- 1. TABELAS ENTERPRISE NOVAS (não conflitam com existentes)
-- ============================================================

-- Criar financial_ledger (coexiste com transactions)
-- A tabela transactions continua sendo usada pelo frontend
-- O ledger é usado internamente pelo backend para cálculos precisos
CREATE TABLE IF NOT EXISTS financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'deposit', 'withdrawal', 'transfer_sent', 'transfer_received',
        'investment', 'yield', 'commission', 'bonus', 'penalty', 'fee'
    )),
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Criar wallet_balances (coexiste com profiles.available_balance)
-- profiles mantém os campos atuais para compatibilidade
-- wallet_balances é a fonte da verdade para o backend
CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
    wallet_balance DECIMAL(15,2) DEFAULT 0,
    yield_balance DECIMAL(15,2) DEFAULT 0,
    bonus_balance DECIMAL(15,2) DEFAULT 0,
    locked_balance DECIMAL(15,2) DEFAULT 0,
    total_balance DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Criar user_network (coexiste com network_relations)
-- network_relations continua sendo usada pelo frontend
-- user_network é usada pelo backend para cálculos MLM
CREATE TABLE IF NOT EXISTS user_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    ancestor_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level > 0),
    path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ancestor_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON financial_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON financial_ledger(type);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON financial_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_network_user_id ON user_network(user_id);
CREATE INDEX IF NOT EXISTS idx_user_network_ancestor_id ON user_network(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_user_network_level ON user_network(level);

-- ============================================================
-- 2. FUNÇÕES DE SINCRONIZAÇÃO (Bridge entre old e new)
-- ============================================================

-- Função para sincronizar saldos de profiles -> wallet_balances
CREATE OR REPLACE FUNCTION sync_profile_to_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallet_balances (user_id, wallet_balance, yield_balance, bonus_balance, total_balance, last_updated)
    VALUES (
        NEW.user_id,
        COALESCE(NEW.available_balance, 0),
        COALESCE(NEW.total_earned, 0),
        0,
        COALESCE(NEW.available_balance, 0) + COALESCE(NEW.total_earned, 0),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        wallet_balance = EXCLUDED.wallet_balance,
        yield_balance = EXCLUDED.yield_balance,
        bonus_balance = EXCLUDED.bonus_balance,
        total_balance = EXCLUDED.total_balance,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar profiles -> wallet_balances
DROP TRIGGER IF EXISTS sync_profile_balances ON profiles;
CREATE TRIGGER sync_profile_balances
    AFTER INSERT OR UPDATE OF available_balance, total_earned ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_to_wallet_balances();

-- Função para sincronizar network_relations -> user_network
CREATE OR REPLACE FUNCTION sync_network_relations_to_user_network()
RETURNS TRIGGER AS $$
DECLARE
    v_sponsor_id UUID;
BEGIN
    -- Tentar converter referred_id para UUID
    BEGIN
        v_sponsor_id := NEW.referred_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        -- Se não conseguir converter, tentar buscar pelo email
        SELECT user_id INTO v_sponsor_id
        FROM profiles
        WHERE email = NEW.referred_email
        LIMIT 1;
    END;
    
    IF v_sponsor_id IS NOT NULL THEN
        -- Inserir na nova estrutura
        INSERT INTO user_network (user_id, ancestor_id, level)
        VALUES (NEW.user_id::UUID, v_sponsor_id, COALESCE(NEW.level, 1))
        ON CONFLICT (user_id, ancestor_id) DO UPDATE SET
            level = EXCLUDED.level;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar network_relations -> user_network
DROP TRIGGER IF EXISTS sync_network_to_user_network ON network_relations;
CREATE TRIGGER sync_network_to_user_network
    AFTER INSERT OR UPDATE ON network_relations
    FOR EACH ROW
    EXECUTE FUNCTION sync_network_relations_to_user_network();

-- ============================================================
-- 3. FUNÇÕES ENTERPRISE (adaptadas para tabelas existentes)
-- ============================================================

-- Função para calcular saldo disponível (usando tabelas existentes)
CREATE OR REPLACE FUNCTION get_user_available_balance(p_user_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_deposits DECIMAL(15,2);
    v_total_invested DECIMAL(15,2);
    v_total_earned DECIMAL(15,2);
    v_total_withdrawn DECIMAL(15,2);
BEGIN
    -- Usar tabelas existentes para calcular saldo
    SELECT COALESCE(SUM(amount), 0) INTO v_total_deposits
    FROM deposits
    WHERE user_id = p_user_id AND status = 'confirmed';
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_invested
    FROM investments
    WHERE user_id = p_user_id;
    
    SELECT COALESCE(SUM(total_yield), 0) INTO v_total_earned
    FROM investments
    WHERE user_id = p_user_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_withdrawn
    FROM withdrawals
    WHERE user_id = p_user_id AND status = 'confirmed';
    
    RETURN v_total_deposits - v_total_invested + v_total_earned - v_total_withdrawn;
END;
$$;

-- Função para executar transferência (compatível com tabelas existentes)
CREATE OR REPLACE FUNCTION execute_transfer_atomic(
    p_sender_id UUID,
    p_recipient_id UUID,
    p_amount DECIMAL(15,2),
    p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer_id UUID;
    v_sender_balance DECIMAL(15,2);
BEGIN
    -- Verificar saldo usando função de cálculo
    v_sender_balance := get_user_available_balance(p_sender_id);
    
    IF v_sender_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, Necessário: %', v_sender_balance, p_amount;
    END IF;
    
    -- Criar transferência na tabela existente
    INSERT INTO transfers (from_user_id, to_user_id, amount, status, description)
    VALUES (p_sender_id, p_recipient_id, p_amount, 'completed', p_description)
    RETURNING id INTO v_transfer_id;
    
    -- Registrar no ledger para auditoria
    INSERT INTO financial_ledger (user_id, type, amount, balance_after, reference_id, reference_type, description)
    VALUES (p_sender_id, 'transfer_sent', -p_amount, v_sender_balance - p_amount, v_transfer_id, 'transfer', 'Transferência enviada para ' || p_recipient_id::TEXT);
    
    INSERT INTO financial_ledger (user_id, type, amount, balance_after, reference_id, reference_type, description)
    VALUES (p_recipient_id, 'transfer_received', p_amount, get_user_available_balance(p_recipient_id) + p_amount, v_transfer_id, 'transfer', 'Transferência recebida de ' || p_sender_id::TEXT);
    
    RETURN json_build_object(
        'id', v_transfer_id,
        'from_user_id', p_sender_id,
        'to_user_id', p_recipient_id,
        'amount', p_amount,
        'status', 'completed',
        'created_at', NOW()
    );
END;
$$;

-- Função para adicionar usuário à rede (compatível com network_relations)
CREATE OR REPLACE FUNCTION add_to_network_bridge(
    p_user_id UUID,
    p_sponsor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Adicionar na nova estrutura
    INSERT INTO user_network (user_id, ancestor_id, level)
    VALUES (p_user_id, p_sponsor_id, 1)
    ON CONFLICT DO NOTHING;
    
    -- Adicionar todos os ancestrais do sponsor
    INSERT INTO user_network (user_id, ancestor_id, level)
    SELECT p_user_id, ancestor_id, level + 1
    FROM user_network
    WHERE user_id = p_sponsor_id
    ON CONFLICT DO NOTHING;
    
    -- Sincronizar com network_relations legacy
    INSERT INTO network_relations (user_id, referred_id, level, referred_email, referred_name)
    SELECT 
        p_sponsor_id::TEXT,
        p_user_id::TEXT,
        1,
        p.email,
        p.full_name
    FROM profiles p
    WHERE p.user_id = p_user_id
    ON CONFLICT DO NOTHING;
END;
$$;

-- ============================================================
-- 4. RLS POLICIES PARA NOVAS TABELAS
-- ============================================================

-- RLS para financial_ledger
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ledger entries" ON financial_ledger;
CREATE POLICY "Users can view own ledger entries" ON financial_ledger
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages ledger" ON financial_ledger;
CREATE POLICY "Service role manages ledger" ON financial_ledger
    FOR ALL USING (auth.role() = 'service_role');

-- RLS para wallet_balances
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet balances" ON wallet_balances;
CREATE POLICY "Users can view own wallet balances" ON wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only service role modifies wallet balances" ON wallet_balances;
CREATE POLICY "Only service role modifies wallet balances" ON wallet_balances
    FOR ALL USING (auth.role() = 'service_role');

-- RLS para user_network
ALTER TABLE user_network ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view network" ON user_network;
CREATE POLICY "Users can view network" ON user_network
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() = ancestor_id OR
        EXISTS (
            SELECT 1 FROM user_network un
            WHERE un.user_id = user_network.user_id
            AND un.ancestor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Only service role manages network" ON user_network;
CREATE POLICY "Only service role manages network" ON user_network
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 5. MIGRAÇÃO DE DADOS EXISTENTES
-- ============================================================

-- Migrar dados de profiles para wallet_balances
INSERT INTO wallet_balances (user_id, wallet_balance, yield_balance, bonus_balance, updated_at)
SELECT 
    user_id,
    COALESCE(available_balance, 0),
    COALESCE(total_earned, 0),
    0,
    NOW()
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- Migrar dados de network_relations para user_network
INSERT INTO user_network (user_id, ancestor_id, level)
SELECT 
    nr.user_id::UUID,
    nr.referred_id::UUID,
    COALESCE(nr.level, 1)
FROM network_relations nr
WHERE nr.user_id IS NOT NULL 
AND nr.referred_id IS NOT NULL
ON CONFLICT (user_id, ancestor_id) DO NOTHING;

-- ============================================================
-- 6. VERIFICAÇÃO
-- ============================================================

-- Verificar se tudo foi criado corretamente
SELECT 
    'financial_ledger' as table_name,
    COUNT(*) as row_count
FROM financial_ledger
UNION ALL
SELECT 
    'wallet_balances',
    COUNT(*)
FROM wallet_balances
UNION ALL
SELECT 
    'user_network',
    COUNT(*)
FROM user_network;

-- Mensagem de sucesso
SELECT 'Compatibility layer installed successfully!' as status;
