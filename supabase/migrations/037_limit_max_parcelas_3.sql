-- Migration 037: Limitar máximo de parcelas para 3
-- Atualiza produtos existentes e adiciona constraint

-- Atualiza produtos que têm mais de 3 parcelas para 3
UPDATE public.produtos 
SET max_parcelas = 3 
WHERE max_parcelas > 3;

-- Adiciona constraint para garantir que max_parcelas não seja maior que 3
ALTER TABLE public.produtos 
DROP CONSTRAINT IF EXISTS produtos_max_parcelas_check;

ALTER TABLE public.produtos 
ADD CONSTRAINT produtos_max_parcelas_check 
CHECK (max_parcelas >= 1 AND max_parcelas <= 3);

-- Comentário explicativo
COMMENT ON COLUMN public.produtos.max_parcelas IS 'Número máximo de parcelas permitidas para este produto. Padrão: 1 (apenas à vista), máximo: 3 parcelas';

