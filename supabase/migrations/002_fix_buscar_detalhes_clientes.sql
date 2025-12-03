-- Correção da função buscar_detalhes_clientes para buscar dados corretos de auth.users
-- Execute este SQL no SQL Editor do Supabase

-- Adicionar coluna CPF se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN cpf TEXT;
  END IF;
END $$;

-- Atualizar função handle_new_user para incluir CPF
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome_completo, role, telefone, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'cpf', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome_completo = EXCLUDED.nome_completo,
    role = EXCLUDED.role,
    telefone = COALESCE(EXCLUDED.telefone, usuarios.telefone),
    cpf = COALESCE(EXCLUDED.cpf, usuarios.cpf),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigir função buscar_detalhes_clientes para buscar dados corretos
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
  telefone_confirmado BOOLEAN
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
    COALESCE(au.email::TEXT, u.email::TEXT) as email,  -- Prioriza email de auth.users (fonte de verdade) com cast explícito
    COALESCE(
      (au.raw_user_meta_data->>'nome_completo')::TEXT,
      (au.raw_user_meta_data->>'display_name')::TEXT,
      u.nome_completo::TEXT,
      ''::TEXT
    ) as nome_completo,  -- Prioriza nome_completo de auth.users com cast explícito
    'cliente'::TEXT as role,  -- SEMPRE força como 'cliente'
    u.created_at,
    u.updated_at,
    COALESCE(
      au.phone::TEXT,
      u.telefone::TEXT,
      (au.raw_user_meta_data->>'telefone')::TEXT,
      ''::TEXT
    ) as telefone,  -- Prioriza phone de auth.users com cast explícito
    COALESCE(
      (au.raw_user_meta_data->>'display_name')::TEXT,
      (au.raw_user_meta_data->>'nome_completo')::TEXT,
      u.nome_completo::TEXT,
      ''::TEXT
    ) as display_name,  -- Prioriza display_name de auth.users com cast explícito
    COALESCE(
      u.cpf::TEXT,
      (au.raw_user_meta_data->>'cpf')::TEXT,
      ''::TEXT
    ) as cpf,  -- Busca CPF de usuarios ou auth.users com cast explícito
    (au.email_confirmed_at IS NOT NULL) as email_confirmado,
    au.last_sign_in_at as ultimo_login,
    (au.phone_confirmed_at IS NOT NULL) as telefone_confirmado
  FROM public.usuarios u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE u.role = 'cliente'::TEXT  -- FILTRO OBRIGATÓRIO no SQL
    AND u.role IS NOT NULL
    AND u.role != 'admin'::TEXT
    AND u.role != 'revenda'::TEXT
  ORDER BY u.created_at DESC;
END;
$$;

