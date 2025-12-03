-- Migration 075: Atualizar função listar_colaboradores_revenda para incluir informações de unidade

DROP FUNCTION IF EXISTS public.listar_colaboradores_revenda(UUID);

CREATE OR REPLACE FUNCTION public.listar_colaboradores_revenda(p_revenda_id UUID)
RETURNS TABLE (
  id UUID,
  usuario_id UUID,
  nome_completo TEXT,
  email TEXT,
  ativo BOOLEAN,
  criado_em TIMESTAMPTZ,
  criado_por_nome TEXT,
  unidade_id UUID,  -- Pode ser NULL
  nome_unidade TEXT  -- Pode ser NULL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  -- Obter o ID do usuário atual em uma variável local
  v_current_user_id := auth.uid();
  
  -- Verificar se é dono da revenda usando a variável local
  IF NOT EXISTS (
    SELECT 1 
    FROM revendas 
    WHERE revendas.id = p_revenda_id 
    AND revendas.user_id = v_current_user_id
  ) THEN
    RAISE EXCEPTION 'Apenas o dono da revenda pode listar colaboradores';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.usuario_id,
    u.nome_completo,
    u.email,
    c.ativo,
    c.criado_em,
    criador.nome_completo as criado_por_nome,
    c.unidade_id,
    ur.nome as nome_unidade
  FROM colaboradores c
  JOIN usuarios u ON c.usuario_id = u.id
  LEFT JOIN usuarios criador ON c.criado_por = criador.id
  LEFT JOIN unidades_revenda ur ON c.unidade_id = ur.id
  WHERE c.tipo_colaborador = 'revenda'
    AND c.revenda_id = p_revenda_id
  ORDER BY c.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_colaboradores_revenda(UUID) TO authenticated;

