-- Migration 030: Criar tabela de parcelamentos
-- Armazena os parcelamentos de cada pedido

CREATE TABLE IF NOT EXISTS public.parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  total_parcelas INTEGER NOT NULL CHECK (total_parcelas > 0),
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
  valor_parcela DECIMAL(10, 2) NOT NULL CHECK (valor_parcela >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado', 'cancelado')),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_parcelamentos_pedido_id ON public.parcelamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_status ON public.parcelamentos(status);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_parcelamentos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_parcelamentos ON public.parcelamentos;
CREATE TRIGGER set_timestamp_parcelamentos
BEFORE UPDATE ON public.parcelamentos
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_parcelamentos();

-- Habilitar RLS
ALTER TABLE public.parcelamentos ENABLE ROW LEVEL SECURITY;

-- Política: Clientes veem parcelamentos de seus pedidos
CREATE POLICY "Clientes veem seus parcelamentos"
ON public.parcelamentos FOR SELECT
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos WHERE cliente_id = auth.uid()
  )
);

-- Política: Revendas veem parcelamentos de seus pedidos
CREATE POLICY "Revendas veem parcelamentos de seus pedidos"
ON public.parcelamentos FOR SELECT
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos 
    WHERE revenda_id IN (
      SELECT id FROM public.revendas WHERE user_id = auth.uid()
    )
  )
);

-- Política: Admins veem todos os parcelamentos
CREATE POLICY "Admins veem todos os parcelamentos"
ON public.parcelamentos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.parcelamentos IS 'Parcelamentos de pedidos';
COMMENT ON COLUMN public.parcelamentos.status IS 'Status: ativo, quitado, cancelado';

