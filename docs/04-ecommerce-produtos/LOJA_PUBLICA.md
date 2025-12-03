# 🏪 Loja Pública - Sistema de Vitrine Online

## 📋 Visão Geral

Sistema de loja pública onde revendas podem exibir seus produtos para clientes através de um link único e personalizado. A loja pública é acessível sem autenticação e exibe apenas produtos ativos.

---

## 🎯 Funcionalidades

### 1. **Link Público Único**
- ✅ Cada revenda possui um link único (slug)
- ✅ Formato: `/loja/{link-publico}`
- ✅ Validação de unicidade no banco
- ✅ Geração automática de sugestão baseada no nome da revenda
- ✅ Ativação/desativação do link público (controle de visibilidade)
- ✅ Status visual Online/Offline com ícone pulsante
- ✅ Agendamento automático de ativação/desativação

### 2. **Personalização da Presença**
- ✅ Upload de logo da revenda
- ✅ Nome público personalizado
- ✅ Descrição da loja
- ✅ Taxa de entrega configurável
- ✅ Opções de entrega personalizáveis (entrega, retirada, agendamento)
- ✅ Preview em tempo real

### 3. **Galeria de Produtos**
- ✅ Grid responsivo de produtos ativos
- ✅ Cards com imagem, nome, descrição e preço
- ✅ Botão "Comprar" em cada produto
- ✅ Design público (sem sidebar, sem autenticação)

---

## 🗄️ Estrutura de Banco de Dados

### **Campos Adicionados em `revendas`:**

```sql
ALTER TABLE revendas ADD COLUMN link_publico VARCHAR(100) UNIQUE;
ALTER TABLE revendas ADD COLUMN nome_publico VARCHAR(255);
ALTER TABLE revendas ADD COLUMN descricao_loja TEXT;
ALTER TABLE revendas ADD COLUMN logo_url TEXT;
ALTER TABLE revendas ADD COLUMN link_publico_ativo BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE revendas ADD COLUMN taxa_entrega DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE revendas ADD COLUMN oferecer_entrega BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE revendas ADD COLUMN oferecer_retirada_local BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE revendas ADD COLUMN oferecer_agendamento BOOLEAN DEFAULT true NOT NULL;
```

**Campos:**
- `link_publico`: Slug único para acesso (ex: "revenda-exemplo")
- `nome_publico`: Nome que aparece na loja (opcional, usa `nome_revenda` se vazio)
- `descricao_loja`: Descrição da loja que aparece na loja pública
- `logo_url`: URL da logo no Supabase Storage
- `link_publico_ativo`: Indica se o link público está ativo e visível (padrão: true)
- `taxa_entrega`: Taxa de entrega cobrada quando cliente escolhe receber no endereço (padrão: 0.00)
- `oferecer_entrega`: Se revenda oferece opção de entrega no endereço (padrão: true)
- `oferecer_retirada_local`: Se revenda oferece opção de retirada no local (padrão: true)
- `oferecer_agendamento`: Se revenda oferece opção de agendamento de entrega (padrão: true, requer `oferecer_entrega = true`)

**Índices:**
- `idx_revendas_link_publico`: Índice único para busca rápida

---

## 🔒 Segurança (RLS)

### **Políticas de Acesso:**

1. **Dados de presença são públicos**
   - Permite leitura de `link_publico`, `nome_publico` e `logo_url` sem autenticação
   - Necessário para a loja pública funcionar

2. **Revendas podem atualizar apenas seus próprios campos**
   - Validação garante que `user_id` corresponde ao usuário logado
   - Validação de unicidade do `link_publico`

3. **Produtos ativos são públicos**
   - Política na tabela `produtos` permite leitura de produtos com `ativo = true`
   - Sem autenticação necessária

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/lojaPublica.ts` - Funções da loja pública
- `src/lib/gerenciarPresenca.ts` - Gerenciamento de presença
- `src/lib/storage.ts` - Upload de logos

### **Páginas:**
- `src/pages/publica/LojaPublica.tsx` - Loja pública acessível por link
- `src/pages/revenda/Dashboard.tsx` - Gerenciamento de link público
- `src/pages/revenda/PresencaLoja.tsx` - Configuração de presença

---

## 🚀 Como Usar

### **Configurar Link Público:**

1. Acesse **Dashboard** no menu lateral
2. No card "Link Público da Loja":
   - Digite um slug único (ex: "revenda-exemplo")
   - Ou clique em **"Gerar Sugestão"** para gerar automaticamente
3. Sistema valida unicidade em tempo real
4. Clique em **"Salvar Link"**
5. Use **"Copiar Link"** para compartilhar

### **Ativar/Desativar Link Público:**

1. Após configurar o link público, aparecerá o componente de **Status da Loja** no topo
2. **Status Visual**: 
   - Ícone pulsante verde = Online
   - Ícone pulsante vermelho = Offline
   - Texto "Online" ou "Offline" ao lado do ícone
3. **Switch**: Ativa/desativa manualmente a loja
4. **Botão "Agendar"**: Abre modal para configurar agendamento automático

### **Agendar Ativação/Desativação Automática:**

1. Clique no botão **"Agendar"** ao lado do switch
2. Configure:
   - **Repetir**: Todos os dias, Dias da semana, ou Apenas uma vez
   - **Dias da semana**: Selecione os dias (apenas para "Dias da semana")
   - **Data de Início**: Quando o agendamento começa
   - **Data de Fim**: Quando termina (opcional)
   - **Horários**: Hora de ativação e desativação
3. Clique em **"Salvar Agendamento"**
4. Agendamentos aparecem em uma lista abaixo, com toggle para ativar/desativar cada um
5. A loja será ativada/desativada automaticamente conforme os agendamentos configurados

### **Personalizar Presença:**

1. Acesse **Presença na Loja** no menu lateral
2. **Upload de Logo:**
   - Clique na área de upload
   - Selecione imagem (JPG, PNG, WEBP, máx. 5MB)
   - Preview aparece automaticamente
3. **Nome Público:**
   - Digite o nome que aparecerá na loja
   - Se deixar vazio, usa o nome da revenda
4. **Descrição da Loja:**
   - Digite uma descrição que aparecerá abaixo do nome na loja pública
5. **Taxa de Entrega:**
   - Configure o valor da taxa de entrega (R$)
   - Deixe 0.00 para não cobrar taxa
6. **Opções de Entrega:**
   - **Oferecer Entrega no Endereço**: Habilita opção de entrega no checkout
   - **Oferecer Retirada no Local**: Habilita opção de retirada no checkout
   - **Oferecer Agendamento de Entrega**: Habilita opção de agendamento (requer entrega habilitada)
   - ⚠️ Pelo menos uma opção deve estar habilitada
7. Clique em **"Salvar Alterações"**

### **Acessar Loja Pública:**

1. Use o link completo: `https://app.pixypay.com/loja/{link-publico}`
2. Ou clique em **"Visualizar Loja"** no Dashboard
3. Loja abre em nova aba

---

## 🔗 Formato do Link

### **Estrutura:**
```
https://app.pixypay.com/loja/{link-publico}
```

### **Exemplo:**
```
https://app.pixypay.com/loja/revenda-exemplo
```

### **Validação do Link:**
- Apenas letras minúsculas
- Números permitidos
- Hífens permitidos
- Mínimo 3 caracteres
- Máximo 50 caracteres
- Regex: `/^[a-z0-9-]{3,50}$/`

---

## 📸 Upload de Logo

### **Especificações:**
- **Tipos permitidos**: JPG, PNG, WEBP
- **Tamanho máximo**: 5MB
- **Recomendado**: Imagem quadrada (ex: 512x512px)
- **Estrutura no Storage**: `logos-revendas/{revenda_id}/logo.{ext}`

### **Processo:**
1. Usuário seleciona arquivo
2. Sistema valida tipo e tamanho
3. Upload para Supabase Storage
4. Logo anterior é deletada (se existir)
5. URL pública é retornada
6. URL é salva no campo `logo_url`

---

## 🎨 Interface da Loja Pública

### **Header:**
- Logo da revenda (se configurada)
- Nome público (ou nome da revenda)
- Botão "Entrar" (redireciona para login)

### **Grid de Produtos:**
- **Desktop**: 4 colunas
- **Tablet**: 3 colunas
- **Mobile**: 2 colunas
- **Mobile pequeno**: 1 coluna

### **Card de Produto:**
- Imagem do produto (ou placeholder)
- Nome do produto
- Descrição (truncada)
- Preço formatado (R$)
- Botão "Comprar"

### **Footer:**
- Nome da revenda
- Copyright Pixy Pay

---

## 🔄 Fluxos

### **Fluxo de Configuração:**
1. Revenda acessa Dashboard
2. Configura link público (opcional)
3. Configura presença (logo e nome)
4. Link fica disponível para compartilhamento

### **Fluxo de Acesso Público:**
1. Cliente acessa `/loja/{link-publico}`
2. Sistema busca revenda por `link_publico`
3. Sistema verifica se `link_publico_ativo = true`
4. Se desativado: Exibe página "Loja Indisponível" com logo PixyPay
5. Se ativado: Sistema busca produtos ativos da revenda
6. Loja é exibida com produtos

### **Fluxo de Compra:**
1. Cliente visualiza produtos na loja pública
2. Cliente clica em "Comprar"
3. ⚠️ **Atualmente**: Mostra alerta (funcionalidade futura)
4. **Futuro**: Redireciona para página de pedido ou WhatsApp

---

## 🧪 Testes Recomendados

1. ✅ Configurar link público único
2. ✅ Tentar usar link já existente (deve dar erro)
3. ✅ Gerar sugestão de link
4. ✅ Upload de logo válida
5. ✅ Configurar nome público
6. ✅ Acessar loja pública pelo link
7. ✅ Verificar que apenas produtos ativos aparecem
8. ✅ Verificar que produtos inativos não aparecem
9. ✅ Testar responsividade da loja
10. ✅ Verificar que loja funciona sem autenticação

---

## ⚠️ Validações

### **Link Público:**
- Formato válido (slug)
- Único no banco de dados
- Validação em tempo real

### **Logo:**
- Tipo de arquivo válido
- Tamanho máximo 5MB
- Opcional

### **Nome Público:**
- Máximo 255 caracteres
- Opcional (usa `nome_revenda` se vazio)

---

## 📝 Notas Importantes

1. **Link público é opcional**: Revenda pode funcionar sem link público
2. **Link público pode ser desativado**: Revenda pode ocultar sua loja temporariamente
3. **Produtos inativos não aparecem**: Apenas produtos com `ativo = true` são exibidos
4. **Loja é pública**: Não requer autenticação para visualizar (quando ativa)
5. **Logo é opcional**: Loja funciona sem logo
6. **Nome público é opcional**: Se não configurado, usa `nome_revenda`
7. **Página de indisponibilidade**: Quando desativado, mostra logo PixyPay e mensagem amigável

---

## 🔗 Relacionamentos

- **Revenda → Produtos**: Um para Muitos (1:N)
- **Revenda → Storage**: Um para Um (1:1) - logo_url
- **Produto → Storage**: Um para Um (1:1) - imagem_url

---

## 🚀 Próximas Funcionalidades (Futuro)

- [ ] Integração com WhatsApp para compras
- [ ] Página de detalhes do produto
- [ ] Carrinho de compras
- [ ] Sistema de pedidos
- [ ] Histórico de visualizações
- [ ] Analytics da loja

---

## 📚 Referências

- Migration: `016_add_campos_presenca_revenda.sql`
- Migration: `020_add_link_publico_ativo.sql`
- Migration: `021_fix_rls_loja_publica_ativa.sql`
- Migration: `022_create_function_buscar_revenda_publica.sql`
- Migration: `023_create_function_buscar_revenda_publica_desativada.sql`
- Migration: `024_create_agendamentos_loja_publica.sql` (agendamento automático)
- Biblioteca: `src/lib/lojaPublica.ts`
- Biblioteca: `src/lib/gerenciarPresenca.ts`
- Biblioteca: `src/lib/gerenciarAgendamentos.ts` (nova)
- Componente: `src/components/revendas/StatusLojaPublica.tsx` (nova)
- Página Pública: `src/pages/publica/LojaPublica.tsx`
- Dashboard: `src/pages/revenda/Dashboard.tsx`
- Presença: `src/pages/revenda/PresencaLoja.tsx`

---

## 🆕 Funcionalidades: Status e Agendamento da Loja Pública

### **1. Status Visual Online/Offline**

**Descrição:**
Componente visual melhorado que mostra o status da loja com ícone pulsante e cores distintas.

**Implementação:**
- Componente `StatusLojaPublica` com ícone pulsante verde (Online) ou vermelho (Offline)
- Switch grande e visível para controle manual
- Status em tempo real

**Comportamento:**
- **Online (verde)**: Loja visível e acessível
- **Offline (vermelho)**: Loja oculta e indisponível

### **2. Agendamento Automático**

**Descrição:**
Sistema de agendamento que permite configurar horários automáticos para ativar/desativar a loja.

**Implementação:**
- Tabela `agendamentos_loja_publica` para armazenar agendamentos
- Modal simplificado acessível pelo botão "Agendar" ao lado do switch
- Tipos de repetição: Diário, Semanal, Único
- Verificação automática dos agendamentos ao acessar a loja

**Tipos de Agendamento:**
- **Diário**: Repete todos os dias no mesmo horário
- **Semanal**: Repete em dias específicos da semana
- **Único**: Executa apenas uma vez em data específica

**Comportamento:**
- Agendamentos ativos têm prioridade sobre o status manual
- Se há agendamento ativo no momento: loja fica ativa (mesmo que `link_publico_ativo = false`)
- Se não há agendamento ativo: segue o status manual (`link_publico_ativo`)
- Múltiplos agendamentos podem coexistir

---

**Última atualização**: 2025-01-07  
**Versão**: 1.1

