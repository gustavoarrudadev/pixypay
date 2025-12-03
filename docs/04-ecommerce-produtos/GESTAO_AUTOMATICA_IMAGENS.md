# Gestão Automática de Imagens - Deletar Imagens Antigas

## Visão Geral

O sistema implementa uma regra importante: **sempre que uma imagem for substituída por outra, a imagem anterior é automaticamente deletada do Storage do Supabase**. Isso evita acúmulo de arquivos não utilizados e mantém o storage limpo.

## Implementação

### 1. **Componente UploadImagem** (`src/components/revendas/UploadImagem.tsx`)

Quando uma nova imagem é enviada:
- Verifica se havia uma imagem anterior (`valorInicial`)
- Se existir, deleta a imagem anterior do storage antes de fazer upload da nova
- Continua o processo mesmo se não conseguir deletar a anterior (não bloqueia o upload)

**Fluxo:**
```typescript
1. Usuário seleciona nova imagem
2. Se existe imagem anterior → Deleta do storage
3. Faz upload da nova imagem
4. Retorna URL da nova imagem
```

### 2. **Remoção de Imagem** (`handleRemove`)

Quando o usuário remove uma imagem:
- Deleta a imagem do storage antes de remover do estado
- Garante que arquivos órfãos não permaneçam no storage

### 3. **Atualização de Produto** (`src/lib/gerenciarProduto.ts`)

Na função `atualizarProduto`:
- Busca o produto atual para obter a URL da imagem anterior
- Se a imagem está sendo alterada:
  - **Substituição**: Se havia imagem anterior e está sendo substituída por nova → deleta a anterior
  - **Remoção**: Se havia imagem e está sendo removida (null) → deleta a anterior
- Atualiza o produto no banco de dados

### 4. **Exclusão de Produto** (`deletarProduto`)

Quando um produto é deletado:
- Busca o produto para obter a URL da imagem
- Deleta a imagem do storage antes de deletar o produto
- Garante que imagens de produtos deletados não permaneçam no storage

### 5. **Presença na Loja** (`src/pages/revenda/PresencaLoja.tsx`)

**Upload de Logo:**
- Quando uma nova logo é enviada e havia uma anterior → deleta a anterior
- Quando a logo é removida → deleta do storage

**Salvamento:**
- Se a logo foi removida (logoUrl é null mas havia original) → deleta do storage antes de salvar

## Função de Deletar Imagem

A função `deletarImagem` em `src/lib/storage.ts`:
- Extrai o bucket e o caminho da URL pública do Supabase
- Formato da URL: `https://xxx.supabase.co/storage/v1/object/public/bucket/caminho/arquivo.jpg`
- Extrai: `bucket = "produtos"` ou `"logos-revendas"`
- Extrai: `path = "revenda_id/produto_id/arquivo.jpg"` (sem o bucket)
- Deleta usando `supabase.storage.from(bucket).remove([path])`

## Tratamento de Erros

- Se não conseguir deletar a imagem anterior, o sistema **continua** com o processo
- Logs de aviso são registrados no console para debug
- Não bloqueia o upload ou atualização se a deleção falhar
- Isso garante que o sistema continue funcionando mesmo se houver problemas com deleção

## Casos de Uso

### Caso 1: Substituir Imagem de Produto
1. Usuário edita produto que já tem imagem
2. Faz upload de nova imagem
3. Sistema deleta imagem anterior automaticamente
4. Nova imagem é salva

### Caso 2: Remover Imagem de Produto
1. Usuário remove imagem de um produto
2. Sistema deleta imagem do storage
3. Campo `imagem_url` é atualizado para `null`

### Caso 3: Substituir Logo da Revenda
1. Revenda faz upload de nova logo
2. Sistema deleta logo anterior automaticamente
3. Nova logo é salva

### Caso 4: Deletar Produto
1. Usuário deleta um produto
2. Sistema deleta a imagem do produto do storage
3. Produto é removido do banco de dados

## Benefícios

✅ **Storage Limpo**: Evita acúmulo de arquivos não utilizados  
✅ **Economia de Espaço**: Reduz custos de storage  
✅ **Automático**: Não requer ação manual do usuário  
✅ **Robusto**: Continua funcionando mesmo se deleção falhar  
✅ **Logs**: Registra todas as operações para debug

## Arquivos Modificados

- `src/components/revendas/UploadImagem.tsx` - Deleção automática ao substituir
- `src/lib/gerenciarProduto.ts` - Deleção ao atualizar/deletar produto
- `src/pages/revenda/PresencaLoja.tsx` - Deleção ao substituir/remover logo
- `src/lib/storage.ts` - Função `deletarImagem` melhorada

