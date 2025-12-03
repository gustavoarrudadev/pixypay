-- Migration 029: Criar tabela de itens do pedido
-- Armazena os itens de cada pedido

CREATE TABLE IF NOT EXISTS public.itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_itens_pedido_id ON public.itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_produto_id ON public.itens_pedido(produto_id);

-- Habilitar RLS
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- Política: Clientes veem itens de seus pedidos
CREATE POLICY "Clientes veem itens de seus pedidos"
ON public.itens_pedido FOR SELECT
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos WHERE cliente_id = auth.uid()
  )
);

-- Política: Clientes podem criar itens em seus pedidos
CREATE POLICY "Clientes podem criar itens"
ON public.itens_pedido FOR INSERT
WITH CHECK (
  pedido_id IN (
    SELECT id FROM public.pedidos WHERE cliente_id = auth.uid()
  )
);

-- Política: Revendas veem itens de seus pedidos
CREATE POLICY "Revendas veem itens de seus pedidos"
ON public.itens_pedido FOR SELECT
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos 
    WHERE revenda_id IN (
      SELECT id FROM public.revendas WHERE user_id = auth.uid()
    )
  )
);

-- Política: Admins veem todos os itens
CREATE POLICY "Admins veem todos os itens"
ON public.itens_pedido FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.itens_pedido IS 'Itens de cada pedido';
COMMENT ON COLUMN public.itens_pedido.preco_unitario IS 'Preço unitário no momento da compra (histórico)';
COMMENT ON COLUMN public.itens_pedido.subtotal IS 'Quantidade × Preço unitário';

