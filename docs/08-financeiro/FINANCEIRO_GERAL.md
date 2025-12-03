# Sistema Financeiro - Visão Geral

## 📋 Visão Geral

O sistema financeiro gerencia todo o fluxo de recebimento e repasse de valores entre a plataforma Pixy Pay e as revendas. A plataforma recebe todos os valores das compras e pedidos, aplica taxas conforme a modalidade de repasse escolhida pela revenda, e realiza os repasses nos prazos estabelecidos.

---

## 🎯 Modalidades de Repasse

### D+1 (24 horas após a compra)
- **Taxa**: 8% sobre o valor total da transação
- **Taxa Fixa**: R$ 0,50 por transação
- **Prazo**: 24 horas após a confirmação do pagamento

### D+15 (15 dias após a compra)
- **Taxa**: 6,5% sobre o valor total da transação
- **Taxa Fixa**: R$ 0,50 por transação
- **Prazo**: 15 dias após a confirmação do pagamento

### D+30 (30 dias após a compra)
- **Taxa**: 5% sobre o valor total da transação
- **Taxa Fixa**: R$ 0,50 por transação
- **Prazo**: 30 dias após a confirmação do pagamento

---

## 💰 Cálculo de Repasse

Para cada pedido, o valor a ser repassado é calculado da seguinte forma:

```
Valor Bruto = Valor Total do Pedido
Taxa Percentual = (Valor Bruto × Taxa%) / 100
Taxa Fixa = R$ 0,50
Valor Líquido Repassado = Valor Bruto - Taxa Percentual - Taxa Fixa
```

**Exemplo (D+1):**
- Pedido: R$ 1.000,00
- Taxa 8%: R$ 80,00
- Taxa Fixa: R$ 0,50
- **Valor Repassado**: R$ 919,50

---

## 📊 Fluxo de Repasse

1. **Pedido Criado**: Cliente realiza compra
2. **Pagamento Confirmado**: Pagamento é confirmado (PIX à vista ou primeira parcela)
3. **Aplicação de Taxas**: Sistema calcula taxas conforme modalidade da revenda
4. **Agendamento de Repasse**: Valor é agendado para repasse no prazo (D+1, D+15 ou D+30)
5. **Liberação**: Após o prazo, valor fica disponível para repasse
6. **Repasse Realizado**: Admin realiza o repasse e registra no histórico

---

## 🗄️ Estrutura de Banco de Dados

### Tabela: `configuracoes_repasse_revenda`
Armazena as configurações de repasse de cada revenda.

```sql
CREATE TABLE public.configuracoes_repasse_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  modalidade VARCHAR(10) NOT NULL CHECK (modalidade IN ('D+1', 'D+15', 'D+30')),
  taxa_percentual DECIMAL(5, 2) NOT NULL CHECK (taxa_percentual >= 0 AND taxa_percentual <= 100),
  taxa_fixa DECIMAL(10, 2) NOT NULL DEFAULT 0.50 CHECK (taxa_fixa >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(revenda_id, modalidade)
);
```

### Tabela: `transacoes_financeiras`
Registra todas as transações financeiras relacionadas aos pedidos.

```sql
CREATE TABLE public.transacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  valor_bruto DECIMAL(10, 2) NOT NULL CHECK (valor_bruto >= 0),
  taxa_percentual DECIMAL(5, 2) NOT NULL CHECK (taxa_percentual >= 0),
  taxa_fixa DECIMAL(10, 2) NOT NULL DEFAULT 0.50 CHECK (taxa_fixa >= 0),
  valor_liquido DECIMAL(10, 2) NOT NULL CHECK (valor_liquido >= 0),
  modalidade VARCHAR(10) NOT NULL CHECK (modalidade IN ('D+1', 'D+15', 'D+30')),
  data_pagamento TIMESTAMPTZ NOT NULL,
  data_repasse_prevista DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'liberado', 'repassado', 'cancelado')),
  repasse_id UUID REFERENCES public.repasses(id),
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Tabela: `repasses`
Registra os repasses realizados.

```sql
CREATE TABLE public.repasses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
  quantidade_transacoes INTEGER NOT NULL CHECK (quantidade_transacoes > 0),
  data_repasse DATE NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  criado_por UUID REFERENCES public.usuarios(id)
);
```

### Tabela: `repasses_transacoes`
Relaciona repasses com suas transações.

```sql
CREATE TABLE public.repasses_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repasse_id UUID NOT NULL REFERENCES public.repasses(id) ON DELETE CASCADE,
  transacao_id UUID NOT NULL REFERENCES public.transacoes_financeiras(id) ON DELETE CASCADE,
  UNIQUE(repasse_id, transacao_id)
);
```

---

## 🔐 Políticas de Segurança (RLS)

### Revendas
- Podem visualizar apenas suas próprias transações e repasses
- Podem visualizar apenas suas configurações de repasse
- Não podem modificar configurações diretamente (apenas via Admin)

### Admins
- Podem visualizar todas as transações e repasses
- Podem modificar configurações de repasse de qualquer revenda
- Podem criar e registrar repasses

---

## 📁 Estrutura de Arquivos

### Bibliotecas:
- `src/lib/financeiro.ts` - Funções de gerenciamento financeiro
- `src/lib/repasses.ts` - Funções de gerenciamento de repasses
- `src/lib/configuracoesRepasse.ts` - Funções de configuração de repasse

### Páginas Revenda:
- `src/pages/revenda/Financeiro.tsx` - Dashboard financeiro da revenda

### Páginas Admin:
- `src/pages/admin/Financeiro.tsx` - Dashboard financeiro geral
- `src/pages/admin/Repasses.tsx` - Gerenciamento de repasses

### Componentes:
- `src/components/financeiro/CardMetrica.tsx` - Card de métrica financeira
- `src/components/financeiro/ModalidadeRepasse.tsx` - Seletor de modalidade
- `src/components/financeiro/HistoricoRepasses.tsx` - Lista de histórico
- `src/components/financeiro/DetalhesTransacao.tsx` - Detalhes de transação

---

## 🔄 Processamento Automático

### Atualização de Status
- Sistema verifica diariamente transações com `data_repasse_prevista` vencida
- Transações vencidas são automaticamente atualizadas para status `liberado`
- Admin pode filtrar repasses liberados para processamento

### Cálculo Automático
- Ao criar pedido, sistema busca configuração ativa da revenda
- Calcula taxas e valor líquido automaticamente
- Cria transação financeira com status `pendente`

---

## 📈 Métricas e Relatórios

### Revenda:
- Valores recebidos hoje
- Valores liberados para receber (por modalidade)
- Histórico de repasses recebidos
- Total de taxas pagas
- Gráficos de evolução financeira

### Admin:
- Total de transações processadas
- Total de repasses realizados
- Taxa média por modalidade
- Receita da plataforma (soma de todas as taxas)
- Distribuição de modalidades por revenda
- Relatórios por período e revenda

---

## 🔔 Notificações e Alertas

- Notificação quando repasse está disponível (Revenda)
- Alerta de repasses pendentes para processar (Admin)
- Notificação de mudança de modalidade (Revenda)

---

## 🎨 Interface do Usuário

### Design System:
- Cards com métricas destacadas
- Gráficos de evolução temporal
- Tabelas com filtros avançados
- Modais para confirmação de mudanças
- Badges de status coloridos
- Links diretos para pedidos/parcelamentos

### Responsividade:
- Layout adaptável para desktop e mobile
- Tabelas com scroll horizontal em mobile
- Cards empilhados em telas pequenas

