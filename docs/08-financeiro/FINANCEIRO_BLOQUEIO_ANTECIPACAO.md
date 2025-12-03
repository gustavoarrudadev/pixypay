# Bloqueio e Antecipação de Repasses

## 📋 Visão Geral

O sistema permite que administradores bloqueiem repasses temporariamente e antecipem datas de repasse quando necessário. Essas funcionalidades fornecem controle adicional sobre o processamento financeiro.

---

## 🔒 Bloqueio de Repasses

### Quando Usar

- Investigação de fraude ou irregularidades
- Problemas com o pedido relacionado
- Solicitação da revenda
- Questões legais ou regulatórias

### Funcionalidades

#### Bloquear Repasse
- **Acesso**: Apenas Admin
- **Requisitos**: 
  - Transação deve estar com status `liberado`
  - Motivo obrigatório
- **Efeitos**:
  - Transação não pode ser selecionada para repasse
  - Transação aparece visualmente bloqueada na interface
  - Motivo do bloqueio é registrado

#### Desbloquear Repasse
- **Acesso**: Apenas Admin
- **Efeitos**:
  - Remove bloqueio da transação
  - Transação volta a estar disponível para repasse
  - Motivo do bloqueio é removido

### Interface

- **Badge Vermelho**: Indica transação bloqueada
- **Motivo Visível**: Exibido abaixo do badge
- **Botão Desbloquear**: Disponível apenas para transações bloqueadas
- **Transações Bloqueadas**: Não podem ser selecionadas (visualmente desabilitadas)

---

## ⏰ Antecipação de Repasses

### Quando Usar

- Solicitação da revenda
- Acordo comercial especial
- Compensação por problemas anteriores
- Promoções ou incentivos

### Funcionalidades

#### Antecipar Repasse
- **Acesso**: Apenas Admin
- **Requisitos**:
  - Transação deve estar com status `liberado`
  - Nova data deve ser anterior à data original
- **Efeitos**:
  - `data_repasse_prevista` é atualizada para a nova data
  - Flag `antecipado` é marcada como `true`
  - `data_repasse_antecipada` armazena a nova data
  - Transação pode ser processada na nova data

### Validações

- Nova data deve ser anterior à data original
- Transação deve estar liberada
- Data não pode ser no passado (opcional, conforme regra de negócio)

### Interface

- **Badge Azul**: Indica transação antecipada
- **Nova Data Visível**: Exibida abaixo do badge
- **Data Original**: Mantida para referência histórica

---

## 🔄 Fluxo de Processamento

### Bloqueio

```
1. Admin identifica transação que precisa ser bloqueada
2. Clica em "Bloquear Repasse"
3. Informa motivo do bloqueio
4. Sistema bloqueia transação
5. Transação não aparece mais como selecionável
6. Admin pode desbloquear quando necessário
```

### Antecipação

```
1. Admin identifica transação que pode ser antecipada
2. Clica em "Antecipar Repasse"
3. Seleciona nova data (deve ser anterior à original)
4. Sistema valida e atualiza data
5. Transação pode ser processada na nova data
6. Histórico de antecipação é mantido
```

---

## 🛡️ Regras de Negócio

### Bloqueio

1. **Apenas Transações Liberadas**: Só pode bloquear transações com status `liberado`
2. **Motivo Obrigatório**: Sempre deve informar motivo do bloqueio
3. **Não Selecionável**: Transações bloqueadas não podem ser incluídas em repasses
4. **Reversível**: Bloqueio pode ser removido a qualquer momento

### Antecipação

1. **Apenas Transações Liberadas**: Só pode antecipar transações com status `liberado`
2. **Data Anterior**: Nova data deve ser anterior à data original
3. **Atualização Imediata**: Data de repasse prevista é atualizada imediatamente
4. **Histórico Mantido**: Flag `antecipado` e `data_repasse_antecipada` preservam histórico

---

## 📊 Impacto nas Métricas

### Valores Bloqueados

- Transações bloqueadas são contabilizadas separadamente
- Não aparecem em valores disponíveis para repasse
- Aparecem em métricas de "Valores Bloqueados"

### Valores Antecipados

- Transações antecipadas são processadas na nova data
- Aparecem normalmente nas métricas
- Flag `antecipado` permite identificar antecipações

---

## 🔐 Segurança

- **Apenas Admin**: Apenas administradores podem bloquear/antecipar
- **Auditoria**: Todas as ações são registradas com timestamp
- **Validações**: Sistema valida status e datas antes de aplicar mudanças
- **RLS**: Row Level Security garante que apenas admins vejam todas as transações

---

## 📝 Campos no Banco de Dados

### Tabela `transacoes_financeiras`

```sql
bloqueado BOOLEAN NOT NULL DEFAULT false
bloqueado_motivo TEXT
antecipado BOOLEAN NOT NULL DEFAULT false
data_repasse_antecipada DATE
```

### Índices

- `idx_transacoes_bloqueado` - Performance em filtros de bloqueio
- `idx_transacoes_antecipado` - Performance em filtros de antecipação
- `idx_transacoes_data_repasse_antecipada` - Performance em ordenação por data

---

## 🧪 Testes Recomendados

1. **Bloquear Repasse**:
   - Bloquear transação liberada com motivo
   - Verificar que não pode ser selecionada
   - Verificar badge e motivo visíveis

2. **Desbloquear Repasse**:
   - Desbloquear transação bloqueada
   - Verificar que volta a estar selecionável
   - Verificar que motivo foi removido

3. **Antecipar Repasse**:
   - Antecipar transação com data válida
   - Verificar atualização da data prevista
   - Verificar badge de antecipação

4. **Validações**:
   - Tentar bloquear transação não liberada (deve falhar)
   - Tentar antecipar com data posterior (deve falhar)
   - Tentar criar repasse com transação bloqueada (deve excluir bloqueadas)

---

## 📚 Referências

- Migration: `supabase/migrations/050_add_bloqueio_antecipacao_transacoes.sql`
- Funções: `src/lib/repasses.ts` (bloquearRepasse, desbloquearRepasse, anteciparRepasse)
- Interface: `src/pages/admin/Repasses.tsx`

---

**Última atualização**: 2025-01-07  
**Versão**: 1.0

