-- SQL para criar tabela de usuários no Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Criar tabela para armazenar informações dos usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome_completo TEXT,
  telefone TEXT,
  cpf TEXT,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'revenda', 'cliente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna CPF se não existir (para migrações existentes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN cpf TEXT;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Criar função auxiliar para verificar se o usuário é admin
-- Esta função usa SECURITY DEFINER para garantir acesso ao auth.users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  );
END;
$$;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Política: Admin pode ver todos os usuários
CREATE POLICY "Admin pode ver todos os usuários"
  ON usuarios
  FOR SELECT
  USING (public.is_admin());

-- Política: Usuários podem ver seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados"
  ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Admin pode atualizar todos os usuários
CREATE POLICY "Admin pode atualizar todos os usuários"
  ON usuarios
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Política: Usuários podem atualizar seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
  ON usuarios
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar registro na tabela usuarios quando um usuário é criado
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

-- Trigger para criar registro automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar role do usuário
CREATE OR REPLACE FUNCTION public.atualizar_role_usuario(user_id UUID, novo_role TEXT)
RETURNS void AS $$
BEGIN
  -- Atualiza na tabela usuarios
  UPDATE public.usuarios
  SET role = novo_role, updated_at = NOW()
  WHERE id = user_id;
  
  -- Atualiza no auth.users (requer permissões admin)
  -- Isso deve ser feito via Admin API ou Edge Function
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função RPC para buscar detalhes completos dos clientes
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
    COALESCE(au.email, u.email) as email,  -- Prioriza email de auth.users (fonte de verdade)
    COALESCE(
      au.raw_user_meta_data->>'nome_completo',
      au.raw_user_meta_data->>'display_name',
      u.nome_completo,
      ''
    ) as nome_completo,  -- Prioriza nome_completo de auth.users
    'cliente'::TEXT as role,  -- SEMPRE força como 'cliente'
    u.created_at,
    u.updated_at,
    COALESCE(
      au.phone::TEXT,
      u.telefone,
      au.raw_user_meta_data->>'telefone',
      ''
    ) as telefone,  -- Prioriza phone de auth.users
    COALESCE(
      au.raw_user_meta_data->>'display_name',
      au.raw_user_meta_data->>'nome_completo',
      u.nome_completo,
      ''
    ) as display_name,  -- Prioriza display_name de auth.users
    COALESCE(
      u.cpf,
      au.raw_user_meta_data->>'cpf',
      ''
    ) as cpf,  -- Busca CPF de usuarios ou auth.users
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

-- Garantir que a função tenha permissões adequadas
GRANT EXECUTE ON FUNCTION public.buscar_detalhes_clientes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_detalhes_clientes() TO anon;
