-- Função para buscar detalhes completos de uma revenda específica
CREATE OR REPLACE FUNCTION public.buscar_detalhes_revenda(revenda_id UUID)
RETURNS TABLE (
  id UUID,
  nome_revenda VARCHAR,
  cnpj VARCHAR,
  nome_responsavel VARCHAR,
  cpf_responsavel VARCHAR,
  telefone VARCHAR,
  cep VARCHAR,
  logradouro VARCHAR,
  numero VARCHAR,
  complemento VARCHAR,
  bairro VARCHAR,
  cidade VARCHAR,
  estado VARCHAR,
  marcas_trabalhadas JSONB,
  user_id UUID,
  criado_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ,
  email TEXT,
  email_confirmado BOOLEAN,
  conta_pix_nome_completo VARCHAR,
  conta_pix_cpf_cnpj VARCHAR,
  conta_pix_chave VARCHAR,
  conta_pix_tipo VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.nome_revenda,
    r.cnpj,
    r.nome_responsavel,
    r.cpf_responsavel,
    r.telefone,
    r.cep,
    r.logradouro,
    r.numero,
    r.complemento,
    r.bairro,
    r.cidade,
    r.estado,
    r.marcas_trabalhadas,
    r.user_id,
    r.criado_em,
    r.atualizado_em,
    COALESCE(au.email::TEXT, ''::TEXT) as email,
    (au.email_confirmed_at IS NOT NULL) as email_confirmado,
    r.conta_pix_nome_completo,
    r.conta_pix_cpf_cnpj,
    r.conta_pix_chave,
    r.conta_pix_tipo
  FROM public.revendas r
  LEFT JOIN auth.users au ON r.user_id = au.id
  WHERE r.id = revenda_id;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.buscar_detalhes_revenda(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_detalhes_revenda(UUID) TO anon;

