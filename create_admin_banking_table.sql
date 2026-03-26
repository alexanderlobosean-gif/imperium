-- Criar tabela admin_banking_accounts
-- Para armazenar contas bancárias do administrador

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS admin_banking_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- corrente, poupanca, pagamento
    bank_agency VARCHAR(20) NOT NULL,
    bank_account VARCHAR(30) NOT NULL,
    account_holder VARCHAR(150) NOT NULL,
    document_cpf VARCHAR(20) NOT NULL,
    pix_key VARCHAR(200) NOT NULL,
    pix_key_type VARCHAR(20) NOT NULL, -- cpf, cnpj, email, phone, random
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_admin_banking_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER admin_banking_accounts_updated_at
    BEFORE UPDATE ON admin_banking_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_banking_accounts_updated_at();

-- 3. Habilitar RLS
ALTER TABLE admin_banking_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
-- Apenas admin pode ver as contas
CREATE POLICY "Admin pode ver contas bancárias"
    ON admin_banking_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Apenas admin pode inserir contas
CREATE POLICY "Admin pode inserir contas bancárias"
    ON admin_banking_accounts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Apenas admin pode atualizar contas
CREATE POLICY "Admin pode atualizar contas bancárias"
    ON admin_banking_accounts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Apenas admin pode deletar contas
CREATE POLICY "Admin pode deletar contas bancárias"
    ON admin_banking_accounts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 5. Inserir dados de exemplo
INSERT INTO admin_banking_accounts (
    bank_name,
    account_type,
    bank_agency,
    bank_account,
    account_holder,
    document_cpf,
    pix_key,
    pix_key_type,
    is_default
) VALUES 
(
    'Banco do Brasil',
    'corrente',
    '0001',
    '12345-6',
    'Imperium Club Administrativo',
    '00.000.000/0001-00',
    'imperium@pix.com',
    'email',
    TRUE
),
(
    'Itaú Unibanco',
    'corrente',
    '1234',
    '54321-0',
    'Imperium Club Financeiro',
    '00.000.000/0001-00',
    '11.2222.3333',
    'random',
    FALSE
);

-- 6. Verificar resultado
SELECT 
    'Tabela admin_banking_accounts criada com sucesso!' as info,
    COUNT(*) as total_contas
FROM admin_banking_accounts 
WHERE is_active = TRUE;
