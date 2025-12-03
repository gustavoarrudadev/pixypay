-- Migration 073: Atualizar função buscar_produto_publico para incluir max_parcelas e campos de unidade
-- Esta migration atualiza a função para retornar max_parcelas, unidade_id e dados da unidade quando disponível

CREATE OR REPLACE FUNCTION public.buscar_produto_publico(
  p_link_revenda VARCHAR,
  p_link_produto VARCHAR
)
RETURNS TABLE (
  id UUID,
  revenda_id UUID,
  unidade_id UUID,
  nome VARCHAR,
  descricao TEXT,
  preco DECIMAL,
  imagem_url TEXT,
  ativo BOOLEAN,
  link_publico VARCHAR,
  max_parcelas INTEGER,
  dias_segunda_parcela INTEGER,
  nome_revenda VARCHAR,
  link_publico_revenda VARCHAR,
  nome_unidade VARCHAR,
  link_publico_unidade VARCHAR
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
    p.unidade_id,
    p.nome,
    p.descricao,
    p.preco,
    p.imagem_url,
    p.ativo,
    p.link_publico,
    COALESCE(p.max_parcelas, 1) as max_parcelas,
    p.dias_segunda_parcela,
    r.nome_revenda,
    r.link_publico as link_publico_revenda,
    u.nome as nome_unidade,
    u.link_publico as link_publico_unidade
  FROM public.produtos p
  INNER JOIN public.revendas r ON r.id = p.revenda_id
  LEFT JOIN public.unidades_revenda u ON u.id = p.unidade_id
  WHERE (
    -- Busca por link da revenda OU link da unidade
    (r.link_publico = p_link_revenda OR u.link_publico = p_link_revenda)
    AND p.link_publico = p_link_produto
    AND p.ativo = true
    AND (
      -- Se tem unidade, verifica se a unidade está ativa
      (p.unidade_id IS NOT NULL AND (u.ativo = true OR u.ativo IS NULL))
      OR
      -- Se não tem unidade, verifica se a revenda está ativa
      (p.unidade_id IS NULL AND (r.link_publico_ativo = true OR r.link_publico_ativo IS NULL))
    )
  )
  LIMIT 1;
END;
$$;

-- Permite acesso público à função
GRANT EXECUTE ON FUNCTION public.buscar_produto_publico(VARCHAR, VARCHAR) TO anon, authenticated;

-- Comentário atualizado
COMMENT ON FUNCTION public.buscar_produto_publico(VARCHAR, VARCHAR) IS 'Busca produto público por link da revenda/unidade e link do produto. Retorna apenas produtos ativos de revendas/unidades ativas. Inclui max_parcelas e dados da unidade quando disponível.';

