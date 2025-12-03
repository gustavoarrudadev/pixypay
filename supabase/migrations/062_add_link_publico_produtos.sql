-- Migration 062: Adicionar link público para produtos
-- Permite que cada produto tenha seu próprio link público único

-- Adicionar coluna link_publico na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS link_publico VARCHAR(255);

-- Criar índice único para link_publico (único por revenda)
CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_link_publico_revenda 
ON public.produtos(revenda_id, link_publico) 
WHERE link_publico IS NOT NULL;

-- Função para gerar slug a partir do nome do produto
CREATE OR REPLACE FUNCTION public.gerar_slug_produto(nome_produto TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Converte para minúsculas
  slug := lower(nome_produto);
  
  -- Remove acentos manualmente (substituição comum)
  slug := replace(slug, 'á', 'a');
  slug := replace(slug, 'à', 'a');
  slug := replace(slug, 'ã', 'a');
  slug := replace(slug, 'â', 'a');
  slug := replace(slug, 'é', 'e');
  slug := replace(slug, 'ê', 'e');
  slug := replace(slug, 'í', 'i');
  slug := replace(slug, 'î', 'i');
  slug := replace(slug, 'ó', 'o');
  slug := replace(slug, 'ô', 'o');
  slug := replace(slug, 'õ', 'o');
  slug := replace(slug, 'ú', 'u');
  slug := replace(slug, 'û', 'u');
  slug := replace(slug, 'ç', 'c');
  slug := replace(slug, 'ñ', 'n');
  
  -- Remove caracteres especiais, mantém apenas letras, números e espaços
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Substitui espaços e hífens múltiplos por um único hífen
  slug := regexp_replace(slug, '[\s-]+', '-', 'g');
  
  -- Remove hífens no início e fim
  slug := trim(both '-' from slug);
  
  -- Limita tamanho a 200 caracteres
  IF length(slug) > 200 THEN
    slug := left(slug, 200);
    -- Remove hífen do final se cortou no meio de uma palavra
    slug := rtrim(slug, '-');
  END IF;
  
  RETURN slug;
END;
$$;

-- Função para gerar link público único para produto
CREATE OR REPLACE FUNCTION public.gerar_link_publico_produto(
  p_revenda_id UUID,
  p_nome_produto TEXT,
  p_produto_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  contador INTEGER := 0;
  slug_existe BOOLEAN;
BEGIN
  -- Gera slug base do nome
  base_slug := public.gerar_slug_produto(p_nome_produto);
  
  -- Se slug está vazio, usa "produto"
  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'produto';
  END IF;
  
  final_slug := base_slug;
  
  -- Verifica se já existe produto com esse link na mesma revenda
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.produtos
      WHERE revenda_id = p_revenda_id
        AND link_publico = final_slug
        AND (p_produto_id IS NULL OR id != p_produto_id)
    ) INTO slug_existe;
    
    EXIT WHEN NOT slug_existe;
    
    -- Se existe, adiciona número no final
    contador := contador + 1;
    final_slug := base_slug || '-' || contador;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger para gerar link público automaticamente ao criar produto
CREATE OR REPLACE FUNCTION public.trigger_gerar_link_publico_produto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se link_publico não foi fornecido, gera automaticamente
  IF NEW.link_publico IS NULL OR NEW.link_publico = '' THEN
    NEW.link_publico := public.gerar_link_publico_produto(
      NEW.revenda_id,
      NEW.nome,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger antes de INSERT
DROP TRIGGER IF EXISTS trigger_gerar_link_produto_insert ON public.produtos;
CREATE TRIGGER trigger_gerar_link_produto_insert
BEFORE INSERT ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_gerar_link_publico_produto();

-- Trigger para atualizar link quando nome mudar
CREATE OR REPLACE FUNCTION public.trigger_atualizar_link_publico_produto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se o nome mudou, atualiza o link público
  IF OLD.nome IS DISTINCT FROM NEW.nome THEN
    NEW.link_publico := public.gerar_link_publico_produto(
      NEW.revenda_id,
      NEW.nome,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger antes de UPDATE
DROP TRIGGER IF EXISTS trigger_atualizar_link_produto_update ON public.produtos;
CREATE TRIGGER trigger_atualizar_link_produto_update
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_atualizar_link_publico_produto();

-- Função RPC para buscar produto público por link
CREATE OR REPLACE FUNCTION public.buscar_produto_publico(
  p_link_revenda VARCHAR,
  p_link_produto VARCHAR
)
RETURNS TABLE (
  id UUID,
  revenda_id UUID,
  nome VARCHAR,
  descricao TEXT,
  preco DECIMAL,
  imagem_url TEXT,
  ativo BOOLEAN,
  link_publico VARCHAR,
  nome_revenda VARCHAR,
  link_publico_revenda VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.revenda_id,
    p.nome,
    p.descricao,
    p.preco,
    p.imagem_url,
    p.ativo,
    p.link_publico,
    r.nome_revenda,
    r.link_publico as link_publico_revenda
  FROM public.produtos p
  INNER JOIN public.revendas r ON r.id = p.revenda_id
  WHERE r.link_publico = p_link_revenda
    AND p.link_publico = p_link_produto
    AND p.ativo = true
    AND r.link_publico_ativo = true
  LIMIT 1;
END;
$$;

-- Permite acesso público à função
GRANT EXECUTE ON FUNCTION public.buscar_produto_publico(VARCHAR, VARCHAR) TO anon, authenticated;

-- Comentários
COMMENT ON COLUMN public.produtos.link_publico IS 'Link público único do produto (slug). Gerado automaticamente baseado no nome do produto.';
COMMENT ON FUNCTION public.gerar_slug_produto(TEXT) IS 'Gera slug a partir do nome do produto, removendo acentos e caracteres especiais';
COMMENT ON FUNCTION public.gerar_link_publico_produto(UUID, TEXT, UUID) IS 'Gera link público único para produto, garantindo unicidade dentro da mesma revenda';
COMMENT ON FUNCTION public.buscar_produto_publico(VARCHAR, VARCHAR) IS 'Busca produto público por link da revenda e link do produto. Retorna apenas produtos ativos de revendas ativas.';

