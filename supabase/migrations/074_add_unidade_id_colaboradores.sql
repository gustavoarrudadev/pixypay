-- Migration 074: Adicionar campo unidade_id em colaboradores para permitir acesso específico a unidades
-- Descrição: Permite que colaboradores de revenda sejam associados a unidades específicas

-- Adicionar coluna unidade_id (opcional, apenas para colaboradores de revenda)
ALTER TABLE colaboradores
ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades_revenda(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_unidade_id ON colaboradores(unidade_id);

-- Adicionar constraint: unidade_id só pode ser definido para colaboradores de revenda
ALTER TABLE colaboradores
DROP CONSTRAINT IF EXISTS check_unidade_id_apenas_revenda;

ALTER TABLE colaboradores
ADD CONSTRAINT check_unidade_id_apenas_revenda 
CHECK (
  (tipo_colaborador = 'revenda' AND (unidade_id IS NULL OR unidade_id IS NOT NULL))
  OR (tipo_colaborador = 'admin' AND unidade_id IS NULL)
);

-- Comentário na coluna
COMMENT ON COLUMN colaboradores.unidade_id IS 'ID da unidade específica (opcional, apenas para colaboradores de revenda). Se NULL, colaborador tem acesso a todas as unidades da revenda.';















