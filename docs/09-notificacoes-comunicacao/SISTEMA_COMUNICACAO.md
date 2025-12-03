# 📢 Sistema de Comunicação

## 📋 Visão Geral

Sistema completo de comunicação administrativa para envio de notificações push e banners de alerta para revendas, clientes e colaboradores. Permite que administradores criem, gerenciem e programem mensagens importantes que aparecem diretamente na interface dos usuários.

---

## 🎯 Funcionalidades Implementadas

### 1. **Notificações Push**

#### 1.1. Características
- ✅ Aparecem no canto inferior direito da tela
- ✅ Exibidas apenas uma vez por usuário (não reaparecem após fechadas)
- ✅ Persistência em localStorage para garantir que não reapareçam
- ✅ Design moderno e discreto
- ✅ Animação suave de entrada
- ✅ Botão de fechar (X) no canto superior direito

#### 1.2. Gerenciamento (Admin)
- ✅ Criar novas notificações push
- ✅ Editar notificações existentes
- ✅ Ativar/desativar notificações
- ✅ Definir público-alvo (revendas, clientes, colaboradores)
- ✅ Agendar período de exibição (data início e fim)
- ✅ Visualizar todas as notificações criadas
- ✅ Remover notificações

#### 1.3. Campos da Notificação
- **Título**: Título curto e objetivo
- **Descrição**: Mensagem detalhada
- **Público-alvo**: 
  - Revendas
  - Clientes
  - Colaboradores
- **Período de exibição**:
  - Data de início (opcional)
  - Data de fim (opcional)

---

### 2. **Banners de Alerta**

#### 2.1. Características
- ✅ Aparecem acima do título da página
- ✅ Dismissíveis (podem ser fechados pelo usuário)
- ✅ Ficam ocultos por 1 hora após serem fechados
- ✅ Cores personalizáveis (background e texto)
- ✅ Design responsivo
- ✅ Animação suave de entrada
- ✅ Botão de fechar (X) no canto superior direito

#### 2.2. Gerenciamento (Admin)
- ✅ Criar novos banners de alerta
- ✅ Editar banners existentes
- ✅ Ativar/desativar banners
- ✅ Personalizar cores (background e texto)
- ✅ Definir público-alvo (revendas, clientes, colaboradores)
- ✅ Agendar período de exibição (data início e fim)
- ✅ Visualizar todos os banners criados
- ✅ Remover banners

#### 2.3. Campos do Banner
- **Título**: Título curto e objetivo
- **Descrição**: Mensagem detalhada
- **Cor de Fundo**: Cor hexadecimal (ex: #f59e0b)
- **Cor do Texto**: Cor hexadecimal (ex: #000000)
- **Público-alvo**: 
  - Revendas
  - Clientes
  - Colaboradores
- **Período de exibição**:
  - Data de início (opcional)
  - Data de fim (opcional)

---

## 🗄️ Estrutura de Banco de Dados

### **Tabela `notificacoes_push`**

```sql
CREATE TABLE public.notificacoes_push (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  criado_por UUID REFERENCES public.usuarios(id),
  desativado_em TIMESTAMPTZ,
  exibir_para_revendas BOOLEAN DEFAULT false NOT NULL,
  exibir_para_clientes BOOLEAN DEFAULT false NOT NULL,
  exibir_para_colaboradores BOOLEAN DEFAULT false NOT NULL,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ
);
```

**Campos:**
- `titulo`: Título da notificação
- `descricao`: Mensagem descritiva
- `ativo`: Se a notificação está ativa
- `criado_por`: ID do admin que criou
- `exibir_para_*`: Flags para definir público-alvo
- `data_inicio`: Data/hora de início da exibição (opcional)
- `data_fim`: Data/hora de fim da exibição (opcional)

---

### **Tabela `banners_alerta`**

```sql
CREATE TABLE public.banners_alerta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  cor_bg VARCHAR(7) NOT NULL DEFAULT '#f59e0b',
  cor_texto VARCHAR(7) NOT NULL DEFAULT '#000000',
  ativo BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  criado_por UUID REFERENCES public.usuarios(id),
  desativado_em TIMESTAMPTZ,
  exibir_para_revendas BOOLEAN DEFAULT false NOT NULL,
  exibir_para_clientes BOOLEAN DEFAULT false NOT NULL,
  exibir_para_colaboradores BOOLEAN DEFAULT false NOT NULL,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ
);
```

**Campos:**
- `titulo`: Título do banner
- `descricao`: Mensagem descritiva
- `cor_bg`: Cor de fundo em hexadecimal
- `cor_texto`: Cor do texto em hexadecimal
- `ativo`: Se o banner está ativo
- `criado_por`: ID do admin que criou
- `exibir_para_*`: Flags para definir público-alvo
- `data_inicio`: Data/hora de início da exibição (opcional)
- `data_fim`: Data/hora de fim da exibição (opcional)

---

## 🔒 Segurança (RLS)

### **Políticas de Acesso:**

1. **Notificações Push:**
   - Admins podem criar, editar, remover e visualizar todas
   - Usuários (revendas, clientes, colaboradores) podem apenas visualizar notificações ativas e direcionadas a eles

2. **Banners de Alerta:**
   - Admins podem criar, editar, remover e visualizar todos
   - Usuários (revendas, clientes, colaboradores) podem apenas visualizar banners ativos e direcionados a eles

### **Validações:**
- Notificações/banners só aparecem se:
  - Estão ativos (`ativo = true`)
  - Estão dentro do período de exibição (se definido)
  - O usuário pertence ao público-alvo selecionado
  - (Para banners) Não foram fechados nas últimas 1 hora

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/comunicacao.ts` - Funções CRUD e lógica de comunicação

### **Componentes:**
- `src/components/comunicacao/NotificacaoPush.tsx` - Componente de exibição de notificações push
- `src/components/comunicacao/BannerAlerta.tsx` - Componente de exibição de banners

### **Páginas:**
- `src/pages/admin/Comunicacao.tsx` - Interface administrativa de gerenciamento

### **Layouts:**
- `src/layouts/UserLayout.tsx` - Integra os componentes de comunicação

---

## 🚀 Como Usar

### **Para Administradores:**

1. **Acessar Sistema de Comunicação:**
   - Menu Admin → Comunicação
   - Rota: `/admin/comunicacao`

2. **Criar Notificação Push:**
   - Aba "Notificações Push"
   - Clique em "Nova Notificação"
   - Preencha título e descrição
   - Selecione público-alvo
   - (Opcional) Defina período de exibição
   - Clique em "Salvar"

3. **Criar Banner de Alerta:**
   - Aba "Banners de Alerta"
   - Clique em "Novo Banner"
   - Preencha título e descrição
   - Escolha cores (background e texto)
   - Selecione público-alvo
   - (Opcional) Defina período de exibição
   - Clique em "Salvar"

4. **Gerenciar Comunicações:**
   - Visualize todas as comunicações criadas
   - Edite clicando no ícone de edição
   - Ative/desative usando o switch
   - Remova clicando no ícone de lixeira

### **Para Usuários (Revendas, Clientes, Colaboradores):**

1. **Notificações Push:**
   - Aparecem automaticamente no canto inferior direito
   - Podem ser fechadas clicando no X
   - Não reaparecem após serem fechadas

2. **Banners de Alerta:**
   - Aparecem automaticamente acima do título da página
   - Podem ser fechados clicando no X
   - Ficam ocultos por 1 hora após serem fechados

---

## 🔄 Fluxos

### **Fluxo de Criação de Notificação Push:**

1. Admin acessa `/admin/comunicacao`
2. Clica em "Nova Notificação" na aba "Notificações Push"
3. Preenche formulário (título, descrição, público-alvo, período)
4. Salva notificação
5. Sistema valida dados e cria registro no banco
6. Notificações aparecem automaticamente para usuários do público-alvo
7. Usuários podem fechar notificações
8. Notificações fechadas não reaparecem (armazenadas em localStorage)

### **Fluxo de Criação de Banner:**

1. Admin acessa `/admin/comunicacao`
2. Clica em "Novo Banner" na aba "Banners de Alerta"
3. Preenche formulário (título, descrição, cores, público-alvo, período)
4. Salva banner
5. Sistema valida dados e cria registro no banco
6. Banners aparecem automaticamente para usuários do público-alvo
7. Usuários podem fechar banners
8. Banners fechados ficam ocultos por 1 hora (armazenados em localStorage)

---

## 💾 Persistência Local

### **Notificações Push:**
- Armazenadas em `localStorage` com chave `notificacoes_push_fechadas`
- Formato: Array de IDs de notificações fechadas
- Persistem entre sessões do navegador

### **Banners de Alerta:**
- Armazenados em `localStorage` com chave `banners_alerta_fechados`
- Formato: Objeto com IDs como chaves e timestamps como valores
- Verificação de 1 hora: `timestamp_fechamento + 3600000 < Date.now()`
- Persistem entre sessões do navegador

---

## 🎨 Design e UX

### **Notificações Push:**
- Posição: Canto inferior direito (fixed)
- Largura máxima: 384px (max-w-sm)
- Espaçamento: 12px entre notificações (space-y-3)
- Animação: `animate-slide-up-in`
- Z-index: 9999 (sempre visível)

### **Banners de Alerta:**
- Posição: Acima do título da página (dentro do layout)
- Largura: 100% do container
- Espaçamento: 8px entre banners (space-y-2)
- Animação: `animate-slide-up-in`
- Cores: Personalizáveis pelo admin

---

## 🔗 Integrações

### **Com Sistema de Roles:**
- Verifica role do usuário para determinar público-alvo
- Revendas: `role = 'revenda'`
- Clientes: `role = 'cliente'`
- Colaboradores: `role` em `colaboradores` table

### **Com Layouts:**
- `UserLayout.tsx` integra ambos os componentes
- Notificações Push: Fixed no bottom-right
- Banners: Dentro do conteúdo principal

---

## ⚠️ Regras de Negócio

1. **Notificações Push:**
   - Exibidas apenas uma vez por usuário
   - Não reaparecem após serem fechadas
   - Respeitam período de exibição (se definido)
   - Respeitam público-alvo selecionado

2. **Banners de Alerta:**
   - Podem ser fechados pelo usuário
   - Ficam ocultos por 1 hora após serem fechados
   - Respeitam período de exibição (se definido)
   - Respeitam público-alvo selecionado

3. **Validações:**
   - Título obrigatório (máx. 255 caracteres)
   - Descrição obrigatória
   - Pelo menos um público-alvo deve ser selecionado
   - Data de fim deve ser posterior à data de início (se ambas definidas)
   - Cores devem ser válidas (formato hexadecimal)

---

## 📊 Impactos em Outras Funcionalidades

### **Impacto no Layout:**
- `UserLayout.tsx` renderiza componentes de comunicação
- Não afeta outros layouts (AdminLayout, ClienteLayout, RevendaLayout)

### **Impacto no Performance:**
- Verificação de notificações/banners a cada 30 segundos
- Uso de localStorage reduz chamadas ao banco
- Filtros otimizados no banco de dados

### **Impacto na Experiência do Usuário:**
- Comunicações importantes sempre visíveis
- Não intrusivas (podem ser fechadas)
- Design consistente com o sistema

---

## 🧪 Testes Recomendados

1. ✅ Criar notificação push e verificar exibição
2. ✅ Fechar notificação e verificar que não reaparece
3. ✅ Criar banner e verificar exibição
4. ✅ Fechar banner e verificar que fica oculto por 1 hora
5. ✅ Testar período de exibição (data início/fim)
6. ✅ Testar público-alvo (revendas, clientes, colaboradores)
7. ✅ Editar comunicação existente
8. ✅ Ativar/desativar comunicação
9. ✅ Remover comunicação
10. ✅ Verificar persistência em localStorage

---

## 📝 Notas Importantes

1. **Notificações Push são "one-time"**: Uma vez fechadas, não reaparecem nunca mais
2. **Banners têm "cooldown"**: Ficam ocultos por 1 hora após serem fechados
3. **Período de exibição**: Se definido, comunicações só aparecem dentro do período
4. **Público-alvo**: Pelo menos um deve ser selecionado
5. **LocalStorage**: Limpar localStorage pode fazer comunicações reaparecerem
6. **Performance**: Verificação a cada 30 segundos garante atualizações sem sobrecarga

---

## 🔧 Manutenção

### **Adicionar Novo Tipo de Comunicação:**

1. Criar tabela no banco de dados
2. Adicionar funções CRUD em `comunicacao.ts`
3. Criar componente de exibição
4. Integrar no layout apropriado
5. Adicionar interface administrativa

### **Modificar Comportamento:**

- Editar componentes em `src/components/comunicacao/`
- Ajustar lógica de persistência em `src/lib/comunicacao.ts`
- Atualizar políticas RLS se necessário

---

## 📚 Referências

- **Biblioteca**: `src/lib/comunicacao.ts`
- **Componentes**: `src/components/comunicacao/`
- **Página Admin**: `src/pages/admin/Comunicacao.tsx`
- **Layout**: `src/layouts/UserLayout.tsx`

---

**Status**: ✅ Implementado e Funcional  
**Última atualização**: 2025-01-27  
**Versão**: 1.0

