-- Migration 068: Adicionar campo unidade_id na tabela agendamentos_entrega
-- Permite filtrar agendamentos por unidade

-- Adicionar campo unidade_id na tabela agendamentos_entrega
ALTER TABLE public.agendamentos_entrega 
ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES public.unidades_revenda(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance nas consultas por unidade
CREATE INDEX IF NOT EXISTS idx_agendamentos_entrega_unidade_id ON public.agendamentos_entrega(unidade_id);

-- Comentário
COMMENT ON COLUMN public.agendamentos_entrega.unidade_id IS 'ID da unidade do pedido. Permite filtrar agendamentos por unidade.';

-- Migrar dados existentes: preencher unidade_id com base no pedido
UPDATE public.agendamentos_entrega ae
SET unidade_id = p.unidade_id
FROM public.pedidos p
WHERE ae.pedido_id = p.id
  AND p.unidade_id IS NOT NULL
  AND ae.unidade_id IS NULL;



















