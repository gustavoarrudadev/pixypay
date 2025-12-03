# Gestão de Revendas - Pixy Pay

## 📋 Visão Geral

Este documento descreve completamente a funcionalidade de **Gestão de Revendas** do sistema Pixy Pay. As revendas são empresas que trabalham com distribuição de produtos e possuem um perfil específico com campos adicionais em relação aos clientes comuns.

**Importante**: Apenas usuários com role `admin` podem cadastrar e gerenciar revendas.

---

## 🎯 Funcionalidades Principais

### 1. Cadastro de Revendas (Apenas Admin)
- **Localização**: `src/pages/admin/Revendas.tsx` - Sheet "Nova Revenda"
- **Biblioteca**: `src/lib/gerenciarRevenda.ts` - `criarRevenda()`
- **Acesso**: Exclusivo para usuários com role `admin`
- **Funcionalidades**:
  - Criação de conta de revenda completa
  - Cadastro de dados da empresa e do responsável
  - Validação de campos obrigatórios
  - Criação automática de usuário no `auth.users`
  - Sincronização automática com tabela `revendas` e `usuarios`

### 2. Listagem e Filtros (Admin)
- **Localização**: `src/pages/admin/Revendas.tsx`
- **Funcionalidades**:
  - Listagem de todas as revendas cadastradas
  - Busca por nome da revenda, CNPJ, nome do responsável ou email
  - Filtros por status:
    - Todos
    - Em atividade (email confirmado)
    - E-mail pendente
    - Banidos
  - Filtros por data de cadastro:
    - Hoje
    - Últimos 7 dias
    - Últimos 15 dias
    - Últimos 30 dias
    - Período personalizado

### 3. Visualização de Detalhes (Admin)
- **Localização**: `src/pages/admin/Revendas.tsx` - Sheet "Detalhes da Revenda"
- **Funcionalidades**:
  - Visualização completa de todos os dados da revenda
  - Informações básicas (nome, CNPJ, responsável, telefone, email)
  - Endereço completo
  - Marcas trabalhadas (exibidas como tags)
  - Informações de conta (datas, IDs, status de banimento)
  - Status de confirmação de email

### 4. Edição de Revendas (Admin)
- **Localização**: `src/pages/admin/Revendas.tsx` - Modo de edição no Sheet
- **Biblioteca**: `src/lib/gerenciarRevenda.ts` - `atualizarRevenda()`
- **Funcionalidades**:
  - Edição de todos os campos editáveis
  - Sincronização bidirecional com `auth.users` e `usuarios`
  - Validação de campos obrigatórios
  - Atualização em tempo real na interface

### 5. Gerenciamento de Conta da Revenda (Própria Revenda)
- **Localização**: `src/pages/GerenciarContaRevenda.tsx`
- **Acesso**: Usuários com role `revenda` são redirecionados automaticamente
- **Funcionalidades**:
  - Visualização de todos os dados da revenda
  - Edição de campos permitidos (exceto CNPJ e Email)
  - Alteração de senha
  - Sincronização bidirecional com dados do admin

### 6. Ações Rápidas (Admin)
- **Localização**: `src/pages/admin/Revendas.tsx` - Aba "Gerenciar"
- **Funcionalidades**:
  - Enviar Magic Link
  - Enviar Redefinição de Senha
  - Banir Revenda (com seleção de tempo)
  - Desbanir Revenda
  - Excluir Revenda

---

## 📊 Estrutura de Dados

### Tabela `revendas`

```sql
CREATE TABLE revendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_revenda VARCHAR NOT NULL,
  cnpj VARCHAR NOT NULL UNIQUE,
  nome_responsavel VARCHAR NOT NULL,
  cpf_responsavel VARCHAR NOT NULL,
  telefone VARCHAR,
  cep VARCHAR NOT NULL,
  logradouro VARCHAR NOT NULL,
  numero VARCHAR NOT NULL,
  complemento VARCHAR,  -- Opcional
  bairro VARCHAR NOT NULL,
  cidade VARCHAR NOT NULL,
  estado VARCHAR(2) NOT NULL,
  marcas_trabalhadas TEXT[],  -- Array de strings
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### Campos Obrigatórios
- `nome_revenda`: Nome da empresa revenda
- `cnpj`: CNPJ da empresa (único, não editável após criação)
- `nome_responsavel`: Nome completo do responsável
- `cpf_responsavel`: CPF do responsável
- `cep`: CEP do endereço
- `logradouro`: Rua/Avenida
- `numero`: Número do endereço
- `bairro`: Bairro
- `cidade`: Cidade
- `estado`: Estado (2 caracteres, maiúsculo)

### Campos Opcionais
- `telefone`: Telefone de contato
- `complemento`: Complemento do endereço
- `marcas_trabalhadas`: Array de marcas de gás trabalhadas

### Marcas Disponíveis
- Ultragaz
- Supergasbras
- Liquigás
- Copagaz
- Nacional Gás
- Outros (com campo de texto personalizado)

---

## 🔐 Segurança e Permissões

### Row Level Security (RLS)

#### Políticas para Admin
- **SELECT**: Admins podem ver todas as revendas
- **INSERT**: Apenas admins podem criar revendas
- **UPDATE**: Admins podem atualizar qualquer revenda
- **DELETE**: Apenas admins podem excluir revendas

#### Políticas para Revendas
- **SELECT**: Revendas podem ver apenas seus próprios dados (`user_id = auth.uid()`)
- **UPDATE**: Revendas podem atualizar apenas seus próprios dados (`user_id = auth.uid()`)

### Validações de Segurança
- CNPJ não pode ser alterado após criação
- Email não pode ser alterado pela própria revenda
- Verificação de role antes de permitir ações administrativas
- Validação de campos obrigatórios no frontend e backend

---

## 🔄 Fluxos de Trabalho

### 1. Cadastro de Nova Revenda (Admin)

```
1. Admin acessa página de Revendas
2. Clica em "Nova Revenda"
3. Preenche formulário completo:
   - Dados da empresa (nome, CNPJ)
   - Dados do responsável (nome, CPF)
   - Telefone (opcional)
   - Endereço completo (CEP obrigatório)
   - Marcas trabalhadas (seleção múltipla)
   - Email e senha para login
4. Sistema valida todos os campos
5. Cria usuário no auth.users com role 'revenda'
6. Cria registro na tabela revendas
7. Cria registro na tabela usuarios
8. Envia email de confirmação (se configurado)
9. Revenda aparece na listagem
```

### 2. Edição de Revenda pelo Admin

```
1. Admin clica em "Ações" na revenda desejada
2. Visualiza detalhes completos
3. Clica em "Editar"
4. Modifica campos desejados
5. Salva alterações
6. Sistema atualiza:
   - Tabela revendas
   - Tabela usuarios
   - auth.users (via Edge Function)
7. Dados são recarregados na interface
8. Alterações refletem na página da revenda quando ela fizer login
```

### 3. Edição de Dados pela Própria Revenda

```
1. Revenda faz login
2. É redirecionada para /conta-revenda
3. Visualiza todos os seus dados
4. Edita campos permitidos (exceto CNPJ e Email)
5. Salva alterações
6. Sistema atualiza:
   - Tabela revendas
   - Tabela usuarios
   - auth.users (via Edge Function e updateUser)
7. Dados são recarregados na interface
8. Alterações refletem na página do admin
```

### 4. Banimento de Revenda

```
1. Admin acessa detalhes da revenda
2. Vai para aba "Gerenciar"
3. Clica em "Banir Revenda"
4. Seleciona tempo de banimento:
   - 1 dia
   - 7 dias
   - 30 dias
   - Permanente
5. Sistema atualiza:
   - Campo banned_until em auth.users
   - Campos banido_at e banido_ate em usuarios
   - Campo esta_banido em usuarios
6. Revenda não consegue mais fazer login
7. Status aparece na listagem e detalhes
```

---

## 🔧 Integrações Técnicas

### Edge Functions Utilizadas

#### `criar-usuario-admin`
- **Uso**: Criação de usuário no `auth.users` com role específica
- **Parâmetros**:
  - `email`: Email da revenda
  - `senha`: Senha inicial
  - `nome_completo`: Nome do responsável
  - `telefone`: Telefone (opcional)
  - `cpf`: CPF do responsável
  - `role`: 'revenda'
- **Retorno**: ID do usuário criado

#### `atualizar-usuario-admin`
- **Uso**: Atualização de dados no `auth.users` e `usuarios`
- **Parâmetros**:
  - `userId`: ID do usuário
  - `display_name`: Nome do responsável
  - `telefone`: Telefone
  - `cpf`: CPF do responsável
- **Retorno**: Dados atualizados

#### `bloquear-usuario`
- **Uso**: Banimento/desbanimento de revendas
- **Parâmetros**:
  - `userId`: ID do usuário
  - `bloquear`: true/false
  - `tempoBanimento`: '1', '7', '30' ou 'permanente'
- **Retorno**: Status da operação

#### `excluir-usuario`
- **Uso**: Exclusão de revenda e usuário associado
- **Parâmetros**:
  - `userId`: ID do usuário
- **Retorno**: Status da operação

### RPC Functions

#### `listar_revendas_com_email()`
- **Uso**: Lista todas as revendas com email e status de banimento
- **Retorno**: Array de revendas com:
  - Dados da tabela `revendas`
  - Email de `auth.users`
  - Status de confirmação de email
  - Status de banimento (`banned_until` de `auth.users`)
  - Datas de banimento de `usuarios`

#### `buscar_detalhes_revenda(revenda_id UUID)`
- **Uso**: Busca detalhes completos de uma revenda específica
- **Parâmetros**: `revenda_id` (UUID)
- **Retorno**: Objeto com todos os dados da revenda

---

## 📝 Bibliotecas e Funções

### `src/lib/gerenciarRevenda.ts`

#### `listarRevendas()`
- Lista todas as revendas cadastradas
- Usa RPC `listar_revendas_com_email()`
- Processa `marcas_trabalhadas` (ARRAY, JSONB ou string)
- Retorna array de `RevendaCompleta`

#### `buscarDetalhesRevenda(revendaId: string)`
- Busca detalhes completos de uma revenda
- Tenta usar RPC primeiro, depois fallback direto
- Busca email e status de banimento de múltiplas fontes
- Processa `marcas_trabalhadas` corretamente
- Retorna `RevendaCompleta` ou erro

#### `criarRevenda(dados)`
- Cria nova revenda completa
- Valida campos obrigatórios (endereço completo)
- Cria usuário no `auth.users` via Edge Function
- Cria registro na tabela `revendas`
- Sincroniza com tabela `usuarios`
- Retorna revenda criada ou erro

#### `atualizarRevenda(revendaId: string, dados)`
- Atualiza dados de uma revenda
- Atualiza tabela `revendas`
- Sincroniza com `auth.users` e `usuarios` via Edge Function
- Trata campos opcionais corretamente
- Retorna sucesso ou erro

#### `excluirRevenda(revendaId: string)`
- Exclui revenda e usuário associado
- Usa Edge Function `excluir-usuario`
- Retorna sucesso ou erro

#### `bloquearRevenda(revendaId: string, bloquear: boolean, tempoBanimento?: string)`
- Bloqueia ou desbloqueia uma revenda
- Usa Edge Function `bloquear-usuario`
- Atualiza campos de banimento
- Retorna sucesso ou erro

#### `enviarMagicLinkRevenda(email: string)`
- Envia magic link para login sem senha
- Usa função `enviarMagicLink` de `auth.ts`

#### `enviarRedefinicaoSenhaRevenda(email: string)`
- Envia email de redefinição de senha
- Usa função `recuperarSenha` de `auth.ts`

### Máscaras Aplicadas

- **CNPJ**: `00.000.000/0000-00`
- **CPF**: `000.000.000-00`
- **Telefone**: `(00) 0-0000-0000`
- **CEP**: `00000-000`

---

## 🎨 Interface do Usuário

### Página de Revendas (Admin)

#### Componentes Principais
- **Header**: Título, botão "Nova Revenda", filtros
- **Barra de Busca**: Busca em tempo real
- **Filtros**:
  - Status (dropdown)
  - Data de cadastro (dropdown com calendário)
- **Tabela**: Listagem de revendas com:
  - Nome da Revenda
  - CNPJ (formatado)
  - Responsável
  - Email (com status de confirmação)
  - Status (badge colorido)
  - Data de Cadastro
  - Botão "Ações"

#### Sheet "Nova Revenda"
- Formulário completo com validação
- Campos organizados em seções:
  - Dados da Empresa
  - Dados do Responsável
  - Endereço Completo
  - Marcas Trabalhadas (checkboxes)
  - Credenciais de Acesso
- Validação em tempo real
- Mensagens de erro claras

#### Sheet "Detalhes da Revenda"
- **Aba "Informações Básicas"**:
  - Dados da empresa e responsável
  - Endereço completo formatado
  - Marcas trabalhadas (tags)
  - Informações de conta
  - Status de banimento (se aplicável)
- **Aba "Gerenciar"**:
  - Modo de edição (toggle)
  - Formulário de edição
  - Ações rápidas (botões)
  - Confirmações para ações destrutivas

### Página de Conta da Revenda

#### Componentes Principais
- **Header**: Título, ícone, botão voltar
- **Card "Informações da Revenda"**:
  - Nome da Revenda (editável)
  - CNPJ (somente leitura)
  - Nome do Responsável (editável)
  - CPF do Responsável (editável)
  - Telefone (editável)
  - Email (somente leitura)
  - Endereço completo (editável)
  - Marcas Trabalhadas (editável)
- **Card "Segurança"**:
  - Alteração de senha
- **Card "Informações da Conta"**:
  - ID do usuário
  - Status de confirmação de email
  - Datas de criação e atualização
  - Botão de logout

---

## 🔄 Sincronização Bidirecional

### Fluxo de Sincronização

#### Admin → Revenda
1. Admin edita dados da revenda
2. `atualizarRevenda()` atualiza:
   - Tabela `revendas`
   - Tabela `usuarios`
   - `auth.users` (via Edge Function)
3. Quando revenda faz login ou recarrega página:
   - `buscarDetalhesRevenda()` busca dados atualizados
   - Formulário é preenchido com dados mais recentes
   - Alterações do admin aparecem automaticamente

#### Revenda → Admin
1. Revenda edita seus dados
2. `handleAtualizarPerfil()` atualiza:
   - Tabela `revendas`
   - Tabela `usuarios`
   - `auth.users` (via Edge Function e `updateUser`)
3. Quando admin visualiza ou recarrega:
   - `listarRevendas()` ou `buscarDetalhesRevenda()` busca dados atualizados
   - Alterações da revenda aparecem automaticamente

### Campos Sincronizados
- `nome_revenda` ↔ `nome_revenda` (revendas)
- `nome_responsavel` ↔ `nome_completo` (usuarios) ↔ `display_name` (auth.users)
- `telefone` ↔ `telefone` (usuarios) ↔ `user_metadata.telefone` (auth.users)
- `cpf_responsavel` ↔ `cpf` (usuarios) ↔ `user_metadata.cpf` (auth.users)
- Endereço completo (todos os campos)
- `marcas_trabalhadas`

---

## ✅ Validações

### Frontend (Client-Side)

#### Campos Obrigatórios
- Nome da Revenda: Não pode estar vazio
- CNPJ: Deve ter 14 dígitos (após remover máscara)
- Nome do Responsável: Não pode estar vazio
- CPF do Responsável: Deve ter 11 dígitos (após remover máscara)
- CEP: Deve ter 8 dígitos (após remover máscara)
- Logradouro: Não pode estar vazio
- Número: Não pode estar vazio
- Bairro: Não pode estar vazio
- Cidade: Não pode estar vazio
- Estado: Deve ter 2 caracteres
- Email: Deve ser válido
- Senha: Mínimo 8 caracteres (se fornecida)

#### Validações Especiais
- CNPJ único: Verificação antes de criar
- Email único: Verificação antes de criar
- Telefone: Mínimo 10 dígitos se fornecido
- Estado: Convertido para maiúsculo automaticamente
- Marcas: Se "Outros" selecionado, campo de texto é obrigatório

### Backend (Server-Side)

#### Validações na Edge Function
- Verificação de role admin antes de criar/atualizar
- Validação de campos obrigatórios
- Sanitização de dados (trim, uppercase)
- Verificação de unicidade (CNPJ, email)

#### Validações no Banco de Dados
- Constraints NOT NULL nos campos obrigatórios
- UNIQUE constraint no CNPJ
- Foreign key constraint no `user_id`
- Check constraint no `estado` (2 caracteres)

---

## 🚨 Tratamento de Erros

### Erros Comuns e Soluções

#### "CNPJ já cadastrado"
- **Causa**: Tentativa de cadastrar CNPJ duplicado
- **Solução**: Verificar se revenda já existe, usar edição ao invés de criação

#### "Email já cadastrado"
- **Causa**: Tentativa de cadastrar email duplicado
- **Solução**: Verificar se usuário já existe

#### "Endereço incompleto"
- **Causa**: Campos obrigatórios do endereço não preenchidos
- **Solução**: Preencher todos os campos obrigatórios (exceto complemento)

#### "Edge Function retornou erro"
- **Causa**: Problema na Edge Function ou permissões
- **Solução**: Verificar logs da Edge Function no Supabase

#### "Revenda não encontrada"
- **Causa**: ID inválido ou revenda foi excluída
- **Solução**: Recarregar lista de revendas

#### "Erro ao carregar dados"
- **Causa**: Problema de conexão ou RLS
- **Solução**: Verificar políticas RLS e conexão com Supabase

---

## 📱 Redirecionamentos

### Login
- Usuário com role `revenda` → `/conta-revenda`
- Usuário com role `cliente` → `/conta`
- Usuário com role `admin` → `/admin`

### Proteção de Rotas
- `/admin/revendas`: Apenas admins
- `/conta-revenda`: Apenas revendas (redireciona outros)
- `/conta`: Redireciona revendas para `/conta-revenda`

---

## 🔍 Migrations Relacionadas

### `009_create_revendas_table.sql`
- Cria tabela `revendas` inicial
- Define estrutura básica

### `010_add_rls_to_revendas.sql`
- Adiciona políticas RLS para admins
- Cria função `eh_admin()`

### `012_fix_revendas_missing_columns.sql`
- Adiciona colunas faltantes (idempotente)

### `013_make_revendas_endereco_fields_required.sql`
- Remove coluna antiga `endereco`
- Torna campos de endereço obrigatórios

### `create_listar_revendas_with_email.sql`
- Cria função RPC `listar_revendas_com_email()`
- Faz join com `auth.users` e `usuarios`

### `add_rls_policy_revenda_access_own_data.sql`
- Adiciona políticas RLS para revendas acessarem seus próprios dados

---

## 📊 Relacionamentos

### Revenda ↔ Usuário
- Uma revenda tem um `user_id` que referencia `auth.users(id)`
- Relacionamento 1:1
- Cascade delete: Se usuário é excluído, revenda também é excluída

### Revenda ↔ Usuarios
- Dados sincronizados via trigger e Edge Functions
- Campos sincronizados:
  - `nome_responsavel` ↔ `nome_completo`
  - `telefone` ↔ `telefone`
  - `cpf_responsavel` ↔ `cpf`

### Revenda ↔ Auth.Users
- Dados sincronizados via Edge Functions
- Campos sincronizados:
  - `nome_responsavel` ↔ `display_name` e `user_metadata.nome_completo`
  - `telefone` ↔ `user_metadata.telefone`
  - `cpf_responsavel` ↔ `user_metadata.cpf`

---

## 🧪 Testes Recomendados

### Testes de Cadastro
1. Cadastrar revenda com todos os campos
2. Cadastrar revenda com campos mínimos obrigatórios
3. Tentar cadastrar CNPJ duplicado (deve falhar)
4. Tentar cadastrar email duplicado (deve falhar)
5. Validar máscaras aplicadas corretamente

### Testes de Edição
1. Admin edita revenda e verifica sincronização
2. Revenda edita seus dados e verifica sincronização
3. Tentar editar CNPJ (deve estar desabilitado)
4. Tentar editar email como revenda (deve estar desabilitado)
5. Validar atualização em tempo real

### Testes de Permissões
1. Cliente tenta acessar `/admin/revendas` (deve ser bloqueado)
2. Revenda tenta acessar `/admin/revendas` (deve ser bloqueado)
3. Admin acessa `/admin/revendas` (deve funcionar)
4. Revenda acessa `/conta-revenda` (deve funcionar)
5. Cliente tenta acessar `/conta-revenda` (deve redirecionar)

### Testes de Banimento
1. Banir revenda e verificar bloqueio de login
2. Desbanir revenda e verificar liberação
3. Verificar exibição de status na listagem
4. Verificar informações de banimento nos detalhes

---

## 📝 Documentação Relacionada

- [Funcionalidades Gerais](./FUNCIONALIDADES_GERAIS.md)
- [Gestão de Clientes](./GESTAO_CLIENTES.md)
- [Integração Supabase](./SUPABASE_INTEGRACAO.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Verificação de Autenticação](./VERIFICACAO_AUTENTICACAO.md)

---

## 🔄 Changelog

### Versão 1.0 (2025-01-07)
- Implementação inicial completa da funcionalidade de Revendas
- Cadastro exclusivo para admins
- Página de gerenciamento completa com filtros e busca
- Página de conta da revenda
- Sincronização bidirecional entre admin e revenda
- Sistema de banimento integrado
- Políticas RLS implementadas
- Validações frontend e backend
- Máscaras aplicadas em todos os campos

---

**Última atualização**: 2025-01-07  
**Versão**: 1.0  
**Autor**: Sistema Pixy Pay

