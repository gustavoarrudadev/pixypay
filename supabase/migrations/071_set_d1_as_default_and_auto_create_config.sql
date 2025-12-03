-- Migration 071: Definir D+1 como padrão e criar trigger para criar configurações automaticamente
-- Altera o padrão de D+30 para D+1 e cria trigger para criar configurações automaticamente para novas revendas

-- Primeiro, atualizar todas as revendas existentes para ter D+1 como padrão
UPDATE public.configuracoes_repasse_revenda
SET ativo = false
WHERE ativo = true;

UPDATE public.configuracoes_repasse_revenda
SET ativo = true
WHERE modalidade = 'D+1';

-- Criar função para inserir configurações padrão de repasse
CREATE OR REPLACE FUNCTION criar_configuracoes_repasse_padrao()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere as três modalidades padrão para a nova revenda
  INSERT INTO public.configuracoes_repasse_revenda (revenda_id, modalidade, taxa_percentual, taxa_fixa, ativo)
  VALUES
    (NEW.id, 'D+1', 8.00, 0.50, true),  -- D+1 é o padrão ativo
    (NEW.id, 'D+15', 6.50, 0.50, false),
    (NEW.id, 'D+30', 5.00, 0.50, false)
  ON CONFLICT (revenda_id, modalidade) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função após inserir uma nova revenda
DROP TRIGGER IF EXISTS trigger_criar_configuracoes_repasse ON public.revendas;
CREATE TRIGGER trigger_criar_configuracoes_repasse
AFTER INSERT ON public.revendas
FOR EACH ROW
EXECUTE FUNCTION criar_configuracoes_repasse_padrao();

-- Comentário atualizado
COMMENT ON FUNCTION criar_configuracoes_repasse_padrao() IS 'Cria automaticamente as configurações de repasse padrão (D+1, D+15, D+30) para novas revendas. D+1 é ativo por padrão.';


















