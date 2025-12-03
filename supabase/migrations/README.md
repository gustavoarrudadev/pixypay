# Migrations do Supabase - Pixy Pay

Este diretório contém todas as migrations do banco de dados para o projeto Pixy Pay.

## 📋 Lista de Migrations

### ✅ 001 - Configuração Inicial de Tabelas
**Arquivo**: `001_initial_setup.sql`

Criação das tabelas principais:
- `usuarios`: Dados dos usuários (admin, revenda, cliente)
- Políticas RLS básicas
- Triggers e funções auxiliares

### ✅ 002 - Atualização de Função de Busca de Clientes
**Arquivo**: `002_update_buscar_clientes.sql`

Melhoria na função `buscar_detalhes_clientes()`:
- Busca dados de `auth.users` e `usuarios`
- Retorna informações consolidadas (email confirmado, último login, telefone confirmado)

### ✅ 003 - Adicionar Campos de Banimento
**Arquivo**: `003_add_banimento_fields.sql`

Adiciona suporte a banimento de usuários:
- Campos `banido_at` e `banido_ate` na tabela `usuarios`
- Função `is_usuario_banido()` para verificar status
- Índice para melhorar performance

### ✅ 004 - Atualizar Função com Banimento
**Arquivo**: `004_update_buscar_detalhes_com_banimento.sql`

Atualiza `buscar_detalhes_clientes()` para incluir:
- Campos de banimento (`banido_at`, `banido_ate`)
- Status calculado `esta_banido` (baseado na tabela `usuarios`)

⚠️ **IMPORTANTE**: Esta migration foi substituída pela 005/006. O status de banimento deve vir do Supabase Auth.

### ✅ 005 - Corrigir Verificação de Banimento com Auth
**Arquivo**: `005_fix_verificar_banimento_auth.sql`

Correção para buscar status de banimento do **Supabase Auth** ao invés da tabela:
- Usa `auth.users.banned_until` como fonte de verdade
- Ignora `usuarios.banido_ate` para o cálculo de `esta_banido`

⚠️ **IMPORTANTE**: Se você já aplicou esta migration, não precisa aplicar novamente. A migration 006 é uma garantia/consolidação da 005.

### 🆕 006 - Garantir Sincronização de Banimento
**Arquivo**: `006_garantir_sync_banimento_auth.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Recria a função `buscar_detalhes_clientes()` garantindo que usa **apenas** `auth.users.banned_until`
- Adiciona função de debug `verificar_status_banimento_usuario()` para diagnóstico
- Adiciona documentação inline

**Por que aplicar**:
- Resolve inconsistências entre interface e Supabase Auth
- Garante que o status de banimento é sempre verdadeiro
- Adiciona ferramentas de debug

### 🆕 007 - Função de Atualização de Banimento (CRÍTICA)
**Arquivo**: `007_create_update_banned_until_function.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Cria função RPC `update_user_banned_until()` para atualizar `auth.users.banned_until`
- Permite que a Edge Function modifique o status de banimento

**Por que aplicar**:
- **CRÍTICO**: Sem esta função, banir/desbanir não funcionará
- A Admin SDK (@supabase/supabase-js) NÃO suporta o campo `banned_until`
- Solução: usar SQL direto via RPC

### 🆕 008 - Verificação de Banimento no Login
**Arquivo**: `008_create_verificar_usuario_banido_function.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Cria função RPC `verificar_usuario_banido(user_email TEXT)` para verificar banimento ANTES do login
- Permite verificação pública (anon) do status de banimento
- Retorna TRUE se o usuário está banido, FALSE caso contrário

**Por que aplicar**:
- Permite que o frontend **bloqueie o login** de usuários banidos
- Mostra mensagem personalizada de conta suspensa
- Melhora a UX ao informar claramente o motivo do bloqueio

### 🆕 009 - Criar Tabela de Revendas
**Arquivo**: `009_create_revendas_table.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Cria tabela `revendas` para cadastro de revendas
- Vincula revendas a usuários via `user_id`
- Configura campos de endereço e marcas trabalhadas

### 🆕 010 - RLS para Revendas
**Arquivo**: `010_add_rls_to_revendas.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Habilita RLS na tabela `revendas`
- Cria políticas para admins gerenciarem revendas
- Cria função auxiliar `eh_admin()`

### 🆕 015 - Criar Tabela de Produtos
**Arquivo**: `015_create_produtos_table.sql`

**Status**: 🆕 **Nova**

**O que faz**:
- Cria tabela `produtos` vinculada a `revendas`
- Campos: nome, descrição, preço, imagem_url, ativo
- Configura RLS para revendas gerenciarem apenas seus produtos
- Permite acesso público a produtos ativos (para loja pública)
- Cria índices para performance

**Por que aplicar**:
- **OBRIGATÓRIA** para sistema de produtos funcionar
- Permite que revendas cadastrem produtos
- Garante segurança com RLS

### 🆕 016 - Campos de Presença na Loja
**Arquivo**: `016_add_campos_presenca_revenda.sql`

**Status**: 🆕 **Nova**

**O que faz**:
- Adiciona campos `link_publico`, `nome_publico` e `logo_url` na tabela `revendas`
- Cria índice único em `link_publico`
- Permite que revendas atualizem seus próprios campos de presença
- Permite acesso público aos dados de presença (para loja pública)
- Cria função `validar_link_publico_unico()` para validação

**Por que aplicar**:
- **OBRIGATÓRIA** para loja pública funcionar
- Permite que revendas personalizem sua presença online
- Garante unicidade do link público

### 🆕 058 - Políticas UPDATE para ADMINs em Parcelas
**Arquivo**: `058_add_admin_update_policy_parcelas.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Adiciona políticas RLS para permitir que ADMINs atualizem todas as parcelas
- Permite que ADMINs atualizem todos os parcelamentos
- Necessário para funcionalidades de dar baixa e marcar como vencida

**Por que aplicar**:
- **CRÍTICO**: Sem esta migration, ADMINs não conseguem dar baixa ou marcar parcelas como vencidas
- Permite que ADMINs gerenciem o status financeiro de todas as parcelas
- Garante controle administrativo completo sobre parcelamentos

### 🆕 059 - Taxa de Entrega para Revendas
**Arquivo**: `059_add_taxa_entrega_revendas.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Adiciona campo `taxa_entrega` na tabela `revendas`
- Permite que cada revenda configure sua própria taxa de entrega
- Valor padrão: 0.00 (sem taxa)
- Validação: valor deve ser maior ou igual a zero

**Por que aplicar**:
- **OBRIGATÓRIA**: Permite que revendas configurem taxa de entrega personalizada
- **FLEXIBILIDADE**: Cada revenda pode ter sua própria taxa
- **CHECKOUT**: Taxa é aplicada quando cliente escolhe "receber no endereço"

### 🆕 060 - Taxa de Entrega para Pedidos
**Arquivo**: `060_add_taxa_entrega_pedidos.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Adiciona campo `taxa_entrega` na tabela `pedidos`
- Armazena a taxa de entrega aplicada a um pedido específico
- Valor padrão: 0.00 (sem taxa)
- Validação: valor deve ser maior ou igual a zero

**Por que aplicar**:
- **OBRIGATÓRIA**: Armazena histórico da taxa de entrega aplicada em cada pedido
- **Rastreabilidade**: Permite saber qual taxa foi cobrada em pedidos antigos
- **Financeiro**: Importante para relatórios e controle financeiro

### 🆕 061 - Garantir Exclusão de Conta de Cliente
**Arquivo**: `061_garantir_exclusao_conta_cliente.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Documenta o processo de exclusão de conta de cliente
- Garante que todas as tabelas relacionadas têm ON DELETE CASCADE configurado
- Documenta quais tabelas serão automaticamente limpas quando um usuário for excluído

**Por que aplicar**:
- **DOCUMENTAÇÃO**: Garante que o processo de exclusão está bem documentado
- **SEGURANÇA**: Confirma que dados relacionados serão removidos automaticamente
- **MANUTENÇÃO**: Facilita futuras manutenções e verificações

**Tabelas afetadas pelo ON DELETE CASCADE**:
- `usuarios` → excluído quando `auth.users` é excluído
- `pedidos` → excluído quando `usuarios` é excluído
- `parcelamentos` → excluído quando `pedidos` é excluído
- `parcelas` → excluído quando `parcelamentos` é excluído
- `enderecos_entrega` → excluído quando `usuarios` é excluído
- `agendamentos_entrega` → excluído quando `pedidos` ou `usuarios` são excluídos
- `lojas_favoritas` → excluído quando `usuarios` é excluído
- `colaboradores` → excluído quando `usuarios` é excluído

### 🆕 062 - Link Público para Produtos
**Arquivo**: `062_add_link_publico_produtos.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Adiciona campo `link_publico` na tabela `produtos`
- Cria função para gerar slug único baseado no nome do produto
- Cria trigger para gerar link automaticamente ao criar produto
- Cria trigger para atualizar link quando nome do produto mudar
- Cria função RPC pública para buscar produto por link da revenda e link do produto
- Garante unicidade do link dentro da mesma revenda

**Por que aplicar**:
- **OBRIGATÓRIA**: Permite que cada produto tenha seu próprio link público
- **AUTOMÁTICO**: Gera link automaticamente baseado no nome
- **ATUALIZAÇÃO**: Atualiza link quando nome do produto é alterado
- **PÚBLICO**: Permite acesso público ao produto através do link

**Funcionalidades**:
- Link gerado automaticamente: `/loja/{link-revenda}/produto/{link-produto}`
- Link único por revenda (mesmo nome pode existir em revendas diferentes)
- Atualização automática quando nome muda
- Função pública para buscar produto sem autenticação

### 🆕 063 - Gerar Links para Produtos Existentes
**Arquivo**: `063_gerar_links_produtos_existentes.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Cria função RPC `gerar_link_produto_existente` para gerar link para produtos que não têm
- Atualiza todos os produtos existentes que não têm `link_publico`
- Permite gerar link sob demanda para produtos específicos

**Por que aplicar**:
- **OBRIGATÓRIA**: Garante que todos os produtos existentes tenham link público
- **AUTOMÁTICO**: Atualiza produtos existentes automaticamente
- **ON-DEMAND**: Permite gerar link para produtos específicos via RPC

**Funcionalidades**:
- Atualiza produtos existentes sem link_publico
- Função RPC para gerar link sob demanda
- Geração automática baseada no nome do produto

### 🆕 064 - Opções de Entrega para Revendas
**Arquivo**: `064_add_opcoes_entrega_revendas.sql`

**Status**: ✅ **Aplicada**

**O que faz**:
- Adiciona campos para revendas escolherem quais opções de entrega oferecer
- Permite configurar entrega, retirada no local e agendamento separadamente
- Cada revenda pode personalizar suas opções de entrega no checkout

**Por que aplicar**:
- **OBRIGATÓRIA**: Permite que revendas personalizem suas opções de entrega
- **FLEXIBILIDADE**: Cada revenda pode escolher o que oferecer
- **CHECKOUT DINÂMICO**: Checkout mostra apenas opções habilitadas pela revenda

**Funcionalidades**:
- `oferecer_entrega`: Se revenda oferece entrega no endereço
- `oferecer_retirada_local`: Se revenda oferece retirada no local
- `oferecer_agendamento`: Se revenda oferece agendamento (requer entrega habilitada)
- Validação no frontend para garantir pelo menos uma opção habilitada

## 🚀 Como Aplicar as Migrations

### Método 1: Via Supabase Dashboard (Recomendado)

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **"New query"**
5. Copie o conteúdo da migration desejada
6. Cole no editor
7. Clique em **"Run"** (ou `Ctrl + Enter`)

### Método 2: Via CLI do Supabase

```bash
# Instalar CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Link do projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations pendentes
supabase db push
```

## 🔍 Verificar se uma Migration foi Aplicada

Execute no SQL Editor:

```sql
-- Ver histórico de migrations (se configurado)
SELECT * FROM supabase_migrations.schema_migrations;

-- Verificar se funções existem
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('buscar_detalhes_clientes', 'verificar_status_banimento_usuario');
```

## 🧪 Testar Migrations

Use o script de teste fornecido:

```bash
# Executar script de teste no SQL Editor
# Arquivo: scripts/testar-banimento.sql
```

Ou leia a documentação detalhada:

📄 **[Como Aplicar Migration de Banimento](../docs/COMO_APLICAR_MIGRATION_BANIMENTO.md)**

## ⚠️ Migrations Obrigatórias

Para o sistema funcionar corretamente, as seguintes migrations **DEVEM** estar aplicadas:

- ✅ **001** - Tabelas básicas
- ✅ **003** - Campos de banimento
- ✅ **006** - Sincronização de banimento (substitui 004 e 005)
- ✅ **007** - Atualização de banimento via RPC (CRÍTICA para banir/desbanir)
- ✅ **008** - Verificação de banimento no login (bloqueio de acesso)

## 🆘 Troubleshooting

### Problema: "Function does not exist"

**Causa**: Migration não foi aplicada ou foi aplicada parcialmente.

**Solução**: Execute a migration 006 novamente.

### Problema: Status de banimento inconsistente

**Causa**: A função está usando a tabela `usuarios` ao invés do `auth.users`.

**Solução**: 
1. Aplique a migration 006
2. Use o script de teste para verificar: `scripts/testar-banimento.sql`

### Problema: Erro de permissão ao executar migration

**Causa**: Usuário não tem permissões suficientes.

**Solução**: Use o Service Role Key ou faça login como owner do projeto.

## 📝 Ordem de Aplicação

Se estiver configurando o banco de dados do zero, aplique as migrations nesta ordem:

1. `001_initial_setup.sql`
2. `002_update_buscar_clientes.sql` (opcional, será substituída)
3. `003_add_banimento_fields.sql`
4. `006_garantir_sync_banimento_auth.sql` ⭐ **IMPORTANTE**
5. `007_create_update_banned_until_function.sql` 🔴 **CRÍTICA**
6. `008_create_verificar_usuario_banido_function.sql` 🛡️ **LOGIN**

**Pule as migrations 004 e 005** - elas são substituídas pela 006.

## 🔗 Documentação Relacionada

- 📄 [Integração Supabase](../docs/SUPABASE_INTEGRACAO.md)
- 📄 [Como Aplicar Migration de Banimento](../docs/COMO_APLICAR_MIGRATION_BANIMENTO.md)
- 🧪 [Script de Teste de Banimento](../scripts/testar-banimento.sql)
- 🧪 [Como Testar Login com Banimento](../docs/COMO_TESTAR_LOGIN_BANIMENTO.md) ⭐ **NOVO**

## 📊 Status das Migrations

| Migration | Status | Obrigatória | Substitui |
|-----------|--------|-------------|-----------|
| 001 | ✅ Estável | Sim | - |
| 002 | ✅ Estável | Não | - |
| 003 | ✅ Estável | Sim | - |
| 004 | ⚠️ Obsoleta | Não | - |
| 005 | ⚠️ Obsoleta | Não | 004 |
| 006 | ✅ **Recomendada** | **Sim** | 004, 005 |
| 007 | ✅ **Crítica** | **Sim** | - |
| 008 | ✅ **Aplicada** | **Sim** | - |
| 009 | ✅ **Aplicada** | Sim | - |
| 010 | ✅ **Aplicada** | Sim | - |
| 015 | 🆕 **Nova** | **Sim** | - |
| 016 | 🆕 **Nova** | **Sim** | - |
| 057 | ✅ **Aplicada** | **Sim** | - |
| 058 | ✅ **Crítica** | **Sim** | - |
| 059 | ✅ **Aplicada** | **Sim** | - |
| 060 | ✅ **Aplicada** | **Sim** | - |
| 061 | ✅ **Aplicada** | **Não** | - |
| 062 | ✅ **Aplicada** | **Sim** | - |

---

**Última atualização**: 2025-01-27  
**Próximas migrations**: Sistema de Produtos e Loja Pública

