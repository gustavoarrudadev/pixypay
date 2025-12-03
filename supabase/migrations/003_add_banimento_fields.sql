-- Adicionar campos de banimento na tabela usuarios
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

-- Criar índice para melhorar performance em consultas de banimento
CREATE INDEX IF NOT EXISTS idx_usuarios_banido_ate ON usuarios(banido_ate) WHERE banido_ate IS NOT NULL;

-- Função auxiliar para verificar se um usuário está banido
CREATE OR REPLACE FUNCTION public.is_usuario_banido(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  banido_ate_val TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT banido_ate INTO banido_ate_val
  FROM usuarios
  WHERE id = user_id;

  -- Se não há data de banimento, não está banido
  IF banido_ate_val IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Se a data de banimento já passou, não está mais banido
  IF banido_ate_val < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Caso contrário, está banido
  RETURN TRUE;
END;
$$;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.is_usuario_banido(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_usuario_banido(UUID) TO anon;

