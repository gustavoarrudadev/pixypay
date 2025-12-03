# Sistema de Relatórios Completo - Admin e Revenda

## 📋 Visão Geral

Sistema completo de relatórios milimétricos com diversos KPIs e informações relevantes para Admin e Revenda. Inclui relatórios pré-configurados, criador de relatórios personalizados com preview em tempo real e exportação em CSV bem formatado.

---

## 🎯 Funcionalidades Implementadas

### 1. Relatórios Admin

#### 1.1 Relatório Geral
- Visão consolidada de todas as revendas
- KPIs gerais da plataforma
- Métricas agregadas de vendas, produtos, clientes e financeiro
- Filtros por período e revenda específica

#### 1.2 Relatório por Revenda
- Filtro para selecionar revenda específica
- Relatório detalhado da revenda selecionada
- Comparativo entre revendas (quando múltiplas selecionadas)

#### 1.3 KPIs Disponíveis (Admin)
- **Vendas:**
  - Total de vendas (valor bruto)
  - Total de vendas (valor líquido)
  - Número de pedidos
  - Ticket médio
  - Vendas por status
  - Vendas por forma de pagamento
  - Vendas por tipo de entrega
  - Evolução temporal de vendas

- **Produtos:**
  - Total de produtos cadastrados
  - Produtos mais vendidos (top 10)
  - Produtos menos vendidos
  - Produtos por revenda
  - Rotatividade de produtos

- **Clientes:**
  - Total de clientes cadastrados
  - Clientes mais frequentes (top 10)
  - Clientes com maior ticket médio
  - Novos clientes por período
  - Clientes por revenda

- **Financeiro:**
  - Receita bruta total
  - Receita líquida total
  - Taxas cobradas
  - Repasses pendentes
  - Repasses realizados
  - Inadimplência total
  - Fluxo de caixa por período

- **Parcelamentos:**
  - Total de parcelamentos ativos
  - Valor total em parcelamentos
  - Parcelas pagas vs pendentes
  - Taxa de inadimplência
  - Parcelamentos por revenda

- **Agendamentos:**
  - Total de agendamentos
  - Taxa de conclusão
  - Agendamentos por tipo de entrega
  - Agendamentos por período

---

### 2. Relatórios Revenda

#### 2.1 Relatório Geral
- Visão completa da revenda
- KPIs específicos da revenda logada
- Métricas de vendas, produtos, clientes e financeiro

#### 2.2 Filtros Avançados
- Período (data inicial e final)
- Status de pedidos
- Forma de pagamento
- Tipo de entrega
- Produtos específicos
- Clientes específicos
- Faixa de valor

#### 2.3 KPIs Disponíveis (Revenda)
- **Vendas:**
  - Total de vendas (valor bruto)
  - Total de vendas (valor líquido)
  - Número de pedidos
  - Ticket médio
  - Vendas por status
  - Vendas por forma de pagamento
  - Vendas por tipo de entrega
  - Evolução temporal de vendas
  - Comparativo mensal/anual

- **Produtos:**
  - Total de produtos cadastrados
  - Produtos mais vendidos (top 10)
  - Produtos menos vendidos
  - Rotatividade de produtos
  - Performance por produto

- **Clientes:**
  - Total de clientes únicos
  - Clientes mais frequentes (top 10)
  - Clientes com maior ticket médio
  - Novos clientes por período
  - Análise de comportamento de compra

- **Financeiro:**
  - Receita bruta
  - Receita líquida
  - Taxas pagas
  - Repasses recebidos
  - Repasses pendentes
  - Inadimplência
  - Fluxo de caixa

- **Parcelamentos:**
  - Total de parcelamentos ativos
  - Valor total em parcelamentos
  - Parcelas pagas vs pendentes
  - Taxa de inadimplência
  - Parcelamentos por cliente

- **Agendamentos:**
  - Total de agendamentos
  - Taxa de conclusão
  - Agendamentos por tipo
  - Agendamentos por período

---

### 3. Criador de Relatórios

#### 3.1 Funcionalidades
- Seleção de campos e métricas a incluir no relatório
- Preview em tempo real do relatório
- Configuração de filtros avançados
- Formatação personalizada
- Salvar configuração para uso futuro

#### 3.2 Campos Disponíveis para Seleção

**Vendas:**
- ID do pedido
- Data do pedido
- Cliente
- Valor total
- Valor líquido
- Status
- Forma de pagamento
- Tipo de entrega
- Número de parcelas
- Observações

**Produtos:**
- ID do produto
- Nome do produto
- Descrição
- Preço
- Quantidade vendida
- Valor total vendido
- Revenda (apenas Admin)

**Clientes:**
- ID do cliente
- Nome
- Email
- Telefone
- CPF
- Total de pedidos
- Ticket médio
- Última compra
- Revenda (apenas Admin)

**Financeiro:**
- ID da transação
- Pedido relacionado
- Valor bruto
- Valor líquido
- Taxa percentual
- Taxa fixa
- Modalidade (D+1, D+15, D+30)
- Data de pagamento
- Data de repasse prevista
- Status do repasse
- Revenda (apenas Admin)

**Parcelamentos:**
- ID do parcelamento
- Pedido relacionado
- Cliente
- Total de parcelas
- Valor total
- Valor da parcela
- Parcelas pagas
- Parcelas pendentes
- Status
- Revenda (apenas Admin)

**Agendamentos:**
- ID do agendamento
- Pedido relacionado
- Cliente
- Data e hora
- Tipo de entrega
- Status
- Observações
- Revenda (apenas Admin)

#### 3.3 Métricas Disponíveis para Seleção

**Vendas:**
- Total de vendas
- Ticket médio
- Número de pedidos
- Vendas por status
- Vendas por forma de pagamento
- Vendas por tipo de entrega

**Produtos:**
- Total de produtos
- Produtos mais vendidos
- Produtos menos vendidos
- Rotatividade

**Clientes:**
- Total de clientes
- Clientes mais frequentes
- Ticket médio por cliente
- Novos clientes

**Financeiro:**
- Receita bruta
- Receita líquida
- Taxas totais
- Repasses pendentes
- Repasses realizados

**Parcelamentos:**
- Total de parcelamentos
- Valor total em parcelamentos
- Parcelas pagas
- Parcelas pendentes
- Taxa de inadimplência

**Agendamentos:**
- Total de agendamentos
- Taxa de conclusão
- Agendamentos por tipo

---

### 4. Exportação CSV

#### 4.1 Formatação
- Cabeçalhos bem formatados em português
- Valores monetários formatados (R$ X.XXX,XX)
- Datas formatadas (DD/MM/YYYY HH:mm)
- Separador de milhares para números
- Encoding UTF-8 com BOM para Excel

#### 4.2 Estrutura do Arquivo
- Primeira linha: Cabeçalhos
- Linhas seguintes: Dados
- Formatação consistente em todas as colunas
- Tratamento de valores nulos/vazios

---

## 🗄️ Estrutura de Banco de Dados

### Tabelas Utilizadas

**Principais:**
- `pedidos` - Pedidos realizados
- `itens_pedido` - Itens de cada pedido
- `produtos` - Produtos cadastrados
- `parcelamentos` - Parcelamentos de pedidos
- `parcelas` - Parcelas individuais
- `agendamentos_entrega` - Agendamentos de entrega
- `transacoes_financeiras` - Transações financeiras
- `usuarios` - Usuários (clientes)
- `revendas` - Revendas cadastradas

**Relacionamentos:**
- `pedidos.cliente_id` → `usuarios.id`
- `pedidos.revenda_id` → `revendas.id`
- `itens_pedido.pedido_id` → `pedidos.id`
- `itens_pedido.produto_id` → `produtos.id`
- `parcelamentos.pedido_id` → `pedidos.id`
- `parcelas.parcelamento_id` → `parcelamentos.id`
- `agendamentos_entrega.pedido_id` → `pedidos.id`
- `transacoes_financeiras.pedido_id` → `pedidos.id`
- `transacoes_financeiras.revenda_id` → `revendas.id`
- `transacoes_financeiras.cliente_id` → `usuarios.id`

---

## 📁 Estrutura de Arquivos

### Bibliotecas:
- `src/lib/relatorios/kpis.ts` - Funções para calcular KPIs
- `src/lib/relatorios/vendas.ts` - Relatórios de vendas
- `src/lib/relatorios/produtos.ts` - Relatórios de produtos
- `src/lib/relatorios/clientes.ts` - Relatórios de clientes
- `src/lib/relatorios/financeiro.ts` - Relatórios financeiros
- `src/lib/relatorios/parcelamentos.ts` - Relatórios de parcelamentos
- `src/lib/relatorios/agendamentos.ts` - Relatórios de agendamentos
- `src/lib/relatorios/exportar.ts` - Funções de exportação CSV

### Componentes:
- `src/components/relatorios/CriadorRelatorios.tsx` - Criador de relatórios personalizados
- `src/components/relatorios/PreviewRelatorio.tsx` - Preview do relatório em tempo real
- `src/components/relatorios/FiltrosAvancados.tsx` - Componente de filtros avançados
- `src/components/relatorios/SeletorCampos.tsx` - Seletor de campos e métricas
- `src/components/relatorios/TabelaRelatorio.tsx` - Tabela de exibição do relatório
- `src/components/relatorios/CardKPI.tsx` - Card para exibir KPIs

### Páginas:
- `src/pages/admin/Relatorios.tsx` - Página de relatórios Admin
- `src/pages/revenda/Relatorios.tsx` - Página de relatórios Revenda

---

## 🔒 Segurança (RLS)

### Políticas de Acesso:

1. **Admin:**
   - Pode ver todos os dados de todas as revendas
   - Pode filtrar por revenda específica
   - Acesso completo a todas as tabelas

2. **Revenda:**
   - Pode ver apenas seus próprios dados
   - Filtros aplicados automaticamente por `revenda_id`
   - Dados isolados por revenda

3. **Cliente:**
   - Não tem acesso a relatórios (não implementado nesta funcionalidade)

---

## 🚀 Fluxos de Uso

### Fluxo de Relatório Padrão (Admin):
1. Admin acessa página de Relatórios
2. Seleciona tipo de relatório (Geral ou por Revenda)
3. Se "por Revenda", seleciona revenda(s) específica(s)
4. Define período (data inicial e final)
5. Sistema gera relatório com dados filtrados
6. Relatório é exibido com KPIs e tabelas
7. Admin pode exportar em CSV

### Fluxo de Relatório Padrão (Revenda):
1. Revenda acessa página de Relatórios
2. Define filtros avançados (período, status, etc.)
3. Sistema gera relatório com dados da revenda
4. Relatório é exibido com KPIs e tabelas
5. Revenda pode exportar em CSV

### Fluxo de Criador de Relatórios:
1. Usuário acessa aba "Criador de Relatórios"
2. Seleciona campos desejados (checkboxes)
3. Seleciona métricas desejadas (checkboxes)
4. Configura filtros avançados
5. Preview é atualizado em tempo real
6. Usuário ajusta seleções conforme necessário
7. Usuário pode exportar relatório em CSV
8. (Futuro) Usuário pode salvar configuração

---

## 📊 Tipos de Relatórios

### Relatórios de Vendas:
- Vendas por período
- Vendas por produto
- Vendas por cliente
- Vendas por status
- Vendas por forma de pagamento
- Vendas por tipo de entrega
- Evolução temporal
- Comparativo mensal/anual

### Relatórios de Produtos:
- Ranking de produtos
- Produtos mais/menos vendidos
- Rotatividade de produtos
- Performance por produto
- Produtos por revenda (Admin)

### Relatórios de Clientes:
- Clientes mais frequentes
- Clientes com maior ticket médio
- Novos clientes por período
- Análise de comportamento
- Clientes por revenda (Admin)

### Relatórios Financeiros:
- Receita bruta/líquida
- Taxas cobradas
- Repasses pendentes/realizados
- Fluxo de caixa
- Inadimplência
- Financeiro por revenda (Admin)

### Relatórios de Parcelamentos:
- Parcelamentos ativos
- Valor total em parcelamentos
- Parcelas pagas vs pendentes
- Taxa de inadimplência
- Parcelamentos por cliente
- Parcelamentos por revenda (Admin)

### Relatórios de Agendamentos:
- Agendamentos por período
- Taxa de conclusão
- Agendamentos por tipo
- Eficiência operacional
- Agendamentos por revenda (Admin)

---

## 📝 Formato de Exportação CSV

### Estrutura:
- **Encoding:** UTF-8 com BOM
- **Separador:** Vírgula (,)
- **Delimitador de texto:** Aspas duplas (")
- **Formatação de valores:**
  - Monetários: R$ X.XXX,XX
  - Datas: DD/MM/YYYY HH:mm
  - Números: Separador de milhares (.)

### Exemplo de Cabeçalho:
```csv
"ID do Pedido","Data","Cliente","Valor Total","Status","Forma de Pagamento"
```

### Exemplo de Dados:
```csv
"550e8400-e29b-41d4-a716-446655440000","15/01/2025 14:30","João Silva","R$ 1.500,00","Confirmado","PIX à Vista"
```

---

## 🔗 Relacionamentos com Outras Funcionalidades

- **Pedidos:** Base de dados principal para relatórios de vendas
- **Produtos:** Dados de produtos e vendas por produto
- **Clientes:** Dados de clientes e comportamento de compra
- **Financeiro:** Dados financeiros e repasses
- **Parcelamentos:** Dados de parcelamentos e inadimplência
- **Agendamentos:** Dados de agendamentos e eficiência

---

## 📚 Referências

- Página Admin: `src/pages/admin/Relatorios.tsx`
- Página Revenda: `src/pages/revenda/Relatorios.tsx`
- Bibliotecas: `src/lib/relatorios/`
- Componentes: `src/components/relatorios/`

---

**Status**: ✅ Implementado  
**Última atualização**: 2025-01-15  
**Versão**: 1.0

