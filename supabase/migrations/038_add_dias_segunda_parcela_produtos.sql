-- Migration 038: Adicionar campo dias_segunda_parcela na tabela produtos
-- Permite que revendas configurem se a segunda parcela (quando for 2x) será em 15 ou 30 dias

ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS dias_segunda_parcela INTEGER DEFAULT 30 CHECK (dias_segunda_parcela IN (15, 30));

-- Comentário explicativo
COMMENT ON COLUMN public.produtos.dias_segunda_parcela IS 'Dias para vencimento da segunda parcela quando max_parcelas = 2. Valores permitidos: 15 ou 30 dias. Padrão: 30 dias';

