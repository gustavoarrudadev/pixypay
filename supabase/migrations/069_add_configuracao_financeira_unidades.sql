-- Migration 069: Adicionar configurações financeiras por unidade
-- Permite que cada unidade tenha sua própria conta PIX e modalidade de repasse

-- Adicionar campos de conta PIX na tabela unidades_revenda
ALTER TABLE public.unidades_revenda 
ADD COLUMN IF NOT EXISTS conta_pix_nome_completo VARCHAR(255),
ADD COLUMN IF NOT EXISTS conta_pix_cpf_cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS conta_pix_chave VARCHAR(255),
ADD COLUMN IF NOT EXISTS conta_pix_tipo VARCHAR(20) CHECK (conta_pix_tipo IN ('CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'CHAVE_ALEATORIA') OR conta_pix_tipo IS NULL);

-- Adicionar campo de modalidade de repasse na tabela unidades_revenda
ALTER TABLE public.unidades_revenda
ADD COLUMN IF NOT EXISTS modalidade_repasse VARCHAR(10) CHECK (modalidade_repasse IN ('D+1', 'D+15', 'D+30') OR modalidade_repasse IS NULL);

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_unidades_revenda_conta_pix_chave ON public.unidades_revenda(conta_pix_chave) WHERE conta_pix_chave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unidades_revenda_modalidade_repasse ON public.unidades_revenda(modalidade_repasse) WHERE modalidade_repasse IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.unidades_revenda.conta_pix_nome_completo IS 'Nome completo do titular da conta PIX da unidade';
COMMENT ON COLUMN public.unidades_revenda.conta_pix_cpf_cnpj IS 'CPF ou CNPJ do titular da conta PIX da unidade';
COMMENT ON COLUMN public.unidades_revenda.conta_pix_chave IS 'Chave PIX da unidade (CPF, CNPJ, Email, Telefone ou Chave Aleatória)';
COMMENT ON COLUMN public.unidades_revenda.conta_pix_tipo IS 'Tipo da chave PIX da unidade: CPF, CNPJ, EMAIL, TELEFONE ou CHAVE_ALEATORIA';
COMMENT ON COLUMN public.unidades_revenda.modalidade_repasse IS 'Modalidade de repasse da unidade: D+1 (24 horas), D+15 (15 dias) ou D+30 (30 dias)';


















