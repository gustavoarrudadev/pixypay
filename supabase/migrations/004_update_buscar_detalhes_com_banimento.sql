-- Atualizar função buscar_detalhes_clientes para incluir campos de banimento
-- Execute este SQL no SQL Editor do Supabase

-- Adicionar colunas de banimento se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'banido_at'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN banido_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'banido_ate'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN banido_ate TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Atualizar função buscar_detalhes_clientes para incluir campos de banimento
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
    -- Verifica se está banido: tem banido_ate E a data ainda não passou
    CASE 
      WHEN u.banido_ate IS NULL THEN FALSE
      WHEN u.banido_ate < NOW() THEN FALSE
      ELSE TRUE
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

