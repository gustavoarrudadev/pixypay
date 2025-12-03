# 🔧 Como Criar a Tabela de Favoritos

## ⚠️ Problema

O erro 404 indica que a tabela `lojas_favoritas` não existe no banco de dados do Supabase.

## ✅ Solução: Execute a Migration

### Passo 1: Acesse o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto do Pixy Pay

### Passo 2: Abra o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique no botão **"New query"** (ou use `Ctrl + N`)

### Passo 3: Execute o SQL

Copie e cole o seguinte SQL completo:

```sql
-- =====================================================
-- MIGRATION 017: Criar Tabela de Lojas Favoritas
-- =====================================================

-- Criar tabela lojas_favoritas
CREATE TABLE IF NOT EXISTS public.lojas_favoritas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cliente_id, revenda_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_cliente_id ON public.lojas_favoritas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_revenda_id ON public.lojas_favoritas(revenda_id);
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_criado_em ON public.lojas_favoritas(criado_em DESC);

-- Habilitar RLS
ALTER TABLE public.lojas_favoritas ENABLE ROW LEVEL SECURITY;

-- Política: Clientes podem ver apenas seus favoritos
DROP POLICY IF EXISTS "Clientes podem ver seus favoritos" ON public.lojas_favoritas;
CREATE POLICY "Clientes podem ver seus favoritos"
ON public.lojas_favoritas FOR SELECT
USING (auth.uid() = cliente_id);

-- Política: Clientes podem criar favoritos apenas para si mesmos
DROP POLICY IF EXISTS "Clientes podem criar favoritos" ON public.lojas_favoritas;
CREATE POLICY "Clientes podem criar favoritos"
ON public.lojas_favoritas FOR INSERT
WITH CHECK (auth.uid() = cliente_id);

-- Política: Clientes podem excluir apenas seus favoritos
DROP POLICY IF EXISTS "Clientes podem excluir favoritos" ON public.lojas_favoritas;
CREATE POLICY "Clientes podem excluir favoritos"
ON public.lojas_favoritas FOR DELETE
USING (auth.uid() = cliente_id);
```

### Passo 4: Execute

1. Clique no botão **"Run"** (ou pressione `Ctrl + Enter`)
2. Aguarde a confirmação de sucesso
3. Você deve ver: "Success. No rows returned"

### Passo 5: Verificar se funcionou

Execute este SQL para verificar:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'lojas_favoritas'
);
```

Se retornar `true`, a tabela foi criada com sucesso! ✅

### Passo 6: Testar no App

1. Recarregue a página "Meus Favoritos" no navegador
2. O erro não deve mais aparecer
3. Se você já tiver favoritos, eles aparecerão na lista

---

## 📁 Arquivo da Migration

O arquivo completo está em: `supabase/migrations/017_create_lojas_favoritas_table.sql`

---

## ❓ Problemas Comuns

### Erro: "relation already exists"
- Significa que a tabela já existe
- Isso é normal, pode ignorar ou executar apenas as políticas RLS

### Erro: "permission denied"
- Verifique se você está logado como admin do projeto
- Verifique se tem permissões para criar tabelas

### Erro: "column does not exist"
- Verifique se a tabela `revendas` existe
- Execute primeiro as migrations anteriores se necessário

---

**Última atualização**: 2025-01-07
