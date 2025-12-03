-- Migration 044: Inserir configurações padrão de repasse para todas as revendas existentes
-- Cria as três modalidades padrão (D+1, D+15, D+30) para cada revenda

INSERT INTO public.configuracoes_repasse_revenda (revenda_id, modalidade, taxa_percentual, taxa_fixa, ativo)
SELECT 
  id as revenda_id,
  'D+1' as modalidade,
  8.00 as taxa_percentual,
  0.50 as taxa_fixa,
  false as ativo -- Por padrão, D+30 será ativo
FROM public.revendas
ON CONFLICT (revenda_id, modalidade) DO NOTHING;

INSERT INTO public.configuracoes_repasse_revenda (revenda_id, modalidade, taxa_percentual, taxa_fixa, ativo)
SELECT 
  id as revenda_id,
  'D+15' as modalidade,
  6.50 as taxa_percentual,
  0.50 as taxa_fixa,
  false as ativo
FROM public.revendas
ON CONFLICT (revenda_id, modalidade) DO NOTHING;

INSERT INTO public.configuracoes_repasse_revenda (revenda_id, modalidade, taxa_percentual, taxa_fixa, ativo)
SELECT 
  id as revenda_id,
  'D+30' as modalidade,
  5.00 as taxa_percentual,
  0.50 as taxa_fixa,
  true as ativo -- D+30 é a modalidade padrão inicial
FROM public.revendas
ON CONFLICT (revenda_id, modalidade) DO NOTHING;

-- Comentário
COMMENT ON TABLE public.configuracoes_repasse_revenda IS 'Configurações padrão: D+1 (8% + R$0,50), D+15 (6,5% + R$0,50), D+30 (5% + R$0,50). D+30 é ativo por padrão.';

