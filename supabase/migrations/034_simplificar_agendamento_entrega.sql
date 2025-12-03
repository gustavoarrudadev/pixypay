-- Migration 034: Simplificar agendamento de entrega
-- Adiciona configurações de agendamento na revenda e simplifica agendamentos_entrega

-- 1. Adicionar campos de configuração de agendamento na tabela revendas
ALTER TABLE public.revendas 
ADD COLUMN IF NOT EXISTS agendamento_entrega_livre BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS agendamento_horarios_disponiveis JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.revendas.agendamento_entrega_livre IS 'Se true, cliente pode escolher qualquer horário. Se false, apenas horários configurados estão disponíveis.';
COMMENT ON COLUMN public.revendas.agendamento_horarios_disponiveis IS 'Array de horários disponíveis no formato ["09:00", "10:00", "14:00", "15:00"]. Usado apenas se agendamento_entrega_livre = false.';

-- 2. Adicionar coluna horario na tabela agendamentos_entrega (mantendo horario_inicio e horario_fim por compatibilidade)
ALTER TABLE public.agendamentos_entrega 
ADD COLUMN IF NOT EXISTS horario TIME;

-- 3. Migrar dados existentes: usar horario_inicio como horario padrão
UPDATE public.agendamentos_entrega 
SET horario = horario_inicio 
WHERE horario IS NULL;

-- 4. Tornar horario NOT NULL após migração (mas primeiro vamos permitir NULL temporariamente)
-- ALTER TABLE public.agendamentos_entrega ALTER COLUMN horario SET NOT NULL;

-- Comentário
COMMENT ON COLUMN public.agendamentos_entrega.horario IS 'Horário único do agendamento (simplificado). Mantém horario_inicio e horario_fim para compatibilidade.';

