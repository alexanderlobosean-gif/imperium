-- SQL para atualizar user para admin no Supabase
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Primeiro, verifique seu user_id atual
SELECT id, email, role FROM profiles WHERE email = 'seu_email@aqui.com';

-- 2. Atualize seu user para admin
-- Substitua 'seu_user_id_aqui' pelo ID retornado na consulta acima
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'seu_user_id_aqui';

-- 3. Verifique se a atualização funcionou
SELECT id, email, role FROM profiles WHERE id = 'seu_user_id_aqui';

-- 4. Se quiser ser super_admin (acesso total):
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = 'seu_user_id_aqui';

-- 5. Para voltar para user normal:
UPDATE profiles 
SET role = 'user' 
WHERE id = 'seu_user_id_aqui';

-- 6. Listar todos os usuários e seus roles (para verificação)
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at;
