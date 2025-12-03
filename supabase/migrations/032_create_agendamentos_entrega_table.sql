-- Migration 032: Criar tabela de agendamentos de entrega
-- Armazena agendamentos de entrega vinculados a pedidos

CREATE TABLE IF NOT EXISTS public.agendamentos_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data_agendamento DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  observacoes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'realizado', 'cancelado')),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_agendamentos_entrega_pedido_id ON public.agendamentos_entrega(pedido_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_entrega_revenda_id ON public.agendamentos_entrega(revenda_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_entrega_cliente_id ON public.agendamentos_entrega(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_entrega_data ON public.agendamentos_entrega(data_agendamento);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_agendamentos_entrega()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_agendamentos_entrega ON public.agendamentos_entrega;
CREATE TRIGGER set_timestamp_agendamentos_entrega
BEFORE UPDATE ON public.agendamentos_entrega
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_agendamentos_entrega();

-- Adicionar foreign key no pedidos (agendamento_entrega_id)
ALTER TABLE public.pedidos 
ADD CONSTRAINT fk_pedidos_agendamento_entrega 
FOREIGN KEY (agendamento_entrega_id) 
REFERENCES public.agendamentos_entrega(id);

-- Habilitar RLS
ALTER TABLE public.agendamentos_entrega ENABLE ROW LEVEL SECURITY;

-- Política: Clientes veem apenas seus agendamentos
CREATE POLICY "Clientes veem seus agendamentos"
ON public.agendamentos_entrega FOR SELECT
USING (cliente_id = auth.uid());

-- Política: Clientes podem criar agendamentos
CREATE POLICY "Clientes podem criar agendamentos"
ON public.agendamentos_entrega FOR INSERT
WITH CHECK (cliente_id = auth.uid());

-- Política: Revendas veem agendamentos de seus pedidos
CREATE POLICY "Revendas veem agendamentos de seus pedidos"
ON public.agendamentos_entrega FOR SELECT
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Revendas podem atualizar agendamentos de seus pedidos
CREATE POLICY "Revendas podem atualizar agendamentos"
ON public.agendamentos_entrega FOR UPDATE
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins veem todos os agendamentos
CREATE POLICY "Admins veem todos os agendamentos"
ON public.agendamentos_entrega FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.agendamentos_entrega IS 'Agendamentos de entrega vinculados a pedidos';
COMMENT ON COLUMN public.agendamentos_entrega.status IS 'Status: agendado, confirmado, realizado, cancelado';

