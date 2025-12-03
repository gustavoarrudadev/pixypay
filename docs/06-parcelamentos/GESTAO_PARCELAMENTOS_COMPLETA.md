# 💳 Crediário Digital (Parcelamentos) - Documentação Completa

## 📋 Visão Geral

Sistema completo de parcelamento PIX (BNPL - Buy Now Pay Later) para Clientes e Revendas, permitindo visualização, gestão e acompanhamento de parcelas de forma intuitiva e estratégica.

---

## 🎯 Funcionalidades Implementadas

### 1. **Para Clientes**

#### 1.1. Página "Crediário Digital" (`/cliente/parcelamentos`)
- **Visualização de todos os parcelamentos ativos**
- Grid de 3 colunas com cards de parcelas
- Filtros avançados:
  - Busca por número do pedido, revenda, cliente
  - Filtro por status do parcelamento (Todos, Ativo, Quitado, Cancelado)
  - Filtro por status da parcela (Todos, Pendente, Paga, Atrasada)
  - Filtro por data (Hoje, 7 dias, 15 dias, 30 dias, Personalizado)
- Informações exibidas:
  - Número do pedido vinculado
  - Revenda
  - Valor total do parcelamento
  - Cards de parcelas individuais com:
    - Número da parcela
    - Valor
    - Data de vencimento
    - Status (com destaque visual para vencidas)
    - QR Code PIX sempre visível
    - Código PIX copia e cola
    - Botão "Ações" para ver detalhes
- Funcionalidades:
  - Ver detalhes de cada parcela em Sheet lateral
  - Copiar código PIX
  - Visualizar QR Code para pagamento
  - Parcelamentos concluídos aparecem colapsados com botão "Ver Detalhes"

#### 1.2. Detalhes da Parcela (Sheet Lateral)
- Informações completas da parcela
- QR Code PIX para pagamento
- Código PIX copia e cola
- Data de vencimento formatada
- Status da parcela
- Informações do pedido vinculado
- Informações da revenda

---

### 2. **Para Revendas**

#### 2.1. Página "Crediário Digital" (`/revenda/parcelamentos`)
- **Visualização estratégica de parcelamentos**
- Grid de 3 colunas com cards de parcelas
- Filtros avançados:
  - Busca por número do pedido, cliente, email, telefone
  - Filtro por status do parcelamento (Todos, Ativo, Quitado, Cancelado)
  - Filtro por status da parcela (Todos, Pendente, Paga, Atrasada)
  - Filtro por data
- Estatísticas exibidas:
  - Total pago
  - Total pendente
  - Total atrasado
  - Total de parcelamentos
- Informações exibidas por parcelamento:
  - Número do pedido vinculado
  - Dados completos do cliente (nome, email, telefone)
  - Valor total do parcelamento
  - Cards de parcelas individuais
- Funcionalidades estratégicas:
  - **QR Code PIX oculto por padrão**
  - Opção "Ver PIX" no botão de ações (visível por 3 horas após ação)
  - Dar baixa em parcela individual
  - Dar baixa completa no parcelamento
  - Marcar parcela como vencida
  - Reverter parcela paga para pendente ou vencida
  - Ver detalhes completos do pedido vinculado
  - Botões de ação estratégicos:
    - "Ver Pedido Completo" - Navega para detalhes do pedido
    - "Dar Baixa Completa" - Marca todas as parcelas como pagas

#### 2.2. Detalhes da Parcela (Sheet Lateral)
- Informações completas da parcela
- Dados do cliente
- Dados do pedido vinculado
- QR Code PIX (se visível - 3 horas após "Ver PIX")
- Código PIX copia e cola (se visível)
- Ações disponíveis:
  - Dar baixa na parcela
  - Marcar como vencida
  - Reverter parcela (se paga)

---

## 🗄️ Estrutura de Banco de Dados

### **Tabela `parcelamentos`**

```sql
CREATE TABLE parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  total_parcelas INTEGER NOT NULL CHECK (total_parcelas > 0),
  valor_total DECIMAL(10, 2) NOT NULL,
  valor_parcela DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Status possíveis:**
- `ativo`: Parcelamento ativo com parcelas pendentes
- `quitado`: Todas as parcelas foram pagas
- `cancelado`: Parcelamento cancelado

---

### **Tabela `parcelas`**

```sql
CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelamento_id UUID NOT NULL REFERENCES parcelamentos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  pix_copia_cola TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(parcelamento_id, numero_parcela)
);
```

**Status possíveis:**
- `pendente`: Parcela aguardando pagamento
- `paga`: Parcela paga e confirmada
- `atrasada`: Parcela com vencimento passado e não paga

**Limite de Parcelas:**
- **Máximo de 3 parcelas por pedido**
- **2x**: Entrada + segunda parcela em 15 ou 30 dias (escolha do cliente)
- **3x**: Entrada + segunda em 15 dias + terceira em 30 dias

---

## 🔄 Fluxos Implementados

### **Fluxo de Criação de Parcelamento:**

1. **Cliente finaliza pedido com parcelamento**
2. **Sistema cria:**
   - Registro em `parcelamentos`
   - Parcelas em `parcelas` (máximo 3)
   - Primeira parcela marcada como "paga" (entrada)
   - Demais parcelas com status "pendente"
   - Geração automática de PIX para parcelas pendentes

### **Fluxo de Visualização (Cliente):**

1. Cliente acessa "Crediário Digital"
2. Sistema carrega parcelamentos ordenados por data do pedido (mais recentes primeiro)
3. Cliente visualiza cards de parcelas
4. Cliente pode:
   - Ver QR Code PIX sempre visível
   - Copiar código PIX
   - Ver detalhes em Sheet lateral
   - Filtrar por status ou data

### **Fluxo de Gestão (Revenda):**

1. Revenda acessa "Crediário Digital"
2. Sistema carrega parcelamentos de seus pedidos
3. Revenda visualiza estatísticas e cards de parcelas
4. Revenda pode:
   - Ver PIX (visível por 3 horas)
   - Dar baixa em parcela individual
   - Dar baixa completa
   - Marcar como vencida
   - Reverter parcela paga
   - Ver detalhes do pedido vinculado

---

## 💰 Sistema de Parcelamento PIX

### **Regras de Parcelamento:**

1. **Máximo de 3 parcelas por pedido**
2. **PIX à Vista:**
   - `max_parcelas = 1`
   - Não cria parcelamento

3. **PIX Parcelado 2x:**
   - Entrada (primeira parcela) - paga no momento do pedido
   - Segunda parcela em 15 ou 30 dias (escolha do cliente)
   - Cliente escolhe no checkout

4. **PIX Parcelado 3x:**
   - Entrada (primeira parcela) - paga no momento do pedido
   - Segunda parcela em 15 dias
   - Terceira parcela em 30 dias
   - Fixo, sem escolha do cliente

### **Geração de PIX:**

- PIX é gerado automaticamente para parcelas pendentes
- Código PIX copia e cola armazenado em `parcelas.pix_copia_cola`
- QR Code gerado dinamicamente usando API externa
- Para revendas: PIX oculto por padrão, visível por 3 horas após ação "Ver PIX"

---

## 🔐 Segurança (RLS)

### **Políticas Implementadas:**

1. **Parcelamentos:**
   - Clientes veem apenas parcelamentos de seus pedidos
   - Revendas veem parcelamentos de seus pedidos
   - Admins veem todos os parcelamentos

2. **Parcelas:**
   - Herda permissões do parcelamento
   - Revendas podem atualizar status (dar baixa, marcar como vencida, reverter)

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/gerenciarParcelamentos.ts` - Funções CRUD de parcelamentos e parcelas

### **Componentes:**
- `src/components/parcelamentos/ParcelaCard.tsx` - Card de parcela reutilizável
- `src/components/revendas/QRCode.tsx` - Componente de QR Code

### **Páginas Cliente:**
- `src/pages/cliente/Parcelamentos.tsx` - Crediário Digital

### **Páginas Revenda:**
- `src/pages/revenda/Parcelamentos.tsx` - Crediário Digital

---

## 🎨 Design e UX

### **Princípios:**
- Grid de 3 colunas para melhor visualização
- Cards de parcela com informações claras
- Status visual (cores diferentes para pendente, paga, vencida)
- Parcelas vencidas destacadas em vermelho com ícone pulsante
- Parcelamentos concluídos colapsados
- Sheet lateral para detalhes completos
- Filtros avançados consistentes

---

## 📊 Ordenação

### **Padrão de Ordenação:**
- **Parcelamentos:** Ordenados por `pedido.criado_em` DESC (mais recentes primeiro)
- **Parcelas:** Ordenadas por `numero_parcela` ASC dentro de cada parcelamento

---

## 🔄 Funcionalidades de Gestão (Revenda)

### **Dar Baixa em Parcela:**
- Marca parcela individual como paga
- Define `data_pagamento` como data atual
- Atualiza status para "paga"
- Confirmação via AlertDialog

### **Dar Baixa Completa:**
- Marca todas as parcelas pendentes como pagas
- Atualiza status do parcelamento para "quitado"
- Confirmação via AlertDialog

### **Marcar como Vencida:**
- Altera status da parcela para "atrasada"
- Parcela fica destacada em vermelho
- Confirmação via AlertDialog

### **Reverter Parcela:**
- Permite reverter parcela paga para:
  - "pendente" ou
  - "atrasada"
- Remove `data_pagamento`
- Confirmação via AlertDialog com seleção de novo status

---

## 📝 Status e Versão

**Status**: ✅ Implementado e Funcional  
**Última atualização**: 2025-01-12  
**Versão**: 2.0

---

## 🔗 Referências Relacionadas

- [Pedidos Completa](./GESTAO_PEDIDOS_COMPLETA.md)
- [Checkout e Pedidos](./GESTAO_CHECKOUT_PEDIDOS.md)

