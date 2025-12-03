-- Migration 041: Criar tabela de transações financeiras
-- Registra todas as transações financeiras relacionadas aos pedidos

CREATE TABLE IF NOT EXISTS public.transacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  valor_bruto DECIMAL(10, 2) NOT NULL CHECK (valor_bruto >= 0),
  taxa_percentual DECIMAL(5, 2) NOT NULL CHECK (taxa_percentual >= 0),
  taxa_fixa DECIMAL(10, 2) NOT NULL DEFAULT 0.50 CHECK (taxa_fixa >= 0),
  valor_liquido DECIMAL(10, 2) NOT NULL CHECK (valor_liquido >= 0),
  modalidade VARCHAR(10) NOT NULL CHECK (modalidade IN ('D+1', 'D+15', 'D+30')),
  data_pagamento TIMESTAMPTZ NOT NULL,
  data_repasse_prevista DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'liberado', 'repassado', 'cancelado')),
  repasse_id UUID, -- Será referenciado após criar tabela repasses
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_transacoes_pedido_id ON public.transacoes_financeiras(pedido_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_revenda_id ON public.transacoes_financeiras(revenda_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_cliente_id ON public.transacoes_financeiras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes_financeiras(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_data_repasse_prevista ON public.transacoes_financeiras(data_repasse_prevista);
CREATE INDEX IF NOT EXISTS idx_transacoes_modalidade ON public.transacoes_financeiras(modalidade);
CREATE INDEX IF NOT EXISTS idx_transacoes_repasse_id ON public.transacoes_financeiras(repasse_id);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_transacoes_financeiras()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_transacoes_financeiras ON public.transacoes_financeiras;
CREATE TRIGGER set_timestamp_transacoes_financeiras
BEFORE UPDATE ON public.transacoes_financeiras
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp_transacoes_financeiras();

-- Habilitar RLS
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Política: Revendas veem suas próprias transações
CREATE POLICY "Revendas veem suas transações financeiras"
ON public.transacoes_financeiras FOR SELECT
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins veem todas as transações
CREATE POLICY "Admins veem todas as transações financeiras"
ON public.transacoes_financeiras FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Sistema pode criar transações (via service role ou função)
-- Nota: Em produção, isso deve ser feito via Edge Function ou service role
CREATE POLICY "Sistema pode criar transações financeiras"
ON public.transacoes_financeiras FOR INSERT
WITH CHECK (true); -- Em produção, restringir para service role

-- Política: Admins podem atualizar transações
CREATE POLICY "Admins podem atualizar transações financeiras"
ON public.transacoes_financeiras FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.transacoes_financeiras IS 'Transações financeiras relacionadas aos pedidos';
COMMENT ON COLUMN public.transacoes_financeiras.valor_bruto IS 'Valor total do pedido antes das taxas';
COMMENT ON COLUMN public.transacoes_financeiras.taxa_percentual IS 'Taxa percentual aplicada';
COMMENT ON COLUMN public.transacoes_financeiras.taxa_fixa IS 'Taxa fixa aplicada';
COMMENT ON COLUMN public.transacoes_financeiras.valor_liquido IS 'Valor a ser repassado após descontar taxas';
COMMENT ON COLUMN public.transacoes_financeiras.modalidade IS 'Modalidade de repasse: D+1, D+15 ou D+30';
COMMENT ON COLUMN public.transacoes_financeiras.data_pagamento IS 'Data em que o pagamento foi confirmado';
COMMENT ON COLUMN public.transacoes_financeiras.data_repasse_prevista IS 'Data prevista para o repasse conforme modalidade';
COMMENT ON COLUMN public.transacoes_financeiras.status IS 'Status: pendente, liberado, repassado, cancelado';

