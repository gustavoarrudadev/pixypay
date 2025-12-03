# Administração - Revenda

## 📋 Visão Geral

Esta funcionalidade será responsável por configurações administrativas da revenda. Permite gerenciar usuários da revenda, permissões, integrações, configurações gerais e outras opções administrativas.

---

## 🎯 Funcionalidades Planejadas

### 1. Usuários da Revenda
- Listagem de usuários vinculados à revenda
- Criação de novos usuários (vendedores, atendentes, etc.)
- Edição de dados de usuários
- Atribuição de permissões e roles
- Desativação/ativação de usuários
- Histórico de atividades

### 2. Permissões e Roles
- Gerenciamento de roles personalizados
- Atribuição de permissões por funcionalidade
- Controle de acesso granular
- Herança de permissões
- Auditoria de acessos

### 3. Configurações Gerais
- Dados da revenda (já existe em Gerenciar Conta)
- Configurações de notificações
- Preferências de exibição
- Configurações de idioma e fuso horário
- Temas e personalização

### 4. Integrações
- Integração com sistemas externos
- APIs e webhooks
- Integração com gateways de pagamento
- Integração com sistemas de entrega
- Sincronização de dados

### 5. Notificações e Alertas
- Configuração de notificações por email
- Configuração de notificações push
- Alertas de eventos importantes
- Templates de notificações
- Histórico de notificações enviadas

### 6. Segurança
- Alteração de senha (já existe)
- Autenticação de dois fatores (2FA)
- Sessões ativas
- Logs de acesso
- Bloqueio de IPs suspeitos

### 7. Backup e Restauração
- Backup de dados
- Restauração de backup
- Exportação de dados
- Importação de dados
- Histórico de backups

### 8. Auditoria e Logs
- Logs de ações dos usuários
- Histórico de alterações
- Rastreamento de atividades
- Relatórios de auditoria
- Exportação de logs

---

## 🗄️ Estrutura de Banco de Dados (Planejada)

### Tabela `usuarios_revenda` (a ser criada)

```sql
CREATE TABLE usuarios_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'funcionario', -- 'proprietario', 'gerente', 'vendedor', 'atendente', 'funcionario'
  permissoes JSONB, -- Permissões específicas
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(revenda_id, user_id)
);
```

### Tabela `configuracoes_revenda` (a ser criada)

```sql
CREATE TABLE configuracoes_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE UNIQUE,
  notificacoes_email BOOLEAN DEFAULT true,
  notificacoes_push BOOLEAN DEFAULT true,
  alertas_vendas BOOLEAN DEFAULT true,
  alertas_agendamentos BOOLEAN DEFAULT true,
  alertas_financeiro BOOLEAN DEFAULT true,
  idioma VARCHAR(10) DEFAULT 'pt-BR',
  fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  tema VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
  configuracoes_extras JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Tabela `logs_auditoria` (a ser criada)

```sql
CREATE TABLE logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  acao VARCHAR(100) NOT NULL,
  entidade VARCHAR(100) NOT NULL, -- 'pedido', 'produto', 'cliente', etc.
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Tabela `integracoes_revenda` (a ser criada)

```sql
CREATE TABLE integracoes_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL, -- 'pagamento', 'entrega', 'erp', 'outros'
  nome VARCHAR(255) NOT NULL,
  configuracao JSONB NOT NULL, -- Credenciais e configurações (criptografadas)
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## 📁 Estrutura de Arquivos (Planejada)

### Bibliotecas:
- `src/lib/gerenciarUsuariosRevenda.ts` - Funções CRUD de usuários
- `src/lib/configuracoesRevenda.ts` - Funções de configurações
- `src/lib/permissoesRevenda.ts` - Funções de permissões
- `src/lib/integracoesRevenda.ts` - Funções de integrações
- `src/lib/auditoriaRevenda.ts` - Funções de auditoria

### Componentes:
- `src/components/revendas/ListaUsuariosRevenda.tsx` - Listagem de usuários
- `src/components/revendas/FormUsuarioRevenda.tsx` - Formulário de usuário
- `src/components/revendas/ConfiguracoesRevenda.tsx` - Configurações gerais
- `src/components/revendas/PermissoesRevenda.tsx` - Gerenciamento de permissões
- `src/components/revendas/IntegracoesRevenda.tsx` - Gerenciamento de integrações
- `src/components/revendas/LogsAuditoria.tsx` - Visualização de logs
- `src/components/revendas/SegurancaRevenda.tsx` - Configurações de segurança

### Páginas:
- `src/pages/revenda/Administracao.tsx` - Página principal

---

## 🔒 Segurança (RLS - Planejada)

### Políticas de Acesso:
1. **Apenas proprietário/gerente pode acessar**
   - Verificação de role antes de permitir acesso

2. **Usuários podem ver apenas dados da própria revenda**
   - Todas as consultas filtram por `revenda_id`

3. **Dados sensíveis são protegidos**
   - Credenciais de integrações são criptografadas
   - Logs de auditoria são somente leitura

---

## 🚀 Fluxos Planejados

### Fluxo de Criação de Usuário:
1. Proprietário/Gerente acessa Administração
2. Seleciona "Usuários da Revenda"
3. Clica em "Novo Usuário"
4. Preenche dados (email, nome, role)
5. Define permissões específicas
6. Sistema cria usuário e envia convite por email
7. Usuário recebe acesso após aceitar convite

### Fluxo de Configuração de Notificações:
1. Proprietário/Gerente acessa Administração
2. Seleciona "Configurações"
3. Acessa aba "Notificações"
4. Ativa/desativa tipos de notificações
5. Configura canais (email, push)
6. Sistema salva configurações
7. Notificações passam a seguir novas regras

### Fluxo de Configuração de Integração:
1. Proprietário/Gerente acessa Administração
2. Seleciona "Integrações"
3. Clica em "Nova Integração"
4. Seleciona tipo de integração
5. Preenche credenciais e configurações
6. Sistema testa conexão
7. Integração é ativada se teste for bem-sucedido

### Fluxo de Visualização de Logs:
1. Proprietário/Gerente acessa Administração
2. Seleciona "Auditoria e Logs"
3. Aplica filtros (data, usuário, ação)
4. Sistema exibe logs filtrados
5. Proprietário pode exportar logs

---

## 📝 Roles Planejados

- **Proprietário**: Acesso total, incluindo administração
- **Gerente**: Acesso quase total, exceto algumas configurações críticas
- **Vendedor**: Acesso a vendas, produtos, clientes
- **Atendente**: Acesso a pedidos, agendamentos, clientes
- **Funcionário**: Acesso limitado conforme permissões específicas

---

## 🔗 Integrações Planejadas

### Gateways de Pagamento:
- Mercado Pago
- PagSeguro
- Stripe
- Outros

### Sistemas de Entrega:
- Correios
- Transportadoras
- Entregadores próprios

### ERPs:
- Integração genérica via API
- Sincronização de dados

---

## 🔗 Relacionamentos

- **Usuário Revenda → Revenda**: Muitos para Um (N:1)
- **Usuário Revenda → Usuário Auth**: Muitos para Um (N:1)
- **Configurações → Revenda**: Um para Um (1:1)
- **Integração → Revenda**: Muitos para Um (N:1)
- **Log → Revenda**: Muitos para Um (N:1)

---

## 📚 Referências

- Página: `src/pages/revenda/Administracao.tsx`
- Biblioteca: `src/lib/gerenciarUsuariosRevenda.ts` (a ser criada)
- Componentes: `src/components/revendas/` (a serem criados)

---

**Status**: 🚧 Em Planejamento  
**Última atualização**: 2025-01-07  
**Versão**: 0.1

