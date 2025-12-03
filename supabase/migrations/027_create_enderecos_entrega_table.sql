-- Migration 027: Criar tabela de endereços de entrega
-- Armazena endereços de entrega dos clientes

CREATE TABLE IF NOT EXISTS public.enderecos_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome_endereco VARCHAR(255), -- Ex: "Casa", "Trabalho"
  cep VARCHAR(10) NOT NULL,
  logradouro VARCHAR(255) NOT NULL,
  numero VARCHAR(50) NOT NULL,
  complemento VARCHAR(255),
  bairro VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL CHECK (LENGTH(estado) = 2),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_enderecos_cliente_id ON public.enderecos_entrega(cliente_id);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_enderecos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_enderecos ON public.enderecos_entrega;
CREATE TRIGGER set_timestamp_enderecos
BEFORE UPDATE ON public.enderecos_entrega
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_enderecos();

-- Habilitar RLS
ALTER TABLE public.enderecos_entrega ENABLE ROW LEVEL SECURITY;

-- Política: Clientes veem apenas seus endereços
CREATE POLICY "Clientes veem seus endereços"
ON public.enderecos_entrega FOR SELECT
USING (cliente_id = auth.uid());

-- Política: Clientes podem inserir seus endereços
CREATE POLICY "Clientes podem criar endereços"
ON public.enderecos_entrega FOR INSERT
WITH CHECK (cliente_id = auth.uid());

-- Política: Clientes podem atualizar seus endereços
CREATE POLICY "Clientes podem atualizar endereços"
ON public.enderecos_entrega FOR UPDATE
USING (cliente_id = auth.uid());

-- Política: Clientes podem deletar seus endereços
CREATE POLICY "Clientes podem deletar endereços"
ON public.enderecos_entrega FOR DELETE
USING (cliente_id = auth.uid());

-- Comentários
COMMENT ON TABLE public.enderecos_entrega IS 'Endereços de entrega dos clientes';
COMMENT ON COLUMN public.enderecos_entrega.nome_endereco IS 'Nome do endereço (ex: Casa, Trabalho)';

