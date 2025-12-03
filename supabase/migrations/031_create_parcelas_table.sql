-- Migration 031: Criar tabela de parcelas
-- Armazena cada parcela individual do parcelamento

CREATE TABLE IF NOT EXISTS public.parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelamento_id UUID NOT NULL REFERENCES public.parcelamentos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
  valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'atrasada', 'cancelada')),
  pix_copia_cola TEXT, -- Código PIX para pagamento
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(parcelamento_id, numero_parcela)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_parcelas_parcelamento_id ON public.parcelas(parcelamento_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON public.parcelas(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON public.parcelas(data_vencimento);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_parcelas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_parcelas ON public.parcelas;
CREATE TRIGGER set_timestamp_parcelas
BEFORE UPDATE ON public.parcelas
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_parcelas();

-- Habilitar RLS
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;

-- Política: Clientes veem parcelas de seus parcelamentos
CREATE POLICY "Clientes veem suas parcelas"
ON public.parcelas FOR SELECT
USING (
  parcelamento_id IN (
    SELECT id FROM public.parcelamentos 
    WHERE pedido_id IN (
      SELECT id FROM public.pedidos WHERE cliente_id = auth.uid()
    )
  )
);

-- Política: Revendas veem parcelas de seus pedidos
CREATE POLICY "Revendas veem parcelas de seus pedidos"
ON public.parcelas FOR SELECT
USING (
  parcelamento_id IN (
    SELECT id FROM public.parcelamentos 
    WHERE pedido_id IN (
      SELECT id FROM public.pedidos 
      WHERE revenda_id IN (
        SELECT id FROM public.revendas WHERE user_id = auth.uid()
      )
    )
  )
);

-- Política: Admins veem todas as parcelas
CREATE POLICY "Admins veem todas as parcelas"
ON public.parcelas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.parcelas IS 'Parcelas individuais de parcelamentos';
COMMENT ON COLUMN public.parcelas.numero_parcela IS 'Número da parcela (1, 2, 3...)';
COMMENT ON COLUMN public.parcelas.pix_copia_cola IS 'Código PIX para pagamento (gerado quando necessário)';

