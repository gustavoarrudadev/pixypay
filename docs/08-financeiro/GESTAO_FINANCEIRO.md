# Financeiro - Revenda

## 📋 Visão Geral

Esta funcionalidade será responsável por gerenciar as informações financeiras da revenda. Permite acompanhar receitas, despesas, saldos, pagamentos pendentes e ter uma visão completa da saúde financeira do negócio.

---

## 🎯 Funcionalidades Planejadas

### 1. Dashboard Financeiro
- Visão geral das finanças
- Saldo atual
- Receitas do mês/período
- Despesas do mês/período
- Lucro líquido
- Gráficos de evolução financeira
- Indicadores de performance

### 2. Receitas
- Listagem de todas as receitas
- Receitas de vendas (vinculadas a pedidos)
- Receitas extras (outras fontes)
- Filtros por período, categoria, status
- Previsão de receitas futuras
- Histórico de recebimentos

### 3. Despesas
- Listagem de todas as despesas
- Categorização de despesas
- Despesas recorrentes
- Despesas únicas
- Filtros por período, categoria, fornecedor
- Controle de pagamentos pendentes

### 4. Contas a Receber
- Lista de valores a receber
- Pedidos com pagamento pendente
- Vencimentos próximos
- Histórico de recebimentos
- Alertas de inadimplência

### 5. Contas a Pagar
- Lista de valores a pagar
- Fornecedores e credores
- Vencimentos próximos
- Histórico de pagamentos
- Alertas de vencimento

### 6. Relatórios Financeiros
- DRE (Demonstração do Resultado do Exercício)
- Fluxo de caixa
- Balanço simplificado
- Relatórios por período
- Comparativo entre períodos

### 7. Configurações Financeiras
- Categorias de receitas/despesas
- Formas de pagamento
- Contas bancárias
- Metas financeiras
- Alertas e notificações

---

## 🗄️ Estrutura de Banco de Dados (Planejada)

### Tabela `receitas` (a ser criada)

```sql
CREATE TABLE receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id),
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  valor DECIMAL(10, 2) NOT NULL,
  data_recebimento DATE NOT NULL,
  forma_pagamento VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'recebido', 'cancelado'
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Tabela `despesas` (a ser criada)

```sql
CREATE TABLE despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  forma_pagamento VARCHAR(50),
  fornecedor VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
  recorrente BOOLEAN DEFAULT false,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Tabela `categorias_financeiras` (a ser criada)

```sql
CREATE TABLE categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'receita' ou 'despesa'
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## 📁 Estrutura de Arquivos (Planejada)

### Bibliotecas:
- `src/lib/gerenciarFinanceiro.ts` - Funções CRUD de receitas/despesas
- `src/lib/calcularFinanceiro.ts` - Funções de cálculos e métricas
- `src/lib/relatoriosFinanceiros.ts` - Funções de relatórios

### Componentes:
- `src/components/revendas/DashboardFinanceiro.tsx` - Dashboard principal
- `src/components/revendas/CardReceita.tsx` - Card de receita
- `src/components/revendas/CardDespesa.tsx` - Card de despesa
- `src/components/revendas/FormReceita.tsx` - Formulário de receita
- `src/components/revendas/FormDespesa.tsx` - Formulário de despesa
- `src/components/revendas/GraficoFinanceiro.tsx` - Componente de gráficos
- `src/components/revendas/RelatorioFinanceiro.tsx` - Componente de relatórios

### Páginas:
- `src/pages/revenda/Financeiro.tsx` - Página principal

---

## 🔒 Segurança (RLS - Planejada)

### Políticas de Acesso:
1. **Revendas podem ver apenas seus dados financeiros**
   - Consulta apenas receitas/despesas onde `revenda_id` corresponde à revenda do usuário logado

2. **Revendas podem criar receitas/despesas apenas para si mesmas**
   - Validação no INSERT garante que `revenda_id` seja da própria revenda

3. **Revendas podem atualizar apenas seus dados**
   - Validação no UPDATE garante propriedade

4. **Dados financeiros são sensíveis**
   - Apenas a própria revenda pode acessar seus dados

---

## 🚀 Fluxos Planejados

### Fluxo de Registro de Receita:
1. Revenda acessa página Financeiro
2. Seleciona "Nova Receita"
3. Preenche dados (descrição, valor, data, categoria)
4. Vincula a pedido (opcional)
5. Sistema registra receita
6. Saldo é atualizado automaticamente

### Fluxo de Registro de Despesa:
1. Revenda acessa página Financeiro
2. Seleciona "Nova Despesa"
3. Preenche dados (descrição, valor, vencimento, categoria, fornecedor)
4. Marca como recorrente (opcional)
5. Sistema registra despesa
6. Alerta de vencimento é criado (se configurado)

### Fluxo de Pagamento de Despesa:
1. Revenda visualiza despesa pendente
2. Revenda marca como pago
3. Informa data e forma de pagamento
4. Sistema atualiza status
5. Saldo é atualizado

### Fluxo de Geração de Relatório:
1. Revenda seleciona tipo de relatório
2. Define período de análise
3. Sistema calcula métricas e gera dados
4. Relatório é exibido na tela
5. Revenda pode exportar (PDF/CSV)

---

## 📊 Métricas Financeiras Planejadas

### Indicadores Principais:
- **Saldo Atual**: Receitas - Despesas (período)
- **Receita Total**: Soma de todas as receitas
- **Despesa Total**: Soma de todas as despesas
- **Lucro Líquido**: Receitas - Despesas
- **Margem de Lucro**: (Lucro / Receitas) * 100
- **Ticket Médio**: Receita Total / Quantidade de vendas

### Gráficos Planejados:
- Gráfico de linha: Evolução de receitas e despesas
- Gráfico de barras: Comparativo mensal
- Gráfico de pizza: Distribuição de despesas por categoria
- Gráfico de área: Fluxo de caixa ao longo do tempo

---

## 📝 Categorias Padrão (Planejadas)

### Receitas:
- Vendas de Produtos
- Serviços
- Outras Receitas

### Despesas:
- Fornecedores
- Salários
- Aluguel
- Energia/Água
- Internet/Telefone
- Combustível
- Manutenção
- Marketing
- Outras Despesas

---

## 🔗 Relacionamentos

- **Receita → Revenda**: Muitos para Um (N:1)
- **Receita → Pedido**: Muitos para Um (N:1) - Opcional
- **Despesa → Revenda**: Muitos para Um (N:1)
- **Categoria → Revenda**: Muitos para Um (N:1)

---

## 📚 Referências

- Página: `src/pages/revenda/Financeiro.tsx`
- Biblioteca: `src/lib/gerenciarFinanceiro.ts` (a ser criada)
- Componentes: `src/components/revendas/` (a serem criados)

---

**Status**: 🚧 Em Planejamento  
**Última atualização**: 2025-01-07  
**Versão**: 0.1

