# 🧪 Como Testar o Sistema de Banimento no Login

## 📋 Resumo

Este guia explica como testar a funcionalidade de **detecção de conta suspensa** na tela de login.

---

## ✨ O Que Foi Implementado

### 1. **Verificação Prévia ao Login**
- Antes de tentar fazer login, o sistema verifica se o usuário está banido consultando `auth.users.banned_until`
- Se estiver banido, **NÃO PERMITE o login** e mostra mensagem específica

### 2. **Alerta Visual Diferenciado**
- Quando um usuário banido tenta fazer login, aparece um **alerta especial** com:
  - ⚠️ Ícone de escudo de alerta
  - 📝 Mensagem clara: "Conta Suspensa"
  - 📧 Botão para **Contatar Suporte** (email)
  - 💬 Botão para **WhatsApp do Suporte**
  - 🎨 Design destaque em **amarelo/âmbar** para diferenciar de erros normais

### 3. **Funções Criadas**

#### **RPC: `verificar_usuario_banido(user_email TEXT)`**
```sql
-- Retorna TRUE se o usuário está banido, FALSE caso contrário
SELECT verificar_usuario_banido('usuario@exemplo.com');
```

---

## 🧪 Como Testar

### **Passo 1: Banir um Usuário**

Execute no Supabase SQL Editor:

```sql
-- Banir usuário por 1 hora
SELECT public.update_user_banned_until(
  'SEU_USER_ID_AQUI'::UUID,
  (NOW() + INTERVAL '1 hour')::TIMESTAMPTZ
);

-- Verificar se está banido
SELECT 
  email,
  banned_until,
  verificar_usuario_banido(email) as esta_banido
FROM auth.users
WHERE id = 'SEU_USER_ID_AQUI';
```

### **Passo 2: Tentar Fazer Login**

1. Abra a aplicação no navegador
2. Vá para a tela de **Login**
3. Digite o **email** e **senha** do usuário banido
4. Clique em **"Entrar"**

### **Passo 3: Verificar o Alerta**

Você deverá ver um **alerta amarelo/âmbar** com:

```
🛡️ Conta Suspensa

Sua conta está temporariamente suspensa e você não pode fazer login no momento.

📧 Para mais informações ou contestar esta suspensão:

[📧 Contatar Suporte]  [💬 WhatsApp]
```

### **Passo 4: Desbanir o Usuário**

```sql
-- Remover banimento
SELECT public.update_user_banned_until(
  'SEU_USER_ID_AQUI'::UUID,
  NULL
);

-- Verificar
SELECT verificar_usuario_banido('email@exemplo.com');
-- Deve retornar: false
```

### **Passo 5: Tentar Login Novamente**

1. Recarregue a página de login
2. Digite **email** e **senha** novamente
3. Agora deve **fazer login com sucesso** ✅

---

## 📊 Comparação Visual

### ❌ **Erro de Credenciais (Vermelho)**
```
⚠️ Credenciais inválidas. Verifique seu e-mail e senha.
```

### 🛡️ **Conta Suspensa (Amarelo)**
```
🛡️ Conta Suspensa

Sua conta está temporariamente suspensa e você não pode 
fazer login no momento.

📧 Para mais informações ou contestar esta suspensão:

[📧 Contatar Suporte]  [💬 WhatsApp]
```

---

## 🔧 Arquivos Modificados

### 1. **Migration 008: `008_create_verificar_usuario_banido_function.sql`**
- Criou a função RPC `verificar_usuario_banido(user_email TEXT)`
- Permite verificação pública (anon) do status de banimento

### 2. **Frontend: `src/lib/auth.ts`**
- Modificou `fazerLogin()` para verificar banimento ANTES de tentar login
- Captura erros de banimento do Supabase e traduz

### 3. **Frontend: `src/pages/Login.tsx`**
- Adicionou estado `contaSuspensa` para diferenciar erros
- Criou **alerta visual especial** para conta suspensa
- Adicionou botões de contato com suporte

### 4. **Frontend: `src/lib/traduzirErro.ts`**
- Adicionou traduções para erros de banimento:
  - `user is banned`
  - `email not authorized`
  - `account suspended`

---

## 🎯 Cenários de Teste

| Cenário | Ação | Resultado Esperado |
|---------|------|-------------------|
| **Usuário NÃO banido** | Fazer login | ✅ Login com sucesso |
| **Usuário banido** | Fazer login | 🛡️ Alerta amarelo + bloqueio |
| **Usuário desbanido** | Fazer login | ✅ Login com sucesso |
| **Credenciais erradas** | Fazer login | ❌ Alerta vermelho |

---

## 📝 Comandos Úteis para Testes

### **Banir Temporariamente (1 dia)**
```sql
SELECT public.update_user_banned_until(
  (SELECT id FROM auth.users WHERE email = 'teste@exemplo.com'),
  (NOW() + INTERVAL '1 day')::TIMESTAMPTZ
);
```

### **Banir Permanentemente**
```sql
SELECT public.update_user_banned_until(
  (SELECT id FROM auth.users WHERE email = 'teste@exemplo.com'),
  (NOW() + INTERVAL '100 years')::TIMESTAMPTZ
);
```

### **Desbanir**
```sql
SELECT public.update_user_banned_until(
  (SELECT id FROM auth.users WHERE email = 'teste@exemplo.com'),
  NULL
);
```

### **Verificar Status**
```sql
SELECT 
  email,
  banned_until,
  verificar_usuario_banido(email) as esta_banido,
  CASE 
    WHEN banned_until IS NULL THEN 'Não banido'
    WHEN banned_until > NOW() THEN 'Banido até ' || banned_until::TEXT
    ELSE 'Banimento expirado'
  END as status_detalhado
FROM auth.users
WHERE email = 'teste@exemplo.com';
```

---

## 🎊 Resultado Final

✅ **Sistema de Banimento Completo:**
1. ✅ Banir/desbanir pela interface admin
2. ✅ Status sincronizado com Supabase Auth
3. ✅ **NOVO:** Bloqueio automático no login
4. ✅ **NOVO:** Alerta visual diferenciado
5. ✅ **NOVO:** Botões de contato com suporte

---

## 📞 Personalização dos Contatos

Para alterar os contatos de suporte, edite:

**`src/pages/Login.tsx`** (linhas ~170-185):

```tsx
// E-mail do suporte
href="mailto:suporte@pixypay.com"

// WhatsApp do suporte (formato: 5511999999999)
href="https://wa.me/5511999999999"
```

---

**🎉 Sistema de Banimento 100% Funcional no Login!**

