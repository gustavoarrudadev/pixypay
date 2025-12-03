-- Migration 046: Criar função para calcular valor líquido de repasse
-- Calcula o valor líquido a ser repassado baseado no valor bruto e nas taxas

CREATE OR REPLACE FUNCTION public.calcular_valor_repasse(
  p_valor_bruto DECIMAL,
  p_taxa_percentual DECIMAL,
  p_taxa_fixa DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_taxa_percentual_valor DECIMAL;
  v_valor_liquido DECIMAL;
BEGIN
  -- Calcula valor da taxa percentual
  v_taxa_percentual_valor := (p_valor_bruto * p_taxa_percentual) / 100;
  
  -- Calcula valor líquido (valor bruto - taxa percentual - taxa fixa)
  v_valor_liquido := p_valor_bruto - v_taxa_percentual_valor - p_taxa_fixa;
  
  -- Garante que valor líquido não seja negativo
  IF v_valor_liquido < 0 THEN
    v_valor_liquido := 0;
  END IF;
  
  RETURN ROUND(v_valor_liquido, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentário
COMMENT ON FUNCTION public.calcular_valor_repasse IS 'Calcula o valor líquido a ser repassado após descontar taxas percentual e fixa';

