-- Migration 043: Criar tabela de relacionamento repasses-transações
-- Relaciona repasses com suas transações financeiras

CREATE TABLE IF NOT EXISTS public.repasses_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repasse_id UUID NOT NULL REFERENCES public.repasses(id) ON DELETE CASCADE,
  transacao_id UUID NOT NULL REFERENCES public.transacoes_financeiras(id) ON DELETE CASCADE,
  UNIQUE(repasse_id, transacao_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_repasses_transacoes_repasse_id ON public.repasses_transacoes(repasse_id);
CREATE INDEX IF NOT EXISTS idx_repasses_transacoes_transacao_id ON public.repasses_transacoes(transacao_id);

-- Adicionar foreign key na tabela transacoes_financeiras
ALTER TABLE public.transacoes_financeiras
ADD CONSTRAINT fk_transacoes_repasse
FOREIGN KEY (repasse_id) REFERENCES public.repasses(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.repasses_transacoes ENABLE ROW LEVEL SECURITY;

-- Política: Revendas veem relacionamentos de seus repasses
CREATE POLICY "Revendas veem relacionamentos de seus repasses"
ON public.repasses_transacoes FOR SELECT
USING (
  repasse_id IN (
    SELECT id FROM public.repasses 
    WHERE revenda_id IN (
      SELECT id FROM public.revendas WHERE user_id = auth.uid()
    )
  )
);

-- Política: Admins veem todos os relacionamentos
CREATE POLICY "Admins veem todos os relacionamentos repasses-transações"
ON public.repasses_transacoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Admins podem criar relacionamentos
CREATE POLICY "Admins podem criar relacionamentos repasses-transações"
ON public.repasses_transacoes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.repasses_transacoes IS 'Relacionamento entre repasses e transações financeiras';
COMMENT ON COLUMN public.repasses_transacoes.repasse_id IS 'ID do repasse';
COMMENT ON COLUMN public.repasses_transacoes.transacao_id IS 'ID da transação financeira incluída no repasse';

