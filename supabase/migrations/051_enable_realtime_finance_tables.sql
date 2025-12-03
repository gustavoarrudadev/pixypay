-- Migration 051: Habilitar Realtime nas tabelas financeiras
-- Permite atualizações em tempo real nas tabelas de pedidos, transações financeiras e repasses

-- Habilitar Realtime na tabela pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;

-- Habilitar Realtime na tabela transacoes_financeiras
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_financeiras;

-- Habilitar Realtime na tabela repasses
ALTER PUBLICATION supabase_realtime ADD TABLE public.repasses;

-- Comentários
COMMENT ON TABLE public.pedidos IS 'Tabela habilitada para Realtime - atualizações em tempo real';
COMMENT ON TABLE public.transacoes_financeiras IS 'Tabela habilitada para Realtime - atualizações em tempo real';
COMMENT ON TABLE public.repasses IS 'Tabela habilitada para Realtime - atualizações em tempo real';

