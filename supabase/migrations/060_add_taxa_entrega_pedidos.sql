-- Migration 060: Adicionar campo taxa_entrega para pedidos
-- Armazena a taxa de entrega aplicada no pedido

-- Adicionar coluna taxa_entrega
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS taxa_entrega DECIMAL(10, 2) DEFAULT 0.00 CHECK (taxa_entrega >= 0);

-- Comentário
COMMENT ON COLUMN public.pedidos.taxa_entrega IS 'Taxa de entrega aplicada quando cliente escolheu receber no endereço (em reais)';






















