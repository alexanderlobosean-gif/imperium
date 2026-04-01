-- POLÍTICAS RLS (ROW LEVEL SECURITY) - IMPERIUM
-- Usuários NÃO podem manipular dinheiro diretamente

-- =============================================
-- FINANCIAL_LEDGER - APENAS SERVICE ROLE
-- =============================================

-- Desabilitar RLS temporariamente para configuração
ALTER TABLE financial_ledger DISABLE ROW LEVEL SECURITY;

-- Política: NINGUÉM vê ledger exceto service role
DROP POLICY IF EXISTS "No one can view ledger" ON financial_ledger;
CREATE POLICY "No one can view ledger" ON financial_ledger
    FOR SELECT USING (false);

-- Política: Apenas service role insere/modifica
DROP POLICY IF EXISTS "Only service role manages ledger" ON financial_ledger;
CREATE POLICY "Only service role manages ledger" ON financial_ledger
    FOR ALL USING (auth.role() = 'service_role');

-- Reabilitar RLS
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;

-- =============================================
-- WALLET_BALANCES - USUÁRIOS VEEM APENAS O PRÓPRIO
-- =============================================

ALTER TABLE wallet_balances DISABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas próprio saldo
DROP POLICY IF EXISTS "Users can view own wallet balances" ON wallet_balances;
CREATE POLICY "Users can view own wallet balances" ON wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Apenas service role modifica saldos
DROP POLICY IF EXISTS "Only service role modifies wallet balances" ON wallet_balances;
CREATE POLICY "Only service role modifies wallet balances" ON wallet_balances
    FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DEPOSITS - USUÁRIOS CRIAM, ADMINS APROVAM
-- =============================================

ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas próprios depósitos
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
CREATE POLICY "Users can view own deposits" ON deposits
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem criar depósitos (status = 'pending')
DROP POLICY IF EXISTS "Users can create pending deposits" ON deposits;
CREATE POLICY "Users can create pending deposits" ON deposits
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        status = 'pending'
    );

-- Política: Apenas service role atualiza status (admin aprova/rejeita)
DROP POLICY IF EXISTS "Only service role updates deposit status" ON deposits;
CREATE POLICY "Only service role updates deposit status" ON deposits
    FOR UPDATE USING (auth.role() = 'service_role');

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- =============================================
-- WITHDRAWALS - USUÁRIOS SOLICITAM, ADMINS APROVAM
-- =============================================

ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas próprios saques
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem criar saques (status = 'pending')
DROP POLICY IF EXISTS "Users can create pending withdrawals" ON withdrawals;
CREATE POLICY "Users can create pending withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        status = 'pending'
    );

-- Política: Apenas service role atualiza status (admin aprova/rejeita)
DROP POLICY IF EXISTS "Only service role updates withdrawal status" ON withdrawals;
CREATE POLICY "Only service role updates withdrawal status" ON withdrawals
    FOR UPDATE USING (auth.role() = 'service_role');

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TRANSFERS - USUÁRIOS VEEM APENAS PARTICIPAÇÕES
-- =============================================

ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;

-- Política: Usuários veem transferências que enviaram ou receberam
DROP POLICY IF EXISTS "Users can view own transfers" ON transfers;
CREATE POLICY "Users can view own transfers" ON transfers
    FOR SELECT USING (
        auth.uid() = from_user_id OR
        auth.uid() = to_user_id
    );

-- Política: Apenas service role cria transferências (através da função)
DROP POLICY IF EXISTS "Only service role creates transfers" ON transfers;
CREATE POLICY "Only service role creates transfers" ON transfers
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INVESTMENTS - USUÁRIOS VEEM APENAS PRÓPRIOS
-- =============================================

ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas próprios investimentos
DROP POLICY IF EXISTS "Users can view own investments" ON investments;
CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem criar investimentos
DROP POLICY IF EXISTS "Users can create investments" ON investments;
CREATE POLICY "Users can create investments" ON investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Apenas service role atualiza (para yields, etc.)
DROP POLICY IF EXISTS "Only service role updates investments" ON investments;
CREATE POLICY "Only service role updates investments" ON investments
    FOR UPDATE USING (auth.role() = 'service_role');

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES - USUÁRIOS VEEM APENAS PRÓPRIOS
-- =============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem atualizar próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Service role pode ver todos os perfis (para admins)
DROP POLICY IF EXISTS "Service role can view all profiles" ON profiles;
CREATE POLICY "Service role can view all profiles" ON profiles
    FOR SELECT USING (auth.role() = 'service_role');

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER_NETWORK - REGRAS COMPLEXAS PARA MLM
-- =============================================

ALTER TABLE user_network DISABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver própria rede E rede dos seus uplines (para comissões)
DROP POLICY IF EXISTS "Users can view network relations" ON user_network;
CREATE POLICY "Users can view network relations" ON user_network
    FOR SELECT USING (
        -- Próprias relações
        auth.uid() = user_id OR
        auth.uid() = ancestor_id OR
        -- Relações da rede (downline)
        EXISTS (
            SELECT 1 FROM user_network un
            WHERE un.user_id = user_network.user_id
            AND un.ancestor_id = auth.uid()
        ) OR
        -- Relações dos uplines (para cálculo de comissões)
        EXISTS (
            SELECT 1 FROM user_network un
            WHERE un.user_id = auth.uid()
            AND un.ancestor_id = user_network.ancestor_id
        )
    );

-- Política: Apenas service role insere/modifica rede
DROP POLICY IF EXISTS "Only service role manages network" ON user_network;
CREATE POLICY "Only service role manages network" ON user_network
    FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE user_network ENABLE ROW LEVEL SECURITY;

-- =============================================
-- NETWORK_RELATIONS (LEGACY) - MANTER PARA COMPATIBILIDADE
-- =============================================

-- Se existir, aplicar mesmas regras
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_relations') THEN
        EXECUTE 'ALTER TABLE network_relations DISABLE ROW LEVEL SECURITY';

        EXECUTE 'DROP POLICY IF EXISTS "Users can view network relations" ON network_relations';
        EXECUTE 'CREATE POLICY "Users can view network relations" ON network_relations
            FOR SELECT USING (
                auth.uid()::text = user_id OR
                auth.uid()::text = referred_id OR
                EXISTS (
                    SELECT 1 FROM network_relations nr
                    WHERE nr.user_id = network_relations.user_id
                    AND nr.referred_id = auth.uid()::text
                )
            )';

        EXECUTE 'ALTER TABLE network_relations ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- =============================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =============================================

-- Função para verificar se RLS está ativo em todas as tabelas
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(table_name TEXT, rls_enabled BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT,
        c.relrowsecurity::BOOLEAN as rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (
        'financial_ledger', 'wallet_balances', 'deposits', 'withdrawals',
        'transfers', 'investments', 'profiles', 'user_network'
    )
    ORDER BY c.relname;
END;
$$;

-- Executar verificação
SELECT * FROM check_rls_status();
