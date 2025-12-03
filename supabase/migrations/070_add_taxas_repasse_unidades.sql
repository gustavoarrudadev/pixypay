-- Migration 070: Adicionar campos de taxas de repasse por unidade
-- Permite que cada unidade tenha suas próprias taxas de repasse (percentual e fixa)

-- Adicionar campos de taxas na tabela unidades_revenda
ALTER TABLE public.unidades_revenda 
ADD COLUMN IF NOT EXISTS taxa_repasse_percentual DECIMAL(5, 2) CHECK (taxa_repasse_percentual IS NULL OR (taxa_repasse_percentual >= 0 AND taxa_repasse_percentual <= 100)),
ADD COLUMN IF NOT EXISTS taxa_repasse_fixa DECIMAL(10, 2) DEFAULT 0.50 CHECK (taxa_repasse_fixa IS NULL OR taxa_repasse_fixa >= 0);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_unidades_revenda_taxa_repasse_percentual ON public.unidades_revenda(taxa_repasse_percentual) WHERE taxa_repasse_percentual IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.unidades_revenda.taxa_repasse_percentual IS 'Taxa percentual de repasse específica da unidade. Se NULL, usa a taxa da configuração da revenda para a modalidade selecionada.';
COMMENT ON COLUMN public.unidades_revenda.taxa_repasse_fixa IS 'Taxa fixa de repasse específica da unidade em reais. Se NULL, usa a taxa da configuração da revenda para a modalidade selecionada.';


















