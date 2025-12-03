-- Migration 078: Corrigir trigger de atualizado_em na tabela colaboradores
-- Descrição: A função update_updated_at_column() tenta atualizar 'updated_at', mas a tabela colaboradores tem 'atualizado_em'

-- Remover trigger problemático
DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;

-- Criar função específica para atualizar atualizado_em (português)
CREATE OR REPLACE FUNCTION public.update_atualizado_em_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger com a função correta
CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_atualizado_em_column();

COMMENT ON FUNCTION public.update_atualizado_em_column() IS 'Atualiza o campo atualizado_em (português) em vez de updated_at (inglês)';















