# 📦 Gestão de Pedidos - Documentação Completa

## 📋 Visão Geral

Sistema completo de gestão de pedidos para Clientes e Revendas, incluindo visualização, acompanhamento de status, detalhes completos, parcelamentos e agendamentos de entrega.

---

## 🎯 Funcionalidades Implementadas

### 1. **Para Clientes**

#### 1.1. Página "Pedidos" (`/cliente/pedidos`)
- **Histórico rápido e consultor de pedidos**
- Visualização em Grid (4 colunas) ou Lista
- Filtros avançados:
  - Busca por número do pedido, revenda, cliente
  - Filtro por status (Todos, Pendente, Confirmado, Preparando, Pronto, Em Trânsito, Entregue, Cancelado)
  - Filtro por data (Hoje, 7 dias, 15 dias, 30 dias, Personalizado)
- Informações exibidas:
  - Número do pedido
  - Data de criação
  - Status do pedido
  - Revenda
  - Valor total
  - Botão "Ver Detalhes"

#### 1.2. Página "Minhas Compras" (`/cliente/compras`)
- **Visualização completa e detalhada de compras**
- Visualização em Grid (4 colunas) ou Lista
- Filtros avançados:
  - Busca por número do pedido, revenda, cliente
  - Filtro por status
  - Filtro por data
- Informações exibidas:
  - Todos os detalhes do pedido
  - Itens do pedido
  - Informações de entrega/agendamento
  - Parcelamentos resumidos
  - Histórico completo

#### 1.3. Detalhes do Pedido (`/cliente/compras/:id`)
- Informações completas do pedido
- Lista de itens com imagens e detalhes
- Dados de entrega/agendamento
- Parcelamentos completos (se aplicável):
  - Cards de parcelas com QR Code PIX
  - Informações de vencimento
  - Status de cada parcela
  - Botão "Ações" para ver detalhes
- Sheet lateral com detalhes de cada parcela

---

### 2. **Para Revendas**

#### 2.1. Página "Pedidos" (`/revenda/pedidos`)
- **Gestão completa de pedidos recebidos**
- Visualização em Grid (4 colunas) ou Lista
- Filtros avançados:
  - Busca por número do pedido, cliente, email, telefone
  - Filtro por status
  - Filtro por data
- Informações exibidas:
  - Número do pedido
  - Cliente
  - Data
  - Status
  - Valor total
  - Tipo de entrega
  - Botão "Ver Detalhes"

#### 2.2. Detalhes do Pedido (`/revenda/pedidos/:id`)
- Informações completas do pedido
- Dados do cliente
- Lista de itens
- Informações de entrega/agendamento
- Parcelamentos completos (se aplicável):
  - Cards de parcelas
  - Ações para dar baixa em parcelas individuais
  - Ações para marcar como vencida
  - Ações para reverter parcela paga
  - Opção "Ver PIX" (visível por 3 horas)
- Atualização de status do pedido:
  - Pendente
  - Confirmado
  - Preparando
  - Pronto
  - Em Trânsito
  - Entregue
  - Cancelado

---

## 💳 Sistema de Parcelamentos (Crediário Digital)

### 1. **Para Clientes**

#### 1.1. Página "Crediário Digital" (`/cliente/parcelamentos`)
- Visualização de todos os parcelamentos ativos
- Grid de 3 colunas com cards de parcelas
- Filtros avançados:
  - Busca por número do pedido, revenda, cliente
  - Filtro por status do parcelamento (Todos, Ativo, Quitado, Cancelado)
  - Filtro por status da parcela (Todos, Pendente, Paga, Atrasada)
  - Filtro por data
- Informações exibidas:
  - Número do pedido
  - Revenda
  - Valor total
  - Parcelas pendentes/pagas/atrasadas
  - Cards de parcelas individuais
- Funcionalidades:
  - QR Code PIX sempre visível
  - Copiar código PIX
  - Ver detalhes de cada parcela em Sheet lateral
  - Parcelamentos concluídos aparecem colapsados

#### 1.2. Detalhes da Parcela (Sheet Lateral)
- Informações completas da parcela
- QR Code PIX para pagamento
- Código PIX copia e cola
- Data de vencimento
- Status da parcela
- Histórico de pagamentos

---

### 2. **Para Revendas**

#### 2.1. Página "Crediário Digital" (`/revenda/parcelamentos`)
- Visualização estratégica de parcelamentos
- Grid de 3 colunas com cards de parcelas
- Filtros avançados:
  - Busca por número do pedido, cliente, email, telefone
  - Filtro por status do parcelamento
  - Filtro por status da parcela
  - Filtro por data
- Informações exibidas:
  - Número do pedido vinculado
  - Dados completos do cliente
  - Valor total do parcelamento
  - Estatísticas (Total pago, pendente, atrasado)
  - Cards de parcelas individuais
- Funcionalidades:
  - **QR Code PIX oculto por padrão**
  - Opção "Ver PIX" no botão de ações (visível por 3 horas)
  - Dar baixa em parcela individual
  - Dar baixa completa no parcelamento
  - Marcar parcela como vencida
  - Reverter parcela paga para pendente ou vencida
  - Ver detalhes completos do pedido vinculado

#### 2.2. Detalhes da Parcela (Sheet Lateral)
- Informações completas da parcela
- Dados do cliente
- Dados do pedido vinculado
- QR Code PIX (se visível)
- Código PIX copia e cola (se visível)
- Ações disponíveis:
  - Dar baixa na parcela
  - Marcar como vencida
  - Reverter parcela (se paga)

---

## 📅 Sistema de Agendamentos de Entrega

### 1. **Configuração (Revenda)**

#### 1.1. Página "Agendamentos" (`/revenda/agendamentos`)
- **Configuração de Agendamento:**
  - Agendamento Livre (cliente escolhe qualquer horário)
  - Agendamento Configurado (horários e dias específicos)
  - Seleção de dias da semana disponíveis
  - Configuração de horários disponíveis

#### 1.2. Agendamentos Realizados
- Lista de todos os agendamentos de entrega
- Ordenação por data e horário
- Informações exibidas:
  - Data do agendamento
  - Horário
  - Número do pedido vinculado
  - Dados do cliente
  - Valor do pedido
  - Status (Agendado, Confirmado, Realizado, Cancelado)
  - Observações

---

### 2. **Criação de Agendamento (Cliente)**

#### 2.1. No Checkout
- Opção "Agendar entrega"
- Seleção de data (baseada na configuração da revenda)
- Seleção de horário (baseada na configuração da revenda)
- Campo de observações
- Criação automática ao finalizar pedido

---

## 🗄️ Estrutura de Banco de Dados

### **Tabela `pedidos`**

```sql
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  forma_pagamento VARCHAR(50) NOT NULL,
  parcelas_total INTEGER,
  valor_total DECIMAL(10, 2) NOT NULL,
  valor_entrada DECIMAL(10, 2),
  tipo_entrega VARCHAR(50) NOT NULL,
  endereco_entrega_id UUID REFERENCES enderecos_entrega(id),
  agendamento_entrega_id UUID REFERENCES agendamentos_entrega(id),
  observacoes TEXT,
  dados_cliente JSONB NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Status possíveis:**
- `pendente`: Aguardando confirmação
- `confirmado`: Pedido confirmado
- `preparando`: Em preparação
- `pronto`: Pronto para entrega/retirada
- `em_transito`: Em trânsito
- `entregue`: Entregue
- `cancelado`: Cancelado

---

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
- Máximo de 3 parcelas por pedido
- 2x: Entrada + segunda parcela em 15 ou 30 dias (escolha do cliente)
- 3x: Entrada + segunda em 15 dias + terceira em 30 dias

---

### **Tabela `agendamentos_entrega`**

```sql
CREATE TABLE agendamentos_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data_agendamento DATE NOT NULL,
  horario TIME NOT NULL,
  horario_inicio TIME,
  horario_fim TIME,
  observacoes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'agendado',
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Status possíveis:**
- `agendado`: Agendamento criado
- `confirmado`: Agendamento confirmado pela revenda
- `realizado`: Entrega realizada
- `cancelado`: Agendamento cancelado

---

### **Tabela `revendas` (Campos de Agendamento)**

```sql
ALTER TABLE revendas
ADD COLUMN agendamento_entrega_livre BOOLEAN DEFAULT true,
ADD COLUMN agendamento_horarios_disponiveis TEXT[] DEFAULT '{}',
ADD COLUMN agendamento_dias_disponiveis INTEGER[] DEFAULT '{0,1,2,3,4,5,6}';
```

---

## 🔄 Fluxos Implementados

### **Fluxo de Pedido Completo:**

1. **Cliente adiciona produtos ao carrinho**
2. **Cliente vai para checkout**
3. **Cliente preenche dados e escolhe:**
   - Forma de pagamento (PIX à vista ou parcelado)
   - Número de parcelas (se parcelado)
   - Tipo de entrega
   - Endereço ou agendamento (se necessário)
4. **Sistema cria:**
   - Pedido na tabela `pedidos`
   - Itens na tabela `itens_pedido`
   - Parcelamento e parcelas (se parcelado)
   - Agendamento de entrega (se agendado)
5. **Cliente vê página de confirmação**
6. **Pedido aparece em:**
   - Cliente: "Pedidos" e "Minhas Compras"
   - Revenda: "Pedidos"
   - Agendamento aparece em "Agendamentos" (se aplicável)

---

### **Fluxo de Parcelamento:**

1. **Pedido criado com parcelamento**
2. **Sistema cria:**
   - Registro em `parcelamentos`
   - Parcelas em `parcelas` (máximo 3)
   - Primeira parcela marcada como "paga" (entrada)
3. **Cliente visualiza em "Crediário Digital"**
4. **Cliente pode:**
   - Ver QR Code PIX de parcelas pendentes
   - Copiar código PIX
   - Ver detalhes de cada parcela
5. **Revenda pode:**
   - Ver todos os parcelamentos de seus pedidos
   - Dar baixa em parcelas individuais
   - Marcar como vencida
   - Reverter parcela paga
   - Ver PIX (por 3 horas após ação)

---

### **Fluxo de Agendamento:**

1. **Revenda configura agendamento:**
   - Escolhe se é livre ou configurado
   - Define dias da semana disponíveis
   - Define horários disponíveis (se configurado)
2. **Cliente no checkout:**
   - Escolhe "Agendar entrega"
   - Seleciona data (baseada na configuração)
   - Seleciona horário (baseado na configuração)
   - Adiciona observações
3. **Sistema cria agendamento:**
   - Registro em `agendamentos_entrega`
   - Vinculado ao pedido
   - Aparece na revenda em "Agendamentos Realizados"

---

## 🔐 Segurança (RLS)

### **Políticas Implementadas:**

1. **Pedidos:**
   - Clientes veem apenas seus próprios pedidos
   - Revendas veem apenas pedidos de sua revenda
   - Admins veem todos os pedidos

2. **Parcelamentos:**
   - Clientes veem apenas parcelamentos de seus pedidos
   - Revendas veem parcelamentos de seus pedidos
   - Admins veem todos os parcelamentos

3. **Parcelas:**
   - Herda permissões do parcelamento

4. **Agendamentos de Entrega:**
   - Clientes veem apenas seus próprios agendamentos
   - Revendas veem agendamentos de seus pedidos
   - Admins veem todos os agendamentos

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/gerenciarPedidos.ts` - Funções CRUD de pedidos
- `src/lib/gerenciarParcelamentos.ts` - Funções CRUD de parcelamentos
- `src/lib/gerenciarAgendamentoEntrega.ts` - Funções de agendamento de entrega

### **Componentes:**
- `src/components/parcelamentos/ParcelaCard.tsx` - Card de parcela
- `src/components/revendas/QRCode.tsx` - Componente de QR Code

### **Páginas Cliente:**
- `src/pages/cliente/Pedidos.tsx` - Histórico rápido de pedidos
- `src/pages/cliente/MinhasCompras.tsx` - Visualização completa de compras
- `src/pages/cliente/DetalhesPedido.tsx` - Detalhes do pedido
- `src/pages/cliente/Parcelamentos.tsx` - Crediário Digital

### **Páginas Revenda:**
- `src/pages/revenda/Pedidos.tsx` - Gestão de pedidos
- `src/pages/revenda/DetalhesPedido.tsx` - Detalhes do pedido
- `src/pages/revenda/Parcelamentos.tsx` - Crediário Digital
- `src/pages/revenda/Agendamentos.tsx` - Agendamentos de entrega

---

## 🎨 Design e UX

### **Princípios:**
- Design clean e moderno
- Responsivo (mobile-first)
- Filtros avançados consistentes
- Visualização em Grid ou Lista
- Animações suaves
- Feedback visual claro

### **Componentes Reutilizáveis:**
- Cards de pedido
- Cards de parcela
- Filtros avançados
- Sheets laterais para detalhes
- AlertDialogs para confirmações

---

## 📊 Estatísticas e Relatórios

### **Para Revendas:**
- Total de pedidos
- Pedidos por status
- Valor total de pedidos
- Parcelamentos ativos
- Parcelas pendentes/pagas/atrasadas
- Agendamentos realizados

---

## 🔄 Ordenação

### **Padrão de Ordenação:**
- **Pedidos:** Ordenados por `criado_em` DESC (mais recentes primeiro)
- **Parcelamentos:** Ordenados por `pedido.criado_em` DESC (mais recentes primeiro)
- **Agendamentos:** Ordenados por `data_agendamento` ASC, `horario` ASC

---

## 📝 Status e Versão

**Status**: ✅ Implementado e Funcional  
**Última atualização**: 2025-01-12  
**Versão**: 2.0

---

## 🔗 Referências Relacionadas

- [Checkout e Pedidos](./GESTAO_CHECKOUT_PEDIDOS.md)
- [Parcelamentos](./GESTAO_PARCELAMENTOS.md)
- [Agendamentos](./GESTAO_AGENDAMENTOS.md)
- [Minhas Compras](./GESTAO_MINHAS_COMPRAS.md)

