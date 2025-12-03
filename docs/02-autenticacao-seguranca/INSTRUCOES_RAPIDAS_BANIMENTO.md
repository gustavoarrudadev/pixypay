# ✅ Instruções Rápidas - Corrigir Status de Banimento

## 🎯 Problema Identificado

O sistema mostra usuários como **banidos** na interface, mas no **Supabase Auth** eles **NÃO estão banidos**.

## 🔧 Solução (3 Passos)

### Passo 1: Aplicar Migration no Supabase

1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor** (menu lateral)
4. Clique em **"New query"**
5. Copie TODO o conteúdo do arquivo: `supabase/migrations/006_garantir_sync_banimento_auth.sql`
6. Cole no editor
7. Clique em **"Run"** (ou `Ctrl + Enter`)
8. ✅ Aguarde aparecer "Success" ou mensagem de log

### Passo 2: Verificar se Funcionou

Execute este SQL no **SQL Editor**:

```sql
-- Verificar se a função foi criada
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'buscar_detalhes_clientes';

-- Deve retornar: buscar_detalhes_clientes | FUNCTION
```

### Passo 3: Testar no Sistema

1. Acesse o painel de **Clientes** (como admin)
2. Recarregue a página (`F5` ou `Ctrl + R`)
3. Verifique se os clientes agora mostram o status correto:
   - Se estão banidos no **Supabase Auth** → Badge "BANIDO" **deve aparecer**
   - Se NÃO estão banidos no Auth → Badge "BANIDO" **NÃO deve aparecer**

## 🧪 Teste Completo (Opcional)

Se quiser fazer um teste completo:

1. Vá para o painel de Clientes
2. Selecione um cliente de teste
3. Clique em **"Banir Cliente"**
4. Escolha tempo (ex: 1 hora)
5. Confirme o banimento
6. ✅ Verifique:
   - Badge "BANIDO" aparece
   - Mensagem mostra tempo de banimento

7. Verifique no Supabase Auth:
   - **Authentication** > **Users** > procure o cliente
   - Campo **"Banned until"** deve estar preenchido

8. Desbana o cliente:
   - Clique em **"Desbanir Cliente"**
   - Confirme
   - ✅ Badge desaparece
   - Campo "Banned until" no Auth é removido

## 📊 Diagnóstico de Problemas

Se algo não funcionar, execute este script no SQL Editor:

**Arquivo**: `scripts/testar-banimento.sql`

Ou execute manualmente:

```sql
-- Ver todos os clientes e status de banimento
SELECT 
  id,
  email,
  esta_banido
FROM buscar_detalhes_clientes();

-- Verificar usuário específico (substitua USER_ID)
SELECT * FROM verificar_status_banimento_usuario('USER_ID_AQUI');
```

## ⚠️ O Que Foi Corrigido?

### Antes (❌ Errado):
```sql
-- Verificava apenas a tabela usuarios
CASE 
  WHEN u.banido_ate IS NOT NULL AND u.banido_ate > NOW() THEN TRUE
  ELSE FALSE
END
```

### Depois (✅ Correto):
```sql
-- Verifica APENAS o Supabase Auth (fonte de verdade)
CASE 
  WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN TRUE
  ELSE FALSE
END
```

## 🎓 Entenda o Problema

1. **Supabase Auth** (`auth.users.banned_until`) é a **fonte de verdade**
   - Quando este campo tem uma data futura → Usuário **ESTÁ banido** (não consegue fazer login)
   - Quando é NULL ou data passada → Usuário **NÃO está banido**

2. **Tabela usuarios** (`banido_at`, `banido_ate`) é apenas **cache/histórico**
   - Serve para exibir informações na interface
   - **NÃO controla** o acesso real do usuário

3. **A função RPC** estava consultando o cache ao invés da fonte de verdade
   - Por isso mostrava status incorreto
   - Agora consulta direto do Auth ✅

## 📚 Documentação Completa

Para mais detalhes, veja:

- 📄 **Guia Completo**: `docs/COMO_APLICAR_MIGRATION_BANIMENTO.md`
- 🧪 **Script de Teste**: `scripts/testar-banimento.sql`
- 📋 **Lista de Migrations**: `supabase/migrations/README.md`

## 🆘 Ainda com Problemas?

Se após aplicar a migration o problema persistir:

1. **Limpe o cache do navegador** (`Ctrl + Shift + Del`)
2. **Recarregue a página** (`Ctrl + F5` - hard reload)
3. **Verifique os logs**:
   - Console do navegador (F12)
   - Logs da Edge Function no Supabase
4. **Execute o script de diagnóstico**: `scripts/testar-banimento.sql`

## ✅ Checklist Final

- [ ] Migration 006 aplicada no Supabase
- [ ] Função `buscar_detalhes_clientes()` existe (verificado no SQL)
- [ ] Página de Clientes recarregada
- [ ] Status de banimento está correto (comparado com Supabase Auth)
- [ ] Teste de banir/desbanir funciona corretamente

---

**🎉 Pronto!** Agora o sistema sempre mostra o status real do Supabase Auth.

**Tempo estimado**: 2-5 minutos
**Última atualização**: 2025-01-07

