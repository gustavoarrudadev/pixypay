# Cron Job - Atualização Automática de Status de Transações

## 📋 Visão Geral

O sistema financeiro precisa atualizar automaticamente o status das transações financeiras de `pendente` para `liberado` quando a data de repasse prevista é atingida.

## 🔧 Implementação

### Função SQL

A função `atualizar_status_transacoes_liberadas()` já foi criada na migration 048 e está disponível no banco de dados.

### Opções de Execução Automática

#### Opção 1: pg_cron (Recomendado para Supabase)

1. **Habilitar extensão pg_cron:**
   - Acesse o dashboard do Supabase
   - Vá em Database > Extensions
   - Habilite a extensão "pg_cron"

2. **Criar o cron job:**
```sql
SELECT cron.schedule(
  'atualizar-status-transacoes',
  '0 0 * * *', -- Executa diariamente à meia-noite UTC
  $$SELECT public.atualizar_status_transacoes_liberadas()$$
);
```

#### Opção 2: Supabase Edge Function + Cron

Crie uma Edge Function que executa a função SQL e configure um cron job no Supabase:

1. **Criar Edge Function:**
```typescript
// supabase/functions/atualizar-status-transacoes/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { error } = await supabaseAdmin.rpc('atualizar_status_transacoes_liberadas')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

2. **Configurar cron no Supabase:**
   - Acesse Edge Functions > Cron Jobs
   - Crie um novo cron job que executa a função diariamente

#### Opção 3: Serviço Externo (GitHub Actions, Vercel Cron, etc.)

Crie um endpoint público ou use uma API route que executa a função:

```typescript
// api/cron/atualizar-transacoes.ts
import { supabase } from '@/lib/supabase'

export default async function handler(req: Request) {
  // Verificar autenticação/secreta
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { error } = await supabase.rpc('atualizar_status_transacoes_liberadas')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

## ⏰ Frequência Recomendada

- **Frequência:** Diária
- **Horário:** Meia-noite (00:00 UTC)
- **Motivo:** Atualiza todas as transações que venceram no dia anterior

## 🔍 Monitoramento

Após configurar o cron job, monitore:

1. **Logs de execução:** Verifique se a função está sendo executada corretamente
2. **Transações atualizadas:** Verifique quantas transações foram atualizadas
3. **Erros:** Monitore logs de erro

## 📝 Notas Importantes

- A função é idempotente (pode ser executada múltiplas vezes sem problemas)
- Apenas transações com status `pendente` e `data_repasse_prevista <= CURRENT_DATE` são atualizadas
- A função não afeta transações já `repassadas` ou `canceladas`

