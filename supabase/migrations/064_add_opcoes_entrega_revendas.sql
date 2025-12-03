-- Migration 064: Adicionar campos de opções de entrega para revendas
-- Permite que cada revenda escolha quais opções de entrega oferecer no checkout

-- Adicionar colunas para opções de entrega
ALTER TABLE public.revendas
ADD COLUMN IF NOT EXISTS oferecer_entrega BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS oferecer_retirada_local BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS oferecer_agendamento BOOLEAN DEFAULT true NOT NULL;

-- Comentários
COMMENT ON COLUMN public.revendas.oferecer_entrega IS 'Se true, revenda oferece opção de entrega no endereço do cliente no checkout';
COMMENT ON COLUMN public.revendas.oferecer_retirada_local IS 'Se true, revenda oferece opção de retirada no local no checkout';
COMMENT ON COLUMN public.revendas.oferecer_agendamento IS 'Se true, revenda oferece opção de agendamento de entrega no checkout (requer oferecer_entrega = true)';

-- Garantir que pelo menos uma opção esteja habilitada (constraint lógica no frontend)
-- Não criamos constraint no banco para permitir flexibilidade, mas validamos no frontend






















