# Ajuda - Cliente

## 📋 Visão Geral

Esta funcionalidade será responsável por fornecer ajuda e suporte ao cliente. Permite acessar FAQ, tutoriais, entrar em contato com suporte e acompanhar solicitações de ajuda.

---

## 🎯 Funcionalidades Planejadas

### 1. FAQ (Perguntas Frequentes)
- Lista de perguntas e respostas comuns
- Busca por palavras-chave
- Categorização por tópicos
- Artigos mais visualizados
- Feedback sobre utilidade das respostas

### 2. Tutoriais e Guias
- Guias passo a passo
- Tutoriais em vídeo (se disponível)
- Documentação de funcionalidades
- Dicas e truques
- Navegação por categorias

### 3. Contato com Suporte
- Formulário de contato
- Seleção de tipo de problema
- Upload de anexos (screenshots, documentos)
- Histórico de contatos anteriores
- Chat em tempo real (se disponível)

### 4. Acompanhamento de Solicitações
- Lista de solicitações abertas
- Status de cada solicitação
- Respostas do suporte
- Histórico completo
- Fechamento de solicitação

### 5. Recursos Adicionais
- Links úteis
- Documentação completa
- Vídeos explicativos
- Comunidade/Forum (se disponível)
- Base de conhecimento

---

## 🗄️ Estrutura de Banco de Dados (Planejada)

### Tabela `faq` (a ser criada)

```sql
CREATE TABLE faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria VARCHAR(100),
  ordem INTEGER DEFAULT 0,
  visualizacoes INTEGER DEFAULT 0,
  utilidade_positiva INTEGER DEFAULT 0,
  utilidade_negativa INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Tabela `solicitacoes_suporte` (a ser criada)

```sql
CREATE TABLE solicitacoes_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_solicitacao VARCHAR(50) UNIQUE NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'duvida', 'problema', 'sugestao', 'reclamacao', 'outros'
  assunto VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberta', -- 'aberta', 'em_atendimento', 'respondida', 'fechada'
  prioridade VARCHAR(20) DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
  anexos JSONB, -- URLs dos anexos
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fechada_em TIMESTAMPTZ
);
```

### Tabela `mensagens_suporte` (a ser criada)

```sql
CREATE TABLE mensagens_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_suporte(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  anexos JSONB,
  lida BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Índices Planejados:
- `idx_faq_categoria`: Performance em filtros por categoria
- `idx_solicitacoes_cliente_id`: Performance em consultas por cliente
- `idx_solicitacoes_status`: Performance em filtros de status
- `idx_mensagens_solicitacao_id`: Performance em consultas de mensagens

---

## 📁 Estrutura de Arquivos (Planejada)

### Bibliotecas:
- `src/lib/faq.ts` - Funções de consulta de FAQ
- `src/lib/solicitacoesSuporte.ts` - Funções CRUD de solicitações
- `src/lib/mensagensSuporte.ts` - Funções de mensagens

### Componentes:
- `src/components/cliente/ListaFAQ.tsx` - Lista de perguntas frequentes
- `src/components/cliente/ItemFAQ.tsx` - Item de FAQ expansível
- `src/components/cliente/FormSolicitacao.tsx` - Formulário de solicitação
- `src/components/cliente/DetalhesSolicitacao.tsx` - Detalhes da solicitação
- `src/components/cliente/ChatSuporte.tsx` - Componente de chat
- `src/components/cliente/BuscaAjuda.tsx` - Barra de busca

### Páginas:
- `src/pages/cliente/Ajuda.tsx` - Página principal

---

## 🔒 Segurança (RLS - Planejada)

### Políticas de Acesso:
1. **FAQ é público**
   - Qualquer usuário autenticado pode visualizar FAQ

2. **Clientes podem ver apenas suas solicitações**
   - Consulta apenas solicitações onde `cliente_id` corresponde ao usuário logado

3. **Clientes podem criar solicitações apenas para si mesmos**
   - Validação no INSERT garante que `cliente_id` seja do próprio cliente

---

## 🚀 Fluxos Planejados

### Fluxo de Busca de Ajuda:
1. Cliente acessa página "Ajuda"
2. Cliente busca por palavra-chave ou navega por categorias
3. Sistema exibe resultados relevantes
4. Cliente visualiza resposta
5. Cliente avalia utilidade da resposta

### Fluxo de Criação de Solicitação:
1. Cliente não encontra resposta no FAQ
2. Cliente acessa "Contato com Suporte"
3. Cliente preenche formulário (tipo, assunto, descrição)
4. Cliente anexa arquivos (opcional)
5. Sistema cria solicitação com status "Aberta"
6. Cliente recebe confirmação
7. Suporte recebe notificação

### Fluxo de Acompanhamento:
1. Cliente visualiza solicitação aberta
2. Cliente acompanha status
3. Suporte responde via mensagem
4. Cliente recebe notificação
5. Cliente visualiza resposta
6. Cliente pode responder ou fechar solicitação

---

## 📝 Categorias de FAQ (Planejadas)

- **Conta e Perfil**: Gerenciamento de conta, alteração de dados
- **Pedidos**: Como fazer pedido, acompanhar entrega
- **Pagamentos**: Formas de pagamento, parcelamentos
- **Produtos**: Busca, favoritos, negociações
- **Problemas Técnicos**: Erros, bugs, problemas de acesso
- **Outros**: Dúvidas gerais

---

## 📝 Tipos de Solicitação (Planejados)

- **Dúvida**: Pergunta sobre funcionalidade
- **Problema**: Bug ou erro encontrado
- **Sugestão**: Ideia de melhoria
- **Reclamação**: Problema com serviço ou produto
- **Outros**: Outros tipos de solicitação

---

## 🔗 Relacionamentos

- **FAQ**: Tabela independente (pública)
- **Solicitação → Cliente**: Muitos para Um (N:1)
- **Mensagem → Solicitação**: Muitos para Um (N:1)
- **Mensagem → Usuário**: Muitos para Um (N:1)

---

## 📚 Referências

- Página: `src/pages/cliente/Ajuda.tsx`
- Biblioteca: `src/lib/faq.ts` (a ser criada)
- Biblioteca: `src/lib/solicitacoesSuporte.ts` (a ser criada)
- Componentes: `src/components/cliente/` (a serem criados)

---

**Status**: 🚧 Em Planejamento  
**Última atualização**: 2025-01-07  
**Versão**: 0.1

