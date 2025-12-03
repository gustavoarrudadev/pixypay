# 🚀 Setup Automatizado - Nova Conta Supabase

## 📋 Visão Geral

Este guia explica como migrar o projeto para uma **nova conta Supabase** de forma **100% automatizada**. Basta trocar as keys no `.env` e executar um comando!

---

## ✅ O que é Automatizado

### 🎯 **TOTALMENTE AUTOMATIZADO** (sem intervenção manual):

1. ✅ **Execução de todas as migrations**
   - Todas as tabelas são criadas automaticamente
   - Todas as funções RPC são criadas automaticamente
   - Todas as políticas RLS são configuradas automaticamente
   - Triggers e índices são criados automaticamente

2. ✅ **Criação de buckets do Storage**
   - Bucket `produtos` criado automaticamente (público)
   - Bucket `logos-revendas` criado automaticamente (público)
   - Configurações de tamanho e tipos de arquivo aplicadas automaticamente

3. ✅ **Configuração de políticas RLS do Storage**
   - Políticas de upload configuradas automaticamente
   - Políticas de leitura pública configuradas automaticamente
   - Políticas de exclusão configuradas automaticamente

4. ✅ **Deploy de Edge Functions**
   - Edge Function `bloquear-usuario` deployada automaticamente
   - Link do projeto feito automaticamente
   - Verificação de sucesso automática

5. ✅ **Verificação de configuração**
   - Verifica se todas as tabelas foram criadas
   - Verifica se todos os buckets foram criados
   - Mostra resumo completo do que foi configurado

---

## ⚠️ O que Precisa ser Manual

### 📝 **AÇÃO MANUAL OBRIGATÓRIA** (apenas 1 vez):

#### 1. Configurar URLs de Redirecionamento no Auth

**Por que é manual?** O Supabase não expõe API pública para configurar essas URLs automaticamente.

**Como fazer:**
1. Acesse: **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:5173` (ou sua URL de produção)
   - **Redirect URLs** (adicione uma por vez):
     - `http://localhost:5173/confirmar-email`
     - `http://localhost:5173/redefinir-senha`
     - `http://localhost:5173/magic-link-login`

**Tempo estimado**: 2 minutos

---

## 🚀 Como Usar (Passo a Passo)

### **PASSO 1: Criar Nova Conta Supabase** (2 min)

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **"New Project"**
3. Preencha:
   - Nome do projeto
   - Senha do banco de dados (anote!)
   - Região (escolha a mais próxima)
4. Aguarde criação do projeto (1-2 minutos)

### **PASSO 2: Obter Credenciais** (1 min)

1. No projeto criado, vá em **Settings** > **API**
2. Anote:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...`
   - **service_role key**: `eyJhbGci...` ⚠️ **OBRIGATÓRIA**

### **PASSO 3: Configurar Variáveis de Ambiente** (1 min)

Edite o arquivo `.env` na raiz do projeto:

```env
# NOVA CONTA SUPABASE
VITE_SUPABASE_URL=https://NOVO_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=NOVA_ANON_KEY_AQUI
SUPABASE_SERVICE_ROLE_KEY=NOVA_SERVICE_ROLE_KEY_AQUI

# URL da aplicação
VITE_APP_URL=http://localhost:5173

# Ambiente
VITE_ENV=development
```

**⚠️ IMPORTANTE**: 
- A `SUPABASE_SERVICE_ROLE_KEY` é **OBRIGATÓRIA** para o script funcionar
- **NUNCA** commite o arquivo `.env` com as keys reais
- Use apenas para desenvolvimento local ou em variáveis de ambiente seguras

### **PASSO 4: Executar Script Automatizado** (5-10 min)

Execute o comando:

```bash
npm run setup:supabase
```

O script vai:
1. ✅ Verificar se Supabase CLI está instalado (instala se necessário)
2. ✅ Executar todas as migrations automaticamente
3. ✅ Criar buckets do Storage automaticamente
4. ✅ Configurar políticas RLS automaticamente
5. ✅ Fazer deploy das Edge Functions automaticamente
6. ✅ Verificar se tudo foi configurado corretamente

**Tempo estimado**: 5-10 minutos (dependendo da velocidade da internet)

### **PASSO 5: Configurar Auth URLs** (2 min) ⚠️ **MANUAL**

Siga as instruções na seção "O que Precisa ser Manual" acima.

### **PASSO 6: Testar** (2 min)

```bash
npm run dev
```

Teste:
- ✅ Login
- ✅ Registro
- ✅ Criar produto
- ✅ Upload de imagem

---

## 📊 Resumo: Automático vs Manual

| Item | Status | Observações |
|------|--------|-------------|
| **Migrations** | ✅ Automático | Executadas via Supabase CLI |
| **Buckets Storage** | ✅ Automático | Criados via API do Supabase |
| **Políticas RLS Storage** | ✅ Automático | Executadas via SQL |
| **Edge Functions** | ✅ Automático | Deploy via Supabase CLI |
| **Verificações** | ✅ Automático | Script verifica tudo |
| **Auth URLs** | ⚠️ Manual | Não há API pública para isso |
| **Email Templates** | ✅ Automático | Usa templates padrão do Supabase |

---

## 🔧 Requisitos Técnicos

### O que o script instala automaticamente:

- ✅ **Supabase CLI**: Instalado via `npm install -g supabase` se não estiver presente

### O que você precisa ter:

- ✅ **Node.js** instalado (versão 18+)
- ✅ **npm** ou **yarn** instalado
- ✅ **Variáveis de ambiente** configuradas no `.env`

### O que é opcional:

- ⚠️ **psql** (PostgreSQL client): Melhora a execução de SQL, mas não é obrigatório
- ⚠️ **Git**: Apenas se quiser versionar o código

---

## 🛡️ Segurança

### ⚠️ **IMPORTANTE - Service Role Key**:

A `SUPABASE_SERVICE_ROLE_KEY` dá **acesso total** ao banco de dados. Por isso:

1. ✅ **NUNCA** commite no Git
2. ✅ Use apenas em `.env` local ou variáveis de ambiente seguras
3. ✅ Não compartilhe publicamente
4. ✅ Revogue e recrie se exposta acidentalmente

### ✅ **O que está protegido**:

- ✅ Arquivo `.env` está no `.gitignore` (não será commitado)
- ✅ Script só funciona localmente (não expõe keys)
- ✅ Service Role Key só é usada para setup inicial

---

## 🐛 Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY não encontrado"

**Solução**: Adicione a chave no arquivo `.env`

### Erro: "Não foi possível executar migrations"

**Possíveis causas**:
1. Supabase CLI não está instalado
2. Service Role Key está incorreta
3. Projeto não existe ou está pausado

**Solução**:
1. Verifique se o projeto existe no Supabase Dashboard
2. Verifique se a Service Role Key está correta
3. Execute migrations manualmente no SQL Editor se necessário

### Erro: "Bucket already exists"

**Solução**: Normal! Significa que o bucket já existe. O script continua normalmente.

### Erro: "Edge Function deploy failed"

**Possíveis causas**:
1. Supabase CLI não está instalado
2. Não está logado no Supabase CLI
3. Projeto não está linkado

**Solução**:
1. Instale: `npm install -g supabase`
2. Faça login: `supabase login`
3. Link manual: `supabase link --project-ref SEU_PROJECT_REF`
4. Deploy manual: `supabase functions deploy bloquear-usuario`

---

## 📝 Checklist de Migração

Use este checklist para garantir que tudo foi configurado:

### Antes de Executar:
- [ ] Nova conta Supabase criada
- [ ] Credenciais anotadas (URL, Anon Key, Service Role Key)
- [ ] Arquivo `.env` atualizado com novas credenciais

### Após Executar Script:
- [ ] Script executou sem erros críticos
- [ ] Todas as tabelas foram criadas (verificado pelo script)
- [ ] Todos os buckets foram criados (verificado pelo script)
- [ ] Edge Functions foram deployadas (verificado pelo script)

### Após Configuração Manual:
- [ ] Auth URLs configuradas no Dashboard
- [ ] Aplicação conecta com nova conta
- [ ] Login funcionando
- [ ] Registro funcionando
- [ ] Upload de imagens funcionando

---

## 🎯 Resultado Final

Após seguir todos os passos:

✅ **Banco de dados**: Totalmente configurado  
✅ **Storage**: Totalmente configurado  
✅ **Edge Functions**: Totalmente deployadas  
✅ **Aplicação**: Pronta para uso  

**Tempo total**: ~10-15 minutos (incluindo configuração manual)

---

## 🔄 Para Migrar Novamente

Para migrar para **outra conta Supabase** no futuro:

1. ✅ Atualize apenas as 3 variáveis no `.env`
2. ✅ Execute `npm run setup:supabase`
3. ✅ Configure Auth URLs manualmente
4. ✅ Pronto!

**Não precisa**:
- ❌ Modificar código
- ❌ Recriar migrations
- ❌ Reconfigurar nada no projeto

---

## 📚 Documentação Relacionada

- [Guia Rápido de Configuração](./GUIA_RAPIDO_CONFIGURACAO.md)
- [Integração Supabase](./SUPABASE_INTEGRACAO.md)
- [Migrations README](../supabase/migrations/README.md)

---

**Última atualização**: 2025-01-15  
**Versão**: 1.0














