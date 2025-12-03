-- Migration 008: Criar função para verificar se usuário está banido (para login)
-- Esta função permite verificar ANTES do login se o usuário está banido

-- Criar função para verificar banimento por email
CREATE OR REPLACE FUNCTION public.verificar_usuario_banido(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  usuario_banned_until TIMESTAMPTZ;
BEGIN
  -- Buscar banned_until do auth.users pelo email
  SELECT banned_until INTO usuario_banned_until
  FROM auth.users
  WHERE email = user_email;
  
  -- Se não encontrou o usuário, retorna false (não está banido)
  IF usuario_banned_until IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Se banned_until existe e ainda não passou, está banido
  IF usuario_banned_until > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- Caso contrário, não está banido
  RETURN FALSE;
END;
$$;

-- Garantir permissões (importante: precisa ser acessível por usuários anônimos)
GRANT EXECUTE ON FUNCTION public.verificar_usuario_banido(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verificar_usuario_banido(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_usuario_banido(TEXT) TO service_role;

-- Adicionar comentário para documentação
COMMENT ON FUNCTION public.verificar_usuario_banido IS 
'Verifica se um usuário está banido consultando auth.users.banned_until. Usado na tela de login ANTES de tentar autenticação. Retorna TRUE se banido, FALSE caso contrário.';

-- Log de aplicação da migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 008 aplicada com sucesso!';
  RAISE NOTICE 'Função verificar_usuario_banido() criada para verificação de banimento no login.';
END $$;

