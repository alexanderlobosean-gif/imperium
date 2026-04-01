-- Função para executar transferência de forma atômica
CREATE OR REPLACE FUNCTION execute_transfer(
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
    v_sender_balance_before DECIMAL(15,2);
    v_recipient_balance_before DECIMAL(15,2);
    v_sender_balance_after DECIMAL(15,2);
    v_recipient_balance_after DECIMAL(15,2);
BEGIN
    -- Verificar saldo do remetente
    SELECT get_user_balance(p_sender_id) INTO v_sender_balance_before;

    IF v_sender_balance_before < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, Necessário: %', v_sender_balance_before, p_amount;
    END IF;

    -- Calcular novos saldos
    v_sender_balance_after := v_sender_balance_before - p_amount;
    v_recipient_balance_before := get_user_balance(p_recipient_id);
    v_recipient_balance_after := v_recipient_balance_before + p_amount;

    -- Criar registro de transferência
    INSERT INTO transfers (
        from_user_id,
        to_user_id,
        amount,
        status,
        description
    ) VALUES (
        p_sender_id,
        p_recipient_id,
        p_amount,
        'completed',
        p_description
    ) RETURNING id INTO v_transfer_id;

    -- Registrar no ledger do remetente
    PERFORM insert_ledger_entry(
        p_sender_id,
        'transfer_sent',
        -p_amount,
        v_transfer_id,
        'Transferência enviada: ' || COALESCE(p_description, '')
    );

    -- Registrar no ledger do destinatário
    PERFORM insert_ledger_entry(
        p_recipient_id,
        'transfer_received',
        p_amount,
        v_transfer_id,
        'Transferência recebida: ' || COALESCE(p_description, '')
    );

    -- Atualizar saldos na wallet_balances
    PERFORM update_wallet_balance(
        p_sender_id,
        -p_amount,  -- wallet_delta
        0,          -- yield_delta
        0,          -- bonus_delta
        0           -- locked_delta
    );

    PERFORM update_wallet_balance(
        p_recipient_id,
        p_amount,   -- wallet_delta
        0,          -- yield_delta
        0,          -- bonus_delta
        0           -- locked_delta
    );

    -- Retornar dados da transferência
    RETURN json_build_object(
        'id', v_transfer_id,
        'from_user_id', p_sender_id,
        'to_user_id', p_recipient_id,
        'amount', p_amount,
        'status', 'completed',
        'created_at', NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro na transferência: %', SQLERRM;
END;
$$;

-- Função para buscar estatísticas da rede
CREATE OR REPLACE FUNCTION get_network_stats(p_user_id UUID)
RETURNS TABLE(level INTEGER, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        un.level,
        COUNT(*) as count
    FROM user_network un
    WHERE un.ancestor_id = p_user_id
    GROUP BY un.level
    ORDER BY un.level;
END;
$$;
