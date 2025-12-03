-- Migration 076: Adicionar políticas RLS para colaboradores acessarem dados baseados em unidade_id

-- Função auxiliar para verificar se o usuário é colaborador de revenda e obter revenda_id e unidade_id
CREATE OR REPLACE FUNCTION public.obter_dados_colaborador_revenda()
RETURNS TABLE (
  revenda_id UUID,
  unidade_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_colaborador_data RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Busca dados do colaborador
  SELECT c.revenda_id, c.unidade_id
  INTO v_colaborador_data
  FROM public.colaboradores c
  WHERE c.usuario_id = v_user_id
    AND c.tipo_colaborador = 'revenda'
    AND c.ativo = true
  LIMIT 1;

  IF v_colaborador_data IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT v_colaborador_data.revenda_id, v_colaborador_data.unidade_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obter_dados_colaborador_revenda() TO authenticated;

COMMENT ON FUNCTION public.obter_dados_colaborador_revenda() IS 'Retorna revenda_id e unidade_id do colaborador atual. Se unidade_id for NULL, significa acesso a todas as unidades.';

-- Política RLS para colaboradores verem produtos
-- Se unidade_id for NULL, vê todos os produtos da revenda
-- Se unidade_id for específico, vê apenas produtos daquela unidade
DROP POLICY IF EXISTS "Colaboradores podem ver produtos" ON public.produtos;
CREATE POLICY "Colaboradores podem ver produtos"
  ON public.produtos FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.obter_dados_colaborador_revenda() AS dados_colab
      WHERE produtos.revenda_id = dados_colab.revenda_id
        AND (
          dados_colab.unidade_id IS NULL -- Acesso a todas as unidades
          OR produtos.unidade_id = dados_colab.unidade_id -- Acesso a unidade específica
        )
    )
  );

-- Política RLS para colaboradores verem pedidos
DROP POLICY IF EXISTS "Colaboradores podem ver pedidos" ON public.pedidos;
CREATE POLICY "Colaboradores podem ver pedidos"
  ON public.pedidos FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.obter_dados_colaborador_revenda() AS dados_colab
      WHERE pedidos.revenda_id = dados_colab.revenda_id
        AND (
          dados_colab.unidade_id IS NULL -- Acesso a todas as unidades
          OR pedidos.unidade_id = dados_colab.unidade_id -- Acesso a unidade específica
        )
    )
  );

-- Política RLS para colaboradores atualizarem pedidos
DROP POLICY IF EXISTS "Colaboradores podem atualizar pedidos" ON public.pedidos;
CREATE POLICY "Colaboradores podem atualizar pedidos"
  ON public.pedidos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.obter_dados_colaborador_revenda() AS dados_colab
      WHERE pedidos.revenda_id = dados_colab.revenda_id
        AND (
          dados_colab.unidade_id IS NULL
          OR pedidos.unidade_id = dados_colab.unidade_id
        )
    )
  );

-- Política RLS para colaboradores verem parcelamentos
DROP POLICY IF EXISTS "Colaboradores podem ver parcelamentos" ON public.parcelamentos;
CREATE POLICY "Colaboradores podem ver parcelamentos"
  ON public.parcelamentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.obter_dados_colaborador_revenda() AS dados_colab
      INNER JOIN public.pedidos p ON parcelamentos.pedido_id = p.id
      WHERE p.revenda_id = dados_colab.revenda_id
        AND (
          dados_colab.unidade_id IS NULL
          OR p.unidade_id = dados_colab.unidade_id
        )
    )
  );

-- Política RLS para colaboradores atualizarem parcelamentos
DROP POLICY IF EXISTS "Colaboradores podem atualizar parcelamentos" ON public.parcelamentos;
CREATE POLICY "Colaboradores podem atualizar parcelamentos"
  ON public.parcelamentos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.obter_dados_colaborador_revenda() AS dados_colab
      INNER JOIN public.pedidos p ON parcelamentos.pedido_id = p.id
      WHERE p.revenda_id = dados_colab.revenda_id
        AND (
          dados_colab.unidade_id IS NULL
          OR p.unidade_id = dados_colab.unidade_id
        )
    )
  );

-- Política RLS para colaboradores verem transações financeiras
DROP POLICY IF EXISTS "Colaboradores podem ver transações financeiras" ON public.transacoes_financeiras;
CREATE POLICY "Colaboradores podem ver transações financeiras"
  ON public.transacoes_financeiras FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.obter_dados_colaborador_revenda() AS dados_colab
      WHERE transacoes_financeiras.revenda_id = dados_colab.revenda_id
        AND (
          dados_colab.unidade_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.pedidos p
            WHERE p.id = transacoes_financeiras.pedido_id
              AND p.unidade_id = dados_colab.unidade_id
          )
        )
    )
  );

-- Política RLS para colaboradores verem clientes (através de pedidos)
-- Nota: A tabela de clientes não existe separadamente, então verificamos através de pedidos
-- Se necessário, podemos criar uma view ou função específica

-- Aplicar a migration
COMMENT ON POLICY "Colaboradores podem ver produtos" ON public.produtos IS 'Permite que colaboradores vejam produtos baseado em unidade_id. Se NULL, vê todas as unidades.';
COMMENT ON POLICY "Colaboradores podem ver pedidos" ON public.pedidos IS 'Permite que colaboradores vejam pedidos baseado em unidade_id. Se NULL, vê todas as unidades.';
COMMENT ON POLICY "Colaboradores podem atualizar pedidos" ON public.pedidos IS 'Permite que colaboradores atualizem pedidos baseado em unidade_id. Se NULL, atualiza todas as unidades.';
COMMENT ON POLICY "Colaboradores podem ver parcelamentos" ON public.parcelamentos IS 'Permite que colaboradores vejam parcelamentos baseado em unidade_id. Se NULL, vê todas as unidades.';
COMMENT ON POLICY "Colaboradores podem atualizar parcelamentos" ON public.parcelamentos IS 'Permite que colaboradores atualizem parcelamentos baseado em unidade_id. Se NULL, atualiza todas as unidades.';
COMMENT ON POLICY "Colaboradores podem ver transações financeiras" ON public.transacoes_financeiras IS 'Permite que colaboradores vejam transações financeiras baseado em unidade_id. Se NULL, vê todas as unidades.';

