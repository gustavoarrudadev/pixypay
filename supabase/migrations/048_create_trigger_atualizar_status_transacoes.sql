-- Migration 048: Criar função e trigger para atualizar status de transações automaticamente
-- Atualiza status de 'pendente' para 'liberado' quando data_repasse_prevista é atingida

-- Função para atualizar status de transações vencidas
CREATE OR REPLACE FUNCTION public.atualizar_status_transacoes_liberadas()
RETURNS void AS $$
BEGIN
  UPDATE public.transacoes_financeiras
  SET status = 'liberado',
      atualizado_em = NOW()
  WHERE status = 'pendente'
    AND data_repasse_prevista <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION public.atualizar_status_transacoes_liberadas IS 'Atualiza status de transações pendentes para liberado quando data de repasse é atingida';

-- Nota: Esta função deve ser chamada diariamente via cron job ou Edge Function
-- Exemplo de cron no Supabase:
-- SELECT cron.schedule('atualizar-status-transacoes', '0 0 * * *', 'SELECT public.atualizar_status_transacoes_liberadas()');

