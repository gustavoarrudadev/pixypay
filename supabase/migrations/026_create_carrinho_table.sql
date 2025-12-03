-- Migration 026: Criar tabela de carrinho de compras
-- Armazena itens do carrinho antes de finalizar o pedido

-- Criar tabela carrinho
CREATE TABLE IF NOT EXISTS public.carrinho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  sessao_id VARCHAR(255), -- Para usuários não autenticados
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_carrinho_cliente_id ON public.carrinho(cliente_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_sessao_id ON public.carrinho(sessao_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_produto_id ON public.carrinho(produto_id);

-- Constraint: Um produto por cliente (se autenticado)
CREATE UNIQUE INDEX IF NOT EXISTS idx_carrinho_cliente_produto 
ON public.carrinho(cliente_id, produto_id) 
WHERE cliente_id IS NOT NULL;

-- Constraint: Um produto por sessão (se não autenticado)
CREATE UNIQUE INDEX IF NOT EXISTS idx_carrinho_sessao_produto 
ON public.carrinho(sessao_id, produto_id) 
WHERE sessao_id IS NOT NULL;

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_carrinho()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_carrinho ON public.carrinho;
CREATE TRIGGER set_timestamp_carrinho
BEFORE UPDATE ON public.carrinho
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_carrinho();

-- Habilitar RLS
ALTER TABLE public.carrinho ENABLE ROW LEVEL SECURITY;

-- Política: Clientes autenticados veem apenas seu carrinho
CREATE POLICY "Clientes veem seu carrinho"
ON public.carrinho FOR SELECT
USING (
  cliente_id = auth.uid() OR
  (cliente_id IS NULL AND sessao_id IS NOT NULL)
);

-- Política: Clientes autenticados podem inserir em seu carrinho
CREATE POLICY "Clientes podem adicionar ao carrinho"
ON public.carrinho FOR INSERT
WITH CHECK (
  cliente_id = auth.uid() OR
  (cliente_id IS NULL AND sessao_id IS NOT NULL)
);

-- Política: Clientes autenticados podem atualizar seu carrinho
CREATE POLICY "Clientes podem atualizar carrinho"
ON public.carrinho FOR UPDATE
USING (
  cliente_id = auth.uid() OR
  (cliente_id IS NULL AND sessao_id IS NOT NULL)
);

-- Política: Clientes autenticados podem deletar do carrinho
CREATE POLICY "Clientes podem remover do carrinho"
ON public.carrinho FOR DELETE
USING (
  cliente_id = auth.uid() OR
  (cliente_id IS NULL AND sessao_id IS NOT NULL)
);

-- Comentários
COMMENT ON TABLE public.carrinho IS 'Carrinho de compras temporário antes de finalizar pedido';
COMMENT ON COLUMN public.carrinho.cliente_id IS 'ID do cliente autenticado (NULL se não autenticado)';
COMMENT ON COLUMN public.carrinho.sessao_id IS 'ID da sessão para usuários não autenticados';
COMMENT ON COLUMN public.carrinho.produto_id IS 'Produto adicionado ao carrinho';
COMMENT ON COLUMN public.carrinho.quantidade IS 'Quantidade do produto no carrinho';

