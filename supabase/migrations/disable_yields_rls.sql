-- Desabilitar RLS temporariamente para teste
-- Se as políticas continuarem falhando, desabilite RLS temporariamente

-- Desabilitar RLS (apenas para teste)
ALTER TABLE yields DISABLE ROW LEVEL SECURITY;

-- Tentativa 2: Se desabilitar funcionar, criamos políticas melhores depois
-- Você pode testar a aplicação de rendimentos agora

-- Para reabilitar RLS depois:
-- ALTER TABLE yields ENABLE ROW LEVEL SECURITY;
