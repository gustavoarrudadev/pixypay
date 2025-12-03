-- Corrigir função buscar_detalhes_clientes para verificar status REAL do Supabase Auth
-- O status de banimento deve vir do auth.users (ban e ban_duration), não apenas da tabela usuarios

DROP FUNCTION IF EXISTS public.buscar_detalhes_clientes();

CREATE OR REPLACE FUNCTION public.buscar_detalhes_clientes()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome_completo TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  telefone TEXT,
  display_name TEXT,
  cpf TEXT,
  email_confirmado BOOLEAN,
  ultimo_login TIMESTAMPTZ,
  telefone_confirmado BOOLEAN,
  banido_at TIMESTAMPTZ,
  banido_ate TIMESTAMPTZ,
  esta_banido BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- FORÇA o retorno apenas de clientes, ignorando políticas RLS
  RETURN QUERY
  SELECT 
    u.id,
    COALESCE(au.email::TEXT, u.email::TEXT) as email,
    COALESCE(
      (au.raw_user_meta_data->>'nome_completo')::TEXT,
      (au.raw_user_meta_data->>'display_name')::TEXT,
      u.nome_completo::TEXT,
      ''::TEXT
    ) as nome_completo,
    'cliente'::TEXT as role,
    u.created_at,
    u.updated_at,
    COALESCE(
      au.phone::TEXT,
      u.telefone::TEXT,
      (au.raw_user_meta_data->>'telefone')::TEXT,
      ''::TEXT
    ) as telefone,
    COALESCE(
      (au.raw_user_meta_data->>'display_name')::TEXT,
      (au.raw_user_meta_data->>'nome_completo')::TEXT,
      u.nome_completo::TEXT,
      ''::TEXT
    ) as display_name,
    COALESCE(
      u.cpf::TEXT,
      (au.raw_user_meta_data->>'cpf')::TEXT,
      ''::TEXT
    ) as cpf,
    (au.email_confirmed_at IS NOT NULL) as email_confirmado,
    au.last_sign_in_at as ultimo_login,
    (au.phone_confirmed_at IS NOT NULL) as telefone_confirmado,
    u.banido_at,
    u.banido_ate,
    -- CRÍTICO: Usar APENAS o Supabase Auth como fonte de verdade para o status de banimento
    -- O status deve vir exclusivamente do auth.users.banned_until
    -- Se banned_until existe e ainda não passou, está banido
    -- Se banned_until é NULL ou já passou, NÃO está banido
    CASE 
      -- Se banned_until existe e ainda não passou, está banido no Auth
      WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN TRUE
      -- Caso contrário, NÃO está banido (ignorar tabela usuarios)
      ELSE FALSE
    END as esta_banido
  FROM public.usuarios u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE u.role = 'cliente'::TEXT
    AND u.role IS NOT NULL
    AND u.role != 'admin'::TEXT
    AND u.role != 'revenda'::TEXT
  ORDER BY u.created_at DESC;
END;
$$;

