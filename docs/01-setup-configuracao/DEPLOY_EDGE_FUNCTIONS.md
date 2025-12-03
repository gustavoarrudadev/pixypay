# 🚀 Deploy Automático das Edge Functions

Este documento explica como fazer deploy automático de todas as Edge Functions do projeto.

---

## 📋 Visão Geral

O projeto possui **4 Edge Functions** que precisam ser deployadas no Supabase:

1. **bloquear-usuario** - Gerencia banimento/desbanimento de usuários
2. **criar-usuario-admin** - Cria usuários administrativamente
3. **atualizar-usuario-admin** - Atualiza dados de usuários
4. **excluir-usuario** - Exclui usuários do sistema

---

## ✅ Deploy Automático

### Durante o Setup Completo

O script `setup-supabase-completo.js` **já faz deploy automático** de todas as Edge Functions durante a configuração inicial:

```bash
npm run setup:supabase
```

Este comando executa:
- ✅ Migrations do banco de dados
- ✅ Criação de buckets do Storage
- ✅ Configuração de políticas RLS
- ✅ **Deploy automático de todas as Edge Functions**

### Deploy Isolado das Edge Functions

Se você precisar fazer deploy apenas das Edge Functions (sem executar todo o setup):

```bash
npm run deploy:functions
```

Ou diretamente:

```bash
node scripts/deploy-edge-functions.js
```

---

## 🔧 Pré-requisitos

### 1. Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
VITE_APP_URL=http://localhost:5173  # Opcional, padrão: http://localhost:5173
```

**Importante**: 
- A `SUPABASE_SERVICE_ROLE_KEY` é **obrigatória** para fazer deploy das Edge Functions
- **As variáveis de ambiente são configuradas automaticamente** durante o deploy via `supabase secrets set`
- Não é necessário configurar manualmente no Supabase Dashboard

### 2. Supabase CLI

O script verifica e instala automaticamente o Supabase CLI se necessário. Caso prefira instalar manualmente:

```bash
npm install -g supabase
```

Verificar instalação:

```bash
supabase --version
```

---

## 📝 Como Funciona

### Processo de Deploy

1. **Verificação do CLI**: Verifica se o Supabase CLI está instalado
2. **Link do Projeto**: Conecta o projeto local ao projeto Supabase remoto
3. **Configuração de Variáveis de Ambiente**: Configura automaticamente os secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_APP_URL` (se configurado)
4. **Deploy Individual**: Faz deploy de cada Edge Function sequencialmente
5. **Validação**: Verifica se cada função foi deployada com sucesso

### Compatibilidade de Parâmetros

Todas as Edge Functions foram padronizadas para aceitar **ambos os formatos** de parâmetros:

- ✅ `userId` (formato novo)
- ✅ `usuario_id` (formato antigo - compatibilidade)
- ✅ `user_id` (em algumas funções)

Isso garante que o código funcione mesmo com chamadas antigas.

### Edge Functions Incluídas

O script automaticamente detecta e faz deploy das seguintes funções:

```javascript
const edgeFunctions = [
  'bloquear-usuario',
  'criar-usuario-admin',
  'atualizar-usuario-admin',
  'excluir-usuario'
];
```

---

## 🐛 Solução de Problemas

### Erro: "CLI não disponível"

**Solução**: Instale o Supabase CLI:

```bash
npm install -g supabase
```

### Erro: "Variáveis de ambiente não configuradas"

**Solução**: Verifique se o arquivo `.env` existe e contém todas as variáveis necessárias:

```bash
cp env.example .env
# Edite o .env com suas credenciais
```

### Erro: "Função não encontrada"

**Solução**: Verifique se a Edge Function existe em `supabase/functions/[nome-da-funcao]/index.ts`

### Erro: "Deploy falhou"

**Possíveis causas**:
- Projeto não está linkado corretamente
- Service Role Key inválida ou expirada
- Problemas de conexão com o Supabase

**Solução**:
1. Verifique suas credenciais no `.env`
2. Tente fazer link manual: `supabase link --project-ref [seu-project-ref]`
3. Verifique os logs do deploy para mais detalhes

---

## 🔍 Verificação

### Verificação Automática

Use o script de verificação para checar se todas as Edge Functions estão deployadas:

```bash
npm run verify:functions
```

Este script:
- ✅ Verifica se todas as 4 funções existem
- ✅ Testa se estão respondendo corretamente
- ✅ Mostra um resumo completo do status

### Verificação Manual

1. Acesse o **Supabase Dashboard**
2. Vá em **Edge Functions**
3. Verifique se todas as 4 funções aparecem na lista
4. Verifique se as **variáveis de ambiente (secrets)** estão configuradas:
   - Vá em **Edge Functions** > **Settings** > **Secrets**
   - Deve conter: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_APP_URL`

### Testar Edge Function

Você pode testar uma Edge Function diretamente do código:

```typescript
const { data, error } = await supabase.functions.invoke('bloquear-usuario', {
  body: { userId: '...', bloquear: true }
});
```

---

## 📚 Edge Functions do Projeto

### 1. bloquear-usuario

**Uso**: Gerencia banimento/desbanimento de usuários

**Parâmetros**:
```typescript
{
  userId: string;
  bloquear: boolean;
  tempoBanimento?: '1h' | '6h' | '12h' | '24h' | '1d' | '7d' | '30d' | 'permanente';
}
```

**Onde é usada**:
- `src/lib/gerenciarCliente.ts`
- `src/lib/gerenciarRevenda.ts`

---

### 2. criar-usuario-admin

**Uso**: Cria usuários administrativamente (admin, revenda, colaborador)

**Parâmetros**:
```typescript
{
  email: string;
  nome_completo: string;
  role: 'admin' | 'revenda' | 'cliente' | 'colaborador_revenda';
  password?: string;
  telefone?: string;
  cpf?: string;
  enviar_magic_link?: boolean;
  email_confirmado?: boolean;
  revenda_id?: string;
}
```

**Onde é usada**:
- `src/pages/admin/Clientes.tsx`
- `src/pages/admin/NovoCliente.tsx`
- `src/lib/gerenciarRevenda.ts`

---

### 3. atualizar-usuario-admin

**Uso**: Atualiza dados de usuários administrativamente

**Parâmetros**:
```typescript
{
  userId: string;
  email?: string;
  password?: string;
  nome_completo?: string;
  display_name?: string;
  telefone?: string;
  cpf?: string;
}
```

**Onde é usada**:
- `src/pages/cliente/GerenciarConta.tsx`
- `src/pages/admin/GerenciarContaAdmin.tsx`
- `src/lib/gerenciarCliente.ts`
- `src/lib/gerenciarRevenda.ts`

---

### 4. excluir-usuario

**Uso**: Exclui usuários do sistema

**Parâmetros**:
```typescript
{
  userId: string;
}
```

**Onde é usada**:
- `src/pages/cliente/GerenciarConta.tsx`
- `src/lib/gerenciarCliente.ts`
- `src/lib/gerenciarRevenda.ts`

---

## 🔄 Atualização de Edge Functions

Quando você modificar uma Edge Function:

1. **Edite o arquivo** em `supabase/functions/[nome-da-funcao]/index.ts`
2. **Execute o deploy**:

```bash
npm run deploy:functions
```

Ou deploy de uma função específica:

```bash
supabase functions deploy [nome-da-funcao] --project-ref [seu-project-ref]
```

---

## 📋 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Arquivo `.env` configurado com todas as variáveis
- [ ] Supabase CLI instalado (`supabase --version`)
- [ ] Edge Functions existem em `supabase/functions/`
- [ ] Cada função tem arquivo `index.ts` ou `index.js`
- [ ] Service Role Key está correta e válida

---

## 🎯 Resumo

### Comandos Rápidos

```bash
# Deploy completo (setup + Edge Functions + variáveis de ambiente)
npm run setup:supabase

# Apenas Edge Functions (com configuração automática de variáveis)
npm run deploy:functions

# Verificar se Edge Functions estão deployadas
npm run verify:functions

# Verificar CLI
supabase --version

# Link manual do projeto
supabase link --project-ref [seu-project-ref]
```

### O que é Configurado Automaticamente

✅ **Deploy de todas as 4 Edge Functions**
✅ **Variáveis de ambiente (secrets)** configuradas automaticamente:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_APP_URL`
✅ **Compatibilidade de parâmetros** (userId/usuario_id)
✅ **Validação de variáveis** nas Edge Functions
✅ **Tratamento de erros** melhorado

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do deploy
2. Confirme que todas as variáveis de ambiente estão corretas
3. Verifique se o Supabase CLI está atualizado
4. Consulte a documentação oficial: https://supabase.com/docs/guides/functions

---

**Última atualização**: 2025-01-27

