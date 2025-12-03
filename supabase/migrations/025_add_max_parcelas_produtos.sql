-- Migration 025: Adicionar campo max_parcelas na tabela produtos
-- Permite que revendas configurem quantas vezes cada produto pode ser parcelado

ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS max_parcelas INTEGER DEFAULT 1 CHECK (max_parcelas >= 1);

-- Comentário explicativo
COMMENT ON COLUMN public.produtos.max_parcelas IS 'Número máximo de parcelas permitidas para este produto. Padrão: 1 (apenas à vista)';

