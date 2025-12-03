# 🛒 Sistema de Checkout e Pedidos - Documentação Completa

## 📋 Visão Geral

Sistema completo de e-commerce com checkout moderno, carrinho de compras, parcelamento PIX (BNPL), gestão de pedidos e integração com todas as roles do sistema.

---

## 🎯 Funcionalidades Principais

### 1. **Carrinho de Compras**
- Adicionar produtos da loja pública ao carrinho
- Gerenciar quantidades
- Remover itens
- Continuar comprando
- Ir para pagamento

### 2. **Checkout Completo**
- Formulário de dados do cliente
- Seleção de forma de pagamento (PIX à vista ou parcelado)
- Seleção de parcelamento (baseado nas opções do produto)
- Seleção de entrega (Retirar no local, Receber no endereço, Agendar entrega)
- Validação completa de dados
- Design responsivo (desktop e mobile)

### 3. **Sistema de Parcelamento (BNPL)**
- PIX Parcelado (Buy Now Pay Later)
- Configuração por produto (quantas vezes pode parcelar)
- Múltiplos produtos com diferentes opções de parcelamento
- Opção de parcelar tudo junto ou separado
- Primeira parcela como entrada via PIX

### 4. **Gestão de Pedidos**
- Cliente: Visualizar pedidos em "Minhas Compras"
- Cliente: Acompanhar status e parcelamentos
- Revenda: Gerenciar pedidos recebidos
- Revenda: Atualizar status (reflete para o cliente)
- Detalhes completos do pedido

### 5. **Sistema de Parcelamentos**
- Visualização de parcelas pendentes e pagas
- Histórico de pagamentos
- Menu dedicado de parcelamentos
- Integração com pedidos

### 6. **Agendamento de Entrega**
- Opção de agendar entrega no checkout
- Integração com sistema de agendamentos da revenda
- Visualização em calendário

---

## 🗄️ Estrutura de Banco de Dados

### **1. Tabela `carrinho` (Temporário/Sessão)**

Armazena itens do carrinho antes de finalizar o pedido.

```sql
CREATE TABLE carrinho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  sessao_id VARCHAR(255), -- Para usuários não autenticados
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cliente_id, produto_id), -- Um produto por cliente
  UNIQUE(sessao_id, produto_id) -- Um produto por sessão
);
```

**Campos:**
- `id`: Identificador único
- `cliente_id`: ID do cliente autenticado (NULL se não autenticado)
- `sessao_id`: ID da sessão para usuários não autenticados
- `produto_id`: Produto no carrinho
- `quantidade`: Quantidade do produto
- `criado_em` / `atualizado_em`: Timestamps

**Políticas RLS:**
- Clientes veem apenas seu próprio carrinho
- Clientes podem inserir/atualizar/deletar apenas seus itens
- Sessão pública para não autenticados (com limitação de tempo)

---

### **2. Tabela `pedidos`**

Armazena os pedidos realizados pelos clientes.

```sql
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  forma_pagamento VARCHAR(50) NOT NULL, -- 'pix_vista', 'pix_parcelado'
  parcelas_total INTEGER, -- NULL se pix_vista, número de parcelas se parcelado
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
  valor_entrada DECIMAL(10, 2), -- Primeira parcela se parcelado
  tipo_entrega VARCHAR(50) NOT NULL, -- 'retirar_local', 'receber_endereco', 'agendar'
  endereco_entrega_id UUID REFERENCES enderecos_entrega(id),
  agendamento_entrega_id UUID REFERENCES agendamentos_entrega(id),
  observacoes TEXT,
  dados_cliente JSONB NOT NULL, -- Nome, telefone, email, CPF
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

**Campos:**
- `id`: Identificador único
- `cliente_id`: Cliente que fez o pedido
- `revenda_id`: Revenda que recebeu o pedido
- `status`: Status atual do pedido
- `forma_pagamento`: Tipo de pagamento escolhido
- `parcelas_total`: Total de parcelas (se parcelado)
- `valor_total`: Valor total do pedido
- `valor_entrada`: Valor da entrada (primeira parcela)
- `tipo_entrega`: Tipo de entrega escolhido
- `endereco_entrega_id`: Endereço de entrega (se aplicável)
- `agendamento_entrega_id`: Agendamento de entrega (se aplicável)
- `observacoes`: Observações do cliente
- `dados_cliente`: Dados do cliente no momento do pedido (JSON)
- `criado_em` / `atualizado_em`: Timestamps

**Políticas RLS:**
- Clientes veem apenas seus próprios pedidos
- Revendas veem apenas pedidos de sua revenda
- Admins veem todos os pedidos

---

### **3. Tabela `itens_pedido`**

Armazena os itens de cada pedido.

```sql
CREATE TABLE itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `id`: Identificador único
- `pedido_id`: Pedido ao qual pertence
- `produto_id`: Produto (referência histórica)
- `quantidade`: Quantidade comprada
- `preco_unitario`: Preço unitário no momento da compra
- `subtotal`: Quantidade × Preço unitário
- `criado_em`: Timestamp

**Políticas RLS:**
- Herda permissões do pedido (via JOIN)

---

### **4. Tabela `parcelamentos`**

Armazena os parcelamentos de cada pedido.

```sql
CREATE TABLE parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  total_parcelas INTEGER NOT NULL CHECK (total_parcelas > 0),
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
  valor_parcela DECIMAL(10, 2) NOT NULL CHECK (valor_parcela >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'ativo', -- 'ativo', 'quitado', 'cancelado'
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `id`: Identificador único
- `pedido_id`: Pedido vinculado
- `total_parcelas`: Total de parcelas
- `valor_total`: Valor total do parcelamento
- `valor_parcela`: Valor de cada parcela
- `status`: Status do parcelamento
- `criado_em` / `atualizado_em`: Timestamps

**Políticas RLS:**
- Clientes veem apenas seus próprios parcelamentos
- Revendas veem parcelamentos de seus pedidos
- Admins veem todos

---

### **5. Tabela `parcelas`**

Armazena cada parcela individual do parcelamento.

```sql
CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelamento_id UUID NOT NULL REFERENCES parcelamentos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
  valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'paga', 'atrasada', 'cancelada'
  pix_copia_cola TEXT, -- Código PIX para pagamento
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(parcelamento_id, numero_parcela)
);
```

**Campos:**
- `id`: Identificador único
- `parcelamento_id`: Parcelamento ao qual pertence
- `numero_parcela`: Número da parcela (1, 2, 3...)
- `valor`: Valor da parcela
- `data_vencimento`: Data de vencimento
- `data_pagamento`: Data em que foi paga (NULL se pendente)
- `status`: Status da parcela
- `pix_copia_cola`: Código PIX para pagamento (gerado quando necessário)
- `criado_em` / `atualizado_em`: Timestamps

**Políticas RLS:**
- Herda permissões do parcelamento

---

### **6. Tabela `enderecos_entrega`**

Armazena endereços de entrega dos clientes.

```sql
CREATE TABLE enderecos_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome_endereco VARCHAR(255), -- Ex: "Casa", "Trabalho"
  cep VARCHAR(10) NOT NULL,
  logradouro VARCHAR(255) NOT NULL,
  numero VARCHAR(50) NOT NULL,
  complemento VARCHAR(255),
  bairro VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `id`: Identificador único
- `cliente_id`: Cliente proprietário
- `nome_endereco`: Nome do endereço (opcional)
- `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`: Dados do endereço
- `criado_em` / `atualizado_em`: Timestamps

**Políticas RLS:**
- Clientes veem apenas seus próprios endereços
- Clientes podem gerenciar seus endereços

---

### **7. Tabela `agendamentos_entrega`**

Armazena agendamentos de entrega vinculados a pedidos.

```sql
CREATE TABLE agendamentos_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data_agendamento DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  observacoes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'agendado', -- 'agendado', 'confirmado', 'realizado', 'cancelado'
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `id`: Identificador único
- `pedido_id`: Pedido vinculado
- `revenda_id`: Revenda responsável
- `cliente_id`: Cliente que solicitou
- `data_agendamento`: Data do agendamento
- `horario_inicio` / `horario_fim`: Horário do agendamento
- `observacoes`: Observações
- `status`: Status do agendamento
- `criado_em` / `atualizado_em`: Timestamps

**Políticas RLS:**
- Clientes veem apenas seus próprios agendamentos
- Revendas veem agendamentos de seus pedidos
- Admins veem todos

---

### **8. Atualização da Tabela `produtos`**

Adicionar campo de parcelamento máximo:

```sql
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS max_parcelas INTEGER DEFAULT 1 CHECK (max_parcelas >= 1);
```

**Campo:**
- `max_parcelas`: Número máximo de parcelas permitidas para o produto (padrão: 1 = apenas à vista)

---

## 🔄 Fluxo de Compra

### **1. Loja Pública → Carrinho**
1. Cliente navega na loja pública
2. Clica em "Comprar" em um produto
3. Produto é adicionado ao carrinho
4. Cliente pode continuar comprando ou ir para o carrinho

### **2. Carrinho → Checkout**
1. Cliente visualiza itens no carrinho
2. Pode alterar quantidades
3. Pode remover itens
4. Clica em "Ir para Pagamento"
5. Redirecionado para o checkout

### **3. Checkout → Confirmação**
1. Cliente preenche dados pessoais
2. Escolhe forma de pagamento (PIX à vista ou parcelado)
3. Se parcelado, escolhe número de parcelas (baseado nas opções dos produtos)
4. Escolhe tipo de entrega
5. Se necessário, preenche endereço ou agenda entrega
6. Confirma o pedido
7. Redirecionado para página de confirmação

### **4. Confirmação → Minhas Compras**
1. Cliente vê resumo do pedido
2. Botão para ir para "Minhas Compras"
3. Pode acompanhar status e parcelamentos

---

## 💳 Sistema de Parcelamento

### **Lógica de Parcelamento:**

1. **Produto Individual:**
   - Cada produto tem `max_parcelas` configurado pela revenda
   - Cliente pode escolher de 1 até `max_parcelas` parcelas

2. **Múltiplos Produtos:**
   - Se produtos têm diferentes `max_parcelas`, mostra opções claras
   - Exemplo: "Produto 1: até 5x | Produto 2: até 3x"
   - Cliente pode escolher:
     - Parcelar tudo junto (máximo = menor `max_parcelas` entre produtos)
     - Parcelar separadamente (cada produto com seu próprio limite)

3. **Primeira Parcela:**
   - Primeira parcela é paga como entrada via PIX
   - Restante é parcelado

4. **Geração de Parcelas:**
   - Ao confirmar pedido, cria registro em `parcelamentos`
   - Cria registros em `parcelas` para cada parcela
   - Primeira parcela já vem com status "paga" (entrada)
   - Demais parcelas com status "pendente"

---

## 📦 Sistema de Entrega

### **Tipos de Entrega:**

1. **Retirar no Local:**
   - Cliente retira na revenda
   - Não precisa de endereço
   - Não gera agendamento

2. **Receber no Endereço:**
   - Cliente informa endereço de entrega
   - Pode usar endereço salvo ou cadastrar novo
   - Entrega em data/horário padrão

3. **Agendar Entrega:**
   - Cliente escolhe data e horário
   - Cria registro em `agendamentos_entrega`
   - Aparece no sistema de agendamentos da revenda
   - Status inicial: "agendado"

---

## 🔐 Segurança e RLS

### **Políticas RLS:**

1. **Carrinho:**
   - Cliente autenticado: vê apenas seu carrinho
   - Não autenticado: usa sessão temporária (expira em 24h)

2. **Pedidos:**
   - Cliente: apenas seus pedidos
   - Revenda: apenas pedidos de sua revenda
   - Admin: todos os pedidos

3. **Parcelamentos:**
   - Herda permissões do pedido

4. **Endereços:**
   - Cliente: apenas seus endereços

5. **Agendamentos:**
   - Cliente: apenas seus agendamentos
   - Revenda: agendamentos de seus pedidos

---

## 🎨 Design e UX

### **Princípios:**
- Design clean e moderno
- Responsivo (mobile-first)
- Formulários intuitivos
- Feedback visual claro
- Animações suaves
- Acessibilidade

### **Componentes:**
- Cards de produto no carrinho
- Formulário de checkout multi-etapas
- Seleção de parcelamento visual
- Seleção de entrega intuitiva
- Resumo do pedido claro

---

## 🔌 Integrações Futuras

### **Gateway de Pagamento:**
- Estrutura preparada para integração
- Por enquanto: pedido criado sem gateway
- Futuro: integração com PIX, cartão, etc.

### **Notificações:**
- Email de confirmação de pedido
- Notificações de status
- Lembretes de parcelas

---

## 📝 Próximos Passos

1. ✅ Criar documentação completa
2. ⏳ Criar migrations do banco
3. ⏳ Criar bibliotecas de gerenciamento
4. ⏳ Criar páginas (Carrinho, Checkout, Confirmação)
5. ⏳ Atualizar páginas existentes
6. ⏳ Integrar com loja pública
7. ⏳ Testes completos

---

**Última atualização**: 2025-01-07  
**Versão**: 1.0

