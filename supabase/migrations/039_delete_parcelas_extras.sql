-- Migration 039: Deletar parcelas 4+ de pedidos existentes
-- Mantém apenas as 3 primeiras parcelas de cada parcelamento

-- Deleta parcelas com numero_parcela > 3
DELETE FROM public.parcelas
WHERE numero_parcela > 3;

-- Atualiza total_parcelas nos parcelamentos para no máximo 3
UPDATE public.parcelamentos
SET total_parcelas = LEAST(total_parcelas, 3)
WHERE total_parcelas > 3;

-- Atualiza parcelas_total nos pedidos para no máximo 3
UPDATE public.pedidos
SET parcelas_total = LEAST(parcelas_total, 3)
WHERE parcelas_total > 3;

