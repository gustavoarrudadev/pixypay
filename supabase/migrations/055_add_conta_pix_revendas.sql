-- Migration 055: Adicionar campos de conta PIX para revendas
-- Permite que revendas cadastrem sua conta PIX para recebimento

-- Adicionar colunas de conta PIX
ALTER TABLE public.revendas 
ADD COLUMN IF NOT EXISTS conta_pix_nome_completo VARCHAR(255),
ADD COLUMN IF NOT EXISTS conta_pix_cpf_cnpj VARCHAR(18),
ADD COLUMN IF NOT EXISTS conta_pix_chave VARCHAR(255),
ADD COLUMN IF NOT EXISTS conta_pix_tipo VARCHAR(20) CHECK (conta_pix_tipo IN ('CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'CHAVE_ALEATORIA'));

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_revendas_conta_pix_chave ON public.revendas(conta_pix_chave) WHERE conta_pix_chave IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.revendas.conta_pix_nome_completo IS 'Nome completo do titular da conta PIX';
COMMENT ON COLUMN public.revendas.conta_pix_cpf_cnpj IS 'CPF ou CNPJ do titular da conta PIX';
COMMENT ON COLUMN public.revendas.conta_pix_chave IS 'Chave PIX (CPF, CNPJ, Email, Telefone ou Chave Aleatória)';
COMMENT ON COLUMN public.revendas.conta_pix_tipo IS 'Tipo da chave PIX: CPF, CNPJ, EMAIL, TELEFONE ou CHAVE_ALEATORIA';

