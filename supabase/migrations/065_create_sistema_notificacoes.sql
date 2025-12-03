-- Migration 065: Sistema completo de notificações em tempo real
-- Cria tabelas de notificações e preferências, triggers automáticos e configura Realtime

-- 1. Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN DEFAULT false NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  lida_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(usuario_id, lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON public.notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criado_em ON public.notificacoes(criado_em DESC);

-- 2. Tabela de preferências de notificações
CREATE TABLE IF NOT EXISTS public.preferencias_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  receber_notificacoes BOOLEAN DEFAULT true NOT NULL,
  receber_pedidos BOOLEAN DEFAULT true NOT NULL,
  receber_status_pedidos BOOLEAN DEFAULT true NOT NULL,
  receber_parcelamentos BOOLEAN DEFAULT true NOT NULL,
  receber_parcelas_abertas BOOLEAN DEFAULT true NOT NULL,
  receber_parcelas_atrasadas BOOLEAN DEFAULT true NOT NULL,
  receber_agendamentos BOOLEAN DEFAULT true NOT NULL,
  receber_repasses BOOLEAN DEFAULT true NOT NULL,
  som_notificacoes BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT fk_preferencias_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- Índice único já está na constraint UNIQUE
CREATE INDEX IF NOT EXISTS idx_preferencias_usuario_id ON public.preferencias_notificacoes(usuario_id);

-- 3. Função para criar notificação
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
  -- Busca preferências do usuário
  SELECT * INTO v_preferencias
  FROM public.preferencias_notificacoes
  WHERE usuario_id = p_usuario_id;

  -- Se não tem preferências, cria com padrões
  IF v_preferencias IS NULL THEN
    INSERT INTO public.preferencias_notificacoes (usuario_id)
    VALUES (p_usuario_id)
    RETURNING * INTO v_preferencias;
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
END;
$$;

-- 4. Trigger para novo pedido (Revenda)
CREATE OR REPLACE FUNCTION public.notificar_novo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenda_user_id UUID;
BEGIN
  -- Busca user_id da revenda (revendas.user_id já é o auth.users.id)
  SELECT user_id INTO v_revenda_user_id
  FROM public.revendas
  WHERE id = NEW.revenda_id;

  IF v_revenda_user_id IS NOT NULL THEN
    -- v_revenda_user_id já é o usuarios.id (revendas.user_id = usuarios.id = auth.users.id)
    PERFORM public.criar_notificacao(
      v_revenda_user_id,
      'novo_pedido',
      'Novo Pedido Recebido',
      'Você recebeu um novo pedido #' || UPPER(LEFT(NEW.id::text, 8)),
      '/revenda/pedidos/' || NEW.id,
      jsonb_build_object('pedido_id', NEW.id, 'revenda_id', NEW.revenda_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_novo_pedido
AFTER INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_novo_pedido();

-- 5. Trigger para mudança de status de pedido (Cliente)
CREATE OR REPLACE FUNCTION public.notificar_status_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_usuario_id UUID;
BEGIN
  -- Só notifica se status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- cliente_id já é o usuarios.id
    v_cliente_usuario_id := NEW.cliente_id;

    IF v_cliente_usuario_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        v_cliente_usuario_id,
        'status_pedido',
        'Status do Pedido Atualizado',
        'Seu pedido #' || UPPER(LEFT(NEW.id::text, 8)) || ' mudou para: ' || NEW.status,
        '/cliente/compras/' || NEW.id,
        jsonb_build_object('pedido_id', NEW.id, 'status_antigo', OLD.status, 'status_novo', NEW.status)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_status_pedido
AFTER UPDATE OF status ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_status_pedido();

-- 6. Trigger para novo parcelamento (Cliente)
CREATE OR REPLACE FUNCTION public.notificar_novo_parcelamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_usuario_id UUID;
BEGIN
  -- Busca usuario_id do cliente através do pedido (cliente_id já é usuarios.id)
  SELECT p.cliente_id INTO v_cliente_usuario_id
  FROM public.pedidos p
  WHERE p.id = NEW.pedido_id;

  IF v_cliente_usuario_id IS NOT NULL THEN
    PERFORM public.criar_notificacao(
      v_cliente_usuario_id,
      'novo_parcelamento',
      'Parcelamento Criado',
      'Seu pedido foi parcelado em ' || NEW.total_parcelas || 'x',
      '/cliente/compras',
      jsonb_build_object('parcelamento_id', NEW.id, 'pedido_id', NEW.pedido_id, 'total_parcelas', NEW.total_parcelas)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_novo_parcelamento
AFTER INSERT ON public.parcelamentos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_novo_parcelamento();

-- 7. Trigger para parcela aberta (Cliente)
CREATE OR REPLACE FUNCTION public.notificar_parcela_aberta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_usuario_id UUID;
  v_dias_vencimento INTEGER;
BEGIN
  -- Só notifica se status é 'pendente' e data de vencimento está próxima (7 dias)
  IF NEW.status = 'pendente' THEN
    v_dias_vencimento := NEW.data_vencimento - CURRENT_DATE;

    -- Notifica se vencimento está entre hoje e 7 dias
    IF v_dias_vencimento >= 0 AND v_dias_vencimento <= 7 THEN
      -- Busca usuario_id do cliente através do parcelamento e pedido (cliente_id já é usuarios.id)
      SELECT p.cliente_id INTO v_cliente_usuario_id
      FROM public.parcelamentos par
      JOIN public.pedidos p ON p.id = par.pedido_id
      WHERE par.id = NEW.parcelamento_id;

      IF v_cliente_usuario_id IS NOT NULL THEN
        PERFORM public.criar_notificacao(
          v_cliente_usuario_id,
          'parcela_aberta',
          'Parcela Próxima do Vencimento',
          'Você tem uma parcela vencendo em ' || v_dias_vencimento || ' dia(s)',
          '/cliente/compras',
          jsonb_build_object('parcela_id', NEW.id, 'parcelamento_id', NEW.parcelamento_id, 'data_vencimento', NEW.data_vencimento)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_parcela_aberta
AFTER INSERT OR UPDATE ON public.parcelas
FOR EACH ROW
EXECUTE FUNCTION public.notificar_parcela_aberta();

-- 8. Trigger para parcela atrasada (Cliente e Revenda)
CREATE OR REPLACE FUNCTION public.notificar_parcela_atrasada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_usuario_id UUID;
  v_revenda_usuario_id UUID;
  v_dias_atraso INTEGER;
BEGIN
  -- Só notifica se status mudou para 'atrasada' ou se já está atrasada e foi atualizada
  IF NEW.status = 'atrasada' AND (OLD.status IS NULL OR OLD.status != 'atrasada') THEN
    v_dias_atraso := CURRENT_DATE - NEW.data_vencimento;

    -- Busca usuario_id do cliente (cliente_id já é usuarios.id)
    SELECT p.cliente_id INTO v_cliente_usuario_id
    FROM public.parcelamentos par
    JOIN public.pedidos p ON p.id = par.pedido_id
    WHERE par.id = NEW.parcelamento_id;

    -- Busca usuario_id da revenda (precisa converter revendas.user_id para usuarios.id)
    SELECT u.id INTO v_revenda_usuario_id
    FROM public.parcelamentos par
    JOIN public.pedidos p ON p.id = par.pedido_id
    JOIN public.revendas r ON r.id = p.revenda_id
    JOIN public.usuarios u ON u.id = r.user_id
    WHERE par.id = NEW.parcelamento_id;

    -- Notifica cliente
    IF v_cliente_usuario_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        v_cliente_usuario_id,
        'parcela_atrasada',
        'Parcela Atrasada',
        'Você tem uma parcela atrasada há ' || v_dias_atraso || ' dia(s)',
        '/cliente/compras',
        jsonb_build_object('parcela_id', NEW.id, 'parcelamento_id', NEW.parcelamento_id, 'dias_atraso', v_dias_atraso)
      );
    END IF;

    -- Notifica revenda
    IF v_revenda_usuario_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        v_revenda_usuario_id,
        'parcela_atrasada',
        'Parcela Atrasada',
        'Uma parcela do pedido está atrasada há ' || v_dias_atraso || ' dia(s)',
        '/revenda/parcelamentos',
        jsonb_build_object('parcela_id', NEW.id, 'parcelamento_id', NEW.parcelamento_id, 'dias_atraso', v_dias_atraso)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_parcela_atrasada
AFTER INSERT OR UPDATE ON public.parcelas
FOR EACH ROW
EXECUTE FUNCTION public.notificar_parcela_atrasada();

-- 9. Trigger para agendamento (Revenda)
CREATE OR REPLACE FUNCTION public.notificar_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenda_usuario_id UUID;
BEGIN
  -- Busca usuario_id da revenda (converte revendas.user_id para usuarios.id)
  SELECT u.id INTO v_revenda_usuario_id
  FROM public.revendas r
  JOIN public.usuarios u ON u.id = r.user_id
  WHERE r.id = NEW.revenda_id;

  IF v_revenda_usuario_id IS NOT NULL THEN
    PERFORM public.criar_notificacao(
      v_revenda_usuario_id,
      'agendamento',
      'Novo Agendamento de Entrega',
      'Um cliente agendou entrega para ' || TO_CHAR(NEW.data_agendamento, 'DD/MM/YYYY') || ' às ' || TO_CHAR(NEW.horario, 'HH24:MI'),
      '/revenda/agendamentos',
      jsonb_build_object('agendamento_id', NEW.id, 'pedido_id', NEW.pedido_id, 'data_agendamento', NEW.data_agendamento, 'horario', NEW.horario)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agendamento
AFTER INSERT ON public.agendamentos_entrega
FOR EACH ROW
EXECUTE FUNCTION public.notificar_agendamento();

-- 10. Habilitar Realtime na tabela de notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- 11. RLS Policies
-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Usuários podem ver suas próprias notificações"
ON public.notificacoes FOR SELECT
USING (usuario_id = auth.uid());

-- Usuários podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "Usuários podem atualizar suas próprias notificações"
ON public.notificacoes FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- Usuários podem deletar suas próprias notificações
CREATE POLICY "Usuários podem deletar suas próprias notificações"
ON public.notificacoes FOR DELETE
USING (usuario_id = auth.uid());

-- Usuários podem ver e atualizar suas próprias preferências
CREATE POLICY "Usuários podem ver suas preferências"
ON public.preferencias_notificacoes FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas preferências"
ON public.preferencias_notificacoes FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuários podem inserir suas preferências"
ON public.preferencias_notificacoes FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- Comentários
COMMENT ON TABLE public.notificacoes IS 'Sistema de notificações em tempo real para usuários';
COMMENT ON TABLE public.preferencias_notificacoes IS 'Preferências de notificações por usuário';
COMMENT ON FUNCTION public.criar_notificacao IS 'Cria uma notificação respeitando as preferências do usuário';
COMMENT ON FUNCTION public.notificar_novo_pedido IS 'Notifica revenda sobre novo pedido';
COMMENT ON FUNCTION public.notificar_status_pedido IS 'Notifica cliente sobre mudança de status do pedido';
COMMENT ON FUNCTION public.notificar_novo_parcelamento IS 'Notifica cliente sobre novo parcelamento';
COMMENT ON FUNCTION public.notificar_parcela_aberta IS 'Notifica cliente sobre parcela próxima do vencimento';
COMMENT ON FUNCTION public.notificar_parcela_atrasada IS 'Notifica cliente e revenda sobre parcela atrasada';
COMMENT ON FUNCTION public.notificar_agendamento IS 'Notifica revenda sobre novo agendamento de entrega';

