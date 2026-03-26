-- Adicionar colunas faltantes na tabela deposits
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS admin_account_id UUID,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT;

-- Verificar estrutura da tabela
\d deposits;
