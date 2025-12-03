# 📚 DOCUMENTAÇÃO MESTRE - Pixy Pay

> **Este é o arquivo central de referência de toda a documentação do projeto Pixy Pay.**
> 
> **IMPORTANTE**: Este arquivo DEVE ser atualizado a cada mudança significativa no projeto. Ele serve como guia completo para desenvolvedores, revisores de código, agentes de IA e qualquer pessoa que precise entender o projeto em profundidade.

---

## 📋 Índice Rápido

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Estrutura da Documentação](#estrutura-da-documentação)
3. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Regras e Padrões do Projeto](#regras-e-padrões-do-projeto)
6. [Funcionalidades Implementadas](#funcionalidades-implementadas)
7. [Fluxos Principais](#fluxos-principais)
8. [Relacionamentos e Impactos](#relacionamentos-e-impactos)
9. [Como Usar Esta Documentação](#como-usar-esta-documentação)
10. [Atualização da Documentação](#atualização-da-documentação)

---

## 🎯 Visão Geral do Projeto

### Sobre o Pixy Pay

**Pixy Pay** é uma plataforma completa de gestão multi-nicho para revendas e lojas virtuais, desenvolvida com tecnologias modernas e arquitetura escalável. O sistema oferece funcionalidades avançadas de e-commerce, gestão financeira, sistema de parcelamentos (BNPL), agendamentos, notificações em tempo real e muito mais.

### Principais Características

- 🛒 **E-commerce Completo**: Loja pública, carrinho, checkout e gestão de pedidos
- 💳 **Crediário Digital**: Sistema de parcelamento PIX (Buy Now Pay Later)
- 📅 **Agendamentos**: Sistema completo de agendamento de entregas
- 💰 **Gestão Financeira**: Repasses, transações e configurações avançadas
- 🔔 **Notificações em Tempo Real**: Sistema completo de notificações
- 📢 **Comunicação**: Notificações push e banners de alerta administrativos
- 👥 **Multirevenda**: Suporte a múltiplas unidades por revenda
- 🔐 **Segurança Robusta**: RLS, autenticação e sistema de banimento

### Status do Projeto

- **Versão**: 1.0.0
- **Status**: ✅ Em Produção / Desenvolvimento Ativo
- **Última Atualização**: 2025-01-27

---

## 📁 Estrutura da Documentação

A documentação está organizada em **12 pastas principais**, cada uma representando um segmento específico do sistema. Cada pasta contém documentações detalhadas sobre sua área de atuação.

### 📂 01 - Setup e Configuração
**Localização**: `docs/01-setup-configuracao/`

Documentações sobre configuração inicial, setup do Supabase e integração com serviços externos.

**Arquivos**:
- `SETUP_AUTOMATICO_SUPABASE.md` - Setup automatizado completo do Supabase
- `SETUP_RESUMO.md` - Resumo do setup automatizado
- `GUIA_RAPIDO_CONFIGURACAO.md` - Guia rápido em 3 passos
- `CONFIGURACAO_STORAGE_MIGRATIONS.md` - Configuração de Storage e Migrations
- `SUPABASE_INTEGRACAO.md` - Integração completa com Supabase
- `VERIFICACAO_AUTENTICACAO.md` - Verificação de funcionalidades de autenticação
- `DEPLOY_EDGE_FUNCTIONS.md` - Deploy automático das Edge Functions

**Quando Consultar**: Ao configurar o projeto pela primeira vez, migrar para nova conta Supabase, ou configurar novos serviços.

---

### 🔐 02 - Autenticação e Segurança
**Localização**: `docs/02-autenticacao-seguranca/`

Documentações sobre sistema de autenticação, banimento de usuários, RLS e segurança.

**Arquivos**:
- `SOLUCAO_COMPLETA_BANIMENTO.md` - Sistema completo de banimento
- `RESUMO_LOGIN_BANIMENTO.md` - Resumo do sistema de login e banimento
- `INSTRUCOES_RAPIDAS_BANIMENTO.md` - Instruções rápidas para corrigir banimento
- `COMO_APLICAR_MIGRATION_BANIMENTO.md` - Como aplicar migrations de banimento
- `COMO_TESTAR_LOGIN_BANIMENTO.md` - Guia de testes do sistema de banimento
- `CORRECOES_RLS_STORAGE.md` - Correções de RLS e Storage

**Quando Consultar**: Ao trabalhar com autenticação, implementar novos recursos de segurança, ou corrigir problemas de acesso/permissões.

---

### 👥 03 - Gestão de Usuários
**Localização**: `docs/03-gestao-usuarios/`

Documentações sobre gestão de clientes, revendas, colaboradores e sistema multirevenda.

**Arquivos**:
- `GESTAO_CLIENTES.md` - Sistema completo de gestão de clientes
- `GESTAO_REVENDAS.md` - Sistema completo de gestão de revendas
- `SISTEMA_CONVITES_COLABORADORES.md` - Sistema de colaboradores e permissões
- `SISTEMA_MULTIREVENDA.md` - Sistema de múltiplas unidades por revenda

**Quando Consultar**: Ao trabalhar com CRUD de usuários, implementar novas funcionalidades de gestão, ou entender permissões e roles.

---

### 🛒 04 - E-commerce e Produtos
**Localização**: `docs/04-ecommerce-produtos/`

Documentações sobre produtos, loja pública, favoritos e gestão de imagens.

**Arquivos**:
- `GESTAO_PRODUTOS.md` - Sistema completo de gestão de produtos
- `LOJA_PUBLICA.md` - Sistema de vitrine online pública
- `QR_CODE_LINK_PUBLICO.md` - Sistema de QR Code e links públicos
- `GESTAO_AUTOMATICA_IMAGENS.md` - Gestão automática de imagens
- `GESTAO_FAVORITOS.md` - Sistema de lojas favoritas
- `COMO_CRIAR_TABELA_FAVORITOS.md` - Guia técnico de criação da tabela de favoritos

**Quando Consultar**: Ao trabalhar com produtos, loja pública, upload de imagens, ou implementar novas funcionalidades de e-commerce.

---

### 📦 05 - Pedidos e Checkout
**Localização**: `docs/05-pedidos-checkout/`

Documentações sobre sistema de pedidos, checkout, carrinho e minhas compras.

**Arquivos**:
- `GESTAO_PEDIDOS_COMPLETA.md` - Sistema completo de gestão de pedidos
- `GESTAO_CHECKOUT_PEDIDOS.md` - Sistema de checkout e carrinho
- `GESTAO_MINHAS_COMPRAS_COMPLETA.md` - Visualização completa de compras do cliente
- `SISTEMA_COMPLETO_PEDIDOS_PARCELAMENTOS_AGENDAMENTOS.md` - Documentação consolidada

**Quando Consultar**: Ao trabalhar com pedidos, checkout, carrinho, ou implementar novas funcionalidades de vendas.

---

### 💳 06 - Parcelamentos
**Localização**: `docs/06-parcelamentos/`

Documentações sobre sistema de parcelamento PIX (Crediário Digital / BNPL).

**Arquivos**:
- `GESTAO_PARCELAMENTOS_COMPLETA.md` - Sistema completo de parcelamentos

**Quando Consultar**: Ao trabalhar com parcelamentos, geração de PIX, ou implementar novas funcionalidades de crediário.

---

### 📅 07 - Agendamentos
**Localização**: `docs/07-agendamentos/`

Documentações sobre sistema de agendamento de entregas.

**Arquivos**:
- `GESTAO_AGENDAMENTOS_COMPLETA.md` - Sistema completo de agendamentos

**Quando Consultar**: Ao trabalhar com agendamentos, configuração de horários, ou implementar novas funcionalidades de entrega.

---

### 💰 08 - Financeiro
**Localização**: `docs/08-financeiro/`

Documentações sobre sistema financeiro, repasses, transações e configurações financeiras.

**Arquivos**:
- `FINANCEIRO_GERAL.md` - Visão geral do sistema financeiro
- `FINANCEIRO_ADMIN.md` - Gestão financeira para administradores
- `FINANCEIRO_REVENDA.md` - Gestão financeira para revendas
- `FINANCEIRO_REGRAS_NEGOCIO.md` - Regras de negócio financeiras
- `FINANCEIRO_CRON_JOB.md` - Jobs agendados financeiros
- `FINANCEIRO_BLOQUEIO_ANTECIPACAO.md` - Sistema de bloqueio de antecipação
- `FINANCEIRO_IMPLEMENTACAO_COMPLETA.md` - Documentação completa de implementação
- `GESTAO_FINANCEIRO.md` - Gestão geral do financeiro

**Quando Consultar**: Ao trabalhar com repasses, transações financeiras, configurações de repasse, ou implementar novas funcionalidades financeiras.

---

### 🔔 09 - Notificações e Comunicação
**Localização**: `docs/09-notificacoes-comunicacao/`

Documentações sobre sistema de notificações em tempo real e comunicação administrativa.

**Arquivos**:
- `SISTEMA_NOTIFICACOES.md` - Sistema completo de notificações em tempo real
- `SISTEMA_COMUNICACAO.md` - Sistema de notificações push e banners administrativos

**Quando Consultar**: Ao trabalhar com notificações, comunicação com usuários, ou implementar novos tipos de notificação.

---

### 📊 10 - Relatórios e Dashboards
**Localização**: `docs/10-relatorios-dashboards/`

Documentações sobre relatórios, dashboards e visualizações de dados.

**Arquivos**:
- `GESTAO_RELATORIOS_COMPLETA.md` - Sistema completo de relatórios
- `DASHBOARDS.md` - Documentação dos dashboards

**Quando Consultar**: Ao trabalhar com relatórios, dashboards, gráficos, ou implementar novas visualizações.

---

### 🎨 11 - Design e UI
**Localização**: `docs/11-design-ui/`

Documentações sobre design system, componentes UI e padrões visuais.

**Arquivos**:
- `DESIGN_SYSTEM.md` - Guia completo de design e componentes

**Quando Consultar**: Ao criar novos componentes, seguir padrões de design, ou implementar novas interfaces.

---

### 🚧 12 - Planejadas
**Localização**: `docs/12-planejadas/`

Documentações sobre funcionalidades planejadas mas ainda não implementadas.

**Arquivos**:
- `GESTAO_NEGOCIACOES.md` - Sistema de negociações (planejado)
- `GESTAO_AJUDA.md` - Sistema de ajuda/suporte (planejado)
- `GESTAO_HISTORICO_VENDAS.md` - Histórico de vendas expandido (planejado)
- `GESTAO_ADMINISTRACAO.md` - Gestão administrativa avançada (planejado)

**Quando Consultar**: Ao planejar novas funcionalidades ou entender o roadmap do projeto.

---

### 📄 Arquivo Geral
**Localização**: `docs/FUNCIONALIDADES_GERAIS.md`

Documentação geral que descreve todas as funcionalidades implementadas, suas integrações e relacionamentos.

**Quando Consultar**: Para ter uma visão geral de todas as funcionalidades do sistema e seus relacionamentos.

---

## 🏗️ Arquitetura e Tecnologias

### Stack Tecnológico

#### Frontend
- **React 18.3.1** - Biblioteca JavaScript para interfaces
- **TypeScript 5.5.4** - Tipagem estática
- **Vite 5.4.2** - Build tool e dev server
- **React Router 6.26.0** - Roteamento
- **React Hook Form 7.66.0** - Gerenciamento de formulários
- **Zod 4.1.12** - Validação de schemas

#### UI/UX
- **Shadcn UI** - Componentes de interface (29 componentes)
- **Tailwind CSS 3.4.13** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones
- **Geist Font** - Fonte tipográfica (Vercel)
- **Sonner** - Sistema de notificações toast
- **Recharts** - Gráficos e visualizações

#### Backend/Infraestrutura
- **Supabase** - BaaS (Backend as a Service)
  - **Auth**: Autenticação de usuários
  - **Database**: PostgreSQL 17.6.1
  - **Storage**: Armazenamento de arquivos (buckets: produtos, logos-revendas)
  - **Realtime**: Tempo real para notificações e atualizações
  - **Edge Functions**: Funções serverless

### Estrutura de Pastas do Projeto

```
pixypay/
├── docs/                    # Documentação completa (organizada por segmentos)
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── admin/          # Componentes específicos admin
│   │   ├── cliente/        # Componentes específicos cliente
│   │   ├── revendas/       # Componentes específicos revenda
│   │   ├── comunicacao/    # Componentes de comunicação
│   │   ├── notificacoes/   # Componentes de notificações
│   │   └── ui/             # Componentes Shadcn UI
│   ├── contexts/           # Contextos React (ThemeContext)
│   ├── hooks/              # Custom hooks (usePermissoes)
│   ├── layouts/            # Layouts de páginas (4 layouts)
│   ├── lib/                # Bibliotecas utilitárias (37 arquivos)
│   ├── pages/              # Páginas da aplicação
│   │   ├── admin/          # 19 páginas admin
│   │   ├── cliente/        # 13 páginas cliente
│   │   ├── revenda/        # 14 páginas revenda
│   │   └── publica/        # 2 páginas públicas
│   └── styles/             # Estilos globais
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # 86+ migrations SQL
└── scripts/                # Scripts de configuração
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### Autenticação e Usuários
- `auth.users` - Usuários do Supabase Auth (fonte de verdade para autenticação)
- `usuarios` - Dados complementares dos usuários (sincronizado com auth.users)
- `revendas` - Revendas cadastradas
- `unidades_revenda` - Unidades físicas de revendas (multirevenda)
- `colaboradores` - Colaboradores do sistema
- `permissoes_colaborador` - Permissões granulares dos colaboradores

#### E-commerce
- `produtos` - Produtos das revendas
- `carrinho` - Carrinho de compras (temporário/sessão)
- `pedidos` - Pedidos realizados
- `itens_pedido` - Itens dos pedidos
- `enderecos_entrega` - Endereços de entrega dos clientes
- `lojas_favoritas` - Lojas favoritas dos clientes

#### Financeiro
- `parcelamentos` - Parcelamentos de pedidos
- `parcelas` - Parcelas individuais
- `transacoes_financeiras` - Transações financeiras
- `repasses` - Repasses realizados
- `repasses_transacoes` - Relacionamento repasses/transações
- `configuracoes_repasse_revenda` - Configurações de repasse por revenda/unidade

#### Agendamentos
- `agendamentos_entrega` - Agendamentos de entrega
- `agendamentos_loja_publica` - Agendamentos de ativação/desativação de loja

#### Notificações e Comunicação
- `notificacoes` - Notificações em tempo real do sistema
- `preferencias_notificacoes` - Preferências de notificações por usuário
- `notificacoes_push` - Notificações push administrativas
- `banners_alerta` - Banners de alerta administrativos

### Funções RPC Principais

- `buscar_detalhes_clientes()` - Listagem de clientes com dados completos
- `buscar_detalhes_revenda()` - Detalhes completos de uma revenda
- `verificar_usuario_banido()` - Verificação de banimento pré-login
- `criar_notificacao()` - Criação de notificações (respeita preferências)
- `calcular_valor_repasse()` - Cálculo de valor de repasse
- `calcular_data_repasse()` - Cálculo de data de repasse
- `get_configuracao_repasse_ativa()` - Obter configuração de repasse ativa
- `buscar_unidade_publica()` - Buscar unidade pública por link
- `obter_unidade_id_colaborador()` - Obter unidade do colaborador
- `update_user_password()` - Atualizar senha do usuário (via Edge Function)

### Edge Functions

- `bloquear-usuario` - Banimento/desbanimento de usuários
- `excluir-usuario` - Exclusão de usuários
- `criar-usuario-admin` - Criação de usuários pelo admin
- `atualizar-usuario-admin` - Atualização de dados de usuários pelo admin

### Row Level Security (RLS)

**Todas as tabelas principais possuem RLS habilitado** com políticas específicas por role:
- **Admin**: Acesso completo a todas as tabelas
- **Revenda**: Acesso apenas aos seus próprios dados
- **Cliente**: Acesso apenas aos seus próprios dados
- **Colaboradores**: Acesso baseado em permissões granulares

**Funções Auxiliares RLS**:
- `is_admin()` - Verifica se usuário é admin (consulta auth.users)
- `eh_admin()` - Verifica se usuário é admin (consulta usuarios)
- `is_revenda()` - Verifica se usuário é revenda
- `is_cliente()` - Verifica se usuário é cliente

---

## 📐 Regras e Padrões do Projeto

### Regras de Código

1. **Separação de Responsabilidades**
   - Arquivos extensos devem ser divididos em módulos compactos
   - Funções longas devem ser transformadas em blocos menores e reutilizáveis
   - Máximo recomendado: 250-300 linhas por arquivo

2. **Tipagem**
   - TypeScript obrigatório em todo o projeto
   - Tipos explícitos para funções públicas
   - Interfaces bem definidas para dados complexos

3. **Validação**
   - Frontend: React Hook Form + Zod
   - Backend: Constraints SQL + Validações em RPCs
   - Validação de unicidade (CNPJ, email, link público)

4. **Segurança**
   - Todas as secrets em `.env` (nunca no código)
   - `.env.example` documentado sem valores reais
   - RLS em todas as tabelas principais
   - Verificação de banimento pré-login

5. **Nomenclatura**
   - Português Brasil para código, comentários e documentação
   - Nomes descritivos e claros
   - Padrão camelCase para variáveis/funções
   - Padrão PascalCase para componentes

### Regras de UI/UX

1. **Design System**
   - Tema base: Neutral (escala 50-950)
   - Cor de destaque: Violet (5-10% da interface)
   - Fonte: Geist Font (Vercel)
   - Modo escuro: Suportado com toggle
   - Animações: Minimalistas, fluidas e suaves

2. **Componentes**
   - Shadcn UI como base (nunca outras bibliotecas)
   - Tailwind CSS para estilização
   - Componentes reutilizáveis bem estruturados
   - Responsividade mobile-first

3. **Padrões de Layout**
   - White Mode como padrão
   - Tema Neutral do Shadcn
   - Hierarquia visual clara
   - Acessibilidade considerada

### Regras de Banco de Dados

1. **Migrations**
   - Numeradas sequencialmente (001, 002, 003...)
   - Idempotentes (podem ser executadas múltiplas vezes)
   - Comentadas e explicativas
   - RLS configurado em todas as tabelas

2. **Triggers**
   - Atualização automática de `atualizado_em`
   - Criação automática de notificações
   - Sincronização de dados entre tabelas
   - Todos com `SECURITY DEFINER` quando necessário

3. **Índices**
   - Criados para campos frequentemente consultados
   - Índices compostos quando necessário
   - Performance otimizada

### Regras de Documentação

1. **Organização**
   - Documentações separadas por funcionalidade
   - Cada funcionalidade em sua pasta específica
   - Arquivo MESTRE sempre atualizado

2. **Conteúdo**
   - Detalhes completos de cada funcionalidade
   - Regras de negócio documentadas
   - Impactos em outras funcionalidades
   - Relacionamentos entre funcionalidades

3. **Atualização**
   - **OBRIGATÓRIO**: Atualizar este arquivo MESTRE a cada mudança significativa
   - Atualizar documentações relacionadas
   - Remover informações desatualizadas
   - Adicionar novas funcionalidades

---

## ✅ Funcionalidades Implementadas

### Autenticação e Segurança ✅
- Sistema completo de autenticação (login, registro, recuperação de senha)
- Magic Link (login sem senha)
- Sistema de banimento (temporário/permanente)
- Verificação pré-login de banimento
- Sincronização bidirecional Auth ↔ Tabelas

### Gestão de Usuários ✅
- Gestão completa de clientes (CRUD, banimento, ações rápidas)
- Gestão completa de revendas (CRUD, banimento, sincronização)
- Sistema de colaboradores com permissões granulares
- Sistema multirevenda (múltiplas unidades por revenda)
- Vinculação de colaboradores a unidades específicas

### E-commerce ✅
- CRUD completo de produtos
- Upload de imagens (Supabase Storage)
- Loja pública com link único
- QR Code para loja pública
- Sistema de favoritos (lojas favoritas)
- Gestão automática de imagens

### Pedidos e Checkout ✅
- Carrinho de compras
- Checkout completo
- Gestão completa de pedidos
- Visualização de "Minhas Compras" (cliente)
- Atualização de status de pedidos
- Integração com parcelamentos e agendamentos

### Parcelamentos ✅
- Sistema completo de parcelamento PIX (BNPL)
- Geração automática de QR Code PIX
- Gestão estratégica para revendas
- Visualização para clientes e revendas
- Máximo de 3 parcelas por pedido

### Agendamentos ✅
- Configuração de agendamento (revenda)
- Agendamento livre ou configurado
- Criação de agendamento no checkout
- Visualização de agendamentos realizados

### Financeiro ✅
- Sistema completo de repasses (D+1, D+15, D+30)
- Cálculo automático de taxas
- Gestão de transações financeiras
- Configurações por revenda e por unidade
- Bloqueio de antecipação
- Antecipação de repasses
- Cron job para atualização de status

### Notificações ✅
- Notificações em tempo real (Supabase Realtime)
- Badge com contador de não lidas
- Notificações automáticas por triggers
- Preferências por tipo de notificação
- Som de notificação (Web Audio API)

### Comunicação ✅
- Notificações Push administrativas (canto inferior direito)
- Banners de Alerta administrativos (acima do título)
- Gerenciamento completo de comunicações
- Agendamento de exibição
- Público-alvo personalizável

### Relatórios e Dashboards ✅
- Dashboards para Admin, Revenda e Cliente
- Relatórios de vendas
- Relatórios financeiros
- KPIs e métricas
- Gráficos e visualizações

---

## 🔄 Fluxos Principais

### Fluxo de Autenticação
1. Usuário acessa página de login
2. Sistema verifica banimento pré-login (RPC `verificar_usuario_banido`)
3. Se banido, bloqueia acesso
4. Se não banido, permite login
5. Após login, verifica banimento novamente (camada extra)
6. Redireciona baseado em role (admin → `/admin`, revenda/cliente → `/conta`)
7. Sincroniza telefone se necessário

### Fluxo de Pedido Completo
1. Cliente navega na loja pública
2. Adiciona produtos ao carrinho
3. Vai para checkout
4. Preenche dados e escolhe:
   - Forma de pagamento (PIX à vista ou parcelado)
   - Número de parcelas (se parcelado)
   - Tipo de entrega (retirada, entrega, agendamento)
   - Endereço ou agendamento (se necessário)
5. Sistema cria:
   - Pedido na tabela `pedidos`
   - Itens na tabela `itens_pedido`
   - Parcelamento e parcelas (se parcelado)
   - Agendamento de entrega (se agendado)
6. Cliente vê página de confirmação
7. Revenda recebe notificação de novo pedido
8. Pedido aparece em:
   - Cliente: "Pedidos" e "Minhas Compras"
   - Revenda: "Pedidos"
   - Agendamento aparece em "Agendamentos" (se aplicável)

### Fluxo de Parcelamento
1. Pedido criado com parcelamento
2. Sistema cria:
   - Registro em `parcelamentos`
   - Parcelas em `parcelas` (máximo 3)
   - Primeira parcela marcada como "paga" (entrada)
3. Cliente visualiza em "Crediário Digital"
4. Cliente pode:
   - Ver QR Code PIX de parcelas pendentes
   - Copiar código PIX
   - Ver detalhes de cada parcela
5. Revenda pode:
   - Ver todos os parcelamentos de seus pedidos
   - Dar baixa em parcelas individuais
   - Marcar como vencida
   - Reverter parcela paga
   - Ver PIX (por 3 horas após ação)

### Fluxo de Repasse Financeiro
1. Pedido é confirmado/entregue
2. Sistema cria transação financeira
3. Sistema calcula valor de repasse baseado em:
   - Modalidade configurada (D+1, D+15, D+30)
   - Taxas configuradas
   - Configuração da revenda/unidade
4. Sistema calcula data de repasse
5. Transação fica com status "pendente"
6. Cron job atualiza status automaticamente
7. Revenda pode:
   - Visualizar transações e repasses
   - Antecipar repasses (se não bloqueado)
   - Ver histórico completo

---

## 🔗 Relacionamentos e Impactos

### Autenticação ↔ Gestão de Usuários
- Clientes são criados via registro ou pelo admin
- Status de banimento afeta login
- Edição de dados sincroniza Auth e tabela
- **Impacto**: Mudanças em autenticação afetam todas as gestões de usuários

### Pedidos ↔ Parcelamentos
- Parcelamentos são criados automaticamente com pedidos parcelados
- Parcelas são vinculadas a pedidos
- Status de parcelas pode afetar status do pedido
- **Impacto**: Mudanças em pedidos podem afetar parcelamentos

### Pedidos ↔ Agendamentos
- Agendamentos podem ser vinculados a pedidos
- Entrega de produtos pode gerar agendamento automático
- Status de agendamento pode afetar status do pedido
- **Impacto**: Mudanças em agendamentos afetam visualização de pedidos

### Financeiro ↔ Pedidos
- Receitas são geradas a partir de pedidos concluídos
- Transações financeiras são criadas com pedidos
- Repasses são calculados baseados em pedidos
- **Impacto**: Mudanças em pedidos afetam cálculos financeiros

### Notificações ↔ Todas as Funcionalidades
- Notificações são criadas automaticamente por triggers
- Novos pedidos geram notificações
- Mudanças de status geram notificações
- Parcelas atrasadas geram notificações
- **Impacto**: Mudanças em qualquer funcionalidade podem gerar notificações

### Comunicação ↔ Todos os Usuários
- Notificações Push aparecem para revendas, clientes e colaboradores
- Banners aparecem para revendas, clientes e colaboradores
- Admin controla todas as comunicações
- **Impacto**: Mudanças em comunicação afetam experiência de todos os usuários

### Multirevenda ↔ Todas as Funcionalidades
- Produtos vinculados a unidades específicas
- Pedidos identificados por unidade
- Agendamentos vinculados a unidades
- Configurações financeiras por unidade
- **Impacto**: Mudanças em multirevenda afetam isolamento de dados

---

## 📖 Como Usar Esta Documentação

### Para Desenvolvedores

1. **Comece pelo arquivo MESTRE** (este arquivo) para entender a estrutura geral
2. **Consulte a pasta específica** da funcionalidade que você está trabalhando
3. **Leia a documentação completa** da funcionalidade antes de fazer mudanças
4. **Verifique relacionamentos** para entender impactos em outras funcionalidades
5. **Atualize a documentação** após fazer mudanças significativas

### Para Revisores de Código

1. **Use o arquivo MESTRE** como índice completo
2. **Consulte documentações específicas** para entender regras de negócio
3. **Verifique relacionamentos** para garantir que mudanças não quebrem outras funcionalidades
4. **Valide contra padrões** documentados nas regras do projeto

### Para Agentes de IA

1. **Leia o arquivo MESTRE primeiro** para contexto completo
2. **Consulte pastas específicas** conforme necessário
3. **Entenda relacionamentos** antes de sugerir mudanças
4. **Respeite regras e padrões** documentados
5. **Sempre atualize documentação** ao fazer mudanças

### Para Novos Membros da Equipe

1. **Leia o arquivo MESTRE** para visão geral
2. **Consulte FUNCIONALIDADES_GERAIS.md** para entender todas as funcionalidades
3. **Explore pastas específicas** conforme interesse/necessidade
4. **Consulte Setup e Configuração** para configurar ambiente local
5. **Leia Design System** para entender padrões visuais

---

## 🔄 Atualização da Documentação

### Quando Atualizar

**OBRIGATÓRIO atualizar este arquivo MESTRE quando**:
- Nova funcionalidade é implementada
- Funcionalidade existente é modificada significativamente
- Nova tabela/estrutura de banco é criada
- Nova Edge Function é criada
- Regras de negócio são alteradas
- Relacionamentos entre funcionalidades mudam

### Como Atualizar

1. **Atualize a seção relevante** neste arquivo MESTRE
2. **Atualize a documentação específica** na pasta correspondente
3. **Atualize FUNCIONALIDADES_GERAIS.md** se necessário
4. **Atualize a data** de "Última Atualização"
5. **Verifique relacionamentos** e atualize seções de impacto

### Checklist de Atualização

- [ ] Seção relevante no MESTRE atualizada
- [ ] Documentação específica atualizada
- [ ] FUNCIONALIDADES_GERAIS.md atualizado (se necessário)
- [ ] Relacionamentos e impactos revisados
- [ ] Data de atualização atualizada
- [ ] Novos arquivos adicionados ao índice (se criados)

---

## 📞 Informações de Contato e Suporte

- **Projeto**: Pixy Pay
- **Versão**: 1.0.0
- **Última Atualização**: 2025-01-27
- **Status**: ✅ Em Produção / Desenvolvimento Ativo

---

## 📝 Notas Finais

Este arquivo MESTRE é o **ponto central de referência** de toda a documentação do projeto. Ele deve ser mantido **sempre atualizado** e servir como **guia completo** para qualquer pessoa que precise entender o projeto em profundidade.

**Lembre-se**: Uma documentação bem mantida é essencial para a manutenibilidade e escalabilidade do projeto. Sempre atualize este arquivo ao fazer mudanças significativas.

---

**Última atualização deste arquivo**: 2025-01-27  
**Próxima revisão recomendada**: Após implementação de novas funcionalidades ou mudanças significativas

