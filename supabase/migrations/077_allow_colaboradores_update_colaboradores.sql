-- Migration 077: Permitir que colaboradores de revenda com acesso a todas as unidades possam atualizar colaboradores
-- Descrição: Colaboradores com acesso a todas as unidades (unidade_id IS NULL) podem gerenciar outros colaboradores da mesma revenda

-- Função auxiliar para verificar se o usuário atual é colaborador com acesso a todas as unidades
-- Usa SECURITY DEFINER para evitar recursão infinita nas políticas RLS
CREATE OR REPLACE FUNCTION public.verificar_colaborador_todas_unidades(p_revenda_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_is_colaborador BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verifica se o usuário atual é colaborador da mesma revenda com acesso a todas as unidades
  -- SECURITY DEFINER permite bypassar RLS para evitar recursão
  SELECT EXISTS (
    SELECT 1
    FROM public.colaboradores c
    WHERE c.usuario_id = v_user_id
      AND c.tipo_colaborador = 'revenda'
      AND c.revenda_id = p_revenda_id
      AND c.ativo = true
      AND c.unidade_id IS NULL -- Apenas colaboradores com acesso a todas as unidades
  ) INTO v_is_colaborador;

  RETURN v_is_colaborador;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_colaborador_todas_unidades(UUID) TO authenticated;

COMMENT ON FUNCTION public.verificar_colaborador_todas_unidades(UUID) IS 'Verifica se o usuário atual é colaborador de revenda com acesso a todas as unidades (unidade_id IS NULL). Usa SECURITY DEFINER para evitar recursão infinita.';

-- Política adicional: Colaboradores de revenda com acesso a todas as unidades podem atualizar colaboradores da mesma revenda
DROP POLICY IF EXISTS "Colaboradores podem atualizar colaboradores da mesma revenda" ON public.colaboradores;
CREATE POLICY "Colaboradores podem atualizar colaboradores da mesma revenda"
  ON public.colaboradores FOR UPDATE
  USING (
    tipo_colaborador = 'revenda' AND
    public.verificar_colaborador_todas_unidades(colaboradores.revenda_id)
  )
  WITH CHECK (
    tipo_colaborador = 'revenda' AND
    public.verificar_colaborador_todas_unidades(colaboradores.revenda_id)
  );

COMMENT ON POLICY "Colaboradores podem atualizar colaboradores da mesma revenda" ON public.colaboradores IS 'Permite que colaboradores de revenda com acesso a todas as unidades (unidade_id IS NULL) possam atualizar outros colaboradores da mesma revenda.';

