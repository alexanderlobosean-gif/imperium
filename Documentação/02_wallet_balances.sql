-- Múltiplos Saldos de Carteira (CRÍTICO)
-- Nunca armazenar apenas um saldo único - sempre separar tipos

CREATE TABLE wallet_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 0, -- Saldo principal para transferências
    yield_balance DECIMAL(15,2) NOT NULL DEFAULT 0,  -- Rendimentos/ganhos
    bonus_balance DECIMAL(15,2) NOT NULL DEFAULT 0,  -- Bônus/comissões
    locked_balance DECIMAL(15,2) NOT NULL DEFAULT 0, -- Saldo bloqueado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_wallet_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wallet_balances_updated_at
    BEFORE UPDATE ON wallet_balances
    FOR EACH ROW EXECUTE FUNCTION update_wallet_balances_updated_at();

-- Função para calcular saldo total disponível (wallet + yield + bonus)
CREATE OR REPLACE FUNCTION get_available_balance(p_user_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_wallet DECIMAL(15,2);
    v_yield DECIMAL(15,2);
    v_bonus DECIMAL(15,2);
BEGIN
    SELECT wallet_balance, yield_balance, bonus_balance
    INTO v_wallet, v_yield, v_bonus
    FROM wallet_balances
    WHERE user_id = p_user_id;

    RETURN COALESCE(v_wallet, 0) + COALESCE(v_yield, 0) + COALESCE(v_bonus, 0);
END;
$$;

-- Função para atualizar saldos específicos
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_wallet_delta DECIMAL(15,2) DEFAULT 0,
    p_yield_delta DECIMAL(15,2) DEFAULT 0,
    p_bonus_delta DECIMAL(15,2) DEFAULT 0,
    p_locked_delta DECIMAL(15,2) DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO wallet_balances (user_id, wallet_balance, yield_balance, bonus_balance, locked_balance)
    VALUES (p_user_id, GREATEST(p_wallet_delta, 0), GREATEST(p_yield_delta, 0), GREATEST(p_bonus_delta, 0), GREATEST(p_locked_delta, 0))
    ON CONFLICT (user_id) DO UPDATE SET
        wallet_balance = GREATEST(wallet_balances.wallet_balance + p_wallet_delta, 0),
        yield_balance = GREATEST(wallet_balances.yield_balance + p_yield_delta, 0),
        bonus_balance = GREATEST(wallet_balances.bonus_balance + p_bonus_delta, 0),
        locked_balance = GREATEST(wallet_balances.locked_balance + p_locked_delta, 0);

    RETURN TRUE;
END;
$$;

-- RLS: Usuários só veem seus próprios saldos
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet balances" ON wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

-- Apenas service role pode modificar saldos
CREATE POLICY "Only service role can modify wallet balances" ON wallet_balances
    FOR ALL USING (auth.role() = 'service_role');
