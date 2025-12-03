# 🔧 Guia de Configuração - Storage e Migrations

## ⚠️ Problemas Comuns e Soluções

Se você está recebendo erros como:
- "Erro ao fazer upload da imagem"
- "Erro ao criar produto"
- "Erro ao validar link"
- "Erro ao salvar configurações"

Siga este guia para resolver:

---

## 📋 Passo 1: Aplicar Migrations

### 1.1 Verificar se as migrations foram aplicadas

Acesse o Supabase Dashboard > SQL Editor e execute:

```sql
-- Verificar se a tabela produtos existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'produtos'
);

-- Verificar se os campos de presença existem
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'revendas' 
AND column_name IN ('link_publico', 'nome_publico', 'logo_url');
```

### 1.2 Aplicar migrations manualmente

Se as migrations não foram aplicadas, execute-as no SQL Editor:

1. **Migration 015**: `supabase/migrations/015_create_produtos_table.sql`
2. **Migration 016**: `supabase/migrations/016_add_campos_presenca_revenda.sql`

**Ou via CLI:**

```bash
# Se estiver usando Supabase CLI
supabase db push
```

---

## 🗄️ Passo 2: Criar Buckets do Storage

### 2.1 Criar Bucket `produtos`

1. Acesse **Supabase Dashboard > Storage**
2. Clique em **"New bucket"**
3. Configure:
   - **Name**: `produtos`
   - **Public bucket**: ✅ **SIM** (marcar como público)
   - Clique em **"Create bucket"**

### 2.2 Criar Bucket `logos-revendas`

1. Ainda em **Storage**, clique em **"New bucket"**
2. Configure:
   - **Name**: `logos-revendas`
   - **Public bucket**: ✅ **SIM** (marcar como público)
   - Clique em **"Create bucket"**

### 2.3 Configurar Políticas RLS dos Buckets

#### **Bucket `produtos`:**

Acesse **Storage > produtos > Policies** e crie as seguintes políticas:

**Política 1: Upload permitido para revendas**
```sql
CREATE POLICY "Revendas podem fazer upload de produtos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'produtos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM revendas WHERE user_id = auth.uid()
  )
);
```

**Política 2: Leitura pública**
```sql
CREATE POLICY "Produtos são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produtos');
```

**Política 3: Revendas podem deletar seus arquivos**
```sql
CREATE POLICY "Revendas podem deletar seus produtos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'produtos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM revendas WHERE user_id = auth.uid()
  )
);
```

#### **Bucket `logos-revendas`:**

Acesse **Storage > logos-revendas > Policies** e crie as seguintes políticas:

**Política 1: Upload permitido para revendas**
```sql
CREATE POLICY "Revendas podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos-revendas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM revendas WHERE user_id = auth.uid()
  )
);
```

**Política 2: Leitura pública**
```sql
CREATE POLICY "Logos são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos-revendas');
```

**Política 3: Revendas podem deletar suas logos**
```sql
CREATE POLICY "Revendas podem deletar suas logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos-revendas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM revendas WHERE user_id = auth.uid()
  )
);
```

**Política 4: Revendas podem atualizar suas logos**
```sql
CREATE POLICY "Revendas podem atualizar suas logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos-revendas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM revendas WHERE user_id = auth.uid()
  )
);
```

---

## ✅ Passo 3: Verificar Configuração

### 3.1 Verificar Tabelas

Execute no SQL Editor:

```sql
-- Verificar tabela produtos
SELECT COUNT(*) FROM produtos;

-- Verificar campos de presença
SELECT id, nome_revenda, link_publico, nome_publico, logo_url 
FROM revendas 
LIMIT 5;
```

### 3.2 Verificar Buckets

No Supabase Dashboard > Storage, você deve ver:
- ✅ Bucket `produtos` (público)
- ✅ Bucket `logos-revendas` (público)

### 3.3 Verificar Políticas RLS

Execute no SQL Editor:

```sql
-- Verificar políticas da tabela produtos
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'produtos';

-- Verificar políticas da tabela revendas relacionadas a presença
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'revendas' 
AND policyname LIKE '%presença%';
```

---

## 🔍 Passo 4: Testar Funcionalidades

### 4.1 Testar Upload de Imagem

1. Faça login como revenda
2. Acesse **Produtos > Novo Produto**
3. Tente fazer upload de uma imagem
4. Verifique o console do navegador (F12) para erros detalhados

### 4.2 Testar Criação de Produto

1. Preencha o formulário de produto
2. Clique em **"Criar Produto"**
3. Verifique se o produto aparece na lista

### 4.3 Testar Link Público

1. Acesse **Dashboard**
2. Configure um link público
3. Verifique se não há erros de validação

---

## 🐛 Troubleshooting

### Erro: "Bucket not found"

**Solução**: Crie os buckets conforme o Passo 2.

### Erro: "relation produtos does not exist"

**Solução**: Execute a migration 015 no SQL Editor.

### Erro: "column link_publico does not exist"

**Solução**: Execute a migration 016 no SQL Editor.

### Erro: "new row violates row-level security"

**Solução**: 
1. Verifique se você está logado como revenda
2. Verifique se as políticas RLS estão configuradas corretamente
3. Verifique se a revenda está vinculada ao usuário logado

### Erro: "Permission denied"

**Solução**: 
1. Verifique as políticas RLS dos buckets
2. Certifique-se de que os buckets são públicos
3. Verifique se o usuário tem a role `revenda`

---

## 📝 Checklist Final

- [ ] Migration 015 aplicada (tabela `produtos` existe)
- [ ] Migration 016 aplicada (campos `link_publico`, `nome_publico`, `logo_url` existem)
- [ ] Bucket `produtos` criado e público
- [ ] Bucket `logos-revendas` criado e público
- [ ] Políticas RLS dos buckets configuradas
- [ ] Políticas RLS das tabelas configuradas
- [ ] Usuário logado como revenda
- [ ] Revenda vinculada ao usuário logado

---

**Última atualização**: 2025-01-07

