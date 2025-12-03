# Sistema de Convites para Colaboradores

## 📋 Visão Geral

Sistema completo para convidar e gerenciar colaboradores tanto no painel Admin quanto no painel Revenda. Permite criar usuários com permissões específicas por funcionalidade, sem necessidade de confirmação de email, com credenciais prontas para uso imediato.

**Versão**: 1.0  
**Data**: 2025-01-15

---

## 🎯 Objetivos

1. **Admin**: Criar colaboradores admin com permissões granulares por funcionalidade
2. **Revenda**: Criar colaboradores da revenda com permissões específicas do painel
3. **Credenciais Imediatas**: Usuários criados já podem fazer login sem confirmação de email
4. **Compartilhamento Seguro**: Exibir credenciais em janela modal com opção de copiar

---

## 🏗️ Arquitetura

### Roles do Sistema

O sistema terá as seguintes roles:

- `admin`: Administrador principal (acesso total)
- `colaborador_admin`: Colaborador do painel admin (permissões granulares)
- `revenda`: Revenda principal (acesso total ao painel da revenda)
- `colaborador_revenda`: Colaborador da revenda (permissões granulares)
- `cliente`: Cliente final (sem mudanças)

### Estrutura de Banco de Dados

#### 1. Tabela `colaboradores`

Armazena informações sobre colaboradores e suas permissões.

```sql
CREATE TABLE colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_colaborador TEXT NOT NULL CHECK (tipo_colaborador IN ('admin', 'revenda')),
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE, -- NULL se tipo_colaborador = 'admin'
  criado_por UUID NOT NULL REFERENCES usuarios(id), -- Quem criou o convite
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que revenda_id seja obrigatório para colaboradores de revenda
  CONSTRAINT check_revenda_id CHECK (
    (tipo_colaborador = 'revenda' AND revenda_id IS NOT NULL) OR
    (tipo_colaborador = 'admin' AND revenda_id IS NULL)
  ),
  
  -- Garantir unicidade: um usuário só pode ser colaborador de uma revenda específica
  CONSTRAINT unique_colaborador_revenda UNIQUE (usuario_id, revenda_id),
  
  -- Garantir unicidade: um usuário só pode ser colaborador admin uma vez
  CONSTRAINT unique_colaborador_admin UNIQUE (usuario_id) WHERE tipo_colaborador = 'admin'
);
```

#### 2. Tabela `permissoes_colaborador`

Armazena as permissões específicas de cada colaborador por funcionalidade.

```sql
CREATE TABLE permissoes_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  funcionalidade TEXT NOT NULL, -- Ex: 'dashboard', 'pedidos', 'produtos', etc.
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir unicidade: uma funcionalidade por colaborador
  CONSTRAINT unique_funcionalidade_colaborador UNIQUE (colaborador_id, funcionalidade)
);
```

#### 3. Atualização da Tabela `usuarios`

Adicionar suporte para a nova role `colaborador_admin` e `colaborador_revenda`:

```sql
-- Atualizar CHECK constraint para incluir novas roles
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_role_check 
  CHECK (role IN ('admin', 'colaborador_admin', 'revenda', 'colaborador_revenda', 'cliente'));
```

---

## 🔐 Permissões e Funcionalidades

### Funcionalidades do Admin

Lista de funcionalidades disponíveis para colaboradores admin:

1. **dashboard** - Visualizar dashboard administrativo
2. **revendas** - Gerenciar revendas
3. **clientes** - Gerenciar clientes
4. **pedidos** - Gerenciar pedidos
5. **parcelamentos** - Gerenciar parcelamentos
6. **agendamentos** - Gerenciar agendamentos
7. **repasses** - Gerenciar repasses
8. **financeiro** - Acessar informações financeiras
9. **inadimplencia** - Gerenciar inadimplência
10. **relatorios** - Acessar relatórios
11. **administracao** - Configurações administrativas

### Funcionalidades da Revenda

Lista de funcionalidades disponíveis para colaboradores de revenda:

1. **dashboard** - Visualizar dashboard da revenda
2. **presenca** - Gerenciar presença na loja
3. **produtos** - Gerenciar produtos
4. **pedidos** - Gerenciar pedidos
5. **agendamentos** - Gerenciar agendamentos
6. **clientes** - Visualizar clientes
7. **parcelamentos** - Gerenciar parcelamentos
8. **historico_vendas** - Visualizar histórico de vendas
9. **financeiro** - Acessar informações financeiras
10. **relatorios** - Acessar relatórios
11. **ajuda** - Acessar ajuda
12. **administracao** - Configurações da revenda

---

## 🔄 Fluxos de Funcionamento

### Fluxo 1: Criar Colaborador Admin

1. Admin acessa menu "Administração" → "Colaboradores"
2. Clica em "Convidar Colaborador"
3. Preenche formulário:
   - Nome completo
   - Email
   - Senha (gerada automaticamente ou definida manualmente)
   - Seleciona funcionalidades e permissões (visualizar, criar, editar, excluir)
4. Sistema cria usuário no `auth.users` com:
   - `email_confirmado = true` (para login imediato)
   - `role = 'colaborador_admin'` nos metadados
5. Sistema cria registro em `usuarios` com `role = 'colaborador_admin'`
6. Sistema cria registro em `colaboradores` com `tipo_colaborador = 'admin'`
7. Sistema cria registros em `permissoes_colaborador` para cada funcionalidade selecionada
8. Sistema exibe modal com credenciais formatadas:
   ```
   Email: colaborador@exemplo.com
   Senha: SenhaGerada123!
   ```
9. Botão "Copiar Credenciais" copia texto formatado para clipboard

### Fluxo 2: Criar Colaborador Revenda

1. Revenda acessa menu "Administração" → "Colaboradores"
2. Clica em "Convidar Colaborador"
3. Preenche formulário:
   - Nome completo
   - Email
   - Senha (gerada automaticamente ou definida manualmente)
   - Seleciona funcionalidades e permissões (visualizar, criar, editar, excluir)
4. Sistema cria usuário no `auth.users` com:
   - `email_confirmado = true` (para login imediato)
   - `role = 'colaborador_revenda'` nos metadados
   - `revenda_id` nos metadados (ID da revenda atual)
5. Sistema cria registro em `usuarios` com `role = 'colaborador_revenda'`
6. Sistema cria registro em `colaboradores` com:
   - `tipo_colaborador = 'revenda'`
   - `revenda_id = <id_da_revenda_atual>`
7. Sistema cria registros em `permissoes_colaborador` para cada funcionalidade selecionada
8. Sistema exibe modal com credenciais formatadas
9. Botão "Copiar Credenciais" copia texto formatado para clipboard

### Fluxo 3: Login de Colaborador

1. Colaborador acessa `/login`
2. Informa email e senha
3. Sistema verifica role:
   - Se `colaborador_admin`: redireciona para `/admin`
   - Se `colaborador_revenda`: redireciona para `/revenda/dashboard`
4. Sistema verifica permissões e filtra menu conforme permissões do colaborador
5. Sistema aplica RLS nas queries baseado nas permissões

---

## 🛡️ Segurança e RLS (Row Level Security)

### Políticas RLS para `colaboradores`

```sql
-- Colaboradores podem ver seus próprios dados
CREATE POLICY "Colaboradores podem ver seus próprios dados"
  ON colaboradores FOR SELECT
  USING (auth.uid() = usuario_id);

-- Admins podem ver todos os colaboradores admin
CREATE POLICY "Admins podem ver colaboradores admin"
  ON colaboradores FOR SELECT
  USING (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Revendas podem ver seus próprios colaboradores
CREATE POLICY "Revendas podem ver seus colaboradores"
  ON colaboradores FOR SELECT
  USING (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  );

-- Admins podem criar colaboradores admin
CREATE POLICY "Admins podem criar colaboradores admin"
  ON colaboradores FOR INSERT
  WITH CHECK (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Revendas podem criar seus colaboradores
CREATE POLICY "Revendas podem criar seus colaboradores"
  ON colaboradores FOR INSERT
  WITH CHECK (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  );

-- Admins podem atualizar colaboradores admin
CREATE POLICY "Admins podem atualizar colaboradores admin"
  ON colaboradores FOR UPDATE
  USING (
    tipo_colaborador = 'admin' AND
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Revendas podem atualizar seus colaboradores
CREATE POLICY "Revendas podem atualizar seus colaboradores"
  ON colaboradores FOR UPDATE
  USING (
    tipo_colaborador = 'revenda' AND
    EXISTS (
      SELECT 1 FROM revendas 
      WHERE id = colaboradores.revenda_id 
      AND user_id = auth.uid()
    )
  );
```

### Políticas RLS para `permissoes_colaborador`

```sql
-- Colaboradores podem ver suas próprias permissões
CREATE POLICY "Colaboradores podem ver suas permissões"
  ON permissoes_colaborador FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores 
      WHERE id = permissoes_colaborador.colaborador_id 
      AND usuario_id = auth.uid()
    )
  );

-- Admins podem ver permissões de colaboradores admin
CREATE POLICY "Admins podem ver permissões de colaboradores admin"
  ON permissoes_colaborador FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'admin'
      AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Revendas podem ver permissões de seus colaboradores
CREATE POLICY "Revendas podem ver permissões de seus colaboradores"
  ON permissoes_colaborador FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN revendas r ON c.revenda_id = r.id
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'revenda'
      AND r.user_id = auth.uid()
    )
  );

-- Admins podem gerenciar permissões de colaboradores admin
CREATE POLICY "Admins podem gerenciar permissões admin"
  ON permissoes_colaborador FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'admin'
      AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Revendas podem gerenciar permissões de seus colaboradores
CREATE POLICY "Revendas podem gerenciar permissões de seus colaboradores"
  ON permissoes_colaborador FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN revendas r ON c.revenda_id = r.id
      WHERE c.id = permissoes_colaborador.colaborador_id
      AND c.tipo_colaborador = 'revenda'
      AND r.user_id = auth.uid()
    )
  );
```

---

## 📁 Estrutura de Arquivos

### Backend (Supabase)

```
supabase/migrations/
  └── 057_create_colaboradores_system.sql
      ├── Tabela colaboradores
      ├── Tabela permissoes_colaborador
      ├── Atualização tabela usuarios
      ├── Funções RPC
      └── Políticas RLS
```

### Frontend

```
src/
  ├── lib/
  │   ├── colaboradores.ts          # Funções para gerenciar colaboradores
  │   └── permissoes.ts             # Funções para verificar permissões
  ├── components/
  │   ├── colaboradores/
  │   │   ├── DialogConvidarColaborador.tsx
  │   │   ├── DialogCredenciais.tsx
  │   │   ├── TabelaColaboradores.tsx
  │   │   └── FormPermissoes.tsx
  │   └── ui/
  │       └── (componentes existentes)
  ├── pages/
  │   ├── admin/
  │   │   └── Colaboradores.tsx     # Página de gerenciamento de colaboradores admin
  │   └── revenda/
  │       └── Colaboradores.tsx     # Página de gerenciamento de colaboradores revenda
  └── hooks/
      └── usePermissoes.ts           # Hook para verificar permissões do usuário atual
```

---

## 🔧 Funções RPC (Supabase)

### 1. `criar_colaborador_admin`

Cria um colaborador admin com permissões.

```sql
CREATE OR REPLACE FUNCTION public.criar_colaborador_admin(
  p_email TEXT,
  p_senha TEXT,
  p_nome_completo TEXT,
  p_criado_por UUID,
  p_permissoes JSONB -- Array de objetos { funcionalidade, pode_visualizar, pode_criar, pode_editar, pode_excluir }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_colaborador_id UUID;
BEGIN
  -- Verificar se quem está criando é admin
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_criado_por AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem criar colaboradores admin';
  END IF;

  -- Criar usuário no auth.users (via Admin API será necessário)
  -- Por enquanto, retornamos instruções para criar via frontend
  
  -- Criar registro em usuarios
  INSERT INTO usuarios (id, email, nome_completo, role)
  VALUES (v_user_id, p_email, p_nome_completo, 'colaborador_admin')
  RETURNING id INTO v_user_id;

  -- Criar registro em colaboradores
  INSERT INTO colaboradores (usuario_id, tipo_colaborador, criado_por)
  VALUES (v_user_id, 'admin', p_criado_por)
  RETURNING id INTO v_colaborador_id;

  -- Criar permissões
  INSERT INTO permissoes_colaborador (colaborador_id, funcionalidade, pode_visualizar, pode_criar, pode_editar, pode_excluir)
  SELECT 
    v_colaborador_id,
    (perm->>'funcionalidade')::TEXT,
    COALESCE((perm->>'pode_visualizar')::BOOLEAN, false),
    COALESCE((perm->>'pode_criar')::BOOLEAN, false),
    COALESCE((perm->>'pode_editar')::BOOLEAN, false),
    COALESCE((perm->>'pode_excluir')::BOOLEAN, false)
  FROM jsonb_array_elements(p_permissoes) AS perm;

  RETURN jsonb_build_object(
    'success', true,
    'usuario_id', v_user_id,
    'colaborador_id', v_colaborador_id,
    'email', p_email,
    'senha', p_senha
  );
END;
$$;
```

### 2. `criar_colaborador_revenda`

Cria um colaborador de revenda com permissões.

```sql
CREATE OR REPLACE FUNCTION public.criar_colaborador_revenda(
  p_email TEXT,
  p_senha TEXT,
  p_nome_completo TEXT,
  p_revenda_id UUID,
  p_criado_por UUID,
  p_permissoes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_colaborador_id UUID;
BEGIN
  -- Verificar se quem está criando é dono da revenda
  IF NOT EXISTS (
    SELECT 1 FROM revendas 
    WHERE id = p_revenda_id 
    AND user_id = p_criado_por
  ) THEN
    RAISE EXCEPTION 'Apenas o dono da revenda pode criar colaboradores';
  END IF;

  -- Criar registro em usuarios
  INSERT INTO usuarios (id, email, nome_completo, role)
  VALUES (v_user_id, p_email, p_nome_completo, 'colaborador_revenda')
  RETURNING id INTO v_user_id;

  -- Criar registro em colaboradores
  INSERT INTO colaboradores (usuario_id, tipo_colaborador, revenda_id, criado_por)
  VALUES (v_user_id, 'revenda', p_revenda_id, p_criado_por)
  RETURNING id INTO v_colaborador_id;

  -- Criar permissões
  INSERT INTO permissoes_colaborador (colaborador_id, funcionalidade, pode_visualizar, pode_criar, pode_editar, pode_excluir)
  SELECT 
    v_colaborador_id,
    (perm->>'funcionalidade')::TEXT,
    COALESCE((perm->>'pode_visualizar')::BOOLEAN, false),
    COALESCE((perm->>'pode_criar')::BOOLEAN, false),
    COALESCE((perm->>'pode_editar')::BOOLEAN, false),
    COALESCE((perm->>'pode_excluir')::BOOLEAN, false)
  FROM jsonb_array_elements(p_permissoes) AS perm;

  RETURN jsonb_build_object(
    'success', true,
    'usuario_id', v_user_id,
    'colaborador_id', v_colaborador_id,
    'email', p_email,
    'senha', p_senha
  );
END;
$$;
```

### 3. `verificar_permissao_colaborador`

Verifica se um colaborador tem permissão para uma ação específica.

```sql
CREATE OR REPLACE FUNCTION public.verificar_permissao_colaborador(
  p_usuario_id UUID,
  p_funcionalidade TEXT,
  p_acao TEXT -- 'visualizar', 'criar', 'editar', 'excluir'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_tem_permissao BOOLEAN := false;
BEGIN
  -- Se for admin ou revenda principal, tem todas as permissões
  IF EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = p_usuario_id 
    AND role IN ('admin', 'revenda')
  ) THEN
    RETURN true;
  END IF;

  -- Verificar permissão específica do colaborador
  SELECT CASE p_acao
    WHEN 'visualizar' THEN pode_visualizar
    WHEN 'criar' THEN pode_criar
    WHEN 'editar' THEN pode_editar
    WHEN 'excluir' THEN pode_excluir
    ELSE false
  END INTO v_tem_permissao
  FROM permissoes_colaborador pc
  JOIN colaboradores c ON pc.colaborador_id = c.id
  WHERE c.usuario_id = p_usuario_id
    AND pc.funcionalidade = p_funcionalidade
    AND c.ativo = true;

  RETURN COALESCE(v_tem_permissao, false);
END;
$$;
```

---

## 🎨 Interface do Usuário

### Página de Gerenciamento de Colaboradores

**Admin**: `/admin/colaboradores`  
**Revenda**: `/revenda/colaboradores`

#### Componentes Principais

1. **Tabela de Colaboradores**
   - Lista todos os colaboradores
   - Colunas: Nome, Email, Status (Ativo/Inativo), Data de Criação, Ações
   - Ações: Editar Permissões, Desativar/Ativar, Remover

2. **Dialog Convidar Colaborador**
   - Campos:
     - Nome completo (obrigatório)
     - Email (obrigatório, validação de formato)
     - Senha (gerada automaticamente ou manual)
     - Checkbox "Gerar senha automaticamente"
   - Seção de Permissões:
     - Lista de funcionalidades com checkboxes:
       - ☐ Visualizar
       - ☐ Criar
       - ☐ Editar
       - ☐ Excluir
   - Botões: Cancelar, Convidar

3. **Dialog Credenciais**
   - Exibe após criação bem-sucedida
   - Conteúdo formatado:
     ```
     ┌─────────────────────────────────────┐
     │  Credenciais do Colaborador         │
     ├─────────────────────────────────────┤
     │                                     │
     │  Email: colaborador@exemplo.com    │
     │  Senha: SenhaGerada123!            │
     │                                     │
     │  [Copiar Credenciais]               │
     │                                     │
     └─────────────────────────────────────┘
     ```
   - Botão "Copiar Credenciais" copia:
     ```
     Email: colaborador@exemplo.com
     Senha: SenhaGerada123!
     ```

4. **Form Editar Permissões**
   - Similar ao formulário de convite
   - Permite editar permissões existentes
   - Não permite alterar email ou senha

---

## 🔄 Integração com Layouts

### Filtro de Menu por Permissões

Os layouts (`AdminLayout` e `RevendaLayout`) devem filtrar os itens do menu baseado nas permissões do colaborador:

```typescript
// Exemplo em AdminLayout.tsx
const menuItems = [
  { label: 'Dashboard', path: '/admin', funcionalidade: 'dashboard' },
  { label: 'Revendas', path: '/admin/revendas', funcionalidade: 'revendas' },
  // ...
].filter(item => {
  // Se for admin principal, mostra tudo
  if (role === 'admin') return true;
  
  // Se for colaborador, verifica permissão
  if (role === 'colaborador_admin') {
    return temPermissao(item.funcionalidade, 'visualizar');
  }
  
  return false;
});
```

---

## 📝 Notas de Implementação

### Geração de Senha

- Senha deve ter no mínimo 8 caracteres
- Deve conter letras maiúsculas, minúsculas e números
- Pode ser gerada automaticamente ou definida manualmente
- Exemplo de geração: `GerarSenhaAleatoria123!`

### Confirmação de Email

- Usuários criados como colaboradores devem ter `email_confirmed_at` definido no `auth.users`
- Isso permite login imediato sem confirmação de email
- Usar Admin API do Supabase para criar usuário com email confirmado

### Validações

1. **Email único**: Não pode haver dois usuários com o mesmo email
2. **Colaborador único**: Um usuário não pode ser colaborador de múltiplas revendas simultaneamente
3. **Permissões obrigatórias**: Pelo menos uma permissão de "visualizar" deve ser concedida

---

## 🧪 Testes Recomendados

1. Criar colaborador admin com todas as permissões
2. Criar colaborador admin com permissões limitadas
3. Criar colaborador revenda com permissões específicas
4. Verificar que colaborador não vê funcionalidades sem permissão
5. Verificar que colaborador não pode acessar rotas sem permissão
6. Testar edição de permissões
7. Testar desativação/ativação de colaborador
8. Testar remoção de colaborador
9. Verificar que credenciais são copiadas corretamente
10. Verificar RLS em todas as tabelas relacionadas

---

## 📚 Documentação Relacionada

- [Gestão de Usuários](./GESTAO_CLIENTES.md)
- [Gestão de Revendas](./GESTAO_REVENDAS.md)
- [Autenticação](./SUPABASE_INTEGRACAO.md)
- [Segurança e RLS](./SEGURANCA_RLS.md)

---

**Última atualização**: 2025-01-15  
**Versão**: 1.0

