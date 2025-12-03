-- Migration 040: Criar tabela de configurações de repasse por revenda
-- Armazena as configurações de modalidade de repasse de cada revenda

CREATE TABLE IF NOT EXISTS public.configuracoes_repasse_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  modalidade VARCHAR(10) NOT NULL CHECK (modalidade IN ('D+1', 'D+15', 'D+30')),
  taxa_percentual DECIMAL(5, 2) NOT NULL CHECK (taxa_percentual >= 0 AND taxa_percentual <= 100),
  taxa_fixa DECIMAL(10, 2) NOT NULL DEFAULT 0.50 CHECK (taxa_fixa >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(revenda_id, modalidade)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_configuracoes_repasse_revenda_id ON public.configuracoes_repasse_revenda(revenda_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_repasse_ativo ON public.configuracoes_repasse_revenda(ativo);
CREATE INDEX IF NOT EXISTS idx_configuracoes_repasse_modalidade ON public.configuracoes_repasse_revenda(modalidade);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_set_timestamp_configuracoes_repasse()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_configuracoes_repasse ON public.configuracoes_repasse_revenda;
CREATE TRIGGER set_timestamp_configuracoes_repasse
BEFORE UPDATE ON public.configuracoes_repasse_revenda
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp_configuracoes_repasse();

-- Habilitar RLS
ALTER TABLE public.configuracoes_repasse_revenda ENABLE ROW LEVEL SECURITY;

-- Política: Revendas veem suas próprias configurações
CREATE POLICY "Revendas veem suas configurações de repasse"
ON public.configuracoes_repasse_revenda FOR SELECT
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins veem todas as configurações
CREATE POLICY "Admins veem todas as configurações de repasse"
ON public.configuracoes_repasse_revenda FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Admins podem inserir configurações
CREATE POLICY "Admins podem criar configurações de repasse"
ON public.configuracoes_repasse_revenda FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Admins podem atualizar configurações
CREATE POLICY "Admins podem atualizar configurações de repasse"
ON public.configuracoes_repasse_revenda FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.configuracoes_repasse_revenda IS 'Configurações de modalidade de repasse por revenda';
COMMENT ON COLUMN public.configuracoes_repasse_revenda.modalidade IS 'Modalidade de repasse: D+1 (24h), D+15 (15 dias), D+30 (30 dias)';
COMMENT ON COLUMN public.configuracoes_repasse_revenda.taxa_percentual IS 'Taxa percentual aplicada sobre o valor do pedido';
COMMENT ON COLUMN public.configuracoes_repasse_revenda.taxa_fixa IS 'Taxa fixa em reais aplicada por transação';
COMMENT ON COLUMN public.configuracoes_repasse_revenda.ativo IS 'Indica se esta configuração está ativa para a revenda';

