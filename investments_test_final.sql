-- Script de Investimentos de Teste COMPLETAMENTE CORRIGIDO
-- Usando o perfil de Cristian Nunes Macena (super_admin)
-- Incluindo todos os campos obrigatórios

-- ========================================
-- 1. INSERIR INVESTIMENTOS DE TESTE (COMPLETO)
-- ========================================

-- Investimento 1: Plano Basic - R$ 1.000,00
INSERT INTO investments (
  user_id,
  plan, -- Campo obrigatório adicionado
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
  'basic', -- Campo plan obrigatório
  'basic', -- plan_slug
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
  plan, -- Campo obrigatório
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
  'start', -- Campo plan obrigatório
  'start', -- plan_slug
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
  plan, -- Campo obrigatório
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
  'silver', -- Campo plan obrigatório
  'silver', -- plan_slug
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
-- 2. VERIFICAR SE OS INVESTIMENTOS FORAM CRIADOS
-- ========================================

SELECT 
    'Investimentos criados:' as info,
    COUNT(*) as count
FROM investments 
WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';

-- Mostrar detalhes dos investimentos
SELECT 
    plan,
    plan_slug,
    amount,
    status,
    base_rate,
    current_daily_rate,
    client_share,
    company_share,
    created_at
FROM investments 
WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf'
ORDER BY created_at;

-- ========================================
-- 3. INSERIR DEPÓSITOS RELACIONADOS
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
  i.user_id::uuid, -- Cast para UUID
  i.amount * i.base_rate,
  i.base_rate,
  (i.amount * i.base_rate) * i.client_share,
  (i.amount * i.base_rate) * i.company_share,
  generate_series(NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', INTERVAL '1 day'),
  generate_series(NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', INTERVAL '1 day')
FROM investments i 
WHERE i.user_id::text = '78f674e2-16cc-4924-9480-e06a2b53cdcf'::text
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
  i.user_id::uuid, -- Cast para UUID
  i.amount * i.base_rate,
  i.base_rate,
  (i.amount * i.base_rate) * i.client_share,
  (i.amount * i.base_rate) * i.company_share,
  generate_series(NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', INTERVAL '1 day'),
  generate_series(NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', INTERVAL '1 day')
FROM investments i 
WHERE i.user_id::text = '78f674e2-16cc-4924-9480-e06a2b53cdcf'::text
  AND i.plan_slug = 'silver'
  AND i.status = 'active'
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. VERIFICAÇÃO FINAL SIMPLES
-- ========================================

-- Verificar investimentos criados
SELECT 
    'Investimentos criados:' as info,
    COUNT(*) as count
FROM investments 
WHERE user_id::text = '78f674e2-16cc-4924-9480-e06a2b53cdcf'::text;

-- Verificar depósitos criados
SELECT 
    'Depósitos criados:' as info,
    COUNT(*) as count
FROM deposits 
WHERE user_id::text = '78f674e2-16cc-4924-9480-e06a2b53cdcf'::text;

-- Verificar rendimentos criados
SELECT 
    'Rendimentos criados:' as info,
    COUNT(*) as count
FROM yields 
WHERE user_id::text = '78f674e2-16cc-4924-9480-e06a2b53cdcf'::text;

-- Mostrar detalhes dos investimentos ativos
SELECT 
    plan,
    plan_slug,
    amount,
    status,
    base_rate,
    client_share,
    company_share,
    created_at
FROM investments 
WHERE user_id::text = '78f674e2-16cc-4924-9480-e06a2b53cdcf'::text
  AND status = 'active'
ORDER BY created_at;
