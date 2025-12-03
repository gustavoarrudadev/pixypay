-- Migration 067: Adicionar configurações de agendamento por unidade
-- Permite que cada unidade tenha suas próprias configurações de agendamento

-- Adicionar campos de configuração de agendamento na tabela unidades_revenda
ALTER TABLE public.unidades_revenda 
ADD COLUMN IF NOT EXISTS agendamento_entrega_livre BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS agendamento_horarios_disponiveis JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS agendamento_dias_disponiveis INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6];

COMMENT ON COLUMN public.unidades_revenda.agendamento_entrega_livre IS 'Se true, cliente pode escolher qualquer horário. Se false, apenas horários configurados estão disponíveis.';
COMMENT ON COLUMN public.unidades_revenda.agendamento_horarios_disponiveis IS 'Array de horários disponíveis no formato ["09:00", "10:00", "14:00", "15:00"]. Usado apenas se agendamento_entrega_livre = false.';
COMMENT ON COLUMN public.unidades_revenda.agendamento_dias_disponiveis IS 'Array de dias da semana disponíveis (0=domingo, 1=segunda, ..., 6=sábado). Padrão: todos os dias.';

-- Migrar configurações existentes da revenda para unidades que não têm configuração própria
-- Isso garante compatibilidade com unidades existentes
UPDATE public.unidades_revenda u
SET 
  agendamento_entrega_livre = COALESCE(
    u.agendamento_entrega_livre,
    r.agendamento_entrega_livre,
    true
  ),
  agendamento_horarios_disponiveis = COALESCE(
    u.agendamento_horarios_disponiveis,
    r.agendamento_horarios_disponiveis,
    '[]'::jsonb
  ),
  agendamento_dias_disponiveis = COALESCE(
    u.agendamento_dias_disponiveis,
    r.agendamento_dias_disponiveis,
    ARRAY[0, 1, 2, 3, 4, 5, 6]
  )
FROM public.revendas r
WHERE u.revenda_id = r.id
  AND (u.agendamento_entrega_livre IS NULL 
    OR u.agendamento_horarios_disponiveis IS NULL 
    OR u.agendamento_dias_disponiveis IS NULL);



















