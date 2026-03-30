-- Script de Dados de Teste para Sistema Admin
-- Este script cria usuários e investimentos de teste para validar o sistema

-- ========================================
-- 1. CRIAR USUÁRIOS DE TESTE
-- ========================================

-- NOTA: Em Supabase, não podemos inserir diretamente em profiles.user_id
-- porque user_id referencia auth.users. Precisamos criar os usuários
-- através do auth primeiro ou usar user_ids existentes.

-- Primeiro, vamos verificar se já existem usuários no auth
DO $$
DECLARE
    existing_auth_users RECORD;
    test_user_id UUID;
BEGIN
    -- Tentar encontrar um usuário existente no auth para usar como teste
    SELECT id INTO test_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usando usuário existente do auth: %', test_user_id;
        
        -- Criar perfil de admin usando usuário existente
        INSERT INTO profiles (
          user_id,
          email,
          full_name,
          role,
          status,
          available_balance,
          total_invested,
          total_withdrawn,
          total_earned,
          referral_code,
          is_active,
          is_verified,
          verification_level,
          created_at,
          updated_at
        ) VALUES (
          test_user_id,
          'admin@imperium.test',
          'Administrador Teste',
          'admin',
          'active',
          0,
          0,
          0,
          0,
          'ADMIN_TEST',
          true,
          true,
          'premium',
          NOW(),
          NOW()
        ) ON CONFLICT (user_id) DO UPDATE SET
          role = 'admin',
          status = 'active',
          updated_at = NOW();
          
        RAISE NOTICE 'Perfil admin criado/atualizado com sucesso!';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado no auth.users';
        RAISE NOTICE 'Você precisa criar usuários através do auth primeiro';
        RAISE NOTICE 'Ou usar a interface de registro para criar usuários';
    END IF;
END
$$;

-- ========================================
-- 2. VERIFICAR ESTRUTURA ATUAL
-- ========================================

-- Verificar usuários existentes
SELECT 
    'Usuários existentes no auth:' as info,
    COUNT(*) as count
FROM auth.users;

-- Verificar perfis existentes
SELECT 
    'Perfis existentes:' as info,
    COUNT(*) as count
FROM profiles;

-- Verificar investimentos existentes
SELECT 
    'Investimentos existentes:' as info,
    COUNT(*) as count
FROM investments;

-- ========================================
-- 3. CRIAR DADOS DE TESTE (SE HOUVER USUÁRIOS)
-- ========================================

-- Criar investimentos de teste se houver perfis
DO $$
DECLARE
    profile_count INTEGER;
    sample_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    IF profile_count > 0 THEN
        -- Pegar um usuário existente
        SELECT user_id INTO sample_user_id 
        FROM profiles 
        LIMIT 1;
        
        RAISE NOTICE 'Criando dados de teste para o usuário: %', sample_user_id;
        
        -- Criar investimento de teste
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
          sample_user_id,
          'basic',
          1000.00,
          'active',
          0.0080, -- 0.8% - dentro da precisão 5,4
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
        
        -- Criar depósito de teste
        INSERT INTO deposits (
          user_id,
          amount,
          method,
          status,
          description,
          confirmed_at,
          created_at,
          updated_at
        ) VALUES (
          sample_user_id,
          1000.00,
          'pix',
          'confirmed',
          'Depósito inicial para plano basic',
          NOW() - INTERVAL '8 days',
          NOW() - INTERVAL '8 days',
          NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Criar rendimento histórico de teste
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
          i.amount * 0.0080, -- Usar mesma taxa do investimento
          0.0080,
          (i.amount * 0.0080) * 0.5,
          (i.amount * 0.0080) * 0.5,
          NOW() - INTERVAL '1 day',
          NOW() - INTERVAL '1 day'
        FROM investments i 
        WHERE i.user_id = sample_user_id 
        AND i.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM yields y 
          WHERE y.investment_id = i.id 
          AND y.date = NOW() - INTERVAL '1 day'
        );
        
        RAISE NOTICE 'Dados de teste criados com sucesso!';
    ELSE
        RAISE NOTICE 'Nenhum perfil encontrado para criar dados de teste';
        RAISE NOTICE 'Por favor, crie usuários através da interface de registro primeiro';
    END IF;
END
$$;

-- ========================================
-- 4. RELATÓRIO FINAL
-- ========================================

DO $$
DECLARE
    auth_user_count INTEGER;
    profile_count INTEGER;
    investment_count INTEGER;
    active_investment_count INTEGER;
    deposit_count INTEGER;
    yield_count INTEGER;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO investment_count FROM investments;
    SELECT COUNT(*) INTO active_investment_count FROM investments WHERE status = 'active';
    SELECT COUNT(*) INTO deposit_count FROM deposits;
    SELECT COUNT(*) INTO yield_count FROM yields;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATÓRIO DE DADOS ATUAIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuários no auth: %', auth_user_count;
    RAISE NOTICE 'Perfis criados: %', profile_count;
    RAISE NOTICE 'Investimentos totais: %', investment_count;
    RAISE NOTICE 'Investimentos ativos: %', active_investment_count;
    RAISE NOTICE 'Depósitos criados: %', deposit_count;
    RAISE NOTICE 'Rendimentos históricos: %', yield_count;
    RAISE NOTICE '========================================';
    
    IF profile_count = 0 THEN
        RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
        RAISE NOTICE '1. Use a interface de registro para criar usuários';
        RAISE NOTICE '2. Faça login com um usuário criado';
        RAISE NOTICE '3. Execute este script novamente para criar dados de teste';
        RAISE NOTICE '4. Teste o painel admin';
    ELSE
        RAISE NOTICE '✅ Dados de teste disponíveis!';
        RAISE NOTICE '🧪 Agora você pode testar o sistema admin!';
        RAISE NOTICE '📊 Use os logs para acompanhar os rendimentos!';
    END IF;
    RAISE NOTICE '========================================';
END
$$;
