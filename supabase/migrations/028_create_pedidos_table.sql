-- Migration 028: Criar tabela de pedidos
-- Armazena os pedidos realizados pelos clientes

CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'preparando', 'pronto', 'em_transito', 'entregue', 'cancelado')),
  forma_pagamento VARCHAR(50) NOT NULL CHECK (forma_pagamento IN ('pix_vista', 'pix_parcelado')),
  parcelas_total INTEGER CHECK (parcelas_total IS NULL OR parcelas_total > 0), -- NULL se pix_vista
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
  valor_entrada DECIMAL(10, 2) CHECK (valor_entrada IS NULL OR valor_entrada >= 0), -- Primeira parcela se parcelado
  tipo_entrega VARCHAR(50) NOT NULL CHECK (tipo_entrega IN ('retirar_local', 'receber_endereco', 'agendar')),
  endereco_entrega_id UUID REFERENCES public.enderecos_entrega(id),
  agendamento_entrega_id UUID, -- Referência será criada na migration de agendamentos
  observacoes TEXT,
  dados_cliente JSONB NOT NULL, -- Nome, telefone, email, CPF no momento do pedido
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_revenda_id ON public.pedidos(revenda_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON public.pedidos(criado_em DESC);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_pedidos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_pedidos ON public.pedidos;
CREATE TRIGGER set_timestamp_pedidos
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_pedidos();

-- Habilitar RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Política: Clientes veem apenas seus pedidos
CREATE POLICY "Clientes veem seus pedidos"
ON public.pedidos FOR SELECT
USING (cliente_id = auth.uid());

-- Política: Clientes podem criar pedidos
CREATE POLICY "Clientes podem criar pedidos"
ON public.pedidos FOR INSERT
WITH CHECK (cliente_id = auth.uid());

-- Política: Revendas veem apenas pedidos de sua revenda
CREATE POLICY "Revendas veem seus pedidos"
ON public.pedidos FOR SELECT
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Revendas podem atualizar status de seus pedidos
CREATE POLICY "Revendas podem atualizar pedidos"
ON public.pedidos FOR UPDATE
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins veem todos os pedidos
CREATE POLICY "Admins veem todos os pedidos"
ON public.pedidos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Admins podem atualizar todos os pedidos
CREATE POLICY "Admins podem atualizar todos os pedidos"
ON public.pedidos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.pedidos IS 'Pedidos realizados pelos clientes';
COMMENT ON COLUMN public.pedidos.status IS 'Status do pedido: pendente, confirmado, preparando, pronto, em_transito, entregue, cancelado';
COMMENT ON COLUMN public.pedidos.forma_pagamento IS 'Forma de pagamento: pix_vista ou pix_parcelado';
COMMENT ON COLUMN public.pedidos.parcelas_total IS 'Total de parcelas (NULL se pix_vista)';
COMMENT ON COLUMN public.pedidos.valor_entrada IS 'Valor da entrada/primeira parcela (se parcelado)';
COMMENT ON COLUMN public.pedidos.tipo_entrega IS 'Tipo de entrega: retirar_local, receber_endereco, agendar';
COMMENT ON COLUMN public.pedidos.dados_cliente IS 'Dados do cliente no momento do pedido (JSON)';

