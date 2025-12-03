# 📅 Agendamentos de Entrega - Documentação Completa

## 📋 Visão Geral

Sistema completo de agendamento de entregas para Revendas, permitindo configurar disponibilidade e visualizar agendamentos realizados pelos clientes durante o checkout.

---

## 🎯 Funcionalidades Implementadas

### 1. **Configuração de Agendamento (Revenda)**

#### 1.1. Página "Agendamentos" (`/revenda/agendamentos`)
- **Configuração de Agendamento:**
  - **Agendamento Livre:**
    - Cliente pode escolher qualquer data e horário
    - Ativado/desativado via Switch
    - Quando ativo, não há restrições de horários ou dias
  
  - **Agendamento Configurado:**
    - Cliente escolhe apenas entre opções pré-configuradas
    - **Dias da Semana Disponíveis:**
      - Seleção múltipla de dias (Domingo a Sábado)
      - Cliente só pode agendar nos dias selecionados
      - Padrão: Todos os dias (0-6)
    
    - **Horários Disponíveis:**
      - Configuração de horários específicos
      - Formato "HH:MM" (ex: "09:00", "14:30")
      - Adição e remoção de horários
      - Cliente escolhe apenas entre horários configurados
      - Ordenação automática dos horários

- **Salvamento:**
  - Botão "Salvar Configuração"
  - Validação: Se não for livre, deve ter pelo menos 1 horário configurado
  - Feedback visual de sucesso/erro

---

### 2. **Agendamentos Realizados (Revenda)**

#### 2.1. Lista de Agendamentos
- **Visualização:**
  - Lista ordenada por data e horário (mais próximos primeiro)
  - Scroll vertical para muitos agendamentos
  - Cards com informações completas

- **Informações Exibidas:**
  - Data do agendamento (formatada)
  - Horário (formatado HH:MM)
  - Número do pedido vinculado
  - Dados do cliente (nome)
  - Valor total do pedido
  - Status do agendamento
  - Observações (se houver)

- **Status Possíveis:**
  - **Agendado** (amarelo): Agendamento criado, aguardando confirmação
  - **Confirmado** (azul): Agendamento confirmado pela revenda
  - **Realizado** (verde): Entrega realizada
  - **Cancelado** (vermelho): Agendamento cancelado

---

### 3. **Criação de Agendamento (Cliente)**

#### 3.1. No Checkout (`/checkout`)
- **Opção "Agendar entrega":**
  - Seleção de data:
    - Se agendamento livre: Calendário completo
    - Se agendamento configurado: Apenas dias da semana disponíveis
  
  - Seleção de horário:
    - Se agendamento livre: Campo de texto livre
    - Se agendamento configurado: Dropdown com horários disponíveis
  
  - Campo de observações (opcional)

- **Criação Automática:**
  - Ao finalizar pedido, cria registro em `agendamentos_entrega`
  - Vincula ao pedido criado
  - Aparece automaticamente na revenda em "Agendamentos Realizados"

---

## 🗄️ Estrutura de Banco de Dados

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

**Campos:**
- `id`: Identificador único
- `pedido_id`: Pedido vinculado (obrigatório)
- `revenda_id`: Revenda responsável (obrigatório)
- `cliente_id`: Cliente que solicitou (obrigatório)
- `data_agendamento`: Data do agendamento
- `horario`: Horário único simplificado (formato TIME)
- `horario_inicio` / `horario_fim`: Horários de início e fim (compatibilidade)
- `observacoes`: Observações do cliente
- `status`: Status do agendamento
- `criado_em` / `atualizado_em`: Timestamps

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

**Campos:**
- `agendamento_entrega_livre`: Se true, cliente escolhe qualquer horário
- `agendamento_horarios_disponiveis`: Array de horários no formato "HH:MM"
- `agendamento_dias_disponiveis`: Array de dias da semana (0=domingo, 6=sábado)

---

## 🔄 Fluxos Implementados

### **Fluxo de Configuração:**

1. Revenda acessa "Agendamentos"
2. Revenda escolhe:
   - Agendamento Livre (Switch ON)
   - OU Agendamento Configurado (Switch OFF)
3. Se Configurado:
   - Seleciona dias da semana disponíveis
   - Adiciona horários disponíveis
4. Revenda salva configuração
5. Configuração é aplicada no checkout para clientes

---

### **Fluxo de Criação de Agendamento:**

1. Cliente no checkout escolhe "Agendar entrega"
2. Sistema verifica configuração da revenda:
   - Se livre: Mostra calendário completo e campo de horário livre
   - Se configurado: Mostra apenas dias disponíveis e dropdown de horários
3. Cliente seleciona data e horário
4. Cliente adiciona observações (opcional)
5. Cliente finaliza pedido
6. Sistema cria:
   - Pedido na tabela `pedidos`
   - Agendamento na tabela `agendamentos_entrega`
   - Vincula agendamento ao pedido
7. Agendamento aparece na revenda em "Agendamentos Realizados"

---

### **Fluxo de Visualização:**

1. Revenda acessa "Agendamentos"
2. Sistema carrega agendamentos ordenados por data e horário
3. Revenda visualiza:
   - Data e horário
   - Pedido vinculado
   - Cliente
   - Valor do pedido
   - Status
   - Observações

---

## 🔐 Segurança (RLS)

### **Políticas Implementadas:**

1. **Clientes podem criar agendamentos:**
   - Apenas para si mesmos (`cliente_id = auth.uid()`)

2. **Clientes veem seus agendamentos:**
   - Apenas agendamentos onde `cliente_id = auth.uid()`

3. **Revendas veem agendamentos de seus pedidos:**
   - Apenas agendamentos onde `revenda_id` corresponde à revenda do usuário logado

4. **Revendas podem atualizar agendamentos:**
   - Apenas agendamentos de seus pedidos

5. **Admins veem todos os agendamentos**

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/gerenciarAgendamentoEntrega.ts` - Funções CRUD de agendamentos de entrega

### **Páginas Revenda:**
- `src/pages/revenda/Agendamentos.tsx` - Configuração e visualização de agendamentos

### **Páginas Cliente:**
- `src/pages/cliente/Checkout.tsx` - Criação de agendamento durante checkout

---

## 🎨 Design e UX

### **Princípios:**
- Interface intuitiva para configuração
- Visualização clara de agendamentos
- Cards informativos com todas as informações relevantes
- Status visual com cores diferentes
- Scroll vertical para muitos agendamentos
- Feedback visual de ações

---

## 📊 Ordenação

### **Padrão de Ordenação:**
- **Agendamentos:** Ordenados por `data_agendamento` ASC, `horario` ASC (mais próximos primeiro)

---

## 🔄 Integração com Pedidos

### **Vinculação:**
- Cada agendamento está vinculado a um pedido (`pedido_id`)
- Pedido referencia o agendamento (`agendamento_entrega_id`)
- Relação bidirecional para facilitar consultas

### **Exibição em Detalhes do Pedido:**
- Agendamento aparece nos detalhes do pedido
- Mostra data, horário e observações
- Permite atualização de status pela revenda

---

## 📝 Status e Versão

**Status**: ✅ Implementado e Funcional  
**Última atualização**: 2025-01-12  
**Versão**: 2.0

---

## 🔗 Referências Relacionadas

- [Pedidos Completa](./GESTAO_PEDIDOS_COMPLETA.md)
- [Checkout e Pedidos](./GESTAO_CHECKOUT_PEDIDOS.md)

