-- Sistema de Ledger Financeiro (CRÍTICO)
-- Este ledger é o ÚNICO lugar onde o saldo real é calculado

CREATE TABLE financial_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer_sent', 'transfer_received', 'investment', 'yield', 'bonus', 'commission')),
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(15,2) NOT NULL,
    reference_id UUID, -- ID da transação relacionada (deposits, withdrawals, transfers, etc.)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_financial_ledger_user_id ON financial_ledger(user_id);
CREATE INDEX idx_financial_ledger_created_at ON financial_ledger(created_at DESC);
CREATE INDEX idx_financial_ledger_reference_id ON financial_ledger(reference_id);

-- Função para calcular saldo atual
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT balance_after
         FROM financial_ledger
         WHERE user_id = p_user_id
         ORDER BY created_at DESC
         LIMIT 1),
        0
    );
END;
$$;

-- Função para inserir entrada no ledger
CREATE OR REPLACE FUNCTION insert_ledger_entry(
    p_user_id UUID,
    p_type TEXT,
    p_amount DECIMAL(15,2),
    p_reference_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance_before DECIMAL(15,2);
    v_balance_after DECIMAL(15,2);
    v_entry_id UUID;
BEGIN
    -- Buscar saldo anterior
    SELECT get_user_balance(p_user_id) INTO v_balance_before;

    -- Calcular novo saldo
    v_balance_after := v_balance_before + p_amount;

    -- Inserir entrada
    INSERT INTO financial_ledger (
        user_id, type, amount, balance_before, balance_after,
        reference_id, description
    ) VALUES (
        p_user_id, p_type, p_amount, v_balance_before, v_balance_after,
        p_reference_id, p_description
    ) RETURNING id INTO v_entry_id;

    RETURN v_entry_id;
END;
$$;

-- RLS: Usuários só veem seus próprios registros
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger entries" ON financial_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- Apenas service role pode inserir/modificar
CREATE POLICY "Only service role can modify ledger" ON financial_ledger
    FOR ALL USING (auth.role() = 'service_role');
