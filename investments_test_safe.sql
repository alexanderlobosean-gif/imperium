-- Script de Investimentos de Teste com Valores Corrigidos
-- Usando o perfil de Cristian Nunes Macena (super_admin)

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
  0.0080, -- 0.8% - tentativa 1
  0.0080,
  50,
  50,
  3,
  0,
  0,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days',
  NOW()
) ON CONFLICT DO NOTHING;

-- Se o acima falhar, tentar com valores menores
DO $$
BEGIN
    -- Tentativa 2: com valores ainda menores
    BEGIN
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
          'basic',
          1000.00,
          'active',
          0.0050, -- 0.5%
          0.0050,
          50,
          50,
          3,
          0,
          0,
          NOW() - INTERVAL '7 days',
          NOW() - INTERVAL '7 days',
          NOW()
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Investimento criado com taxa 0.5%';
    EXCEPTION WHEN OTHERS THEN
        -- Tentativa 3: com valores mínimos
        BEGIN
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
              'basic',
              1000.00,
              'active',
              0.0010, -- 0.1%
              0.0010,
              50,
              50,
              3,
              0,
              0,
              NOW() - INTERVAL '7 days',
              NOW() - INTERVAL '7 days',
              NOW()
            ) ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Investimento criado com taxa 0.1%';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERRO: Não foi possível criar investimento. Verifique a estrutura da tabela investments.';
            RAISE NOTICE 'ERRO DETALHADO: %', SQLERRM;
        END;
    END;
END
$$;

-- ========================================
-- 2. VERIFICAR SE O INVESTIMENTO FOI CRIADO
-- ========================================

SELECT 
    'Investimentos criados:' as info,
    COUNT(*) as count
FROM investments 
WHERE user_id = '78f674e2-16cc-4924-9480-e06a2b53cdcf';

-- Mostrar detalhes
SELECT 
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
