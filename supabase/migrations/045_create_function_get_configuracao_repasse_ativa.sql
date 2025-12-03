-- Migration 045: Criar função para obter configuração de repasse ativa de uma revenda
-- Retorna a configuração ativa (modalidade, taxas) de uma revenda

CREATE OR REPLACE FUNCTION public.get_configuracao_repasse_ativa(p_revenda_id UUID)
RETURNS TABLE (
  id UUID,
  revenda_id UUID,
  modalidade VARCHAR,
  taxa_percentual DECIMAL,
  taxa_fixa DECIMAL,
  ativo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.revenda_id,
    cr.modalidade,
    cr.taxa_percentual,
    cr.taxa_fixa,
    cr.ativo
  FROM public.configuracoes_repasse_revenda cr
  WHERE cr.revenda_id = p_revenda_id
    AND cr.ativo = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION public.get_configuracao_repasse_ativa IS 'Retorna a configuração de repasse ativa de uma revenda';

