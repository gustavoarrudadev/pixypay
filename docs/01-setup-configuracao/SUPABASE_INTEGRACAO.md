# Integração Supabase - Pixy Pay

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://giiwmavorrepzgopzmjx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaXdtYXZvcnJlcHpnb3B6bWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzAxMzMsImV4cCI6MjA3ODEwNjEzM30.O3X69V_66CPRalyscSfNIlpd6QC6lAPcizP6Ot9D3BE
VITE_APP_URL=http://localhost:5173
VITE_ENV=development
```

## Funcionalidades Implementadas

### 1. Autenticação

#### 1.1 Registro de Usuário
- ✅ Criação de conta com email e senha
- ✅ Validação de senha em tempo real
- ✅ Suporte a telefone e CPF (opcionais)
- ✅ Envio automático de email de confirmação
- ✅ Sincronização de telefone após registro
- ✅ Role padrão: `cliente`
- ✅ Redirecionamento após registro

#### 1.2 Confirmação de Email
- ✅ Página `/confirmar-email` que processa o link do email
- ✅ Verificação automática do token
- ✅ Mensagem de sucesso e redirecionamento para login

#### 1.3 Login
- ✅ Login com email e senha
- ✅ Verificação prévia de banimento (bloqueio automático)
- ✅ Verificação de email confirmado
- ✅ Magic Link (apenas para usuários registrados)
- ✅ Redirecionamento baseado em role (admin, revenda, cliente)
- ✅ Mensagens de erro e sucesso
- ✅ Sincronização de telefone após login

#### 1.4 Magic Link
- ✅ Envio de link de login por email
- ✅ Login automático ao clicar no link
- ✅ Redirecionamento para `/magic-link-login`

#### 1.5 Recuperação de Senha
- ✅ Envio de email de recuperação
- ✅ Link para redefinir senha

#### 1.6 Redefinição de Senha
- ✅ Página `/redefinir-senha` para definir nova senha
- ✅ Validação de sessão/token
- ✅ Confirmação de senha
- ✅ Redirecionamento após redefinição

### 2. Gestão de Clientes

#### 2.1 Listagem
- ✅ Lista todos os clientes cadastrados
- ✅ Filtros avançados (busca, status, data)
- ✅ Exibição de status visual (badges)
- ✅ Consulta via RPC `buscar_detalhes_clientes()`

#### 2.2 Criação
- ✅ Cadastro manual pelo admin
- ✅ Campos: Nome, Email, Telefone (opcional), CPF (opcional)
- ✅ Senha opcional (cliente cria via email)
- ✅ Opção de enviar Magic Link
- ✅ Edge Function `criar-usuario-admin`

#### 2.3 Edição
- ✅ Edição de nome, email, telefone, CPF
- ✅ Sincronização com `auth.users` e tabela `usuarios`
- ✅ Edge Function `atualizar-usuario-admin`

#### 2.4 Exclusão
- ✅ Exclusão com confirmação
- ✅ Remoção de `auth.users` e tabela `usuarios`
- ✅ Edge Function `excluir-usuario`

#### 2.5 Banimento
- ✅ Banimento temporário (horas ou dias)
- ✅ Banimento permanente
- ✅ Desbanimento
- ✅ Edge Function `bloquear-usuario`
- ✅ RPC `update_user_banned_until()` (Migration 007)

### 3. Gestão de Revendas

#### 3.1 Listagem
- ✅ Lista todas as revendas cadastradas
- ✅ Busca por nome ou CNPJ
- ✅ Tabela `revendas` (Migration 009)

#### 3.2 Criação
- ✅ Cadastro manual pelo admin
- ✅ Campos: Nome, Email, Senha
- ✅ Role: `revenda`
- ✅ Edge Function `criar-usuario-admin`

#### 3.3 Edição e Exclusão
- ✅ Edição de dados da revenda
- ✅ Exclusão com confirmação
- ✅ Tabela `revendas`

### 4. Sistema de Banimento

#### 4.1 Verificação
- ✅ Verificação prévia ao login
- ✅ RPC `verificar_usuario_banido()` (Migration 008)
- ✅ Consulta `auth.users.banned_until`

#### 4.2 Aplicação
- ✅ Banimento por horas ou dias
- ✅ Banimento permanente
- ✅ Sincronização com `auth.users` e tabela `usuarios`
- ✅ Edge Function `bloquear-usuario`

#### 4.3 Alerta Visual
- ✅ Alerta diferenciado no login (amarelo/âmbar)
- ✅ Botões de contato com suporte
- ✅ Mensagem clara sobre suspensão

## Fluxos

### Fluxo de Registro
1. Usuário preenche formulário de registro
2. Conta é criada no Supabase
3. Email de confirmação é enviado automaticamente
4. Usuário clica no link do email
5. Redirecionado para `/confirmar-email`
6. Email é confirmado
7. Redirecionado para `/login` com mensagem de sucesso

### Fluxo de Magic Link
1. Usuário seleciona "Magic Link" na tela de login
2. Informa email
3. Sistema verifica se usuário existe
4. Se existir, envia magic link
5. Usuário clica no link do email
6. Redirecionado para `/confirmar-email`
7. Login automático

### Fluxo de Recuperação de Senha
1. Usuário clica em "Esqueceu?" na tela de login
2. Informa email
3. Email de recuperação é enviado
4. Usuário clica no link do email
5. Redirecionado para `/redefinir-senha`
6. Define nova senha
7. Redirecionado para `/login` com mensagem de sucesso

## Configuração no Supabase

### URLs de Redirecionamento

No painel do Supabase, configure as seguintes URLs de redirecionamento:

- **Site URL**: `http://localhost:5173`
- **Redirect URLs**:
  - `http://localhost:5173/confirmar-email`
  - `http://localhost:5173/redefinir-senha`

### Email Templates

Os templates de email do Supabase são usados automaticamente. Você pode personalizá-los no painel do Supabase em:
- Authentication > Email Templates

## Edge Functions

### `bloquear-usuario`
- **Função**: Banir/desbanir usuários
- **Parâmetros**: `userId`, `bloquear`, `tempoBanimento`
- **Integração**: RPC `update_user_banned_until()`
- **Atualiza**: `auth.users.banned_until` e tabela `usuarios`

### `criar-usuario-admin`
- **Função**: Criar usuários pelo admin
- **Parâmetros**: `email`, `password`, `nome_completo`, `role`, `telefone`, `cpf`
- **Cria**: Usuário no Supabase Auth e tabela `usuarios`

### `atualizar-usuario-admin`
- **Função**: Atualizar dados de usuário
- **Parâmetros**: `userId`, `display_name`, `telefone`, `cpf`, `email`
- **Atualiza**: `auth.users` e tabela `usuarios`

### `excluir-usuario`
- **Função**: Excluir usuário
- **Parâmetros**: `userId`
- **Remove**: Usuário do Supabase Auth e tabela `usuarios`

## RPC Functions

### `buscar_detalhes_clientes()`
- **Função**: Listar clientes com detalhes completos
- **Retorna**: Lista de clientes com status de banimento
- **Fonte de Verdade**: `auth.users.banned_until`
- **Migration**: 006

### `verificar_usuario_banido(user_email TEXT)`
- **Função**: Verificar se usuário está banido
- **Retorna**: `TRUE` se banido, `FALSE` se não
- **Consulta**: `auth.users.banned_until`
- **Migration**: 008

### `update_user_banned_until(user_id UUID, banned_until_value TIMESTAMPTZ)`
- **Função**: Atualizar campo `banned_until` do usuário
- **Usado por**: Edge Function `bloquear-usuario`
- **Migration**: 007

## Observações

- O Magic Link só funciona para usuários que já fizeram registro
- A confirmação de email é obrigatória antes de fazer login
- Os links de email expiram após um período determinado pelo Supabase
- A sessão é mantida no localStorage automaticamente
- O campo `auth.users.banned_until` é a **fonte de verdade** para banimentos
- A tabela `usuarios` serve apenas como cache/histórico
- Todas as operações de banimento sincronizam ambos os lugares

