-- Migration 081: Criar função para atualizar senha de usuário diretamente em auth.users
-- Descrição: Atualiza a senha usando crypt do pgcrypto para garantir que o hash seja correto

-- Garantir que a extensão pgcrypto está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para atualizar senha de usuário
CREATE OR REPLACE FUNCTION public.update_user_password(
  p_user_id UUID,
  p_password TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_encrypted_password TEXT;
BEGIN
  -- Validar que a senha foi fornecida
  IF p_password IS NULL OR p_password = '' THEN
    RAISE EXCEPTION 'Senha não pode ser vazia';
  END IF;

  -- Gerar hash da senha usando crypt (compatível com Supabase Auth)
  -- O formato é: $2a$10$... (bcrypt)
  -- Mas o Supabase usa um formato específico, então vamos usar a função crypt do PostgreSQL
  -- que gera um hash compatível com bcrypt
  v_encrypted_password := crypt(p_password, gen_salt('bf', 10));

  -- Atualizar encrypted_password em auth.users
  UPDATE auth.users
  SET encrypted_password = v_encrypted_password,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_password(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.update_user_password(UUID, TEXT) IS 'Atualiza a senha de um usuário em auth.users usando crypt do pgcrypto. Usado para garantir que a senha seja atualizada corretamente.';















