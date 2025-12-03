# Financeiro - Admin

## 📋 Visão Geral

A área financeira do Admin fornece visão completa de todas as transações financeiras da plataforma, permitindo gerenciamento geral e por revenda.

---

## 🎯 Funcionalidades

### 1. Dashboard Financeiro Geral

#### Métricas Principais:
- **Receita Total da Plataforma**: Soma de todas as taxas cobradas
- **Total de Transações**: Quantidade total de transações processadas
- **Repasses Realizados**: Total de repasses já processados
- **Repasses Pendentes**: Valores aguardando processamento
- **Taxa Média**: Taxa média aplicada em todas as transações
- **Distribuição por Modalidade**: Quantidade e valores por D+1, D+15, D+30

#### Filtros Avançados:
- **Período**: Hoje, Últimos 7 dias, Últimos 30 dias, Personalizado
- **Revenda**: Todas ou específica (dropdown)
- **Status**: Todos, Pendentes, Liberados, Repassados
- **Modalidade**: D+1, D+15, D+30
- **Valor**: Mínimo e máximo
- **Busca**: Por número de pedido, cliente, revenda

### 2. Histórico de Transações

#### Visualização:
- Lista completa de todas as transações financeiras
- Detalhes por transação:
  - Revenda (com link)
  - Pedido (com link)
  - Cliente (com link)
  - Valor bruto
  - Taxas aplicadas
  - Valor líquido
  - Modalidade
  - Status
  - Datas (pagamento, repasse previsto, repasse realizado)

#### Filtros:
- Por revenda
- Por período
- Por status
- Por modalidade
- Por valor
- Busca textual

### 3. Relatórios e Análises

#### Relatórios Disponíveis:
- **Receita por Período**: Gráfico de linha temporal
- **Distribuição por Revenda**: Gráfico de barras
- **Distribuição por Modalidade**: Gráfico de pizza
- **Evolução de Taxas**: Gráfico de área
- **Top Revendas**: Ranking por volume de transações

#### Exportação:
- Exportar relatórios em CSV
- Exportar relatórios em PDF
- Agendamento de relatórios periódicos

---

## 🎯 Menu Repasses

### 1. Repasses para Hoje

#### Visualização:
- Lista de repasses que devem ser processados hoje
- Agrupados por revenda
- Totalizadores por revenda
- Opção de processar em lote ou individual

#### Informações:
- Revenda
- Quantidade de transações
- Valor total a repassar
- Taxas descontadas
- Lista de pedidos incluídos

### 2. Histórico de Repasses

#### Visualização:
- Lista completa de todos os repasses realizados
- Detalhes de cada repasse:
  - Data do repasse
  - Revenda
  - Valor total
  - Quantidade de transações
  - Lista de pedidos incluídos
  - Observações

#### Filtros:
- Por revenda
- Por período
- Por valor
- Busca textual

### 3. Processamento de Repasses

#### Funcionalidades:
- Selecionar múltiplos repasses para processar
- Processar repasse individual
- Adicionar observações ao repasse
- Marcar como processado manualmente
- Cancelar repasse (com justificativa)

---

## 🎨 Interface

### Layout Principal:
```
┌─────────────────────────────────────────┐
│  Dashboard Financeiro                   │
├─────────────────────────────────────────┤
│  [Card] Receita Total                   │
│  [Card] Transações                      │
│  [Card] Repasses                        │
│  [Card] Taxa Média                      │
├─────────────────────────────────────────┤
│  [Gráficos] Evolução e Distribuição    │
├─────────────────────────────────────────┤
│  [Filtros Avançados]                    │
├─────────────────────────────────────────┤
│  [Tabela] Histórico de Transações       │
└─────────────────────────────────────────┘
```

### Componentes:
- **Cards de Métrica**: Valores destacados com ícones
- **Gráficos Interativos**: Chart.js ou Recharts
- **Tabela de Transações**: Colunas sortáveis e filtros inline
- **Modal de Processamento**: Formulário para processar repasses

---

## 🔗 Navegação

### Links Diretos:
- Revenda → `/admin/revendas/{revenda_id}`
- Pedido → `/admin/pedidos/{pedido_id}`
- Cliente → `/admin/clientes/{cliente_id}`
- Parcelamento → `/admin/parcelamentos/{parcelamento_id}`

---

## 📊 Gráficos e Visualizações

### Gráficos Disponíveis:
1. **Receita ao Longo do Tempo**: Linha temporal
2. **Distribuição por Revenda**: Barras horizontais
3. **Distribuição por Modalidade**: Pizza
4. **Evolução de Taxas**: Área empilhada
5. **Top 10 Revendas**: Ranking

### Períodos:
- Últimos 7 dias
- Últimos 30 dias
- Últimos 90 dias
- Último ano
- Personalizado

---

## ⚙️ Gerenciamento de Configurações

### Edição Manual de Taxas (Detalhes da Revenda):
- Formulário para editar taxa percentual
- Formulário para editar taxa fixa
- Validação de valores mínimos/máximos
- Histórico de alterações
- Confirmação com preview de impacto

---

## 🔔 Notificações e Alertas

- Alerta de repasses pendentes para processar
- Notificação de valores altos aguardando repasse
- Alerta de mudanças de configuração de taxas
- Relatório diário de atividades financeiras

---

## 📱 Responsividade

- Layout adaptável para desktop e tablet
- Tabelas com scroll horizontal em mobile
- Gráficos responsivos
- Filtros em sidebar colapsável

---

## 🔐 Permissões

- Apenas usuários com role `admin` podem acessar
- Todas as ações são registradas em log de auditoria
- Confirmação obrigatória para ações críticas

