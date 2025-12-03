# 🔔 Sistema de Notificações em Tempo Real

## 📋 Visão Geral

Sistema completo de notificações em tempo real para Revendas e Clientes, cobrindo todas as movimentações do sistema: pedidos, status, parcelamentos, parcelas abertas e atrasadas, agendamentos e repasses.

---

## 🎯 Funcionalidades

### 1. **Notificações Automáticas**
- ✅ **Novos Pedidos**: Revenda recebe notificação quando cliente faz pedido
- ✅ **Status de Pedidos**: Cliente recebe notificação quando status do pedido muda
- ✅ **Novos Parcelamentos**: Cliente recebe notificação quando pedido é parcelado
- ✅ **Parcelas Abertas**: Cliente recebe notificação quando parcela está próxima do vencimento (7 dias)
- ✅ **Parcelas Atrasadas**: Cliente e Revenda recebem notificação quando parcela está atrasada
- ✅ **Agendamentos**: Revenda recebe notificação quando cliente agenda entrega
- ✅ **Repasses**: (Preparado para futuras implementações)

### 2. **Tempo Real**
- ✅ Notificações aparecem instantaneamente usando Supabase Realtime
- ✅ Badge com contador de não lidas atualiza automaticamente
- ✅ Som de notificação quando nova notificação chega (respeitando preferências)

### 3. **Gerenciamento**
- ✅ Visualizar todas as notificações ou apenas não lidas
- ✅ Marcar como lida individual ou todas de uma vez
- ✅ Deletar notificações individuais
- ✅ Limpar todas as notificações lidas
- ✅ Configurar preferências por tipo de notificação
- ✅ Habilitar/desabilitar som de notificações

### 4. **Interface**
- ✅ Badge na barra superior com contador de não lidas
- ✅ Dropdown com preview das últimas 5 notificações
- ✅ Página completa de gerenciamento (`/notificacoes`)
- ✅ Links diretos para páginas relacionadas

---

## 🗄️ Estrutura de Banco de Dados

### **Tabela `notificacoes`**

```sql
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN DEFAULT false NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  lida_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Campos:**
- `usuario_id`: ID do usuário que recebe a notificação (referencia `usuarios.id`)
- `tipo`: Tipo da notificação (novo_pedido, status_pedido, etc.)
- `titulo`: Título da notificação
- `mensagem`: Mensagem descritiva
- `link`: Link para página relacionada (opcional)
- `lida`: Se a notificação foi lida
- `metadata`: Dados adicionais em JSON

**Índices:**
- `idx_notificacoes_usuario_id`: Busca rápida por usuário
- `idx_notificacoes_lida`: Busca rápida de não lidas
- `idx_notificacoes_tipo`: Busca por tipo
- `idx_notificacoes_criado_em`: Ordenação por data

### **Tabela `preferencias_notificacoes`**

```sql
CREATE TABLE public.preferencias_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  receber_notificacoes BOOLEAN DEFAULT true NOT NULL,
  receber_pedidos BOOLEAN DEFAULT true NOT NULL,
  receber_status_pedidos BOOLEAN DEFAULT true NOT NULL,
  receber_parcelamentos BOOLEAN DEFAULT true NOT NULL,
  receber_parcelas_abertas BOOLEAN DEFAULT true NOT NULL,
  receber_parcelas_atrasadas BOOLEAN DEFAULT true NOT NULL,
  receber_agendamentos BOOLEAN DEFAULT true NOT NULL,
  receber_repasses BOOLEAN DEFAULT true NOT NULL,
  som_notificacoes BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `receber_notificacoes`: Master switch para todas as notificações
- `receber_*`: Preferências específicas por tipo
- `som_notificacoes`: Se deve tocar som quando notificação chega

---

## ⚙️ Triggers Automáticos

### **1. Novo Pedido (Revenda)**
```sql
CREATE TRIGGER trigger_novo_pedido
AFTER INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_novo_pedido();
```

**Quando dispara**: Quando um novo pedido é criado
**Quem recebe**: Revenda do pedido

### **2. Status de Pedido (Cliente)**
```sql
CREATE TRIGGER trigger_status_pedido
AFTER UPDATE OF status ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_status_pedido();
```

**Quando dispara**: Quando status do pedido muda
**Quem recebe**: Cliente do pedido

### **3. Novo Parcelamento (Cliente)**
```sql
CREATE TRIGGER trigger_novo_parcelamento
AFTER INSERT ON public.parcelamentos
FOR EACH ROW
EXECUTE FUNCTION public.notificar_novo_parcelamento();
```

**Quando dispara**: Quando um parcelamento é criado
**Quem recebe**: Cliente do pedido

### **4. Parcela Aberta (Cliente)**
```sql
CREATE TRIGGER trigger_parcela_aberta
AFTER INSERT OR UPDATE ON public.parcelas
FOR EACH ROW
EXECUTE FUNCTION public.notificar_parcela_aberta();
```

**Quando dispara**: Quando parcela está próxima do vencimento (0-7 dias)
**Quem recebe**: Cliente

### **5. Parcela Atrasada (Cliente e Revenda)**
```sql
CREATE TRIGGER trigger_parcela_atrasada
AFTER INSERT OR UPDATE ON public.parcelas
FOR EACH ROW
EXECUTE FUNCTION public.notificar_parcela_atrasada();
```

**Quando dispara**: Quando parcela fica atrasada
**Quem recebe**: Cliente e Revenda

### **6. Agendamento (Revenda)**
```sql
CREATE TRIGGER trigger_agendamento
AFTER INSERT ON public.agendamentos_entrega
FOR EACH ROW
EXECUTE FUNCTION public.notificar_agendamento();
```

**Quando dispara**: Quando cliente agenda entrega
**Quem recebe**: Revenda

---

## 🔒 Segurança (RLS)

### **Políticas de Acesso:**

1. **Notificações**
   - Usuários podem ver apenas suas próprias notificações
   - Usuários podem atualizar apenas suas próprias notificações
   - Usuários podem deletar apenas suas próprias notificações

2. **Preferências**
   - Usuários podem ver e atualizar apenas suas próprias preferências
   - Preferências são criadas automaticamente quando necessário

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/gerenciarNotificacoes.ts` - Funções de gerenciamento de notificações

### **Componentes:**
- `src/components/notificacoes/BadgeNotificacoes.tsx` - Badge na barra superior

### **Páginas:**
- `src/pages/Notificacoes.tsx` - Página de gerenciamento completa

### **Migrations:**
- `supabase/migrations/065_create_sistema_notificacoes.sql` - Criação completa do sistema

---

## 🚀 Como Usar

### **Para Usuários:**

1. **Ver Notificações**:
   - Clique no ícone de sino na barra superior
   - Veja preview das últimas 5 notificações
   - Clique em "Ver todas as notificações" para página completa

2. **Gerenciar Notificações**:
   - Acesse `/notificacoes` ou clique em "Configurar" no dropdown
   - Filtre por "Todas" ou "Não lidas"
   - Marque como lida, delete ou limpe notificações lidas

3. **Configurar Preferências**:
   - Na página de notificações, ajuste os switches no card "Preferências"
   - Desabilite tipos de notificações que não quer receber
   - Controle se quer som de notificações

### **Para Desenvolvedores:**

#### **Criar Notificação Manualmente:**

```typescript
import { criarNotificacao } from '@/lib/gerenciarNotificacoes'

// Via RPC (respeita preferências automaticamente)
const { data, error } = await supabase.rpc('criar_notificacao', {
  p_usuario_id: usuarioId,
  p_tipo: 'novo_pedido',
  p_titulo: 'Novo Pedido',
  p_mensagem: 'Você recebeu um novo pedido',
  p_link: '/revenda/pedidos/123',
  p_metadata: { pedido_id: '123' }
})
```

#### **Escutar Notificações em Tempo Real:**

```typescript
import { supabase } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

const session = await obterSessao()
const channel = supabase
  .channel(`notificacoes:${session.user.id}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'notificacoes',
      filter: `usuario_id=eq.${session.user.id}`,
    },
    (payload) => {
      console.log('Nova notificação:', payload)
    }
  )
  .subscribe()
```

---

## 🔊 Sistema de Sons

### **Implementação:**

O sistema usa Web Audio API para tocar um som suave quando uma nova notificação chega.

**Características:**
- Frequência: 800 Hz (nota musical suave)
- Tipo de onda: Senoidal (som suave)
- Duração: 300ms
- Volume: 30% (discreto)

**Respeita Preferências:**
- Som só toca se `som_notificacoes = true` nas preferências do usuário
- Preferência pode ser alterada na página de notificações

---

## 📊 Tipos de Notificações

| Tipo | Quem Recebe | Quando Dispara | Link Padrão |
|------|-------------|----------------|-------------|
| `novo_pedido` | Revenda | Novo pedido criado | `/revenda/pedidos/{pedido_id}` |
| `status_pedido` | Cliente | Status do pedido muda | `/cliente/compras/{pedido_id}` |
| `novo_parcelamento` | Cliente | Parcelamento criado | `/cliente/compras` |
| `parcela_aberta` | Cliente | Parcela próxima do vencimento (0-7 dias) | `/cliente/compras` |
| `parcela_atrasada` | Cliente + Revenda | Parcela fica atrasada | `/cliente/compras` ou `/revenda/parcelamentos` |
| `agendamento` | Revenda | Cliente agenda entrega | `/revenda/agendamentos` |
| `repasse` | Revenda | (Preparado para futuro) | `/revenda/financeiro` |

---

## 🔄 Fluxos

### **Fluxo de Criação Automática:**

1. Evento ocorre no sistema (ex: novo pedido)
2. Trigger detecta o evento
3. Função `criar_notificacao` é chamada
4. Sistema verifica preferências do usuário
5. Se usuário quer receber, notificação é criada
6. Realtime envia atualização para cliente conectado
7. Badge atualiza automaticamente
8. Som toca (se habilitado)

### **Fluxo de Visualização:**

1. Usuário clica no badge de notificações
2. Dropdown mostra últimas 5 notificações
3. Usuário pode:
   - Clicar na notificação para ir ao link
   - Marcar como lida
   - Deletar
   - Ir para página completa

### **Fluxo de Gerenciamento:**

1. Usuário acessa `/notificacoes`
2. Vê todas as notificações (filtradas ou não)
3. Pode marcar como lida, deletar ou limpar lidas
4. Pode configurar preferências por tipo
5. Mudanças são salvas automaticamente

---

## 🧪 Testes Recomendados

1. ✅ Criar pedido e verificar notificação na revenda
2. ✅ Mudar status de pedido e verificar notificação no cliente
3. ✅ Criar parcelamento e verificar notificação
4. ✅ Criar parcela próxima do vencimento e verificar notificação
5. ✅ Criar parcela atrasada e verificar notificações (cliente e revenda)
6. ✅ Agendar entrega e verificar notificação na revenda
7. ✅ Marcar notificação como lida
8. ✅ Deletar notificação
9. ✅ Limpar notificações lidas
10. ✅ Configurar preferências e verificar que notificações respeitam
11. ✅ Desabilitar som e verificar que não toca
12. ✅ Verificar Realtime funcionando (notificações aparecem instantaneamente)

---

## ⚠️ Validações

### **Preferências:**
- Se `receber_notificacoes = false`, nenhuma notificação é criada
- Se tipo específico está desabilitado, notificação daquele tipo não é criada
- Preferências são criadas automaticamente com padrões se não existirem

### **RLS:**
- Usuários só veem suas próprias notificações
- Usuários só podem atualizar/deletar suas próprias notificações
- Preferências são privadas por usuário

---

## 📝 Notas Importantes

1. **Realtime**: Requer conexão ativa com Supabase. Notificações aparecem instantaneamente quando usuário está online.

2. **Performance**: Índices garantem busca rápida mesmo com muitas notificações.

3. **Limpeza**: Notificações são deletadas automaticamente quando usuário é excluído (ON DELETE CASCADE).

4. **Som**: Usa Web Audio API, pode não funcionar em alguns navegadores ou se usuário bloqueou áudio.

5. **Preferências**: São criadas automaticamente na primeira notificação se não existirem.

6. **Triggers**: Todos os triggers são `SECURITY DEFINER` para garantir permissões adequadas.

---

## 🔧 Manutenção

### **Adicionar Novo Tipo de Notificação:**

1. Adicionar tipo em `TipoNotificacao` em `gerenciarNotificacoes.ts`
2. Adicionar campo de preferência em `preferencias_notificacoes` (se necessário)
3. Adicionar case na função `criar_notificacao` no banco
4. Criar trigger ou chamar função manualmente onde necessário

### **Modificar Mensagens:**

Edite as funções de trigger no banco de dados para alterar títulos e mensagens.

---

## 📚 Referências

- **Migration**: `supabase/migrations/065_create_sistema_notificacoes.sql`
- **Biblioteca**: `src/lib/gerenciarNotificacoes.ts`
- **Componente**: `src/components/notificacoes/BadgeNotificacoes.tsx`
- **Página**: `src/pages/Notificacoes.tsx`














