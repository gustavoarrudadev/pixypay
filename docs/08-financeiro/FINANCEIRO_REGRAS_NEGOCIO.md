# Regras de Negócio - Sistema Financeiro

## 📋 Regras Gerais

### 1. Aplicação de Taxas

#### Regra 1.1: Cálculo de Taxas
- Taxas são calculadas no momento da criação da transação financeira
- Cálculo baseado na modalidade ativa da revenda no momento do pedido
- Taxas são aplicadas sobre o valor total do pedido (valor_bruto)

#### Regra 1.2: Modalidades Padrão
- **D+1**: 8% + R$ 0,50
- **D+15**: 6,5% + R$ 0,50
- **D+30**: 5% + R$ 0,50

#### Regra 1.3: Taxas Customizadas
- Admin pode alterar taxas manualmente para revendas específicas
- Alterações afetam apenas novos pedidos
- Histórico de alterações é mantido

---

### 2. Criação de Transações Financeiras

#### Regra 2.1: Momento de Criação
- Transação é criada quando o pedido é confirmado
- Para pagamentos à vista: transação única
- Para pagamentos parcelados: transação criada quando primeira parcela é paga

#### Regra 2.2: Cálculo de Data de Repasse
- **D+1**: Data de pagamento + 1 dia (24 horas)
- **D+15**: Data de pagamento + 15 dias
- **D+30**: Data de pagamento + 30 dias

#### Regra 2.3: Status Inicial
- Todas as transações começam com status `pendente`
- Status muda para `liberado` automaticamente quando data_repasse_prevista é atingida

---

### 3. Processamento de Repasses

#### Regra 3.1: Liberação Automática
- Sistema verifica diariamente transações com data_repasse_prevista vencida
- Transações vencidas são automaticamente atualizadas para `liberado`
- Processo roda uma vez por dia (meia-noite)

#### Regra 3.2: Agrupamento de Repasses
- Admin pode agrupar múltiplas transações em um único repasse
- Agrupamento pode ser por revenda e/ou por data
- Cada repasse pode conter múltiplas transações

#### Regra 3.3: Processamento Manual
- Admin deve processar repasses manualmente
- Ao processar, status muda para `repassado`
- Data de repasse é registrada
- Observações podem ser adicionadas

---

### 4. Mudança de Modalidade

#### Regra 4.1: Efeito Imediato
- Mudança de modalidade é imediata
- Aplica-se apenas a novos pedidos
- Pedidos existentes mantêm modalidade original

#### Regra 4.2: Confirmação Obrigatória
- Revenda deve confirmar mudança de modalidade
- Modal de confirmação mostra:
  - Taxa atual vs nova taxa
  - Impacto financeiro estimado
  - Aviso sobre aplicação apenas em novos pedidos

#### Regra 4.3: Histórico de Mudanças
- Todas as mudanças são registradas
- Histórico inclui: data, modalidade anterior, nova modalidade, usuário

---

### 5. Pedidos Existentes

#### Regra 5.1: Retrocompatibilidade
- Pedidos criados antes da implementação do sistema financeiro
- Sistema deve criar transações financeiras retroativas
- Usar modalidade padrão (D+30) ou modalidade atual da revenda
- Data de pagamento = data de criação do pedido

#### Regra 5.2: Processamento em Lote
- Script para processar pedidos existentes
- Execução única ou periódica
- Log de processamento detalhado

---

### 6. Validações e Restrições

#### Regra 6.1: Validação de Valores
- Valor bruto deve ser > 0
- Taxa percentual deve estar entre 0% e 100%
- Taxa fixa deve ser >= 0
- Valor líquido deve ser >= 0

#### Regra 6.2: Validação de Datas
- Data de repasse prevista deve ser >= data de pagamento
- Não permitir datas futuras para repasses realizados

#### Regra 6.3: Validação de Status
- Transição de status deve seguir fluxo:
  - `pendente` → `liberado` → `repassado`
  - Não permitir voltar para status anterior
  - Cancelamento apenas com justificativa

---

### 7. Relatórios e Métricas

#### Regra 7.1: Cálculo de Receita
- Receita = Soma de todas as taxas (percentual + fixa)
- Calculada por período, revenda ou geral

#### Regra 7.2: Cálculo de Taxa Média
- Taxa média = (Soma de taxas percentuais) / (Quantidade de transações)
- Pode ser calculada por modalidade ou geral

#### Regra 7.3: Valores Pendentes
- Valores pendentes = Soma de valores líquidos com status `pendente`
- Agrupados por data de repasse prevista

---

### 8. Segurança e Auditoria

#### Regra 8.1: Logs de Auditoria
- Todas as alterações de configuração são registradas
- Logs incluem: usuário, data, ação, valores anteriores e novos

#### Regra 8.2: Permissões
- Revenda: apenas visualização e mudança de modalidade própria
- Admin: acesso completo, incluindo edição manual de taxas

#### Regra 8.3: Confirmações
- Ações críticas requerem confirmação
- Mudanças de modalidade requerem confirmação explícita
- Processamento de repasses requer confirmação

---

### 9. Notificações

#### Regra 9.1: Notificações para Revenda
- Notificação quando repasse está disponível
- Notificação de mudança de modalidade bem-sucedida
- Resumo semanal de atividades financeiras

#### Regra 9.2: Notificações para Admin
- Alerta de repasses pendentes para processar
- Notificação de valores altos aguardando repasse
- Relatório diário de atividades financeiras

---

### 10. Tratamento de Erros

#### Regra 10.1: Erros de Cálculo
- Sistema deve validar cálculos antes de salvar
- Em caso de erro, transação não é criada
- Log de erro detalhado

#### Regra 10.2: Erros de Processamento
- Repasses com erro devem ser marcados como "erro"
- Admin pode reprocessar após correção
- Histórico de tentativas é mantido

#### Regra 10.3: Recuperação de Dados
- Sistema deve permitir recálculo de transações
- Opção de reprocessar pedidos específicos
- Backup automático de transações financeiras

---

## 🔄 Fluxos de Processo

### Fluxo 1: Criação de Pedido
```
1. Cliente cria pedido
2. Pagamento é confirmado
3. Sistema busca modalidade ativa da revenda
4. Calcula taxas (percentual + fixa)
5. Calcula valor líquido
6. Calcula data de repasse prevista
7. Cria transação financeira com status 'pendente'
```

### Fluxo 2: Liberação de Repasse
```
1. Sistema verifica transações com data_repasse_prevista vencida
2. Atualiza status para 'liberado'
3. Notifica revenda (opcional)
4. Adiciona à lista de repasses disponíveis
```

### Fluxo 3: Processamento de Repasse
```
1. Admin visualiza repasses liberados
2. Seleciona transações para repasse
3. Agrupa por revenda (opcional)
4. Confirma processamento
5. Sistema atualiza status para 'repassado'
6. Registra data de repasse
7. Cria registro na tabela repasses
8. Notifica revenda (opcional)
```

### Fluxo 4: Mudança de Modalidade
```
1. Revenda acessa área financeira
2. Visualiza modalidade atual
3. Clica em "Alterar Modalidade"
4. Seleciona nova modalidade
5. Sistema mostra preview de taxas
6. Revenda confirma mudança
7. Sistema atualiza configuração
8. Registra mudança no histórico
9. Novos pedidos usam nova modalidade
```

---

## 📝 Observações Importantes

1. **Pedidos Parcelados**: Apenas primeira parcela gera transação financeira. Parcelas subsequentes não geram novas transações.

2. **Cancelamento de Pedidos**: Se pedido for cancelado, transação financeira deve ser cancelada também.

3. **Reembolsos**: Reembolsos devem criar transação reversa, mantendo histórico completo.

4. **Arredondamento**: Valores devem ser arredondados para 2 casas decimais.

5. **Timezone**: Todas as datas devem usar UTC e serem convertidas para timezone local na exibição.

