-- Migration 022: Criar função RPC para buscar revenda pública
-- Esta função bypassa RLS e permite acesso público seguro

CREATE OR REPLACE FUNCTION public.buscar_revenda_publica(p_link_publico VARCHAR)
RETURNS TABLE (
  id UUID,
  nome_revenda VARCHAR,
  nome_publico VARCHAR,
  descricao_loja TEXT,
  logo_url TEXT,
  link_publico VARCHAR,
  link_publico_ativo BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.nome_revenda,
    r.nome_publico,
    r.descricao_loja,
    r.logo_url,
    r.link_publico,
    r.link_publico_ativo
  FROM public.revendas r
  WHERE r.link_publico = p_link_publico
    AND r.link_publico IS NOT NULL
    AND (r.link_publico_ativo = true OR r.link_publico_ativo IS NULL)
  LIMIT 1;
END;
$$;

-- Permite acesso público à função
GRANT EXECUTE ON FUNCTION public.buscar_revenda_publica(VARCHAR) TO anon, authenticated;

COMMENT ON FUNCTION public.buscar_revenda_publica(VARCHAR) IS 
'Busca dados públicos de uma revenda por link público. Retorna apenas se link_publico_ativo = true ou NULL. Função pública que bypassa RLS para acesso seguro.';

