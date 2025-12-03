# Histórico de Vendas - Revenda

## 📋 Visão Geral

Esta funcionalidade será responsável por exibir o histórico completo de vendas realizadas pela revenda. Permite visualizar relatórios detalhados, análises de desempenho e acompanhamento de vendas ao longo do tempo.

---

## 🎯 Funcionalidades Planejadas

### 1. Visualização do Histórico
- Lista completa de todas as vendas realizadas
- Filtros por período (Hoje, Semana, Mês, Trimestre, Ano, Personalizado)
- Filtros por status (Todas, Concluídas, Canceladas)
- Filtros por forma de pagamento
- Busca por número do pedido, cliente ou produto
- Ordenação por data, valor ou cliente

### 2. Detalhes da Venda
- Visualização completa dos dados da venda
- Informações do pedido original
- Lista de produtos vendidos
- Dados do cliente
- Informações de pagamento
- Histórico de status

### 3. Estatísticas e Métricas
- Total de vendas no período
- Valor total vendido
- Ticket médio
- Quantidade de pedidos
- Produtos mais vendidos
- Clientes mais frequentes
- Gráficos e visualizações

### 4. Exportação de Dados
- Exportação para CSV
- Exportação para PDF
- Relatórios personalizados
- Filtros aplicados mantidos na exportação

### 5. Análises e Insights
- Tendências de vendas
- Comparação entre períodos
- Análise de sazonalidade
- Produtos em alta/baixa
- Performance por período

---

## 🗄️ Estrutura de Banco de Dados (Planejada)

### View `vendas_completas` (a ser criada)

```sql
CREATE VIEW vendas_completas AS
SELECT 
  p.id,
  p.revenda_id,
  p.cliente_id,
  p.numero_pedido,
  p.status,
  p.valor_total,
  p.forma_pagamento,
  p.criado_em,
  p.atualizado_em,
  u.nome_completo as nome_cliente,
  u.email as email_cliente,
  r.nome_revenda
FROM pedidos p
LEFT JOIN usuarios u ON p.cliente_id = u.id
LEFT JOIN revendas r ON p.revenda_id = r.id
WHERE p.status IN ('entregue', 'concluido');
```

### Tabela `vendas_estatisticas` (a ser criada - cache)

```sql
CREATE TABLE vendas_estatisticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  periodo DATE NOT NULL,
  total_vendas INTEGER NOT NULL DEFAULT 0,
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ticket_medio DECIMAL(10, 2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(revenda_id, periodo)
);
```

---

## 📁 Estrutura de Arquivos (Planejada)

### Bibliotecas:
- `src/lib/historicoVendas.ts` - Funções de consulta de histórico
- `src/lib/estatisticasVendas.ts` - Funções de estatísticas e métricas
- `src/lib/exportarVendas.ts` - Funções de exportação

### Componentes:
- `src/components/revendas/CardVenda.tsx` - Card de venda na listagem
- `src/components/revendas/DetalhesVenda.tsx` - Modal/Sheet de detalhes
- `src/components/revendas/GraficoVendas.tsx` - Componente de gráficos
- `src/components/revendas/FiltrosHistorico.tsx` - Componente de filtros
- `src/components/revendas/EstatisticasVendas.tsx` - Cards de estatísticas

### Páginas:
- `src/pages/revenda/HistoricoVendas.tsx` - Página principal

---

## 🔒 Segurança (RLS - Planejada)

### Políticas de Acesso:
1. **Revendas podem ver apenas seu histórico**
   - Consulta apenas vendas onde `revenda_id` corresponde à revenda do usuário logado

2. **Dados são somente leitura**
   - Histórico não pode ser editado, apenas visualizado

---

## 🚀 Fluxos Planejados

### Fluxo de Visualização:
1. Revenda acessa página de Histórico de Vendas
2. Sistema carrega vendas do período padrão (últimos 30 dias)
3. Revenda aplica filtros desejados
4. Sistema atualiza listagem e estatísticas
5. Revenda pode visualizar detalhes de qualquer venda

### Fluxo de Análise:
1. Revenda seleciona período para análise
2. Sistema calcula estatísticas do período
3. Gráficos são atualizados automaticamente
4. Revenda pode comparar com período anterior
5. Insights são exibidos baseados nos dados

### Fluxo de Exportação:
1. Revenda aplica filtros desejados
2. Revenda seleciona formato de exportação (CSV/PDF)
3. Sistema gera arquivo com dados filtrados
4. Arquivo é baixado pelo navegador

---

## 📊 Métricas Planejadas

### Métricas Principais:
- **Total de Vendas**: Quantidade de pedidos concluídos
- **Valor Total**: Soma de todos os valores vendidos
- **Ticket Médio**: Valor total / Quantidade de vendas
- **Vendas por Dia/Semana/Mês**: Distribuição temporal
- **Produtos Mais Vendidos**: Ranking de produtos
- **Clientes Mais Frequentes**: Ranking de clientes

### Gráficos Planejados:
- Gráfico de linha: Evolução de vendas ao longo do tempo
- Gráfico de barras: Vendas por período
- Gráfico de pizza: Distribuição por forma de pagamento
- Gráfico de barras: Top produtos vendidos

---

## 🔗 Relacionamentos

- **Histórico → Pedidos**: Baseado na tabela `pedidos` com status concluído
- **Histórico → Clientes**: Via `cliente_id` dos pedidos
- **Histórico → Produtos**: Via `itens_pedido`

---

## 📚 Referências

- Página: `src/pages/revenda/HistoricoVendas.tsx`
- Biblioteca: `src/lib/historicoVendas.ts` (a ser criada)
- Componentes: `src/components/revendas/` (a serem criados)

---

**Status**: 🚧 Em Planejamento  
**Última atualização**: 2025-01-07  
**Versão**: 0.1

