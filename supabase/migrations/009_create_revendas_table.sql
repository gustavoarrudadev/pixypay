CREATE TABLE revendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_revenda VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    nome_responsavel VARCHAR(255) NOT NULL,
    cpf_responsavel VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    cep VARCHAR(9),
    logradouro VARCHAR(255),
    numero VARCHAR(50),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    marcas_trabalhadas JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revendas_cnpj ON revendas(cnpj);
CREATE INDEX idx_revendas_cpf_responsavel ON revendas(cpf_responsavel);
CREATE INDEX idx_revendas_user_id ON revendas(user_id);

-- Function to update `atualizado_em` timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update `atualizado_em` on row update
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON revendas
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
