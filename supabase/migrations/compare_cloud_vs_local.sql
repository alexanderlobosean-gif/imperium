-- COMPARAR TABELAS DO PROJETO ATUAL (NUVEM) VS LOCAL
-- Execute no Studio Local para ver o que falta

-- 1. Verificar tabelas que existem no projeto atual (conectar ao projeto)
-- Para isso, precisamos exportar do projeto atual

-- 2. Primeiro, vamos listar todas as tabelas que deveriam existir
-- Baseado no código da aplicação, verificamos estas tabelas:

-- Tabelas principais que devem existir:
-- profiles ✅ (já verificamos que existe)
-- investments ✅ (já verificamos que existe)
-- deposits ✅ (já verificamos que existe)
-- withdrawals ✅ (já verificamos que existe)
-- network_relations ✅ (já verificamos que existe)

-- Tabelas que podem estar faltando:
-- auth.users (já existe no Supabase, não precisa criar)
-- kyc_documents (para documentos KYC)
-- notifications (para notificações)
-- transactions (para transações gerais)
-- referral_links (para links de indicação)
-- investment_plans (para planos de investimento)
-- user_balances (para saldos de usuário)
-- commission_history (para histórico de comissões)
-- support_tickets (para tickets de suporte)
-- audit_logs (para logs de auditoria)
-- user_sessions (para sessões de usuário)
-- email_templates (para templates de email)
-- system_settings (para configurações do sistema)

-- 3. Verificar se há outras tabelas no projeto atual
-- Para isso, vamos conectar ao projeto atual e listar

-- 4. Verificar estrutura das tabelas existentes para garantir que estão completas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'investments', 'deposits', 'withdrawals', 'network_relations')
ORDER BY table_name, ordinal_position;

-- 5. Verificar se há tabelas de sistema que criamos
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name NOT IN ('profiles', 'investments', 'deposits', 'withdrawals', 'network_relations')
ORDER BY table_name;
