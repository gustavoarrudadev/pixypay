-- Migration 079: Corrigir trigger de atualizado_em na tabela permissoes_colaborador
-- Descrição: A função update_updated_at_column() tenta atualizar 'updated_at', mas a tabela permissoes_colaborador tem 'atualizado_em'

-- Remover trigger problemático
DROP TRIGGER IF EXISTS update_permissoes_colaborador_updated_at ON public.permissoes_colaborador;

-- Usar a função update_atualizado_em_column() que já foi criada na migration 078
CREATE TRIGGER update_permissoes_colaborador_updated_at
  BEFORE UPDATE ON public.permissoes_colaborador
  FOR EACH ROW
  EXECUTE FUNCTION public.update_atualizado_em_column();















