-- Migration 042: Criar tabela de repasses
-- Registra os repasses realizados para as revendas

CREATE TABLE IF NOT EXISTS public.repasses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
  quantidade_transacoes INTEGER NOT NULL CHECK (quantidade_transacoes > 0),
  data_repasse DATE NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  criado_por UUID REFERENCES public.usuarios(id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_repasses_revenda_id ON public.repasses(revenda_id);
CREATE INDEX IF NOT EXISTS idx_repasses_data_repasse ON public.repasses(data_repasse);
CREATE INDEX IF NOT EXISTS idx_repasses_criado_por ON public.repasses(criado_por);

-- Habilitar RLS
ALTER TABLE public.repasses ENABLE ROW LEVEL SECURITY;

-- Política: Revendas veem seus próprios repasses
CREATE POLICY "Revendas veem seus repasses"
ON public.repasses FOR SELECT
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins veem todos os repasses
CREATE POLICY "Admins veem todos os repasses"
ON public.repasses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Admins podem criar repasses
CREATE POLICY "Admins podem criar repasses"
ON public.repasses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Admins podem atualizar repasses
CREATE POLICY "Admins podem atualizar repasses"
ON public.repasses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.repasses IS 'Repasses realizados para as revendas';
COMMENT ON COLUMN public.repasses.valor_total IS 'Valor total repassado';
COMMENT ON COLUMN public.repasses.quantidade_transacoes IS 'Quantidade de transações incluídas no repasse';
COMMENT ON COLUMN public.repasses.data_repasse IS 'Data em que o repasse foi realizado';
COMMENT ON COLUMN public.repasses.criado_por IS 'ID do admin que criou o repasse';

