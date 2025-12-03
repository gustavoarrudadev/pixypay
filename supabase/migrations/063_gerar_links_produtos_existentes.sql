-- Migration 063: Gerar links públicos para produtos existentes que não têm link_publico
-- Atualiza produtos existentes para terem link_publico baseado no nome

-- Função RPC para gerar link para um produto específico
CREATE OR REPLACE FUNCTION public.gerar_link_produto_existente(p_produto_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenda_id UUID;
  v_nome VARCHAR;
  v_link_publico TEXT;
BEGIN
  -- Busca dados do produto
  SELECT revenda_id, nome INTO v_revenda_id, v_nome
  FROM public.produtos
  WHERE id = p_produto_id;
  
  IF v_revenda_id IS NULL OR v_nome IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Gera o link público
  v_link_publico := public.gerar_link_publico_produto(v_revenda_id, v_nome, p_produto_id);
  
  -- Atualiza o produto
  UPDATE public.produtos
  SET link_publico = v_link_publico
  WHERE id = p_produto_id;
  
  RETURN v_link_publico;
END;
$$;

-- Permite acesso à função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.gerar_link_produto_existente(UUID) TO authenticated;

-- Atualiza produtos que não têm link_publico
UPDATE public.produtos
SET link_publico = public.gerar_link_publico_produto(revenda_id, nome, id)
WHERE link_publico IS NULL OR link_publico = '';

-- Comentário
COMMENT ON COLUMN public.produtos.link_publico IS 'Link público único do produto (slug). Gerado automaticamente baseado no nome do produto. Atualizado automaticamente quando o nome muda.';
COMMENT ON FUNCTION public.gerar_link_produto_existente(UUID) IS 'Gera e atualiza o link público de um produto existente baseado no nome';

