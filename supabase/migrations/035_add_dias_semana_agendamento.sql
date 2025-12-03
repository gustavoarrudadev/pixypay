-- Migration 035: Adicionar configuração de dias da semana para agendamento
-- Permite que revendas configurem quais dias da semana estão disponíveis para agendamento

ALTER TABLE public.revendas 
ADD COLUMN IF NOT EXISTS agendamento_dias_disponiveis INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6]::INTEGER[];

COMMENT ON COLUMN public.revendas.agendamento_dias_disponiveis IS 'Array de dias da semana disponíveis (0=domingo, 1=segunda, ..., 6=sábado). Padrão: todos os dias.';

