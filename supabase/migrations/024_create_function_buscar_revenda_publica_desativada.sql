-- Migration 024: Criar função RPC para buscar revenda pública mesmo quando desativada
-- Esta migration já foi aplicada anteriormente, mas mantém aqui para histórico

-- A função já existe, apenas verifica se precisa ser recriada
CREATE OR REPLACE FUNCTION public.buscar_revenda_publica_desativada(p_link_publico VARCHAR)
RETURNS TABLE (
  id UUID,
  nome_revenda VARCHAR,
  nome_publico VARCHAR,
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
    r.logo_url,
    r.link_publico,
    r.link_publico_ativo
  FROM public.revendas r
  WHERE r.link_publico = p_link_publico
    AND r.link_publico IS NOT NULL
  LIMIT 1;
END;
$$;

-- Permite acesso público à função
GRANT EXECUTE ON FUNCTION public.buscar_revenda_publica_desativada(VARCHAR) TO anon, authenticated;

