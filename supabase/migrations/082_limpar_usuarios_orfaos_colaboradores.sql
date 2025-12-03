-- Migration 082: Limpar usuários órfãos de colaboradores
-- Descrição: Remove usuários de auth.users que são colaboradores mas não existem mais na tabela colaboradores
-- Isso resolve o problema de não conseguir criar novos colaboradores com emails que já foram usados

-- Função para deletar usuários órfãos de colaboradores
CREATE OR REPLACE FUNCTION public.limpar_usuarios_orfaos_colaboradores()
RETURNS TABLE (
  usuario_id UUID,
  email TEXT,
  role TEXT,
  deletado BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_record RECORD;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Buscar usuários órfãos (existem em auth.users mas não em colaboradores)
  FOR v_user_record IN
    SELECT 
      u.id,
      u.email,
      u.raw_user_meta_data->>'role' as role
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'role' IN ('colaborador_admin', 'colaborador_revenda')
      AND u.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 
        FROM colaboradores c 
        WHERE c.usuario_id = u.id
      )
  LOOP
    -- Deletar usuário de auth.users
    -- Isso também deletará automaticamente os registros relacionados devido ao ON DELETE CASCADE
    DELETE FROM auth.users WHERE id = v_user_record.id;
    
    v_deleted_count := v_deleted_count + 1;
    
    -- Retornar informação do usuário deletado
    RETURN QUERY SELECT 
      v_user_record.id,
      v_user_record.email::TEXT,
      v_user_record.role::TEXT,
      true;
  END LOOP;
  
  -- Se não encontrou nenhum, retornar vazio
  IF v_deleted_count = 0 THEN
    RETURN;
  END IF;
END;
$$;

-- Executar a limpeza uma vez
SELECT * FROM public.limpar_usuarios_orfaos_colaboradores();

-- Comentário
COMMENT ON FUNCTION public.limpar_usuarios_orfaos_colaboradores() IS 'Remove usuários órfãos de colaboradores de auth.users. Usuários que têm role de colaborador mas não existem mais na tabela colaboradores.';















