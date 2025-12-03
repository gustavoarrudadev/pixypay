-- Migration 006: Garantir sincronização do status de banimento com Supabase Auth
-- Esta migration garante que a função buscar_detalhes_clientes() sempre busca o status
-- de banimento diretamente do auth.users.banned_until, que é a fonte de verdade

-- 1. RECRIAR a função buscar_detalhes_clientes para garantir que está correta
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
    -- ⚠️ CRÍTICO: A FONTE DE VERDADE É SEMPRE auth.users.banned_until
    -- O campo esta_banido deve refletir APENAS o status do Supabase Auth
    -- Ignorar completamente os campos banido_at/banido_ate da tabela usuarios
    CASE 
      -- Se banned_until existe e ainda não passou, usuário ESTÁ banido no Auth
      WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN TRUE
      -- Caso contrário, usuário NÃO está banido (mesmo que banido_ate esteja preenchido)
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

-- 2. Garantir permissões corretas na função
GRANT EXECUTE ON FUNCTION public.buscar_detalhes_clientes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_detalhes_clientes() TO anon;

-- 3. Criar função auxiliar para debug/verificação (apenas para admins)
CREATE OR REPLACE FUNCTION public.verificar_status_banimento_usuario(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  banido_at TIMESTAMPTZ,
  banido_ate TIMESTAMPTZ,
  auth_banned_until TIMESTAMPTZ,
  auth_ban_duration TEXT,
  esta_banido_tabela BOOLEAN,
  esta_banido_auth BOOLEAN,
  esta_sincronizado BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    COALESCE(au.email::TEXT, u.email::TEXT) as email,
    u.banido_at,
    u.banido_ate,
    au.banned_until as auth_banned_until,
    au.ban_duration as auth_ban_duration,
    -- Status baseado na tabela usuarios
    CASE 
      WHEN u.banido_ate IS NULL THEN FALSE
      WHEN u.banido_ate < NOW() THEN FALSE
      ELSE TRUE
    END as esta_banido_tabela,
    -- Status baseado no Supabase Auth (fonte de verdade)
    CASE 
      WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN TRUE
      ELSE FALSE
    END as esta_banido_auth,
    -- Verifica se estão sincronizados
    CASE 
      WHEN (u.banido_ate IS NOT NULL AND u.banido_ate > NOW()) = 
           (au.banned_until IS NOT NULL AND au.banned_until > NOW()) THEN TRUE
      ELSE FALSE
    END as esta_sincronizado
  FROM public.usuarios u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE u.id = user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_status_banimento_usuario(UUID) TO authenticated;

-- 4. Adicionar comentários para documentação
COMMENT ON FUNCTION public.buscar_detalhes_clientes IS 
'Busca detalhes completos dos clientes. O campo esta_banido reflete APENAS o status do auth.users.banned_until (fonte de verdade do Supabase Auth).';

COMMENT ON FUNCTION public.verificar_status_banimento_usuario IS 
'Função de debug para verificar sincronização entre tabela usuarios e auth.users. Use esta função para diagnosticar problemas de banimento.';

-- 5. Log de aplicação da migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 006 aplicada com sucesso!';
  RAISE NOTICE 'A função buscar_detalhes_clientes() agora usa APENAS auth.users.banned_until como fonte de verdade.';
  RAISE NOTICE 'Use SELECT * FROM verificar_status_banimento_usuario(''<user_id>'') para debug.';
END $$;

