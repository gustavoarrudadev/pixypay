-- =====================================================
-- MIGRATION 017: Criar Tabela de Lojas Favoritas
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- Criar tabela lojas_favoritas
CREATE TABLE IF NOT EXISTS public.lojas_favoritas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cliente_id, revenda_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_cliente_id ON public.lojas_favoritas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_revenda_id ON public.lojas_favoritas(revenda_id);
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_criado_em ON public.lojas_favoritas(criado_em DESC);

-- Habilitar RLS
ALTER TABLE public.lojas_favoritas ENABLE ROW LEVEL SECURITY;

-- Política: Clientes podem ver apenas seus favoritos
DROP POLICY IF EXISTS "Clientes podem ver seus favoritos" ON public.lojas_favoritas;
CREATE POLICY "Clientes podem ver seus favoritos"
ON public.lojas_favoritas FOR SELECT
USING (auth.uid() = cliente_id);

-- Política: Clientes podem criar favoritos apenas para si mesmos
DROP POLICY IF EXISTS "Clientes podem criar favoritos" ON public.lojas_favoritas;
CREATE POLICY "Clientes podem criar favoritos"
ON public.lojas_favoritas FOR INSERT
WITH CHECK (auth.uid() = cliente_id);

-- Política: Clientes podem excluir apenas seus favoritos
DROP POLICY IF EXISTS "Clientes podem excluir favoritos" ON public.lojas_favoritas;
CREATE POLICY "Clientes podem excluir favoritos"
ON public.lojas_favoritas FOR DELETE
USING (auth.uid() = cliente_id);

-- Comentários na tabela
COMMENT ON TABLE public.lojas_favoritas IS 'Armazena as lojas (revendas) favoritas dos clientes';
COMMENT ON COLUMN public.lojas_favoritas.cliente_id IS 'ID do cliente (referência a auth.users)';
COMMENT ON COLUMN public.lojas_favoritas.revenda_id IS 'ID da revenda favoritada';
COMMENT ON COLUMN public.lojas_favoritas.criado_em IS 'Data e hora em que a loja foi adicionada aos favoritos';

