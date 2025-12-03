-- Migration 049: Criar cron job para atualizar status de transações automaticamente
-- Atualiza status de 'pendente' para 'liberado' quando data_repasse_prevista é atingida

-- Nota: Para usar o pg_cron no Supabase, é necessário habilitar a extensão
-- Isso geralmente é feito via dashboard do Supabase ou via SQL direto
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove o cron job anterior se existir
SELECT cron.unschedule('atualizar-status-transacoes') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'atualizar-status-transacoes'
);

-- Cria o cron job para executar diariamente à meia-noite (UTC)
-- Formato: segundo minuto hora dia mês dia-da-semana
-- '0 0 * * *' = todos os dias à meia-noite
SELECT cron.schedule(
  'atualizar-status-transacoes',
  '0 0 * * *', -- Executa diariamente à meia-noite UTC
  $$SELECT public.atualizar_status_transacoes_liberadas()$$
);

-- Comentário
COMMENT ON FUNCTION public.atualizar_status_transacoes_liberadas IS 'Função executada diariamente via cron para atualizar status de transações pendentes para liberado quando data de repasse é atingida';

