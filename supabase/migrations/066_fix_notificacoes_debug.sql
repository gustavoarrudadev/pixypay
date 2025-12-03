-- Migration 066: Corrigir e melhorar sistema de notificações com logs
-- Adiciona logs e garante que notificações sejam criadas corretamente

-- Recriar função criar_notificacao com melhor tratamento de erros
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_usuario_id UUID,
  p_tipo VARCHAR,
  p_titulo VARCHAR,
  p_mensagem TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notificacao_id UUID;
  v_preferencias public.preferencias_notificacoes;
  v_receber BOOLEAN := true;
BEGIN
  -- Verifica se usuario_id existe na tabela usuarios
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_usuario_id) THEN
    RAISE WARNING 'Usuário % não encontrado na tabela usuarios', p_usuario_id;
    RETURN NULL;
  END IF;

  -- Busca preferências do usuário
  SELECT * INTO v_preferencias
  FROM public.preferencias_notificacoes
  WHERE usuario_id = p_usuario_id;

  -- Se não tem preferências, cria com padrões
  IF v_preferencias IS NULL THEN
    BEGIN
      INSERT INTO public.preferencias_notificacoes (usuario_id)
      VALUES (p_usuario_id)
      RETURNING * INTO v_preferencias;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar preferências para usuário %: %', p_usuario_id, SQLERRM;
      -- Continua com preferências padrão (tudo true)
      v_preferencias := ROW(
        gen_random_uuid(),
        p_usuario_id,
        true, -- receber_notificacoes
        true, -- receber_pedidos
        true, -- receber_status_pedidos
        true, -- receber_parcelamentos
        true, -- receber_parcelas_abertas
        true, -- receber_parcelas_atrasadas
        true, -- receber_agendamentos
        true, -- receber_repasses
        true, -- som_notificacoes
        NOW(),
        NOW()
      )::public.preferencias_notificacoes;
    END;
  END IF;

  -- Verifica se usuário quer receber notificações
  IF NOT v_preferencias.receber_notificacoes THEN
    RETURN NULL;
  END IF;

  -- Verifica preferência específica por tipo
  CASE p_tipo
    WHEN 'novo_pedido' THEN
      v_receber := v_preferencias.receber_pedidos;
    WHEN 'status_pedido' THEN
      v_receber := v_preferencias.receber_status_pedidos;
    WHEN 'novo_parcelamento' THEN
      v_receber := v_preferencias.receber_parcelamentos;
    WHEN 'parcela_aberta' THEN
      v_receber := v_preferencias.receber_parcelas_abertas;
    WHEN 'parcela_atrasada' THEN
      v_receber := v_preferencias.receber_parcelas_atrasadas;
    WHEN 'agendamento' THEN
      v_receber := v_preferencias.receber_agendamentos;
    WHEN 'repasse' THEN
      v_receber := v_preferencias.receber_repasses;
    ELSE
      v_receber := true; -- Tipos desconhecidos sempre notificam
  END CASE;

  -- Se não deve receber, retorna NULL
  IF NOT v_receber THEN
    RETURN NULL;
  END IF;

  -- Cria a notificação
  BEGIN
    INSERT INTO public.notificacoes (
      usuario_id,
      tipo,
      titulo,
      mensagem,
      link,
      metadata
    )
    VALUES (
      p_usuario_id,
      p_tipo,
      p_titulo,
      p_mensagem,
      p_link,
      p_metadata
    )
    RETURNING id INTO v_notificacao_id;

    RETURN v_notificacao_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar notificação para usuário %: %', p_usuario_id, SQLERRM;
    RETURN NULL;
  END;
END;
$$;

-- Recriar trigger com melhor tratamento
CREATE OR REPLACE FUNCTION public.notificar_novo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenda_user_id UUID;
  v_notificacao_id UUID;
BEGIN
  -- Busca user_id da revenda (revendas.user_id já é o auth.users.id = usuarios.id)
  SELECT user_id INTO v_revenda_user_id
  FROM public.revendas
  WHERE id = NEW.revenda_id;

  IF v_revenda_user_id IS NOT NULL THEN
    -- Tenta criar notificação
    v_notificacao_id := public.criar_notificacao(
      v_revenda_user_id,
      'novo_pedido',
      'Novo Pedido Recebido',
      'Você recebeu um novo pedido #' || UPPER(LEFT(NEW.id::text, 8)),
      '/revenda/pedidos/' || NEW.id,
      jsonb_build_object('pedido_id', NEW.id, 'revenda_id', NEW.revenda_id)
    );

    -- Se retornou NULL, pode ser que preferências bloqueiem ou erro silencioso
    IF v_notificacao_id IS NULL THEN
      RAISE WARNING 'Notificação não criada para pedido % (revenda: %, user_id: %)', 
        NEW.id, NEW.revenda_id, v_revenda_user_id;
    END IF;
  ELSE
    RAISE WARNING 'Revenda % não encontrada ou sem user_id para pedido %', 
      NEW.revenda_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.criar_notificacao IS 'Cria uma notificação respeitando as preferências do usuário. Retorna NULL se não deve criar ou se houver erro.';






















