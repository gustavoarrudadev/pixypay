-- Migration 053: Permitir que revendas alterem a modalidade de repasse
-- Revendas podem atualizar o campo 'ativo' de suas próprias configurações de repasse

-- Política: Revendas podem atualizar o campo 'ativo' de suas próprias configurações
DROP POLICY IF EXISTS "Revendas podem alterar modalidade de repasse" ON public.configuracoes_repasse_revenda;

CREATE POLICY "Revendas podem alterar modalidade de repasse"
ON public.configuracoes_repasse_revenda FOR UPDATE
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Função com SECURITY DEFINER para garantir que a atualização funcione
CREATE OR REPLACE FUNCTION public.alterar_modalidade_repasse_revenda(
  p_revenda_id UUID,
  p_nova_modalidade VARCHAR(10)
)
RETURNS JSON AS $$
DECLARE
  v_config_id UUID;
  v_result JSON;
BEGIN
  -- Verificar se a revenda pertence ao usuário logado
  IF NOT EXISTS (
    SELECT 1 FROM public.revendas 
    WHERE id = p_revenda_id 
    AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Revenda não encontrada ou sem permissão'
    );
  END IF;

  -- Verificar se a configuração existe
  SELECT id INTO v_config_id
  FROM public.configuracoes_repasse_revenda
  WHERE revenda_id = p_revenda_id
    AND modalidade = p_nova_modalidade;

  IF v_config_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Configuração não encontrada para esta modalidade'
    );
  END IF;

  -- Desativar todas as configurações da revenda
  UPDATE public.configuracoes_repasse_revenda
  SET ativo = false
  WHERE revenda_id = p_revenda_id;

  -- Ativar a nova modalidade
  UPDATE public.configuracoes_repasse_revenda
  SET ativo = true
  WHERE id = v_config_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Modalidade alterada com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION public.alterar_modalidade_repasse_revenda IS 'Permite que revendas alterem a modalidade de repasse usando SECURITY DEFINER para contornar RLS';
COMMENT ON POLICY "Revendas podem alterar modalidade de repasse" ON public.configuracoes_repasse_revenda IS 'Permite que revendas alterem o campo ativo de suas configurações de repasse para mudar a modalidade';

