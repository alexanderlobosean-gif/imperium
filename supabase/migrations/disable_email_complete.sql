-- Desabilitar completamente confirmação de email no Supabase
-- Execute isso no SQL Editor do Supabase Dashboard

-- 1. Atualizar configurações de autenticação
UPDATE auth.config 
SET value = 'false'::jsonb 
WHERE key = 'mailer_otp_enabled';

UPDATE auth.config 
SET value = '{"enabled": false, "max_frequency": "0s", "seconds": 0}'::jsonb 
WHERE key = 'mailer_autoconfirm';

UPDATE auth.config 
SET value = 'false'::jsonb 
WHERE key = 'external_email_enabled';

-- 2. Confirmar todos os usuários pendentes
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 3. Verificar configurações
SELECT key, value 
FROM auth.config 
WHERE key IN ('mailer_otp_enabled', 'mailer_autoconfirm', 'external_email_enabled');

-- 4. Verificar usuários confirmados
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
