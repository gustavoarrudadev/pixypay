# Sistema de Multirevenda - Pixy Pay

## 📋 Visão Geral

O sistema de **Multirevenda** permite que revendas gerenciem múltiplas unidades de lojas físicas, cada uma com suas próprias configurações, produtos, preços, links públicos e regras de entrega.

### 🎯 Objetivo

Permitir que revendas que possuem mais de uma unidade física na cidade possam:
- Cadastrar e gerenciar múltiplas unidades
- Associar produtos específicos a cada unidade
- Configurar preços diferentes por unidade
- Ter links públicos e QR Codes únicos por unidade
- Configurar regras de entrega e taxas específicas por unidade
- Gerenciar presença na loja de forma independente por unidade

---

## 🗄️ Estrutura de Dados

### Tabela: `unidades_revenda`

```sql
CREATE TABLE public.unidades_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Configurações de presença na loja
  nome_publico VARCHAR(255),
  descricao_loja TEXT,
  logo_url TEXT,
  link_publico VARCHAR(100) UNIQUE,
  link_publico_ativo BOOLEAN DEFAULT true NOT NULL,
  
  -- Configurações de entrega
  taxa_entrega DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  oferecer_entrega BOOLEAN DEFAULT true NOT NULL,
  oferecer_retirada_local BOOLEAN DEFAULT true NOT NULL,
  oferecer_agendamento BOOLEAN DEFAULT true NOT NULL,
  
  -- Endereço da unidade (opcional, pode ser diferente da revenda)
  cep VARCHAR(10),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  
  CONSTRAINT unidades_revenda_revenda_id_fkey FOREIGN KEY (revenda_id) 
    REFERENCES public.revendas(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_unidades_revenda_revenda_id ON public.unidades_revenda(revenda_id);
CREATE INDEX idx_unidades_revenda_link_publico ON public.unidades_revenda(link_publico);
CREATE INDEX idx_unidades_revenda_ativo ON public.unidades_revenda(ativo);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_unidades_revenda_updated_at
  BEFORE UPDATE ON public.unidades_revenda
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Alterações na Tabela: `produtos`

```sql
-- Adicionar campo unidade_id (opcional, para produtos específicos de unidade)
ALTER TABLE public.produtos 
ADD COLUMN unidade_id UUID REFERENCES public.unidades_revenda(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX idx_produtos_unidade_id ON public.produtos(unidade_id);

-- Se unidade_id for NULL, produto é da revenda (compatibilidade com produtos existentes)
-- Se unidade_id for preenchido, produto é específico daquela unidade
```

### Alterações na Tabela: `pedidos`

```sql
-- Adicionar campo unidade_id para identificar de qual unidade veio o pedido
ALTER TABLE public.pedidos 
ADD COLUMN unidade_id UUID REFERENCES public.unidades_revenda(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX idx_pedidos_unidade_id ON public.pedidos(unidade_id);
```

---

## 🔐 Políticas RLS (Row Level Security)

### Políticas para `unidades_revenda`

```sql
-- Revendas podem ver suas próprias unidades
CREATE POLICY "Revendas podem ver suas unidades"
ON public.unidades_revenda FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.revendas r
    WHERE r.id = unidades_revenda.revenda_id
    AND r.user_id = auth.uid()
  )
);

-- Revendas podem criar unidades
CREATE POLICY "Revendas podem criar unidades"
ON public.unidades_revenda FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.revendas r
    WHERE r.id = unidades_revenda.revenda_id
    AND r.user_id = auth.uid()
  )
);

-- Revendas podem atualizar suas unidades
CREATE POLICY "Revendas podem atualizar suas unidades"
ON public.unidades_revenda FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.revendas r
    WHERE r.id = unidades_revenda.revenda_id
    AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.revendas r
    WHERE r.id = unidades_revenda.revenda_id
    AND r.user_id = auth.uid()
  )
);

-- Revendas podem deletar suas unidades
CREATE POLICY "Revendas podem deletar suas unidades"
ON public.unidades_revenda FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.revendas r
    WHERE r.id = unidades_revenda.revenda_id
    AND r.user_id = auth.uid()
  )
);

-- Acesso público para ler unidades ativas com link público (para loja pública)
CREATE POLICY "Acesso público para unidades ativas"
ON public.unidades_revenda FOR SELECT
USING (
  ativo = true 
  AND link_publico IS NOT NULL 
  AND link_publico_ativo = true
);
```

---

## 📱 Funcionalidades por Área

### 1. Presença na Loja (`src/pages/revenda/PresencaLoja.tsx`)

#### 1.1 Gerenciamento de Unidades

**Nova Interface:**
- Lista de unidades cadastradas (cards ou tabela)
- Botão "Nova Unidade" para criar nova unidade
- Cada unidade mostra:
  - Nome da unidade
  - Status (Ativa/Inativa)
  - Link público (se configurado)
  - Quantidade de produtos associados
  - Ações: Editar, Duplicar, Desativar/Ativar, Excluir

**Criar/Editar Unidade:**
- Formulário com campos:
  - **Nome da Unidade** (obrigatório)
  - **Nome Público** (opcional, usado na loja pública)
  - **Descrição da Loja** (opcional)
  - **Upload de Logo** (opcional, específica da unidade)
  - **Link Público** (único, slug para acesso à loja)
  - **Status** (Ativa/Inativa)
  - **Taxa de Entrega** (R$)
  - **Opções de Entrega:**
    - Oferecer entrega
    - Oferecer retirada local
    - Oferecer agendamento
  - **Endereço da Unidade** (opcional, campos separados)

**Link Público e QR Code:**
- Cada unidade tem seu próprio link público único
- QR Code gerado automaticamente para cada unidade
- Visualização e cópia do link e QR Code dentro da configuração da unidade
- Link público no formato: `/loja/:linkPublico`

#### 1.2 Migração de Dados Existentes

**Estratégia:**
1. Criar uma unidade padrão "Matriz" ou "Unidade Principal" para cada revenda existente
2. Migrar dados de `revendas` para a unidade padrão:
   - `nome_publico` → `unidades_revenda.nome_publico`
   - `descricao_loja` → `unidades_revenda.descricao_loja`
   - `logo_url` → `unidades_revenda.logo_url`
   - `link_publico` → `unidades_revenda.link_publico`
   - `link_publico_ativo` → `unidades_revenda.link_publico_ativo`
   - `taxa_entrega` → `unidades_revenda.taxa_entrega`
   - `oferecer_entrega` → `unidades_revenda.oferecer_entrega`
   - `oferecer_retirada_local` → `unidades_revenda.oferecer_retirada_local`
   - `oferecer_agendamento` → `unidades_revenda.oferecer_agendamento`
3. Associar produtos existentes à unidade padrão (se necessário)
4. Manter compatibilidade: se não houver unidades, usar dados da revenda

---

### 2. Produtos (`src/pages/revenda/Produtos.tsx`)

#### 2.1 Seleção de Unidade

**Nova Interface:**
- Dropdown/Select no topo da página: "Unidade: [Selecionar Unidade]"
- Opções:
  - "Todas as Unidades" (mostra produtos de todas as unidades)
  - Lista de unidades cadastradas
  - "Nova Unidade" (abre modal para criar unidade rapidamente)

**Filtro por Unidade:**
- Ao selecionar uma unidade, mostra apenas produtos daquela unidade
- Produtos sem unidade (legado) aparecem em "Todas as Unidades"

#### 2.2 Cadastro de Produtos

**Formulário Atualizado:**
- Campo "Unidade" (obrigatório ao criar novo produto)
- Opções:
  - Selecionar unidade existente
  - Criar nova unidade (abre modal rápido)
- Validação: produto deve estar associado a uma unidade

**Produtos por Unidade:**
- Cada unidade pode ter produtos diferentes
- Mesmo produto pode existir em múltiplas unidades com preços diferentes
- Produtos são independentes por unidade (estoque, preço, ativo/inativo)

#### 2.3 Listagem de Produtos

**Visualização:**
- Badge/indicador mostrando a qual unidade pertence cada produto
- Filtro por unidade mantém-se ativo durante navegação
- Contador de produtos por unidade

---

### 3. Loja Pública (`src/pages/publica/LojaPublica.tsx`)

#### 3.1 Acesso por Link Público

**Mudança de Rota:**
- Antes: `/loja/:linkPublico` → mostrava produtos da revenda
- Agora: `/loja/:linkPublico` → identifica a unidade pelo `link_publico` e mostra produtos daquela unidade

**Busca de Unidade:**
```typescript
// Buscar unidade pelo link_publico
const { data: unidade } = await supabase
  .from('unidades_revenda')
  .select('*, revenda:revendas(*)')
  .eq('link_publico', linkPublico)
  .eq('ativo', true)
  .eq('link_publico_ativo', true)
  .single()
```

**Exibição:**
- Logo da unidade (ou da revenda se não houver)
- Nome público da unidade (ou da revenda)
- Descrição da loja da unidade
- Produtos apenas daquela unidade
- Configurações de entrega da unidade (taxas, opções)

#### 3.2 Compatibilidade

**Fallback:**
- Se não encontrar unidade pelo `link_publico`, tenta buscar pela revenda (compatibilidade com links antigos)
- Se encontrar revenda mas não unidade, usa dados da revenda e mostra todos os produtos (sem filtro de unidade)

---

### 4. Dashboard (`src/pages/revenda/Dashboard.tsx`)

#### 4.1 Remoção de Link Público e QR Code

**Mudanças:**
- Remover card "Link Público da Loja"
- Remover card "QR Code da Loja"
- Adicionar card informativo: "Gerencie links públicos e QR Codes em Presença na Loja"

#### 4.2 Estatísticas por Unidade

**Novos Cards (Opcional):**
- Total de unidades ativas
- Produtos por unidade (gráfico ou lista)
- Pedidos por unidade (gráfico ou lista)

---

### 5. Pedidos (`src/pages/revenda/Pedidos.tsx`)

#### 5.1 Identificação de Unidade

**Visualização:**
- Badge/indicador mostrando de qual unidade veio o pedido
- Filtro por unidade
- Estatísticas por unidade

**Associação:**
- Ao criar pedido, identificar unidade pelo produto selecionado
- Se produto tem `unidade_id`, pedido recebe `unidade_id`
- Se produto não tem `unidade_id` (legado), pedido fica sem `unidade_id`

---

### 6. Checkout (`src/pages/cliente/Checkout.tsx`)

#### 6.1 Regras por Unidade

**Aplicação de Regras:**
- Identificar unidade do produto no carrinho
- Aplicar configurações da unidade:
  - Taxa de entrega da unidade
  - Opções de entrega disponíveis (entrega, retirada, agendamento)
  - Horários de agendamento da unidade (se configurado)

**Validação:**
- Se carrinho tem produtos de unidades diferentes, mostrar aviso
- Opção de separar pedido por unidade ou escolher uma unidade principal

---

## 🔄 Fluxos de Uso

### Fluxo 1: Criar Nova Unidade

1. Revenda acessa **Presença na Loja**
2. Clica em **"Nova Unidade"**
3. Preenche formulário:
   - Nome da unidade
   - Configurações de presença
   - Link público (ou gera sugestão)
   - Taxa de entrega e opções
4. Salva unidade
5. Sistema gera QR Code automaticamente
6. Unidade aparece na lista

### Fluxo 2: Cadastrar Produto em Unidade

1. Revenda acessa **Produtos**
2. Seleciona unidade no dropdown
3. Clica em **"Novo Produto"**
4. Preenche dados do produto
5. Unidade já está pré-selecionada
6. Salva produto
7. Produto aparece apenas naquela unidade

### Fluxo 3: Cliente Acessa Loja Pública

1. Cliente acessa link público: `/loja/unidade-centro`
2. Sistema identifica unidade pelo `link_publico`
3. Carrega dados da unidade:
   - Logo, nome público, descrição
   - Produtos apenas daquela unidade
   - Configurações de entrega da unidade
4. Cliente adiciona produtos ao carrinho
5. Ao fazer checkout, aplica regras da unidade

### Fluxo 4: Migração de Dados Existentes

1. Admin executa migration de criação de tabela
2. Migration cria unidade padrão para cada revenda
3. Migration migra dados de `revendas` para `unidades_revenda`
4. Migration associa produtos existentes à unidade padrão
5. Sistema continua funcionando normalmente
6. Revendas podem criar novas unidades quando necessário

---

## 📚 Bibliotecas e Funções

### Nova Biblioteca: `src/lib/gerenciarUnidades.ts`

```typescript
// Interfaces
export interface UnidadeRevenda {
  id: string
  revenda_id: string
  nome: string
  ativo: boolean
  nome_publico?: string | null
  descricao_loja?: string | null
  logo_url?: string | null
  link_publico?: string | null
  link_publico_ativo: boolean
  taxa_entrega: number
  oferecer_entrega: boolean
  oferecer_retirada_local: boolean
  oferecer_agendamento: boolean
  // ... endereço
  criado_em: string
  atualizado_em: string
}

// Funções principais
export async function listarUnidades(revendaId: string): Promise<{ unidades: UnidadeRevenda[]; error: Error | null }>
export async function buscarUnidade(unidadeId: string): Promise<{ unidade: UnidadeRevenda | null; error: Error | null }>
export async function buscarUnidadePorLink(linkPublico: string): Promise<{ unidade: UnidadeRevenda | null; error: Error | null }>
export async function criarUnidade(dados: Partial<UnidadeRevenda>): Promise<{ unidade: UnidadeRevenda | null; error: Error | null }>
export async function atualizarUnidade(unidadeId: string, dados: Partial<UnidadeRevenda>): Promise<{ error: Error | null }>
export async function deletarUnidade(unidadeId: string): Promise<{ error: Error | null }>
export async function validarLinkPublicoUnidade(linkPublico: string, unidadeId?: string): Promise<{ valido: boolean; error: Error | null }>
```

### Atualização: `src/lib/gerenciarProdutos.ts`

```typescript
// Adicionar parâmetro unidadeId nas funções existentes
export async function listarProdutos(revendaId: string, unidadeId?: string): Promise<{ produtos: Produto[]; error: Error | null }>
export async function criarProduto(dados: DadosProduto & { unidade_id: string }): Promise<{ produto: Produto | null; error: Error | null }>
```

### Atualização: `src/lib/lojaPublica.ts`

```typescript
// Buscar unidade em vez de revenda
export async function buscarLojaPorLink(linkPublico: string): Promise<{ unidade: UnidadeRevenda | null; produtos: Produto[]; error: Error | null }>
```

---

## 🗂️ Estrutura de Arquivos

### Novos Arquivos

```
src/
├── pages/
│   └── revenda/
│       └── PresencaLoja.tsx (atualizado - gerenciar unidades)
│       └── Unidades.tsx (novo - se necessário separar)
├── components/
│   └── revendas/
│       └── UnidadeCard.tsx (novo - card de unidade)
│       └── FormularioUnidade.tsx (novo - formulário criar/editar)
│       └── SelecionarUnidade.tsx (novo - dropdown de seleção)
├── lib/
│   └── gerenciarUnidades.ts (novo - funções de CRUD)
```

### Arquivos Modificados

```
src/
├── pages/
│   └── revenda/
│       ├── Dashboard.tsx (remover link público e QR code)
│       ├── Produtos.tsx (adicionar seleção de unidade)
│       ├── Pedidos.tsx (mostrar unidade do pedido)
│   └── publica/
│       └── LojaPublica.tsx (buscar por unidade)
│   └── cliente/
│       └── Checkout.tsx (aplicar regras da unidade)
├── lib/
│   ├── gerenciarProdutos.ts (adicionar filtro por unidade)
│   ├── gerenciarPedidos.ts (adicionar unidade_id)
│   └── lojaPublica.ts (buscar unidade em vez de revenda)
```

---

## ✅ Checklist de Implementação

### Fase 1: Banco de Dados
- [ ] Criar migration para tabela `unidades_revenda`
- [ ] Criar migration para adicionar `unidade_id` em `produtos`
- [ ] Criar migration para adicionar `unidade_id` em `pedidos`
- [ ] Criar migration de migração de dados existentes
- [ ] Criar políticas RLS para `unidades_revenda`
- [ ] Criar índices necessários
- [ ] Criar triggers (updated_at, validações)

### Fase 2: Bibliotecas
- [ ] Criar `src/lib/gerenciarUnidades.ts`
- [ ] Atualizar `src/lib/gerenciarProdutos.ts`
- [ ] Atualizar `src/lib/gerenciarPedidos.ts`
- [ ] Atualizar `src/lib/lojaPublica.ts`

### Fase 3: Componentes
- [ ] Criar `src/components/revendas/UnidadeCard.tsx`
- [ ] Criar `src/components/revendas/FormularioUnidade.tsx`
- [ ] Criar `src/components/revendas/SelecionarUnidade.tsx`
- [ ] Atualizar `src/components/revendas/QRCode.tsx` (se necessário)

### Fase 4: Páginas
- [ ] Atualizar `src/pages/revenda/PresencaLoja.tsx`
- [ ] Atualizar `src/pages/revenda/Produtos.tsx`
- [ ] Atualizar `src/pages/revenda/Dashboard.tsx`
- [ ] Atualizar `src/pages/revenda/Pedidos.tsx`
- [ ] Atualizar `src/pages/publica/LojaPublica.tsx`
- [ ] Atualizar `src/pages/cliente/Checkout.tsx`

### Fase 5: Testes
- [ ] Testar criação de unidades
- [ ] Testar cadastro de produtos por unidade
- [ ] Testar links públicos por unidade
- [ ] Testar QR codes por unidade
- [ ] Testar loja pública por unidade
- [ ] Testar checkout com regras por unidade
- [ ] Testar migração de dados existentes

---

## 🔒 Considerações de Segurança

1. **Validação de Link Público:**
   - Link público deve ser único em toda a tabela `unidades_revenda`
   - Validação em tempo real ao digitar
   - Sugestão automática se já existir

2. **RLS:**
   - Revendas só podem gerenciar suas próprias unidades
   - Acesso público apenas para unidades ativas com link público ativo

3. **Validações:**
   - Nome da unidade obrigatório
   - Link público único
   - Unidade deve pertencer à revenda autenticada

---

## 📝 Notas de Compatibilidade

1. **Produtos Existentes:**
   - Produtos sem `unidade_id` continuam funcionando
   - Aparecem em "Todas as Unidades"
   - Podem ser associados a uma unidade posteriormente

2. **Links Públicos Antigos:**
   - Links públicos antigos (na tabela `revendas`) continuam funcionando
   - Sistema tenta buscar primeiro em `unidades_revenda`, depois em `revendas`
   - Migração cria unidade padrão com link público existente

3. **Pedidos Existentes:**
   - Pedidos sem `unidade_id` continuam funcionando
   - Podem ser identificados pela unidade do produto (se disponível)

---

## 🚀 Próximos Passos

1. Revisar documentação com equipe
2. Criar migrations no Supabase
3. Implementar bibliotecas
4. Implementar componentes
5. Atualizar páginas
6. Testar funcionalidades
7. Deploy em produção

---

**Última Atualização:** 2025-01-26  
**Versão:** 1.0.0  
**Status:** 📝 Documentação Completa - Aguardando Implementação













