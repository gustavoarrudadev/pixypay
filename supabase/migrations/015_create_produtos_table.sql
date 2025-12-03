-- Migration 015: Criar tabela de produtos para revendas
-- Esta migration cria a tabela produtos vinculada à tabela revendas
-- e configura todas as políticas RLS necessárias

-- Criar tabela produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_revenda_id ON public.produtos(revenda_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_criado_em ON public.produtos(criado_em DESC);

-- Criar trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp_produtos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_produtos
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_produtos();

-- Habilitar RLS na tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Política: Revendas podem ver apenas seus próprios produtos
CREATE POLICY "Revendas podem ver seus produtos"
ON public.produtos FOR SELECT
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Revendas podem inserir produtos apenas para si mesmas
CREATE POLICY "Revendas podem criar produtos"
ON public.produtos FOR INSERT
WITH CHECK (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Revendas podem atualizar apenas seus produtos
CREATE POLICY "Revendas podem atualizar seus produtos"
ON public.produtos FOR UPDATE
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Revendas podem excluir apenas seus produtos
CREATE POLICY "Revendas podem excluir seus produtos"
ON public.produtos FOR DELETE
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins podem ver todos os produtos
CREATE POLICY "Admins podem ver todos os produtos"
ON public.produtos FOR SELECT
USING (
  (SELECT eh_admin(auth.uid()))
);

-- Política: Admins podem gerenciar todos os produtos
CREATE POLICY "Admins podem gerenciar produtos"
ON public.produtos FOR ALL
USING (
  (SELECT eh_admin(auth.uid()))
)
WITH CHECK (
  (SELECT eh_admin(auth.uid()))
);

-- Política: Acesso público para produtos ativos (para loja pública)
-- Esta política permite que qualquer pessoa veja produtos ativos
-- mesmo sem autenticação (necessário para a loja pública)
CREATE POLICY "Produtos ativos são públicos"
ON public.produtos FOR SELECT
USING (ativo = true);

-- Comentários nas colunas para documentação
COMMENT ON TABLE public.produtos IS 'Tabela de produtos cadastrados pelas revendas';
COMMENT ON COLUMN public.produtos.revenda_id IS 'ID da revenda proprietária do produto';
COMMENT ON COLUMN public.produtos.preco IS 'Preço do produto em reais (DECIMAL com 2 casas decimais)';
COMMENT ON COLUMN public.produtos.imagem_url IS 'URL da imagem do produto no Supabase Storage';
COMMENT ON COLUMN public.produtos.ativo IS 'Indica se o produto está ativo e visível na loja pública';

