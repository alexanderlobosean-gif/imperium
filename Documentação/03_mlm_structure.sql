-- Estrutura MLM com Closure Table Pattern (CRÍTICO)
-- Permite calcular comissões eficientemente até 20 níveis sem recursão

CREATE TABLE user_network (
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    ancestor_id UUID REFERENCES auth.users(id) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, ancestor_id)
);

-- Índices para performance
CREATE INDEX idx_user_network_user_id ON user_network(user_id);
CREATE INDEX idx_user_network_ancestor_id ON user_network(ancestor_id);
CREATE INDEX idx_user_network_level ON user_network(level);

-- Função para inserir nova relação na rede (chamada quando usuário indica outro)
CREATE OR REPLACE FUNCTION add_to_network(p_user_id UUID, p_sponsor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Inserir todas as relações ancestrais
    INSERT INTO user_network (user_id, ancestor_id, level)
    SELECT p_user_id, ancestor_id, level + 1
    FROM user_network
    WHERE user_id = p_sponsor_id;

    -- Inserir relação direta com o sponsor
    INSERT INTO user_network (user_id, ancestor_id, level)
    VALUES (p_user_id, p_sponsor_id, 1);

    RETURN TRUE;
END;
$$;

-- Função para buscar toda a rede de um usuário (até nível X)
CREATE OR REPLACE FUNCTION get_network_downline(p_user_id UUID, p_max_level INTEGER DEFAULT 20)
RETURNS TABLE(user_id UUID, level INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT un.user_id, un.level
    FROM user_network un
    WHERE un.ancestor_id = p_user_id
    AND un.level <= p_max_level
    ORDER BY un.level, un.user_id;
END;
$$;

-- RLS: Usuários podem ver apenas sua própria rede
ALTER TABLE user_network ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view network relations" ON user_network
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() = ancestor_id OR
        EXISTS (
            SELECT 1 FROM user_network un
            WHERE un.user_id = user_network.user_id
            AND un.ancestor_id = auth.uid()
        )
    );
