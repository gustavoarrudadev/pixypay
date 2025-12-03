-- Migration 059: Adicionar campo taxa_entrega para revendas
-- Permite que cada revenda configure sua própria taxa de entrega

-- Adicionar coluna taxa_entrega
ALTER TABLE public.revendas 
ADD COLUMN IF NOT EXISTS taxa_entrega DECIMAL(10, 2) DEFAULT 0.00 CHECK (taxa_entrega >= 0);

-- Comentário
COMMENT ON COLUMN public.revendas.taxa_entrega IS 'Taxa de entrega cobrada quando cliente escolhe receber no endereço (em reais)';






















