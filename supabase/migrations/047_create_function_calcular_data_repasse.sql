-- Migration 047: Criar função para calcular data de repasse prevista
-- Calcula a data de repasse baseada na modalidade e data de pagamento

CREATE OR REPLACE FUNCTION public.calcular_data_repasse(
  p_data_pagamento TIMESTAMPTZ,
  p_modalidade VARCHAR
)
RETURNS DATE AS $$
DECLARE
  v_data_repasse DATE;
  v_dias_para_repasse INTEGER;
BEGIN
  -- Converte data de pagamento para DATE
  v_data_repasse := DATE(p_data_pagamento);
  
  -- Calcula dias para repasse baseado na modalidade
  CASE p_modalidade
    WHEN 'D+1' THEN
      v_dias_para_repasse := 1;
    WHEN 'D+15' THEN
      v_dias_para_repasse := 15;
    WHEN 'D+30' THEN
      v_dias_para_repasse := 30;
    ELSE
      -- Padrão: D+30
      v_dias_para_repasse := 30;
  END CASE;
  
  -- Adiciona dias à data de pagamento
  v_data_repasse := v_data_repasse + (v_dias_para_repasse || ' days')::INTERVAL;
  
  RETURN v_data_repasse;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentário
COMMENT ON FUNCTION public.calcular_data_repasse IS 'Calcula a data prevista de repasse baseada na modalidade e data de pagamento';

