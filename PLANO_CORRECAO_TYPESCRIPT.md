# 📋 Plano de Correção de Erros TypeScript

## 🎯 Objetivo
Corrigir todos os erros de TypeScript para permitir deploy na Vercel.

## ✅ Status Atual
- ✅ `package.json` já está correto localmente (`build: vite build`)
- ⚠️ Git ainda tem versão antiga - precisa commitar
- ❌ ~200+ erros de TypeScript bloqueando deploy

## 🔥 Prioridade 1: Correções Críticas (Bloqueiam Deploy)

### 1.1. Confirmar package.json no Git
- [x] Local já está correto
- [ ] Commitar mudança

### 1.2. Adicionar prop `disabled` ao SelectMenu
**Arquivos afetados:**
- `src/components/ui/select-menu.tsx` (adicionar prop)
- `src/components/admin/FiltrosRevendaUnidade.tsx` (2 usos)
- `src/components/admin/SeletorRevendaAdmin.tsx` (1 uso)
- `src/pages/admin/Revendas.tsx` (1 uso)
- `src/pages/revenda/Financeiro.tsx` (1 uso)

### 1.3. Corrigir import.meta.env
**Arquivos afetados:** ~15 arquivos
- Verificar se `src/env.d.ts` está sendo reconhecido
- Garantir que `tsconfig.json` inclui os tipos

### 1.4. Adicionar campos à interface RevendaCompleta
**Arquivo:** `src/lib/gerenciarRevenda.ts`
- Adicionar `nome_publico?: string | null`
- Adicionar `logo_url?: string | null`

### 1.5. Corrigir getSession pattern
**Arquivos afetados:**
- `src/lib/gerenciarCarrinho.ts` (3 usos)
- Padrão correto: `const { data: { session } } = await supabase.auth.getSession()`

### 1.6. Exportar tipo Parcela
**Arquivo:** `src/lib/gerenciarPedidos.ts`
- Exportar `export type Parcela = ...`

## 🔶 Prioridade 2: Correções Importantes

### 2.1. Corrigir props de componentes
- `Dropdown`: adicionar prop `isOpen` ou remover uso
- `DateRangePicker`: adicionar prop `startDate` ou ajustar uso

### 2.2. Corrigir variáveis não declaradas
- `setRevendaFiltro` em `src/pages/admin/Pedidos.tsx`
- `setMarcasSelecionadas` em `src/pages/revenda/GerenciarConta.tsx`
- `setAtualizandoItem` em `src/pages/cliente/Checkout.tsx`
- `setDropdownCalendarioAberto` em vários arquivos
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` em `src/pages/admin/Clientes.tsx`
- `navigate` em `src/pages/admin/Clientes.tsx`

### 2.3. Corrigir tipos incompatíveis
- `undefined` vs `null` em vários lugares
- `boolean | null` vs `boolean | undefined`
- Tipos de `TransacaoLiberada` (adicionar `status`, `repasse_id`)

## 🔷 Prioridade 3: Limpeza (Não Bloqueiam Deploy)

### 3.1. Remover imports não utilizados
- ~100+ erros TS6133, TS6192
- Pode ser feito gradualmente

### 3.2. Corrigir tipos opcionais
- `percent` possibly undefined em ChartPieLabeled
- Outros tipos opcionais

## 📝 Ordem de Execução

1. ✅ Confirmar package.json
2. 🔄 Adicionar prop `disabled` ao SelectMenu
3. 🔄 Corrigir import.meta.env
4. 🔄 Adicionar campos à RevendaCompleta
5. 🔄 Corrigir getSession pattern
6. 🔄 Exportar Parcela
7. 🔄 Corrigir props de componentes
8. 🔄 Corrigir variáveis não declaradas
9. 🔄 Corrigir tipos incompatíveis
10. 🔄 Limpeza de imports não utilizados

