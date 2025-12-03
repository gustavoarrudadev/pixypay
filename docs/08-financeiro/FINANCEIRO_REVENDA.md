# Financeiro - Revenda

## 📋 Visão Geral

A área financeira da revenda permite visualizar recebimentos, gerenciar modalidades de repasse e acompanhar o histórico de repasses recebidos.

---

## 🎯 Funcionalidades

### 1. Dashboard Financeiro

#### Métricas Principais:
- **Valores Recebidos Hoje**: Soma de todos os repasses recebidos no dia atual
- **Valores Liberados para Receber**: Valores que estão disponíveis para repasse mas ainda não foram processados
- **Valores Pendentes**: Valores aguardando o prazo de repasse (D+1, D+15 ou D+30)
- **Total em Processamento**: Soma de todos os valores pendentes

#### Filtros Avançados:
- **Período**: Hoje, Últimos 7 dias, Últimos 30 dias, Personalizado
- **Status**: Todos, Pendentes, Liberados, Repassados
- **Modalidade**: D+1, D+15, D+30
- **Busca**: Por número de pedido, nome do cliente, valor

### 2. Gerenciamento de Modalidade

#### Seleção de Modalidade:
- Botão destacado mostrando modalidade atual (D+1, D+15 ou D+30)
- Opções para mudar modalidade
- Modal de confirmação mostrando:
  - Taxa percentual atual vs nova taxa
  - Taxa fixa atual vs nova taxa
  - Impacto da mudança
  - Aviso: "A partir desta mudança, novos pedidos seguirão a nova modalidade"

#### Regras de Mudança:
- Mudança é imediata
- Pedidos já criados mantêm a modalidade original
- Novos pedidos seguem a nova modalidade
- Histórico de mudanças é registrado

### 3. Histórico de Repasses

#### Visualização:
- Lista de todos os repasses recebidos
- Detalhes de cada repasse:
  - Data do repasse
  - Valor total recebido
  - Quantidade de pedidos incluídos
  - Taxas descontadas
  - Lista de pedidos com links diretos

#### Filtros:
- Período (data inicial e final)
- Valor mínimo/máximo
- Busca por número de pedido ou cliente

### 4. Detalhes de Transações

#### Informações Exibidas:
- Número do pedido (com link)
- Cliente (com link)
- Valor bruto
- Taxas aplicadas (percentual + fixa)
- Valor líquido
- Modalidade de repasse
- Data de pagamento
- Data prevista de repasse
- Status atual
- Data de repasse (se já foi repassado)

---

## 🎨 Interface

### Layout Principal:
```
┌─────────────────────────────────────────┐
│  Dashboard Financeiro                   │
├─────────────────────────────────────────┤
│  [Card] Valores Recebidos Hoje         │
│  [Card] Liberados para Receber          │
│  [Card] Pendentes                       │
│  [Card] Total em Processamento          │
├─────────────────────────────────────────┤
│  Modalidade Atual: [D+1] [Alterar]     │
├─────────────────────────────────────────┤
│  [Filtros Avançados]                    │
├─────────────────────────────────────────┤
│  [Tabela/Grid] Histórico de Repasses    │
└─────────────────────────────────────────┘
```

### Componentes:
- **Card de Métrica**: Valor destacado com ícone e variação
- **Seletor de Modalidade**: Dropdown com preview de taxas
- **Tabela de Repasses**: Colunas: Data, Valor, Pedidos, Status, Ações
- **Modal de Confirmação**: Formulário de mudança de modalidade

---

## 🔗 Navegação

### Links Diretos:
- Número do pedido → `/revenda/pedidos/{pedido_id}`
- Nome do cliente → `/revenda/clientes/{cliente_id}`
- Parcelamento → `/revenda/parcelamentos/{parcelamento_id}`

---

## 📊 Gráficos e Visualizações

### Gráfico de Evolução:
- Linha temporal mostrando valores recebidos ao longo do tempo
- Período selecionável (7 dias, 30 dias, 90 dias, 1 ano)

### Distribuição por Modalidade:
- Gráfico de pizza mostrando distribuição de pedidos por modalidade
- Valores totais por modalidade

---

## 🔔 Notificações

- Notificação quando novo repasse está disponível
- Alerta de mudança de modalidade bem-sucedida
- Notificação de valores liberados para receber

---

## 📱 Responsividade

- Cards empilhados em mobile
- Tabela com scroll horizontal
- Filtros em accordion colapsável
- Botões de ação adaptados para touch

