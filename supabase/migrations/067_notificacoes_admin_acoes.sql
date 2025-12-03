-- Migration 067: Notificações para ações do admin em pedidos, parcelas e repasses
-- Quando admin faz mudanças, revendas e clientes recebem notificações

-- 1. Trigger para mudança de status de pedido pelo admin (notifica cliente)
CREATE OR REPLACE FUNCTION public.notificar_status_pedido_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_usuario_id UUID;
  v_status_traduzido TEXT;
BEGIN
  -- Só notifica se status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- cliente_id já é o usuarios.id
    v_cliente_usuario_id := NEW.cliente_id;

    -- Traduz status para português
    CASE NEW.status
      WHEN 'pendente' THEN v_status_traduzido := 'Pendente';
      WHEN 'confirmado' THEN v_status_traduzido := 'Confirmado';
      WHEN 'preparando' THEN v_status_traduzido := 'Preparando';
      WHEN 'pronto' THEN v_status_traduzido := 'Pronto';
      WHEN 'em_transito' THEN v_status_traduzido := 'Em Trânsito';
      WHEN 'entregue' THEN v_status_traduzido := 'Entregue';
      WHEN 'cancelado' THEN v_status_traduzido := 'Cancelado';
      ELSE v_status_traduzido := NEW.status::TEXT;
    END CASE;

    IF v_cliente_usuario_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        v_cliente_usuario_id,
        'status_pedido',
        'Status do Pedido Atualizado',
        'Seu pedido #' || UPPER(LEFT(NEW.id::text, 8)) || ' mudou para: ' || v_status_traduzido,
        '/cliente/compras/' || NEW.id,
        jsonb_build_object('pedido_id', NEW.id, 'status_antigo', OLD.status, 'status_novo', NEW.status)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Atualizar trigger existente para incluir notificação de admin
DROP TRIGGER IF EXISTS trigger_status_pedido ON public.pedidos;
CREATE TRIGGER trigger_status_pedido
AFTER UPDATE OF status ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_status_pedido_admin();

-- 2. Trigger para parcela marcada como paga pelo admin (notifica cliente)
CREATE OR REPLACE FUNCTION public.notificar_parcela_paga_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_usuario_id UUID;
BEGIN
  -- Só notifica se status mudou para 'paga' e tinha data_pagamento NULL antes
  IF NEW.status = 'paga' AND (OLD.status IS NULL OR OLD.status != 'paga') AND NEW.data_pagamento IS NOT NULL THEN
    -- Busca usuario_id do cliente através do parcelamento e pedido
    SELECT p.cliente_id INTO v_cliente_usuario_id
    FROM public.parcelamentos par
    JOIN public.pedidos p ON p.id = par.pedido_id
    WHERE par.id = NEW.parcelamento_id;

    IF v_cliente_usuario_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        v_cliente_usuario_id,
        'parcela_paga',
        'Parcela Paga',
        'A parcela #' || NEW.numero_parcela || ' do seu parcelamento foi marcada como paga',
        '/cliente/parcelamentos',
        jsonb_build_object('parcela_id', NEW.id, 'parcelamento_id', NEW.parcelamento_id, 'numero_parcela', NEW.numero_parcela)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_parcela_paga_admin
AFTER UPDATE OF status, data_pagamento ON public.parcelas
FOR EACH ROW
WHEN (NEW.status = 'paga' AND (OLD.status IS NULL OR OLD.status != 'paga'))
EXECUTE FUNCTION public.notificar_parcela_paga_admin();

-- 3. Trigger para parcela marcada como vencida pelo admin (notifica cliente e revenda)
CREATE OR REPLACE FUNCTION public.notificar_parcela_vencida_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_usuario_id UUID;
  v_revenda_usuario_id UUID;
BEGIN
  -- Só notifica se status mudou para 'atrasada'
  IF NEW.status = 'atrasada' AND (OLD.status IS NULL OR OLD.status != 'atrasada') THEN
    -- Busca usuario_id do cliente
    SELECT p.cliente_id INTO v_cliente_usuario_id
    FROM public.parcelamentos par
    JOIN public.pedidos p ON p.id = par.pedido_id
    WHERE par.id = NEW.parcelamento_id;

    -- Busca usuario_id da revenda
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
        'Parcela Marcada como Atrasada',
        'A parcela #' || NEW.numero_parcela || ' do seu parcelamento foi marcada como atrasada',
        '/cliente/parcelamentos',
        jsonb_build_object('parcela_id', NEW.id, 'parcelamento_id', NEW.parcelamento_id, 'numero_parcela', NEW.numero_parcela)
      );
    END IF;

    -- Notifica revenda
    IF v_revenda_usuario_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        v_revenda_usuario_id,
        'parcela_atrasada',
        'Parcela Marcada como Atrasada',
        'Uma parcela do pedido foi marcada como atrasada pelo administrador',
        '/revenda/parcelamentos',
        jsonb_build_object('parcela_id', NEW.id, 'parcelamento_id', NEW.parcelamento_id, 'numero_parcela', NEW.numero_parcela)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_parcela_vencida_admin
AFTER UPDATE OF status ON public.parcelas
FOR EACH ROW
WHEN (NEW.status = 'atrasada' AND (OLD.status IS NULL OR OLD.status != 'atrasada'))
EXECUTE FUNCTION public.notificar_parcela_vencida_admin();

-- 4. Trigger para repasse criado/atualizado pelo admin (notifica revenda)
CREATE OR REPLACE FUNCTION public.notificar_repasse_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenda_usuario_id UUID;
  v_acao TEXT;
BEGIN
  -- Determina a ação
  IF TG_OP = 'INSERT' THEN
    v_acao := 'criado'
  ELSIF TG_OP = 'UPDATE' THEN
    -- Verifica o que mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      CASE NEW.status
        WHEN 'liberado' THEN v_acao := 'liberado'
        WHEN 'bloqueado' THEN v_acao := 'bloqueado'
        WHEN 'pago' THEN v_acao := 'pago'
        WHEN 'antecipado' THEN v_acao := 'antecipado'
        ELSE v_acao := 'atualizado'
      END CASE;
    ELSE
      v_acao := 'atualizado'
    END IF;
  END IF;

  -- Busca usuario_id da revenda
  SELECT u.id INTO v_revenda_usuario_id
  FROM public.revendas r
  JOIN public.usuarios u ON u.id = r.user_id
  WHERE r.id = NEW.revenda_id;

  IF v_revenda_usuario_id IS NOT NULL THEN
    PERFORM public.criar_notificacao(
      v_revenda_usuario_id,
      'repasse',
      'Repasse ' || INITCAP(v_acao),
      'Um repasse foi ' || v_acao || ' pelo administrador. Valor: R$ ' || TO_CHAR(NEW.valor_liquido, 'FM999G999G999D90'),
      '/revenda/financeiro',
      jsonb_build_object('repasse_id', NEW.id, 'revenda_id', NEW.revenda_id, 'status', NEW.status, 'acao', v_acao)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_repasse_admin
AFTER INSERT OR UPDATE ON public.repasses
FOR EACH ROW
EXECUTE FUNCTION public.notificar_repasse_admin();

-- Comentários
COMMENT ON FUNCTION public.notificar_status_pedido_admin IS 'Notifica cliente quando admin muda status do pedido';
COMMENT ON FUNCTION public.notificar_parcela_paga_admin IS 'Notifica cliente quando admin marca parcela como paga';
COMMENT ON FUNCTION public.notificar_parcela_vencida_admin IS 'Notifica cliente e revenda quando admin marca parcela como vencida';
COMMENT ON FUNCTION public.notificar_repasse_admin IS 'Notifica revenda quando admin cria ou atualiza repasse';

