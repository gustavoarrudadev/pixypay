# Negociações - Cliente

## 📋 Visão Geral

Esta funcionalidade será responsável por gerenciar negociações e propostas de compra do cliente. Permite fazer propostas de preço, negociar condições de pagamento e acompanhar o status das negociações com as revendas.

---

## 🎯 Funcionalidades Planejadas

### 1. Listagem de Negociações
- Visualização de todas as negociações ativas
- Filtros por status (Todas, Pendentes, Aceitas, Recusadas, Expiradas)
- Filtros por revenda
- Busca por produto ou número da negociação
- Ordenação por data ou status

### 2. Criar Negociação
- Seleção de produto da loja pública
- Proposta de preço
- Proposta de condições de pagamento
- Quantidade desejada
- Observações e justificativa
- Prazo de validade da proposta

### 3. Detalhes da Negociação
- Informações completas da negociação
- Histórico de contrapropostas
- Status atual
- Mensagens entre cliente e revenda
- Produto negociado
- Valores propostos

### 4. Acompanhamento
- Status em tempo real
- Notificações de atualizações
- Alertas de prazo de validade
- Histórico completo de interações

### 5. Ações Disponíveis
- Aceitar contraproposta da revenda
- Fazer nova proposta
- Cancelar negociação
- Converter negociação em pedido (se aceita)
- Visualizar produto na loja

---

## 🗄️ Estrutura de Banco de Dados (Planejada)

### Tabela `negociacoes` (a ser criada)

```sql
CREATE TABLE negociacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  numero_negociacao VARCHAR(50) UNIQUE NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_proposto_cliente DECIMAL(10, 2) NOT NULL,
  valor_proposto_revenda DECIMAL(10, 2),
  valor_final DECIMAL(10, 2),
  condicoes_pagamento TEXT,
  observacoes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'em_negociacao', 'aceita', 'recusada', 'expirada', 'cancelada'
  data_validade TIMESTAMPTZ,
  aceita_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Tabela `mensagens_negociacao` (a ser criada)

```sql
CREATE TABLE mensagens_negociacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES negociacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'proposta', 'contraproposta', 'mensagem', 'aceite', 'recusa'
  valor_proposto DECIMAL(10, 2), -- Se for proposta
  lida BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Índices Planejados:
- `idx_negociacoes_cliente_id`: Performance em consultas por cliente
- `idx_negociacoes_revenda_id`: Performance em consultas por revenda
- `idx_negociacoes_status`: Performance em filtros de status
- `idx_negociacoes_data_validade`: Performance em verificações de expiração

---

## 📁 Estrutura de Arquivos (Planejada)

### Bibliotecas:
- `src/lib/gerenciarNegociacoes.ts` - Funções CRUD de negociações
- `src/lib/mensagensNegociacao.ts` - Funções de mensagens

### Componentes:
- `src/components/cliente/CardNegociacao.tsx` - Card de negociação
- `src/components/cliente/FormNegociacao.tsx` - Formulário de criação
- `src/components/cliente/DetalhesNegociacao.tsx` - Modal/Sheet de detalhes
- `src/components/cliente/ChatNegociacao.tsx` - Componente de chat/mensagens
- `src/components/cliente/Contraproposta.tsx` - Formulário de contraproposta

### Páginas:
- `src/pages/cliente/Negociacoes.tsx` - Página principal

---

## 🔒 Segurança (RLS - Planejada)

### Políticas de Acesso:
1. **Clientes podem ver apenas suas negociações**
   - Consulta apenas negociações onde `cliente_id` corresponde ao usuário logado

2. **Clientes podem criar negociações apenas para si mesmos**
   - Validação no INSERT garante que `cliente_id` seja do próprio cliente

3. **Clientes podem atualizar apenas suas negociações**
   - Validação garante propriedade e status permitido

---

## 🚀 Fluxos Planejados

### Fluxo de Criação:
1. Cliente visualiza produto na loja pública
2. Cliente clica em "Negociar Preço"
3. Cliente preenche formulário (preço, quantidade, condições)
4. Sistema cria negociação com status "Pendente"
5. Revenda recebe notificação
6. Cliente acompanha status

### Fluxo de Negociação:
1. Revenda visualiza negociação pendente
2. Revenda faz contraproposta ou aceita/recusa
3. Cliente recebe notificação
4. Cliente visualiza contraproposta
5. Cliente aceita, recusa ou faz nova proposta
6. Processo continua até acordo ou recusa

### Fluxo de Aceitação:
1. Negociação é aceita (por cliente ou revenda)
2. Sistema gera valor final e condições
3. Cliente pode converter em pedido
4. Pedido é criado com valores negociados
5. Negociação é marcada como "Aceita"

---

## 📝 Status das Negociações (Planejado)

- **Pendente**: Negociação criada, aguardando resposta da revenda
- **Em Negociação**: Revenda fez contraproposta, aguardando resposta do cliente
- **Aceita**: Negociação aceita por ambas as partes
- **Recusada**: Negociação recusada por uma das partes
- **Expirada**: Prazo de validade expirado
- **Cancelada**: Negociação cancelada pelo cliente

---

## 🔗 Relacionamentos

- **Negociação → Cliente**: Muitos para Um (N:1)
- **Negociação → Revenda**: Muitos para Um (N:1)
- **Negociação → Produto**: Muitos para Um (N:1)
- **Negociação → Pedido**: Um para Um (1:1) - Opcional, quando convertida
- **Mensagem → Negociação**: Muitos para Um (N:1)
- **Mensagem → Usuário**: Muitos para Um (N:1)

---

## 📚 Referências

- Página: `src/pages/cliente/Negociacoes.tsx`
- Biblioteca: `src/lib/gerenciarNegociacoes.ts` (a ser criada)
- Componentes: `src/components/cliente/` (a serem criados)

---

**Status**: 🚧 Em Planejamento  
**Última atualização**: 2025-01-07  
**Versão**: 0.1

