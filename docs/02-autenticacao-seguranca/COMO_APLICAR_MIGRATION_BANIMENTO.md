# Como Aplicar Migration de Sincronização de Banimento

## 📌 Problema

O sistema estava mostrando usuários como banidos na interface, mas no Supabase Auth eles não estavam banidos. Isso acontecia porque:

1. A função `buscar_detalhes_clientes()` estava consultando a tabela `usuarios` ao invés do `auth.users`
2. O **Supabase Auth** (`auth.users.banned_until`) é a **fonte de verdade** para banimentos
3. A tabela `usuarios` serve apenas como cache/histórico

## ✅ Solução

A migration `006_garantir_sync_banimento_auth.sql` corrige a função para buscar o status diretamente do Supabase Auth.

## 🚀 Passo a Passo para Aplicar a Migration

### 1. Acessar o Supabase Dashboard

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** (ícone no menu lateral)

### 2. Executar a Migration

1. Clique em **"New query"**
2. Copie todo o conteúdo do arquivo: `supabase/migrations/006_garantir_sync_banimento_auth.sql`
3. Cole no editor SQL
4. Clique em **"Run"** (ou pressione `Ctrl + Enter`)

### 3. Verificar se foi Aplicada com Sucesso

Execute o seguinte SQL no **SQL Editor**:

```sql
-- Verificar se a função existe e está correta
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'buscar_detalhes_clientes';

-- Deve retornar: buscar_detalhes_clientes | FUNCTION
```

### 4. Testar com um Usuário (Opcional)

Se você quiser verificar o status de banimento de um usuário específico:

```sql
-- Substituir 'USER_ID_AQUI' pelo ID real do usuário
SELECT * FROM verificar_status_banimento_usuario('USER_ID_AQUI');
```

Este comando retorna:
- `esta_banido_tabela`: Status baseado na tabela `usuarios` (cache)
- `esta_banido_auth`: Status baseado no `auth.users` (fonte de verdade)
- `esta_sincronizado`: Se ambos estão iguais

## 🔍 Como Testar no Sistema

### 1. Testar Banimento

1. Acesse o painel de **Clientes** como admin
2. Selecione um cliente de teste
3. Clique em **"Banir Cliente"**
4. Escolha um tempo (ex: 1 hora)
5. Confirme o banimento

### 2. Verificar no Supabase Auth

1. Vá para **Authentication** > **Users** no dashboard
2. Encontre o usuário banido
3. Verifique se o campo **"Banned until"** está preenchido

### 3. Verificar na Interface

1. Volte para o painel de Clientes
2. Clique no cliente banido
3. Verifique se mostra:
   - Badge "BANIDO" em vermelho
   - Data de expiração do banimento
   - Botão "Desbanir Cliente"

### 4. Testar Desbanimento

1. Clique em **"Desbanir Cliente"**
2. Confirme a ação
3. Verifique se:
   - Badge "BANIDO" desaparece
   - No Supabase Auth, o campo "Banned until" foi removido ou está no passado

## 🧪 Script de Teste SQL

Você pode usar este script para testar manualmente:

```sql
-- 1. Listar todos os clientes e seu status de banimento
SELECT 
  id,
  email,
  esta_banido
FROM buscar_detalhes_clientes();

-- 2. Verificar detalhes de um cliente específico
SELECT * FROM verificar_status_banimento_usuario('USER_ID_AQUI');

-- 3. Ver diretamente no auth.users (requer permissões de admin)
SELECT 
  id, 
  email, 
  banned_until, 
  ban_duration 
FROM auth.users 
WHERE id = 'USER_ID_AQUI';
```

## ⚠️ Importante

1. **Sempre use o Supabase Auth como fonte de verdade** - O campo `auth.users.banned_until` é o que realmente bloqueia o acesso do usuário
2. **A tabela usuarios é apenas cache** - Os campos `banido_at` e `banido_ate` servem para histórico e exibição, mas não controlam o acesso
3. **A Edge Function é responsável pela sincronização** - Quando você bane/desbane um cliente, a Edge Function `bloquear-usuario` atualiza AMBOS (auth.users e tabela usuarios)

## 🔧 Troubleshooting

### Problema: "Function does not exist"

**Solução**: Execute novamente a migration 006. Ela faz `DROP FUNCTION IF EXISTS` antes de criar.

### Problema: Cliente mostra como banido, mas consegue fazer login

**Solução**: Verifique o `auth.users.banned_until`:

```sql
SELECT id, email, banned_until 
FROM auth.users 
WHERE email = 'email@cliente.com';
```

Se `banned_until` for NULL ou estiver no passado, o cliente NÃO está banido no Auth.

### Problema: Desbanimento não funciona

**Solução**: Verifique os logs da Edge Function `bloquear-usuario` no Supabase:

1. Vá para **Edge Functions** > **bloquear-usuario** > **Logs**
2. Procure por erros nas tentativas de desbanimento
3. A função tenta múltiplas abordagens (ver linhas 217-321 do código)

## 📝 Logs e Debug

Para debugar problemas de banimento:

1. **Frontend**: Abra o Console do navegador (F12)
2. **Edge Function**: Veja os logs no Supabase Dashboard > Edge Functions > bloquear-usuario > Logs
3. **Database**: Use a função `verificar_status_banimento_usuario()`

## 🎯 Checklist Final

- [ ] Migration 006 aplicada com sucesso
- [ ] Função `buscar_detalhes_clientes()` existe
- [ ] Função `verificar_status_banimento_usuario()` existe
- [ ] Teste de banimento funciona (badge aparece)
- [ ] Teste de desbanimento funciona (badge desaparece)
- [ ] Status no Supabase Auth está sincronizado com a interface

---

**Última atualização**: 2025-01-07
**Migration**: 006_garantir_sync_banimento_auth.sql

