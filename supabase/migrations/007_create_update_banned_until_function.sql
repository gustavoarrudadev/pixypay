-- Migration 007: Criar função para atualizar banned_until no auth.users
-- Esta função permite que a Edge Function atualize o status de banimento diretamente
-- Necessário porque a Admin SDK (@supabase/supabase-js) não suporta atualizar banned_until

-- Criar função para atualizar banned_until
CREATE OR REPLACE FUNCTION public.update_user_banned_until(
  user_id UUID,
  banned_until_value TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Atualizar o campo banned_until na tabela auth.users
  -- Se banned_until_value for NULL, remove o banimento
  -- Se banned_until_value for uma data futura, aplica o banimento
  UPDATE auth.users
  SET banned_until = banned_until_value
  WHERE id = user_id;
  
  -- Log da operação
  RAISE NOTICE 'Usuario % atualizado: banned_until = %', user_id, banned_until_value;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.update_user_banned_until(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_banned_until(UUID, TIMESTAMPTZ) TO service_role;

-- Adicionar comentário para documentação
COMMENT ON FUNCTION public.update_user_banned_until IS 
'Atualiza o campo banned_until do auth.users. Usado pela Edge Function bloquear-usuario pois a Admin SDK não suporta este campo. Para banir: passar data futura. Para desbanir: passar NULL.';

-- Log de aplicação da migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 007 aplicada com sucesso!';
  RAISE NOTICE 'Função update_user_banned_until() criada para suportar banimento via Edge Function.';
END $$;

