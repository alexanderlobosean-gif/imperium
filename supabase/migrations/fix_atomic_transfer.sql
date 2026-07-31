-- Migração: tornar transferências atômicas no banco
-- Cria a função execute_transfer que debita/credita em uma única transação,
-- com row locks (FOR UPDATE) para evitar corrida e saldo inconsistente.
-- Aplicar via: supabase db push OU no SQL Editor do dashboard.

CREATE OR REPLACE FUNCTION public.execute_transfer(
  p_transfer_id UUID,
  p_sender_id UUID
)
RETURNS TABLE (
  status TEXT,
  message TEXT,
  amount NUMERIC,
  sender_id UUID,
  recipient_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_sender_balance RECORD;
  v_available NUMERIC;
BEGIN
  -- Bloqueia a transferência para processamento
  SELECT * INTO v_transfer
  FROM public.transfers
  WHERE id = p_transfer_id
    AND from_user_id = p_sender_id
    AND status = 'pending_verification'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'not_found'::TEXT,
      'Transferência não encontrada ou já processada'::TEXT,
      0::NUMERIC,
      p_sender_id,
      p_sender_id;
    RETURN;
  END IF;

  -- Expiração do código de verificação
  IF v_transfer.verification_expires_at IS NOT NULL
     AND v_transfer.verification_expires_at < NOW() THEN
    UPDATE public.transfers
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_transfer_id;

    RETURN QUERY SELECT
      'expired'::TEXT,
      'Código de verificação expirado. Inicie a transferência novamente.'::TEXT,
      v_transfer.amount,
      p_sender_id,
      v_transfer.to_user_id;
    RETURN;
  END IF;

  -- Bloqueia a linha de saldo do remetente
  SELECT * INTO v_sender_balance
  FROM public.wallet_balances
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'insufficient'::TEXT,
      'Saldo insuficiente'::TEXT,
      v_transfer.amount,
      p_sender_id,
      v_transfer.to_user_id;
    RETURN;
  END IF;

  v_available := COALESCE(v_sender_balance.wallet_balance, 0)
               + COALESCE(v_sender_balance.yield_balance, 0)
               + COALESCE(v_sender_balance.bonus_balance, 0);

  IF v_available < v_transfer.amount THEN
    RETURN QUERY SELECT
      'insufficient'::TEXT,
      'Saldo insuficiente'::TEXT,
      v_transfer.amount,
      p_sender_id,
      v_transfer.to_user_id;
    RETURN;
  END IF;

  -- Debita do remetente
  UPDATE public.wallet_balances
  SET wallet_balance = COALESCE(wallet_balance, 0) - v_transfer.amount,
      updated_at = NOW()
  WHERE user_id = p_sender_id;

  -- Credita no destinatário (upsert)
  INSERT INTO public.wallet_balances
    (user_id, wallet_balance, yield_balance, bonus_balance, locked_balance, updated_at)
  VALUES
    (v_transfer.to_user_id, v_transfer.amount, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET wallet_balance = public.wallet_balances.wallet_balance + v_transfer.amount,
      updated_at = NOW();

  -- Marca a transferência como concluída
  UPDATE public.transfers
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_transfer_id;

  RETURN QUERY SELECT
    'success'::TEXT,
    'Transferência realizada com sucesso'::TEXT,
    v_transfer.amount,
    p_sender_id,
    v_transfer.to_user_id;
  RETURN;
END;
$$;

-- Garantir unicidade de user_id em wallet_balances (necessário para o upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallet_balances_user_id_key'
  ) THEN
    ALTER TABLE public.wallet_balances
      ADD CONSTRAINT wallet_balances_user_id_key UNIQUE (user_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_transfer(UUID, UUID) TO authenticated;
