# 📦 Gestão de Produtos - Sistema Completo

## 📋 Visão Geral

Sistema completo de gestão de produtos para revendas, permitindo que cada revenda cadastre, edite e gerencie seus próprios produtos de forma independente.

---

## 🎯 Funcionalidades

### 1. **CRUD Completo de Produtos**
- ✅ Cadastro de produtos com nome, descrição, preço e imagem
- ✅ Edição de todas as informações do produto
- ✅ Exclusão de produtos
- ✅ Listagem em grid de 4 colunas
- ✅ Switch Ativo/Inativo para controlar visibilidade na loja pública

### 2. **Upload de Imagens**
- ✅ Upload de imagens para Supabase Storage
- ✅ Validação de tipo (JPG, PNG, WEBP)
- ✅ Validação de tamanho (máx. 5MB)
- ✅ Preview antes de salvar
- ✅ Remoção de imagens antigas ao atualizar

### 3. **Filtros e Busca**
- ✅ Busca por nome ou descrição
- ✅ Filtro por status (Todos, Ativos, Inativos)
- ✅ Atualização em tempo real

---

## 🗄️ Estrutura de Banco de Dados

### **Tabela `produtos`**

```sql
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `id`: Identificador único do produto
- `revenda_id`: ID da revenda proprietária (FK)
- `nome`: Nome do produto (obrigatório, máx. 255 caracteres)
- `descricao`: Descrição detalhada do produto (opcional, TEXT)
- `preco`: Preço em reais (obrigatório, DECIMAL com 2 casas)
- `imagem_url`: URL da imagem no Supabase Storage (opcional)
- `ativo`: Status do produto (true = visível na loja pública)
- `criado_em`: Data de criação
- `atualizado_em`: Data da última atualização (atualizado automaticamente)

**Índices:**
- `idx_produtos_revenda_id`: Performance em consultas por revenda
- `idx_produtos_ativo`: Performance em filtros de status
- `idx_produtos_criado_em`: Ordenação por data de criação

---

## 🔒 Segurança (RLS)

### **Políticas de Acesso:**

1. **Revendas podem ver apenas seus produtos**
   - Consulta apenas produtos onde `revenda_id` corresponde à revenda do usuário logado

2. **Revendas podem criar produtos apenas para si mesmas**
   - Validação no INSERT garante que `revenda_id` seja da própria revenda

3. **Revendas podem atualizar apenas seus produtos**
   - Validação no UPDATE garante propriedade

4. **Revendas podem excluir apenas seus produtos**
   - Validação no DELETE garante propriedade

5. **Admins podem gerenciar todos os produtos**
   - Acesso completo para administradores

6. **Produtos ativos são públicos**
   - Permite acesso público (sem autenticação) para produtos com `ativo = true`
   - Necessário para a loja pública funcionar

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/gerenciarProduto.ts` - Funções CRUD de produtos
- `src/lib/storage.ts` - Funções de upload/download de imagens

### **Componentes:**
- `src/components/revendas/CardProduto.tsx` - Card de produto no grid
- `src/components/revendas/FormProduto.tsx` - Formulário de criação/edição
- `src/components/revendas/UploadImagem.tsx` - Componente de upload

### **Páginas:**
- `src/pages/revenda/Produtos.tsx` - Página principal de gestão

---

## 🚀 Como Usar

### **Cadastrar Novo Produto:**

1. Acesse **Produtos** no menu lateral
2. Clique em **"Novo Produto"**
3. Preencha:
   - **Nome**: Nome do produto (obrigatório)
   - **Descrição**: Descrição detalhada (opcional)
   - **Preço**: Preço em reais (obrigatório)
   - **Imagem**: Faça upload da imagem principal (opcional)
4. Clique em **"Criar Produto"**

### **Editar Produto:**

1. Na lista de produtos, clique em **"Editar"** no card desejado
2. Modifique os campos necessários
3. Clique em **"Salvar Alterações"**

### **Ativar/Desativar Produto:**

1. Use o **Switch** no card do produto
2. **Ativo** = Visível na loja pública
3. **Inativo** = Não aparece na loja pública

### **Excluir Produto:**

1. Clique em **"Excluir"** no card do produto
2. Confirme a exclusão
3. ⚠️ **Atenção**: Esta ação não pode ser desfeita

---

## 📸 Upload de Imagens

### **Especificações:**
- **Tipos permitidos**: JPG, JPEG, PNG, WEBP
- **Tamanho máximo**: 5MB
- **Estrutura no Storage**: `produtos/{revenda_id}/{produto_id}/imagem.{ext}`

### **Processo:**
1. Usuário seleciona arquivo
2. Sistema valida tipo e tamanho
3. Upload para Supabase Storage
4. URL pública é retornada
5. URL é salva no campo `imagem_url` do produto

---

## 🔍 Filtros e Busca

### **Busca:**
- Busca por nome do produto
- Busca por descrição
- Case-insensitive
- Atualização em tempo real

### **Filtros:**
- **Todos**: Mostra todos os produtos
- **Ativos**: Apenas produtos visíveis na loja pública
- **Inativos**: Apenas produtos ocultos

---

## ⚠️ Validações

### **Nome:**
- Obrigatório
- Máximo 255 caracteres
- Não pode ser vazio

### **Preço:**
- Obrigatório
- Deve ser >= 0
- Formato: DECIMAL(10, 2)

### **Descrição:**
- Opcional
- Máximo 1000 caracteres

### **Imagem:**
- Opcional
- Tipo: JPG, PNG ou WEBP
- Tamanho máximo: 5MB

---

## 🎨 Interface

### **Grid de Produtos:**
- **Desktop**: 4 colunas (xl:grid-cols-4)
- **Tablet**: 3 colunas (lg:grid-cols-3)
- **Mobile**: 2 colunas (sm:grid-cols-2)
- **Mobile pequeno**: 1 coluna

### **Card de Produto:**
- Imagem do produto (ou placeholder)
- Nome do produto
- Descrição (truncada)
- Preço formatado (R$)
- Switch Ativo/Inativo
- Botões Editar e Excluir

---

## 🔄 Fluxos

### **Fluxo de Criação:**
1. Usuário clica em "Novo Produto"
2. Dialog abre com formulário vazio
3. Usuário preenche dados e faz upload de imagem (opcional)
4. Sistema valida dados
5. Produto é criado no banco
6. Lista é atualizada

### **Fluxo de Edição:**
1. Usuário clica em "Editar" no card
2. Dialog abre com dados preenchidos
3. Usuário modifica dados
4. Sistema valida alterações
5. Produto é atualizado no banco
6. Lista é atualizada

### **Fluxo de Ativação/Desativação:**
1. Usuário alterna Switch
2. Sistema atualiza campo `ativo`
3. Lista é atualizada
4. Produto aparece/desaparece da loja pública

---

## 🧪 Testes Recomendados

1. ✅ Criar produto com todos os campos
2. ✅ Criar produto apenas com nome e preço
3. ✅ Editar produto existente
4. ✅ Ativar/desativar produto
5. ✅ Excluir produto
6. ✅ Upload de imagem válida
7. ✅ Tentar upload de arquivo inválido
8. ✅ Buscar produto por nome
9. ✅ Filtrar por status
10. ✅ Verificar RLS (produtos de outras revendas não aparecem)

---

## 📝 Notas Importantes

1. **Produtos são isolados por revenda**: Cada revenda vê apenas seus próprios produtos
2. **Produtos inativos não aparecem na loja pública**: Use o Switch para controlar visibilidade
3. **Imagens são opcionais**: Produtos podem ser cadastrados sem imagem
4. **Exclusão é permanente**: Não há lixeira ou recuperação
5. **Preço deve ser positivo**: Não é permitido preço negativo

---

## 🔗 Relacionamentos

- **Produto → Revenda**: Muitos para Um (N:1)
- **Produto → Storage**: Um para Um (1:1) - imagem_url

---

## 📚 Referências

- Migration: `015_create_produtos_table.sql`
- Biblioteca: `src/lib/gerenciarProduto.ts`
- Componentes: `src/components/revendas/`
- Página: `src/pages/revenda/Produtos.tsx`

---

**Última atualização**: 2025-01-07  
**Versão**: 1.0

