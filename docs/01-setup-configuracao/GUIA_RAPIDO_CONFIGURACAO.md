# 🚀 Guia Rápido de Configuração - Execute em 3 Passos

## ⚡ Configuração Rápida

Siga estes 3 passos para configurar tudo:

---

## 📋 PASSO 1: Executar Migration do Banco de Dados

1. Acesse **Supabase Dashboard** > **SQL Editor**
2. Abra o arquivo: `supabase/migrations/SCRIPT_COMPLETO_DATABASE.sql`
3. Copie TODO o conteúdo do arquivo
4. Cole no SQL Editor
5. Clique em **"Run"** ou pressione `Ctrl+Enter`
6. Aguarde a execução (deve mostrar "Success")

**O que este script faz:**
- ✅ Cria tabela `produtos`
- ✅ Adiciona campos `link_publico`, `nome_publico`, `logo_url` na tabela `revendas`
- ✅ Configura todas as políticas RLS
- ✅ Cria índices e triggers

---

## 🗄️ PASSO 2: Criar Buckets do Storage

1. Acesse **Supabase Dashboard** > **Storage**
2. Clique em **"New bucket"**
3. Configure o primeiro bucket:
   - **Name**: `produtos`
   - **Public bucket**: ✅ **SIM** (marque esta opção!)
   - Clique em **"Create bucket"**
4. Clique novamente em **"New bucket"**
5. Configure o segundo bucket:
   - **Name**: `logos-revendas`
   - **Public bucket**: ✅ **SIM** (marque esta opção!)
   - Clique em **"Create bucket"**

**Importante:** Ambos os buckets DEVEM ser públicos!

---

## 🔒 PASSO 3: Configurar Políticas RLS do Storage

1. Ainda no **Supabase Dashboard**, vá para **SQL Editor**
2. Abra o arquivo: `supabase/migrations/SCRIPT_COMPLETO_STORAGE.sql`
3. Copie TODO o conteúdo do arquivo
4. Cole no SQL Editor
5. Clique em **"Run"** ou pressione `Ctrl+Enter`
6. Aguarde a execução (deve mostrar "Success")

**O que este script faz:**
- ✅ Configura políticas para upload de imagens de produtos
- ✅ Configura políticas para upload de logos
- ✅ Permite leitura pública de todos os arquivos
- ✅ Permite que revendas gerenciem apenas seus próprios arquivos

---

## ✅ Verificação Final

Execute este SQL para verificar se tudo está configurado:

```sql
-- Verificar tabela produtos
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'produtos'
) AS tabela_produtos_existe;

-- Verificar campos de presença
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'revendas' 
AND column_name IN ('link_publico', 'nome_publico', 'logo_url');

-- Verificar buckets (execute no SQL Editor)
-- Nota: Não há query SQL para verificar buckets, verifique manualmente em Storage
```

**Checklist:**
- [ ] Tabela `produtos` criada
- [ ] Campos `link_publico`, `nome_publico`, `logo_url` existem em `revendas`
- [ ] Bucket `produtos` criado e público
- [ ] Bucket `logos-revendas` criado e público
- [ ] Políticas RLS do Storage configuradas

---

## 🐛 Se algo der errado

### Erro: "relation produtos does not exist"
**Solução:** Execute novamente o PASSO 1

### Erro: "Bucket not found"
**Solução:** Verifique se os buckets foram criados no PASSO 2 e se estão marcados como públicos

### Erro: "new row violates row-level security"
**Solução:** Execute novamente o PASSO 3 (políticas RLS do Storage)

### Erro: "column link_publico does not exist"
**Solução:** Execute novamente o PASSO 1

---

## 🎉 Pronto!

Após executar os 3 passos, todas as funcionalidades devem funcionar:
- ✅ Cadastro de produtos
- ✅ Upload de imagens
- ✅ Configuração de link público
- ✅ Upload de logo
- ✅ Loja pública

**Última atualização**: 2025-01-07

