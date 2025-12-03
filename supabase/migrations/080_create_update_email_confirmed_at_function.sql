-- Migration 080: Criar função para atualizar email_confirmed_at
-- Descrição: Permite atualizar email_confirmed_at diretamente no auth.users para manter email confirmado ao resetar senha

CREATE OR REPLACE FUNCTION public.update_email_confirmed_at(
  p_user_id UUID,
  p_email_confirmed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Atualiza email_confirmed_at diretamente em auth.users
  UPDATE auth.users
  SET email_confirmed_at = p_email_confirmed_at
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_email_confirmed_at(UUID, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION public.update_email_confirmed_at(UUID, TIMESTAMPTZ) IS 'Atualiza email_confirmed_at em auth.users. Usado para manter email confirmado ao resetar senha de colaboradores.';















