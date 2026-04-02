-- SQL para adicionar campos faltantes na tabela profiles
-- Execute este script no painel do Supabase (SQL Editor)

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_agency TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS crypto_wallet TEXT;

-- Add comments to new columns
COMMENT ON COLUMN profiles.bank_name IS 'Nome do banco';
COMMENT ON COLUMN profiles.bank_agency IS 'Agência bancária';
COMMENT ON COLUMN profiles.bank_account IS 'Número da conta bancária';
COMMENT ON COLUMN profiles.pix_key IS 'Chave PIX (CPF, Email, Telefone ou Aleatória)';
COMMENT ON COLUMN profiles.crypto_wallet IS 'Endereço da carteira de criptomoedas';

-- Update RLS policies to include new columns (they should already work since we're just adding columns)
-- No need to update policies as they use SELECT * and work with all columns

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Campos bancários e crypto adicionados com sucesso à tabela profiles!';
END $$;
