-- Migration 050: Adicionar campos de bloqueio e antecipação em transacoes_financeiras
-- Permite bloquear repasses e antecipar datas de repasse

-- Adicionar campos de bloqueio
ALTER TABLE public.transacoes_financeiras
ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bloqueado_motivo TEXT,
ADD COLUMN IF NOT EXISTS antecipado BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS data_repasse_antecipada DATE;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_transacoes_bloqueado ON public.transacoes_financeiras(bloqueado);
CREATE INDEX IF NOT EXISTS idx_transacoes_antecipado ON public.transacoes_financeiras(antecipado);
CREATE INDEX IF NOT EXISTS idx_transacoes_data_repasse_antecipada ON public.transacoes_financeiras(data_repasse_antecipada);

-- Comentários
COMMENT ON COLUMN public.transacoes_financeiras.bloqueado IS 'Indica se o repasse está bloqueado';
COMMENT ON COLUMN public.transacoes_financeiras.bloqueado_motivo IS 'Motivo do bloqueio do repasse';
COMMENT ON COLUMN public.transacoes_financeiras.antecipado IS 'Indica se o repasse foi antecipado';
COMMENT ON COLUMN public.transacoes_financeiras.data_repasse_antecipada IS 'Nova data de repasse quando antecipado';

