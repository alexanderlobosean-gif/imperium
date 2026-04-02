-- Script de Investimentos de Teste CORRIGIDO
-- Usando o perfil de Cristian Nunes Macena (super_admin)
-- Valores corrigidos para NUMERIC(5,4)

-- ========================================
-- 1. INSERIR INVESTIMENTOS DE TESTE (VALORES CORRIGIDOS)
-- ========================================

-- Investimento 1: Plano Basic - R$ 1.000,00
INSERT INTO investments (
  user_id,
  plan_slug,
  amount,
  status,
  base_rate,
  current_daily_rate,
  client_share,
  company_share,
  residual_levels,
  daily_yield,
  total_yield,
  start_date,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf', -- user_id do Cristian
  'basic',
  1000.00,
  'active',
  0.0080, -- 0.8% - OK para NUMERIC(5,4)
  0.0080, -- 0.8% - OK para NUMERIC(5,4)
  0.5000, -- 50.00% - CORRIGIDO para NUMERIC(5,4)
  0.5000, -- 50.00% - CORRIGIDO para NUMERIC(5,4)
  3,
  0,
  0,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- Investimento 2: Plano Start - R$ 500,00 (concluído para histórico)
INSERT INTO investments (
  user_id,
  plan_slug,
  amount,
  status,
  base_rate,
  current_daily_rate,
  client_share,
  company_share,
  residual_levels,
  daily_yield,
  total_yield,
  start_date,
  end_date,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf',
  'start',
  500.00,
  'completed',
  0.0060, -- 0.6% - OK para NUMERIC(5,4)
  0.0060, -- 0.6% - OK para NUMERIC(5,4)
  0.5000, -- 50.00% - CORRIGIDO
  0.5000, -- 50.00% - CORRIGIDO
  1,
  0,
  24.00, -- 500 * 0.006 * 8 dias (exemplo)
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '22 days',
  NOW() - INTERVAL '30 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- Investimento 3: Plano Silver - R$ 2.000,00
INSERT INTO investments (
  user_id,
  plan_slug,
  amount,
  status,
  base_rate,
  current_daily_rate,
  client_share,
  company_share,
  residual_levels,
  daily_yield,
  total_yield,
  start_date,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf',
  'silver',
  2000.00,
  'active',
  0.0100, -- 1.0% - OK para NUMERIC(5,4)
  0.0100, -- 1.0% - OK para NUMERIC(5,4)
  0.6000, -- 60.00% - CORRIGIDO
  0.4000, -- 40.00% - CORRIGIDO
  5,
  0,
  0,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- ========================================
-- 2. INSERIR DEPÓSITOS RELACIONADOS
-- ========================================

-- Depósito para investimento Basic
INSERT INTO deposits (
  user_id,
  amount,
  method,
  status,
  description,
  transaction_hash,
  confirmed_at,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf',
  1000.00,
  'pix',
  'confirmed',
  'Depósito inicial para plano Basic',
  'tx_basic_' || gen_random_uuid(),
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- Depósito para investimento Silver
INSERT INTO deposits (
  user_id,
  amount,
  method,
  status,
  description,
  transaction_hash,
  confirmed_at,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf',
  2000.00,
  'bank_transfer',
  'confirmed',
  'Depósito para plano Silver',
  'tx_silver_' || gen_random_uuid(),
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- Depósito pendente para teste
INSERT INTO deposits (
  user_id,
  amount,
  method,
  status,
  description,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf',
  750.00,
  'crypto',
  'pending',
  'Depósito aguardando confirmação',
  NOW() - INTERVAL '1 day',
  NOW()
) ON CONFLICT DO NOTHING;

-- ========================================
-- 3. INSERIR SAQUES DE TESTE
-- ========================================

-- Saque confirmado
INSERT INTO withdrawals (
  user_id,
  amount,
  method,
  destination_address,
  status,
  processing_fee,
  transaction_hash,
  confirmed_at,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf',
  200.00,
  'pix',
  '87998092910',
  'confirmed',
  2.50,
  'tx_withdraw_' || gen_random_uuid(),
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- Saque pendente
INSERT INTO withdrawals (
  user_id,
  amount,
  method,
  destination_address,
  status,
  processing_fee,
  created_at,
  updated_at
) VALUES (
  '78f674e2-16cc-4924-9480-e06a2b53cdcf',
  150.00,
  'bank_transfer',
  'Santander - 0000-2',
  'pending',
  5.00,
  NOW() - INTERVAL '2 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- ========================================
-- 4. INSERIR RENDIMENTOS HISTÓRICOS
-- ========================================

-- Rendimentos para investimento Basic (últimos 5 dias)
INSERT INTO yields (
  investment_id,
  user_id,
  amount,
  rate,
  client_yield,
  company_yield,
  date,
  created_at
) SELECT 
  i.id,
  i.user_id,
  i.amount * i.base_rate,
  i.base_rate,
  (i.amount * i.base_rate) * i.client_share,
  (i.amount * i.base_rate) * i.company_share,
  generate_series(NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', INTERVAL '1 day'),
  generate_series(NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', INTERVAL '1 day')
FROM investments i 
WHERE i.user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf'
  AND i.plan_slug = 'basic'
  AND i.status = 'active'
ON CONFLICT DO NOTHING;

-- Rendimentos para investimento Silver (últimos 2 dias)
INSERT INTO yields (
  investment_id,
  user_id,
  amount,
  rate,
  client_yield,
  company_yield,
  date,
  created_at
) SELECT 
  i.id,
  i.user_id,
  i.amount * i.base_rate,
  i.base_rate,
  (i.amount * i.base_rate) * i.client_share,
  (i.amount * i.base_rate) * i.company_share,
  generate_series(NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', INTERVAL '1 day'),
  generate_series(NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', INTERVAL '1 day')
FROM investments i 
WHERE i.user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf'
  AND i.plan_slug = 'silver'
  AND i.status = 'active'
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. ATUALIZAR SALDOS DO PERFIL
-- ========================================

-- Calcular e atualizar totais baseados nos investimentos e rendimentos
UPDATE profiles 
SET 
  total_invested = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM investments 
    WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf'
  ),
  total_withdrawn = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM withdrawals 
    WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf'
    AND status = 'confirmed'
  ),
  total_earned = (
    SELECT COALESCE(SUM(client_yield), 0) 
    FROM yields 
    WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf'
  ),
  available_balance = (
    (SELECT COALESCE(SUM(client_yield), 0) FROM yields WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf')
    - (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf' AND status = 'confirmed')
  ),
  updated_at = NOW()
WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';

-- ========================================
-- 6. RELATÓRIO FINAL
-- ========================================

DO $$
DECLARE
    investment_count INTEGER;
    active_investment_count INTEGER;
    deposit_count INTEGER;
    withdrawal_count INTEGER;
    yield_count INTEGER;
    total_invested DECIMAL;
    total_earned DECIMAL;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO investment_count FROM investments WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';
    SELECT COUNT(*) INTO active_investment_count FROM investments WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf' AND status = 'active';
    SELECT COUNT(*) INTO deposit_count FROM deposits WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';
    SELECT COUNT(*) INTO withdrawal_count FROM withdrawals WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';
    SELECT COUNT(*) INTO yield_count FROM yields WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';
    
    SELECT COALESCE(SUM(amount), 0) INTO total_invested FROM investments WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';
    SELECT COALESCE(SUM(client_yield), 0) INTO total_earned FROM yields WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DADOS DE INVESTIMENTO CRIADOS COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuário: Cristian Nunes Macena';
    RAISE NOTICE 'Investimentos totais: %', investment_count;
    RAISE NOTICE 'Investimentos ativos: %', active_investment_count;
    RAISE NOTICE 'Depósitos criados: %', deposit_count;
    RAISE NOTICE 'Saques criados: %', withdrawal_count;
    RAISE NOTICE 'Rendimentos históricos: %', yield_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total investido: R$ %', total_invested;
    RAISE NOTICE 'Total ganho: R$ %', total_earned;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Agora você pode testar o sistema admin!';
    RAISE NOTICE '🧪 Use taxa 0.0080 (0.8%) para o investimento Basic';
    RAISE NOTICE '🧪 Use taxa 0.0100 (1.0%) para o investimento Silver';
    RAISE NOTICE '📊 Acompanhe os logs no console!';
    RAISE NOTICE '========================================';
END
$$;
