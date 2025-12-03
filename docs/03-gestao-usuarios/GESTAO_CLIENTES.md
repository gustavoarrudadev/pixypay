# Gestão de Clientes - Pixy Pay

## 📋 Visão Geral

Sistema completo de gestão de clientes com funcionalidades de listagem, criação, edição, exclusão e banimento.

---

## 🎯 Funcionalidades Principais

### 1. Listagem de Clientes

#### Localização
- **Página**: `src/pages/admin/Clientes.tsx`
- **Biblioteca**: `src/lib/usuarios.ts` - `listarClientes()`

#### Funcionalidades
- ✅ Lista todos os clientes cadastrados
- ✅ Filtros avançados:
  - Busca por nome, email, telefone, CPF
  - Filtro por status (Todos, Ativo, Banido, Email Pendente)
  - Filtro por data de cadastro (Hoje, 7 dias, 15 dias, 30 dias, Personalizado)
- ✅ Exibição de status visual (badges coloridos)
- ✅ Ordenação por data de cadastro

#### Dados Exibidos
- Nome completo / Display Name
- Email (com indicador de confirmação)
- Telefone (com máscara e indicador de confirmação)
- CPF (com máscara)
- Status (Ativo, Banido, Email Pendente)

#### Integração
- **RPC**: `buscar_detalhes_clientes()` (Migration 006)
- **Fonte de Verdade**: `auth.users.banned_until` para status de banimento
- **Tabela**: `usuarios` (cache/histórico)

---

### 2. Criação de Cliente

#### Localização
- **Página**: `src/pages/admin/Clientes.tsx` (Sheet lateral) e `src/pages/admin/NovoCliente.tsx`
- **Edge Function**: `criar-usuario-admin`

#### Funcionalidades
- ✅ Cadastro manual pelo admin
- ✅ Campos obrigatórios: Nome, Email
- ✅ Campos opcionais: Telefone, CPF
- ✅ Senha opcional (cliente cria via email se não informada)
- ✅ Opção de enviar Magic Link ao invés de senha
- ✅ Validação de dados em tempo real
- ✅ Envio automático de email para criação de senha

#### Fluxo de Criação
1. Admin preenche dados do cliente
2. Sistema valida dados
3. Edge Function cria usuário no Supabase Auth
4. Usuário é criado na tabela `usuarios`
5. Email de criação de senha é enviado (se senha não informada)
6. Magic Link é enviado (se opção marcada)

#### Integração
- **Edge Function**: `criar-usuario-admin`
- **Supabase Auth**: Criação de usuário
- **Tabela**: `usuarios` (sincronização automática)

---

### 3. Edição de Cliente

#### Localização
- **Página**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)
- **Biblioteca**: `src/lib/gerenciarCliente.ts` - `atualizarCliente()`

#### Funcionalidades
- ✅ Edição de nome completo
- ✅ Edição de email
- ✅ Edição de telefone (com máscara)
- ✅ Edição de CPF (com máscara)
- ✅ Atualização em tempo real
- ✅ Sincronização com `auth.users` e tabela `usuarios`
- ✅ Validação de dados

#### Fluxo de Edição
1. Admin clica em "Ações" no cliente
2. Sheet lateral abre com detalhes
3. Admin clica em "Editar" no campo desejado
4. Formulário de edição aparece
5. Admin salva alterações
6. Sistema atualiza em ambos os lugares (Auth e tabela)

#### Integração
- **Edge Function**: `atualizar-usuario-admin`
- **Tabela**: `usuarios`
- **Supabase Auth**: `auth.users` (metadados e campos)

---

### 4. Exclusão de Cliente

#### Localização
- **Página**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)
- **Biblioteca**: `src/lib/gerenciarCliente.ts` - `excluirCliente()`

#### Funcionalidades
- ✅ Exclusão de cliente com confirmação
- ✅ Remoção de `auth.users` e tabela `usuarios`
- ✅ Dialog de confirmação antes de excluir

#### Fluxo de Exclusão
1. Admin clica em "Excluir Cliente"
2. Dialog de confirmação aparece
3. Admin confirma exclusão
4. Edge Function remove usuário do Auth
5. Usuário é removido da tabela `usuarios`
6. Lista é atualizada automaticamente

#### Integração
- **Edge Function**: `excluir-usuario`
- **Supabase Auth**: Remoção de usuário
- **Tabela**: Remoção de registro

---

### 5. Banimento de Cliente

#### Localização
- **Página**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)
- **Biblioteca**: `src/lib/gerenciarCliente.ts` - `bloquearCliente()`

#### Funcionalidades
- ✅ Banimento temporário (horas ou dias)
- ✅ Banimento permanente
- ✅ Desbanimento
- ✅ Exibição de status de banimento
- ✅ Data de expiração do banimento
- ✅ Badge visual de banimento

#### Tipos de Banimento
- **Temporário por Horas**: 1h, 6h, 12h, 24h, etc.
- **Temporário por Dias**: 1d, 7d, 30d, etc.
- **Permanente**: 100 anos no futuro

#### Fluxo de Banimento
1. Admin clica em "Banir Cliente"
2. Formulário de banimento aparece
3. Admin escolhe tipo (horas ou dias) e quantidade
4. Admin confirma banimento
5. Edge Function atualiza `auth.users.banned_until`
6. Tabela `usuarios` é atualizada (cache)
7. Cliente não consegue fazer login
8. Badge "BANIDO" aparece na listagem

#### Fluxo de Desbanimento
1. Admin clica em "Desbanir Cliente"
2. Admin confirma desbanimento
3. Edge Function remove `banned_until` (NULL)
4. Tabela `usuarios` é atualizada
5. Cliente pode fazer login novamente
6. Badge "BANIDO" desaparece

#### Integração
- **Edge Function**: `bloquear-usuario`
- **RPC**: `update_user_banned_until()` (Migration 007)
- **Fonte de Verdade**: `auth.users.banned_until`
- **Tabela**: `usuarios` (campos `banido_at`, `banido_ate`)

#### Segurança
- ✅ Bloqueio automático no login
- ✅ Verificação prévia ao login
- ✅ Sincronização entre Auth e tabela
- ✅ Múltiplas camadas de verificação

---

### 6. Ações Rápidas

#### Localização
- **Página**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)

#### Funcionalidades Disponíveis
- ✅ **Enviar Magic Link**: Envia link de login por email
- ✅ **Enviar Redefinição de Senha**: Envia email para redefinir senha
- ✅ **Banir Cliente**: Aplica banimento temporário ou permanente
- ✅ **Desbanir Cliente**: Remove banimento
- ✅ **Excluir Cliente**: Remove cliente do sistema

#### Integração
- **Magic Link**: `src/lib/gerenciarCliente.ts` - `enviarMagicLinkCliente()`
- **Redefinição**: `src/lib/gerenciarCliente.ts` - `enviarRedefinicaoSenhaCliente()`
- **Banimento**: `src/lib/gerenciarCliente.ts` - `bloquearCliente()`

---

## 🔄 Integrações com Outras Funcionalidades

### Autenticação
- Clientes são criados via registro ou pelo admin
- Status de banimento afeta login
- Edição de dados sincroniza Auth e tabela

### Sistema de Banimento
- Admin pode banir/desbanir clientes
- Status sincronizado entre Auth e tabela
- Exibição de status na listagem
- Bloqueio automático no login

### Sistema de Roles
- Clientes têm role `cliente`
- Acesso limitado ao sistema
- Redirecionamento para `/conta` após login

---

## 📊 Estrutura de Dados

### Tabela `usuarios`
```sql
- id (UUID, PK)
- email (TEXT)
- nome_completo (TEXT)
- role (TEXT: 'admin' | 'revenda' | 'cliente')
- telefone (TEXT)
- cpf (TEXT)
- banido_at (TIMESTAMPTZ)
- banido_ate (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### `auth.users` (Supabase Auth)
```sql
- id (UUID, PK)
- email (TEXT)
- banned_until (TIMESTAMPTZ) -- FONTE DE VERDADE
- user_metadata (JSONB)
  - nome_completo
  - display_name
  - telefone
  - cpf
  - role
```

---

## 🧪 Testes e Validações

### Validações de Dados
- ✅ Email válido
- ✅ Telefone com DDD (mínimo 10 dígitos)
- ✅ CPF válido (formato)
- ✅ Senha mínima de 8 caracteres
- ✅ Confirmação de senha

### Testes Recomendados
1. Criar cliente com todos os campos
2. Criar cliente apenas com nome e email
3. Editar dados do cliente
4. Banir cliente temporariamente
5. Desbanir cliente
6. Excluir cliente
7. Verificar sincronização entre Auth e tabela

---

## 📝 Documentação Relacionada

- [Funcionalidades Gerais](./FUNCIONALIDADES_GERAIS.md)
- [Integração Supabase](./SUPABASE_INTEGRACAO.md)
- [Como Aplicar Migration de Banimento](./COMO_APLICAR_MIGRATION_BANIMENTO.md)
- [Como Testar Login com Banimento](./COMO_TESTAR_LOGIN_BANIMENTO.md)

---

**Última atualização**: 2025-01-07  
**Versão**: 1.0

