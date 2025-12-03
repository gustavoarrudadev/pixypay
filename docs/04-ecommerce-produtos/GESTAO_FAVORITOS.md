# Meus Favoritos - Cliente

## 📋 Visão Geral

Esta funcionalidade permite que clientes gerenciem suas lojas favoritas. Clientes podem adicionar lojas (revendas) aos favoritos diretamente na loja pública e acessá-las rapidamente através da página "Meus Favoritos".

**Status**: ✅ **IMPLEMENTADO** (Fase 1 - Favoritar Lojas) | 🚧 **EM PLANEJAMENTO** (Fase 2 - Favoritar Produtos)

---

## ✅ Funcionalidades Implementadas (Fase 1 - Lojas)

### 1. Favoritar/Desfavoritar Loja na Loja Pública
- **Localização**: `src/pages/publica/LojaPublica.tsx`
- **Funcionalidades**:
  - Botão de favorito no cabeçalho da loja pública
  - Indicador visual quando loja está favoritada (ícone preenchido)
  - Adicionar loja aos favoritos com um clique
  - Remover loja dos favoritos com um clique
  - Feedback visual com toast notifications
- **Requisitos**:
  - Cliente deve estar logado
  - Apenas clientes podem favoritar lojas

### 2. Listagem de Lojas Favoritas
- **Localização**: `src/pages/cliente/MeusFavoritos.tsx`
- **Funcionalidades**:
  - Grid responsivo de lojas favoritas
  - Exibição de logo, nome e descrição da loja
  - Botão para visitar loja (abre em nova aba)
  - Botão para remover dos favoritos
  - Confirmação antes de remover
  - Estado vazio quando não há favoritos

### 3. Avatar e Menu no Cabeçalho da Loja Pública
- **Localização**: `src/pages/publica/LojaPublica.tsx`
- **Funcionalidades**:
  - Se cliente não está logado: mostra botão "Entrar"
  - Se cliente está logado: mostra avatar com nome e email
  - Dropdown menu com opções:
    - Meu Perfil
    - Minha Conta
    - Sair
  - Botão de favoritar ao lado do avatar

---

## 🗄️ Estrutura de Banco de Dados

### Tabela `lojas_favoritas` (IMPLEMENTADA)

```sql
CREATE TABLE IF NOT EXISTS public.lojas_favoritas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES public.revendas(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cliente_id, revenda_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_cliente_id ON public.lojas_favoritas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_lojas_favoritas_revenda_id ON public.lojas_favoritas(revenda_id);

-- Habilitar RLS
ALTER TABLE public.lojas_favoritas ENABLE ROW LEVEL SECURITY;

-- Política: Clientes podem ver apenas seus favoritos
CREATE POLICY "Clientes podem ver seus favoritos"
ON public.lojas_favoritas FOR SELECT
USING (auth.uid() = cliente_id);

-- Política: Clientes podem criar favoritos apenas para si mesmos
CREATE POLICY "Clientes podem criar favoritos"
ON public.lojas_favoritas FOR INSERT
WITH CHECK (auth.uid() = cliente_id);

-- Política: Clientes podem excluir apenas seus favoritos
CREATE POLICY "Clientes podem excluir favoritos"
ON public.lojas_favoritas FOR DELETE
USING (auth.uid() = cliente_id);
```

**Migration**: `supabase/migrations/017_create_lojas_favoritas_table.sql` (a ser criada)

---

## 📁 Estrutura de Arquivos

### Bibliotecas:
- ✅ `src/lib/favoritosLojas.ts` - Funções CRUD de favoritos de lojas
  - `verificarLojaFavorita()` - Verifica se loja está favoritada
  - `adicionarLojaFavorita()` - Adiciona loja aos favoritos
  - `removerLojaFavorita()` - Remove loja dos favoritos
  - `listarLojasFavoritas()` - Lista todas as lojas favoritas do cliente
  - `toggleLojaFavorita()` - Alterna status de favorito

### Componentes:
- ✅ `src/components/ui/DialogoConfirmacao.tsx` - Dialog de confirmação (atualizado)

### Páginas:
- ✅ `src/pages/cliente/MeusFavoritos.tsx` - Página principal (atualizada)
- ✅ `src/pages/publica/LojaPublica.tsx` - Loja pública com botão de favoritar (atualizada)

---

## 🔒 Segurança (RLS)

### Políticas de Acesso:
1. **Clientes podem ver apenas seus favoritos**
   - Consulta apenas favoritos onde `cliente_id` corresponde ao usuário logado

2. **Clientes podem criar favoritos apenas para si mesmos**
   - Validação no INSERT garante que `cliente_id` seja do próprio cliente

3. **Clientes podem excluir apenas seus favoritos**
   - Validação garante propriedade

4. **Acesso público não permitido**
   - Apenas usuários autenticados podem acessar favoritos

---

## 🚀 Fluxos Implementados

### Fluxo de Adicionar Favorito:
1. Cliente acessa loja pública (logado)
2. Cliente visualiza botão de favorito no cabeçalho
3. Cliente clica no botão de favorito
4. Sistema verifica se já está favoritada
5. Sistema adiciona loja aos favoritos
6. Botão muda para estado "favoritado" (preenchido)
7. Toast de confirmação é exibido

### Fluxo de Remover Favorito:
1. Cliente acessa loja pública (logado)
2. Cliente visualiza botão de favorito preenchido
3. Cliente clica no botão de favorito
4. Sistema remove loja dos favoritos
5. Botão muda para estado "não favoritado"
6. Toast de confirmação é exibido

### Fluxo de Visualizar Favoritos:
1. Cliente acessa "Meus Favoritos"
2. Sistema carrega lojas favoritas do cliente
3. Lojas são exibidas em grid responsivo
4. Cliente pode:
   - Visitar loja (abre em nova aba)
   - Remover dos favoritos (com confirmação)

---

## 🔗 Relacionamentos

- **Loja Favorita → Cliente**: Muitos para Um (N:1)
- **Loja Favorita → Revenda**: Muitos para Um (N:1)

---

## 🚧 Funcionalidades Planejadas (Fase 2 - Produtos)

### 1. Favoritar Produtos
- Adicionar produtos individuais aos favoritos
- Organização por categorias
- Notificações sobre produtos favoritos

### 2. Tabela `favoritos` (a ser criada)
- Para produtos favoritos (diferente de lojas favoritas)
- Campos: cliente_id, produto_id, categoria, notificacoes

### 3. Tabela `categorias_favoritos` (a ser criada)
- Para organizar produtos favoritos em categorias

---

## 📚 Referências

- Página: `src/pages/cliente/MeusFavoritos.tsx`
- Biblioteca: `src/lib/favoritosLojas.ts`
- Loja Pública: `src/pages/publica/LojaPublica.tsx`
- Componente: `src/components/ui/DialogoConfirmacao.tsx`

---

## 🔧 Como Aplicar a Migration

### Via Supabase Dashboard:

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **"New query"**
5. Execute o SQL da tabela `lojas_favoritas` (veja seção "Estrutura de Banco de Dados")
6. Clique em **"Run"**

---

**Status**: ✅ **Fase 1 Implementada** | 🚧 **Fase 2 em Planejamento**  
**Última atualização**: 2025-01-07  
**Versão**: 1.0

