# 🚀 Guia de Deploy - Correções TypeScript

## ✅ O Que Já Foi Corrigido

### Correções Críticas Implementadas:
1. ✅ **SelectMenu** - Prop `disabled` adicionada
2. ✅ **RevendaCompleta** - Campos `nome_publico` e `logo_url` adicionados
3. ✅ **getSession** - Pattern corrigido em `gerenciarCarrinho.ts`
4. ✅ **Parcela** - Tipo re-exportado de `gerenciarPedidos.ts`
5. ✅ **env.d.ts** - Criado e configurado para Vite

### Arquivos Modificados:
- `src/components/ui/select-menu.tsx`
- `src/lib/gerenciarCarrinho.ts`
- `src/lib/gerenciarPedidos.ts`
- `src/lib/gerenciarRevenda.ts`
- `tsconfig.json`
- `src/env.d.ts` (novo)

## ⚠️ Status Atual

- **package.json:** ✅ Correto no Git (`build: vite build`)
- **Erros restantes:** ~487 (muitos são imports não utilizados)
- **Deploy:** Pode estar usando cache - tentar novo deploy

## 🔥 Próximas Correções Críticas (Ordem de Prioridade)

### 1. Variáveis Não Declaradas (Bloqueiam Compilação)

#### `src/pages/admin/Pedidos.tsx`
- Adicionar: `const [revendaFiltro, setRevendaFiltro] = useState<string>('')`
- Adicionar: `const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)`

#### `src/pages/revenda/GerenciarConta.tsx`
- Adicionar: `const [marcasSelecionadas, setMarcasSelecionadas] = useState<string[]>([])`
- Adicionar: `const [marcaOutrosTexto, setMarcaOutrosTexto] = useState<string>('')`

#### `src/pages/cliente/Checkout.tsx`
- Adicionar: `const [atualizandoItem, setAtualizandoItem] = useState<string | null>(null)`

#### `src/pages/admin/Clientes.tsx`
- Importar: `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'`
- Adicionar: `const navigate = useNavigate()`

### 2. Props de Componentes

#### `Dropdown` - Prop `isOpen`
**Arquivos:** `src/pages/revenda/Agendamentos.tsx`, `src/pages/revenda/Clientes.tsx`
**Solução:** Trocar `isOpen` por `aberto` ou adicionar prop na interface

#### `DateRangePicker` - Prop `startDate`
**Arquivos:** `src/pages/revenda/Agendamentos.tsx`, `src/pages/revenda/Clientes.tsx`
**Solução:** Verificar interface e ajustar props ou remover uso

### 3. Tipos Incompatíveis

#### `TransacaoLiberada` - Adicionar campos
**Arquivo:** `src/lib/financeiro.ts`
- Adicionar: `status?: string`
- Adicionar: `repasse_id?: string | null`

#### `undefined` vs `null`
- Normalizar tipos usando `?? null` ou `?? undefined`
- Ajustar interfaces para refletir realidade

## 📋 Checklist de Deploy

- [x] package.json correto
- [x] Correções críticas principais
- [ ] Variáveis não declaradas corrigidas
- [ ] Props de componentes corrigidas
- [ ] Tipos incompatíveis corrigidos
- [ ] Commitar mudanças
- [ ] Fazer novo deploy na Vercel

## 🛠️ Comandos

```bash
# Ver erros restantes
npm run type-check 2>&1 | grep "error TS" | wc -l

# Build para verificar
npm run build

# Commitar correções
git add .
git commit -m "fix: corrigir erros críticos de TypeScript"
git push
```

## 💡 Estratégia Recomendada

1. **Agora:** Commitar as correções já feitas
2. **Depois:** Corrigir variáveis não declaradas (rápido, resolve muitos erros)
3. **Em seguida:** Corrigir props de componentes
4. **Por último:** Limpeza de imports não utilizados (pode ser gradual)

## 📝 Notas

- Muitos erros são de imports não utilizados (TS6133) - não bloqueiam funcionalidade
- Focar primeiro nos erros que bloqueiam compilação
- Deploy pode funcionar mesmo com alguns warnings de TypeScript se o build passar

