-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO - PRODUTOS E LOJA PÚBLICA
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR TABELA DE PRODUTOS
-- =====================================================

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

DROP TRIGGER IF EXISTS set_timestamp_produtos ON public.produtos;
CREATE TRIGGER set_timestamp_produtos
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp_produtos();

-- Habilitar RLS na tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Política: Revendas podem ver apenas seus próprios produtos
DROP POLICY IF EXISTS "Revendas podem ver seus produtos" ON public.produtos;
CREATE POLICY "Revendas podem ver seus produtos"
ON public.produtos FOR SELECT
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Revendas podem inserir produtos apenas para si mesmas
DROP POLICY IF EXISTS "Revendas podem criar produtos" ON public.produtos;
CREATE POLICY "Revendas podem criar produtos"
ON public.produtos FOR INSERT
WITH CHECK (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Revendas podem atualizar apenas seus produtos
DROP POLICY IF EXISTS "Revendas podem atualizar seus produtos" ON public.produtos;
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
DROP POLICY IF EXISTS "Revendas podem excluir seus produtos" ON public.produtos;
CREATE POLICY "Revendas podem excluir seus produtos"
ON public.produtos FOR DELETE
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins podem ver todos os produtos
DROP POLICY IF EXISTS "Admins podem ver todos os produtos" ON public.produtos;
CREATE POLICY "Admins podem ver todos os produtos"
ON public.produtos FOR SELECT
USING (
  (SELECT eh_admin(auth.uid()))
);

-- Política: Admins podem gerenciar todos os produtos
DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON public.produtos;
CREATE POLICY "Admins podem gerenciar produtos"
ON public.produtos FOR ALL
USING (
  (SELECT eh_admin(auth.uid()))
)
WITH CHECK (
  (SELECT eh_admin(auth.uid()))
);

-- Política: Acesso público para produtos ativos (para loja pública)
DROP POLICY IF EXISTS "Produtos ativos são públicos" ON public.produtos;
CREATE POLICY "Produtos ativos são públicos"
ON public.produtos FOR SELECT
USING (ativo = true);

-- Comentários nas colunas para documentação
COMMENT ON TABLE public.produtos IS 'Tabela de produtos cadastrados pelas revendas';
COMMENT ON COLUMN public.produtos.revenda_id IS 'ID da revenda proprietária do produto';
COMMENT ON COLUMN public.produtos.preco IS 'Preço do produto em reais (DECIMAL com 2 casas decimais)';
COMMENT ON COLUMN public.produtos.imagem_url IS 'URL da imagem do produto no Supabase Storage';
COMMENT ON COLUMN public.produtos.ativo IS 'Indica se o produto está ativo e visível na loja pública';

-- =====================================================
-- PARTE 2: ADICIONAR CAMPOS DE PRESENÇA NA REVENDA
-- =====================================================

-- Adicionar campos de presença na loja
DO $$ 
BEGIN
  -- Link público (slug único para acesso à loja)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'link_publico'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN link_publico VARCHAR(100) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_revendas_link_publico ON public.revendas(link_publico);
    RAISE NOTICE 'Campo link_publico adicionado';
  END IF;

  -- Nome público (nome que aparece na loja pública)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'nome_publico'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN nome_publico VARCHAR(255);
    RAISE NOTICE 'Campo nome_publico adicionado';
  END IF;

  -- URL da logo da revenda
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN logo_url TEXT;
    RAISE NOTICE 'Campo logo_url adicionado';
  END IF;
END $$;

-- Política: Revendas podem atualizar seus próprios campos de presença
DROP POLICY IF EXISTS "Revendas podem atualizar presença" ON public.revendas;
CREATE POLICY "Revendas podem atualizar presença"
ON public.revendas FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Garante que link_publico seja único se fornecido
  (link_publico IS NULL OR link_publico NOT IN (
    SELECT link_publico FROM public.revendas 
    WHERE id != revendas.id AND link_publico IS NOT NULL
  ))
);

-- Política: Acesso público para ler dados de presença (necessário para loja pública)
DROP POLICY IF EXISTS "Dados de presença são públicos" ON public.revendas;
CREATE POLICY "Dados de presença são públicos"
ON public.revendas FOR SELECT
USING (link_publico IS NOT NULL);

-- Função auxiliar para validar link público único
CREATE OR REPLACE FUNCTION validar_link_publico_unico(
  p_link_publico VARCHAR,
  p_revenda_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Se link_publico for NULL, é válido (opcional)
  IF p_link_publico IS NULL THEN
    RETURN true;
  END IF;

  -- Verifica se já existe outro revenda com o mesmo link
  RETURN NOT EXISTS (
    SELECT 1 FROM public.revendas
    WHERE link_publico = p_link_publico
    AND id != p_revenda_id
  );
END;
$$ LANGUAGE plpgsql;

-- Comentários nas colunas
COMMENT ON COLUMN public.revendas.link_publico IS 'Slug único para acesso público à loja (ex: revenda-exemplo)';
COMMENT ON COLUMN public.revendas.nome_publico IS 'Nome que aparece na loja pública';
COMMENT ON COLUMN public.revendas.logo_url IS 'URL da logo da revenda no Supabase Storage';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

