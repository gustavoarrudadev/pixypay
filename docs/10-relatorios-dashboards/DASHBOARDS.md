# Documentação dos Dashboards

## Visão Geral

O sistema possui três dashboards distintos, um para cada role (Admin, Revenda, Cliente), cada um com funcionalidades e KPIs específicos para suas necessidades.

---

## Dashboard Admin

### Objetivo
Fornecer uma visão completa e em tempo real de toda a plataforma, permitindo monitoramento de todas as métricas críticas e tomada de decisões estratégicas.

### Funcionalidades Principais

#### 1. Visão Geral (Dashboard Geral)
- **Métricas Principais em Cards:**
  - Receita Total (com comparação vs. dia anterior)
  - Total de Transações (com comparação)
  - Total de Pedidos (com comparação)
  - Total de Clientes (com comparação)
  - Total de Revendas Ativas (com comparação)
  - Repasses Realizados (com comparação)
  - Repasses Pendentes (com comparação)
  - Valor Total em Parcelamentos (com comparação)
  - Inadimplência Total (com comparação)

#### 2. Gráficos e Visualizações

**Gráfico de Receita ao Longo do Tempo:**
- Linha temporal mostrando receita diária/semanal/mensal
- Filtro por período (7 dias, 15 dias, 30 dias, personalizado)
- Comparação com período anterior

**Distribuição por Modalidade de Pagamento:**
- Gráfico de pizza ou barras mostrando:
  - PIX à Vista
  - PIX Parcelado
  - Percentual de cada modalidade

**Top Revendas por Volume:**
- Gráfico de barras horizontais
- Top 10 revendas por volume de vendas
- Mostrar valor total e quantidade de pedidos

**Distribuição de Status de Pedidos:**
- Gráfico de pizza mostrando:
  - Pendentes
  - Confirmados
  - Preparando
  - Pronto
  - Em Trânsito
  - Entregues
  - Cancelados

**Evolução de Parcelamentos:**
- Gráfico de linha mostrando:
  - Parcelamentos Ativos ao longo do tempo
  - Parcelas Pagas vs. Pendentes
  - Valor total em parcelamentos

**Inadimplência:**
- Gráfico de barras mostrando:
  - Clientes inadimplentes por revenda
  - Valor total atrasado por revenda
  - Tendência de inadimplência

**Repasses por Período:**
- Gráfico de barras agrupadas mostrando:
  - Repasses realizados vs. pendentes
  - Comparação mês a mês

#### 3. Filtros Avançados
- **Período:** Hoje, Últimos 7 dias, Últimos 15 dias, Últimos 30 dias, Personalizado
- **Revenda:** Seletor de revenda específica (opcional)
- **Status:** Todos, Pendentes, Confirmados, Entregues, Cancelados
- **Modalidade:** Todas, PIX à Vista, PIX Parcelado

#### 4. Atualização em Tempo Real
- Atualização automática a cada 30 segundos
- Indicador visual quando há atualização
- Possibilidade de atualização manual via botão

#### 5. Cards de Resumo Rápido
- **Últimos Pedidos:** Lista dos 5 pedidos mais recentes
- **Alertas:** Notificações importantes (inadimplências críticas, repasses pendentes, etc.)
- **Ações Rápidas:** Botões para ações frequentes

---

## Dashboard Revenda

### Objetivo
Fornecer à revenda uma visão completa de seu negócio, incluindo métricas de vendas, financeiro e gestão de clientes.

### Funcionalidades Principais

#### 1. Visão Geral
- **Métricas Principais em Cards:**
  - Recebidos Hoje (com comparação vs. dia anterior)
  - Valores Liberados (com comparação)
  - Valores Pendentes (com comparação)
  - Total de Pedidos (com comparação)
  - Total de Clientes (com comparação)
  - Parcelamentos Ativos (com comparação)
  - Taxa Média de Comissão (com comparação)

#### 2. Link Público e QR Code da Loja
- **Card Destaque:**
  - Link público da loja (copiável)
  - QR Code gerado automaticamente
  - Botão para compartilhar
  - Estatísticas de visualizações do link (se disponível)

#### 3. Gráficos e Visualizações

**Receita ao Longo do Tempo:**
- Gráfico de linha mostrando receita diária/semanal
- Filtro por período
- Comparação com período anterior

**Distribuição de Pedidos por Status:**
- Gráfico de pizza ou barras
- Status: Pendente, Confirmado, Preparando, Pronto, Em Trânsito, Entregue

**Top Produtos Mais Vendidos:**
- Gráfico de barras horizontais
- Top 10 produtos por quantidade vendida
- Mostrar quantidade e valor total

**Evolução de Clientes:**
- Gráfico de linha mostrando:
  - Novos clientes ao longo do tempo
  - Clientes ativos
  - Clientes favoritos

**Parcelamentos:**
- Gráfico mostrando:
  - Parcelamentos ativos
  - Parcelas pagas vs. pendentes
  - Valor total em parcelamentos

**Repasses:**
- Gráfico de barras mostrando:
  - Repasses realizados por período
  - Valores recebidos vs. pendentes

#### 4. Filtros Avançados
- **Período:** Hoje, Últimos 7 dias, Últimos 15 dias, Últimos 30 dias, Personalizado
- **Status de Pedidos:** Todos, Pendentes, Confirmados, Entregues
- **Modalidade:** Todas, PIX à Vista, PIX Parcelado

#### 5. Atualização em Tempo Real
- Atualização automática a cada 30 segundos
- Indicador visual quando há atualização
- Possibilidade de atualização manual

#### 6. Cards de Resumo Rápido
- **Últimos Pedidos:** Lista dos 5 pedidos mais recentes
- **Próximos Repasses:** Informações sobre próximos repasses programados
- **Alertas:** Notificações importantes (conta PIX não cadastrada, repasses pendentes, etc.)

---

## Dashboard Cliente

### Objetivo
Fornecer ao cliente uma visão simples e útil de suas compras, pedidos e histórico.

### Funcionalidades Principais

#### 1. Visão Geral Simplificada
- **Métricas Principais em Cards:**
  - Total de Pedidos (com comparação vs. mês anterior)
  - Pedidos Pendentes
  - Pedidos Entregues
  - Total Gasto (com comparação)
  - Parcelamentos Ativos
  - Próxima Parcela a Vencer

#### 2. Gráficos Simples

**Gastos ao Longo do Tempo:**
- Gráfico de linha simples mostrando gastos mensais
- Últimos 6 meses

**Distribuição de Pedidos por Status:**
- Gráfico de pizza simples
- Status: Pendente, Confirmado, Entregue, Cancelado

**Parcelamentos:**
- Gráfico de barras simples mostrando:
  - Parcelas pagas vs. pendentes
  - Valor total em parcelamentos

#### 3. Cards de Resumo
- **Últimos Pedidos:** Lista dos 3 pedidos mais recentes com status
- **Próximas Parcelas:** Lista das próximas 3 parcelas a vencer
- **Favoritos:** Lista das últimas 3 revendas favoritadas

#### 4. Filtros Básicos
- **Período:** Últimos 30 dias, Últimos 3 meses, Últimos 6 meses, Todo o período

#### 5. Atualização em Tempo Real
- Atualização automática a cada 60 segundos
- Atualização manual disponível

---

## Organização dos Menus

### Admin
1. Dashboard
2. Revendas
3. Clientes
4. Pedidos
5. Parcelamentos
6. Agendamentos
7. Repasses
8. Financeiro
9. Inadimplência
10. Relatórios (novo - vazio por enquanto)
11. Ajuda (novo - FAQ voltado para Admin)
12. Administração (novo - vazio por enquanto)

### Revenda
1. Dashboard
2. Presença na Loja
3. Produtos
4. Pedidos
5. Agendamentos
6. Clientes
7. Parcelamentos
8. Histórico de Vendas
9. Financeiro
10. Relatório
11. Administração (novo - vazio por enquanto)

### Cliente
1. Dashboard
2. Minhas Compras
3. Pedidos
4. Parcelamentos
5. Meu Histórico
6. Meus Favoritos
7. Negociações
8. Ajuda (corrigir FAQs sobre parcelamento)

---

## Componentes de Gráficos

### Bibliotecas Recomendadas
- **Recharts** (recomendado para React)
- Ou usar componentes do Shadcn se disponíveis

### Tipos de Gráficos
1. **Line Chart:** Para evolução temporal
2. **Bar Chart:** Para comparações
3. **Pie Chart:** Para distribuições
4. **Area Chart:** Para áreas acumuladas

---

## Atualização em Tempo Real

### Estratégia
- Usar `setInterval` para atualização periódica
- Mostrar indicador visual durante atualização
- Evitar atualização quando o usuário está interagindo com a página
- Pausar atualização quando a aba está inativa

### Performance
- Debounce nas atualizações
- Cache de dados quando possível
- Atualização incremental quando viável

---

## Paleta de Cores e Tema

### Cores Principais
- **Violet:** Ações principais, destaques
- **Green:** Valores positivos, sucesso
- **Red:** Alertas, valores negativos
- **Yellow:** Avisos, pendências
- **Blue:** Informações neutras
- **Neutral:** Fundos, textos

### Tema
- Suporte completo a Dark Mode
- Usar escala Neutral (50-950) do Shadcn
- Accent color: Violet (5-10% da interface)

---

## Implementação Técnica

### Estrutura de Arquivos
```
src/pages/admin/Dashboard.tsx
src/pages/revenda/Dashboard.tsx
src/pages/cliente/Dashboard.tsx
src/components/dashboard/
  - MetricCard.tsx
  - ChartCard.tsx
  - FilterBar.tsx
  - RealTimeIndicator.tsx
```

### Hooks Customizados
- `useRealTimeData`: Para atualização em tempo real
- `useDashboardMetrics`: Para cálculo de métricas
- `useChartData`: Para preparação de dados dos gráficos

---

## Próximos Passos

1. Criar estrutura base dos dashboards
2. Implementar componentes de gráficos
3. Adicionar filtros avançados
4. Implementar atualização em tempo real
5. Reorganizar menus conforme especificado
6. Criar páginas vazias (Relatórios, Ajuda Admin, Administração)
7. Corrigir FAQs do Cliente
8. Garantir que Dashboard seja o primeiro menu ao logar

