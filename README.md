# Pixy Pay

Plataforma completa de gestão multi-nicho para pagamentos com PIX Parcelado!

---

## 📋 Sobre o Projeto

O **Pixy Pay** é uma solução completa para gestão de revendas de gás, oferecendo funcionalidades avançadas de e-commerce, gestão financeira e sistema de parcelamentos (BNPL).

### Principais Características

- 🛒 **E-commerce Completo**: Loja pública, carrinho, checkout e gestão de pedidos
- 💳 **Crediário Digital**: Sistema de parcelamento PIX (Buy Now Pay Later)
- 📅 **Agendamentos**: Sistema completo de agendamento de entregas
- 💰 **Gestão Financeira**: Repasses, transações e configurações avançadas
- 🔔 **Notificações em Tempo Real**: Sistema completo de notificações
- 📢 **Comunicação**: Notificações push e banners de alerta administrativos
- 👥 **Multirevenda**: Suporte a múltiplas unidades por revenda
- 🔐 **Segurança Robusta**: RLS, autenticação e sistema de banimento

---

## 🚀 Tecnologias

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### UI/UX
- **Shadcn UI** - Componentes de interface
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones
- **Geist Font** - Fonte tipográfica (Vercel)
- **Sonner** - Sistema de notificações toast
- **Recharts** - Gráficos e visualizações

### Backend/Infraestrutura
- **Supabase** - BaaS (Backend as a Service)
  - Auth (Autenticação)
  - Database (PostgreSQL)
  - Storage (Armazenamento de arquivos)
  - Realtime (Tempo real)
  - Edge Functions (Funções serverless)

---

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn** ou **pnpm**
- Conta no **Supabase** (para backend)

---

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd pixypay
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Configure o Supabase

Execute o script de configuração automatizada:

```bash
npm run setup:supabase
```

**Nota**: Você precisará configurar manualmente as URLs de redirecionamento no painel do Supabase:
- Acesse: **Supabase Dashboard** > **Authentication** > **URL Configuration**
- Configure:
  - **Site URL**: `http://localhost:5173`
  - **Redirect URLs**: 
    - `http://localhost:5173/confirmar-email`
    - `http://localhost:5173/redefinir-senha`
    - `http://localhost:5173/magic-link-login`

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

---

## 📁 Estrutura do Projeto

```
pixypay/
├── docs/                    # Documentação completa do projeto
│   ├── historico/          # Arquivos históricos
│   └── ...                 # Documentações por funcionalidade
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── admin/         # Componentes específicos admin
│   │   ├── cliente/       # Componentes específicos cliente
│   │   ├── revendas/      # Componentes específicos revenda
│   │   ├── comunicacao/   # Componentes de comunicação
│   │   ├── notificacoes/  # Componentes de notificações
│   │   └── ui/            # Componentes Shadcn UI
│   ├── contexts/           # Contextos React
│   ├── hooks/             # Custom hooks
│   ├── layouts/           # Layouts de páginas
│   ├── lib/               # Bibliotecas utilitárias
│   ├── pages/             # Páginas da aplicação
│   │   ├── admin/        # Páginas admin
│   │   ├── cliente/      # Páginas cliente
│   │   ├── revenda/      # Páginas revenda
│   │   └── publica/      # Páginas públicas
│   └── styles/            # Estilos globais
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Migrations SQL
├── scripts/               # Scripts de configuração
└── public/                # Arquivos estáticos
```

---

## 🎨 Design System

- **Tema Base**: Neutral (escala 50-950)
- **Cor de Destaque**: Violet (aplicada estrategicamente)
- **Modo Escuro**: Suportado com toggle
- **Fonte**: Geist (Vercel)
- **Animações**: Minimalistas e fluidas

---

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa linter
- `npm run setup:supabase` - Configuração automatizada do Supabase (inclui deploy de Edge Functions + variáveis de ambiente)
- `npm run deploy:functions` - Deploy apenas das Edge Functions (com configuração automática de variáveis)
- `npm run verify:functions` - Verifica se todas as Edge Functions estão deployadas e funcionando

---

## 📚 Documentação

> **🎯 IMPORTANTE**: Comece pela **[Documentação MESTRE](./docs/00-MESTRE.md)** para ter uma visão completa e organizada de toda a documentação do projeto.

A documentação completa está organizada em **12 pastas principais** na pasta `docs/`, cada uma representando um segmento específico do sistema. O arquivo **MESTRE** serve como índice completo e guia de referência.

### 📖 Documentação MESTRE
- **[00-MESTRE.md](./docs/00-MESTRE.md)** - ⭐ **COMECE AQUI** - Índice completo de toda a documentação, arquitetura, regras, padrões e guia de uso

### 📂 Documentação por Segmento

### ⚡ 01 - Setup e Configuração
**Pasta**: `docs/01-setup-configuracao/`
- **[Setup Automatizado Supabase](./docs/01-setup-configuracao/SETUP_AUTOMATICO_SUPABASE.md)** - Migre para nova conta Supabase automaticamente
- **[Guia Rápido de Configuração](./docs/01-setup-configuracao/GUIA_RAPIDO_CONFIGURACAO.md)** - Configure tudo em 3 passos simples
- **[Setup Resumo](./docs/01-setup-configuracao/SETUP_RESUMO.md)** - Resumo do setup automatizado
- **[Integração Supabase](./docs/01-setup-configuracao/SUPABASE_INTEGRACAO.md)** - Configuração e integração com Supabase
- **[Configuração Storage e Migrations](./docs/01-setup-configuracao/CONFIGURACAO_STORAGE_MIGRATIONS.md)** - Guia completo de configuração
- **[Verificação de Autenticação](./docs/01-setup-configuracao/VERIFICACAO_AUTENTICACAO.md)** - Status das funcionalidades de autenticação
- **[Deploy Edge Functions](./docs/01-setup-configuracao/DEPLOY_EDGE_FUNCTIONS.md)** - Deploy automático das Edge Functions

### 🔐 02 - Autenticação e Segurança
**Pasta**: `docs/02-autenticacao-seguranca/`
- **[Solução Completa de Banimento](./docs/02-autenticacao-seguranca/SOLUCAO_COMPLETA_BANIMENTO.md)** - Sistema completo de banimento
- **[Resumo Login e Banimento](./docs/02-autenticacao-seguranca/RESUMO_LOGIN_BANIMENTO.md)** - Resumo do sistema
- **[Instruções Rápidas de Banimento](./docs/02-autenticacao-seguranca/INSTRUCOES_RAPIDAS_BANIMENTO.md)** - Guia rápido
- **[Como Aplicar Migration de Banimento](./docs/02-autenticacao-seguranca/COMO_APLICAR_MIGRATION_BANIMENTO.md)** - Guia de migrations
- **[Como Testar Login com Banimento](./docs/02-autenticacao-seguranca/COMO_TESTAR_LOGIN_BANIMENTO.md)** - Testes do sistema
- **[Correções RLS Storage](./docs/02-autenticacao-seguranca/CORRECOES_RLS_STORAGE.md)** - Correções de segurança

### 👥 03 - Gestão de Usuários
**Pasta**: `docs/03-gestao-usuarios/`
- **[Gestão de Clientes](./docs/03-gestao-usuarios/GESTAO_CLIENTES.md)** - Sistema completo de gestão de clientes
- **[Gestão de Revendas](./docs/03-gestao-usuarios/GESTAO_REVENDAS.md)** - Sistema completo de gestão de revendas
- **[Sistema de Colaboradores](./docs/03-gestao-usuarios/SISTEMA_CONVITES_COLABORADORES.md)** - Gestão de colaboradores
- **[Sistema de Multirevenda](./docs/03-gestao-usuarios/SISTEMA_MULTIREVENDA.md)** - Gestão de múltiplas unidades

### 🛒 04 - E-commerce e Produtos
**Pasta**: `docs/04-ecommerce-produtos/`
- **[Gestão de Produtos](./docs/04-ecommerce-produtos/GESTAO_PRODUTOS.md)** - Sistema completo de gestão de produtos
- **[Loja Pública](./docs/04-ecommerce-produtos/LOJA_PUBLICA.md)** - Sistema de vitrine online
- **[QR Code Link Público](./docs/04-ecommerce-produtos/QR_CODE_LINK_PUBLICO.md)** - Sistema de QR Code
- **[Gestão Automática de Imagens](./docs/04-ecommerce-produtos/GESTAO_AUTOMATICA_IMAGENS.md)** - Upload e gestão de imagens
- **[Gestão de Favoritos](./docs/04-ecommerce-produtos/GESTAO_FAVORITOS.md)** - Sistema de lojas favoritas

### 📦 05 - Pedidos e Checkout
**Pasta**: `docs/05-pedidos-checkout/`
- **[Gestão de Pedidos](./docs/05-pedidos-checkout/GESTAO_PEDIDOS_COMPLETA.md)** - Sistema completo de pedidos
- **[Checkout e Pedidos](./docs/05-pedidos-checkout/GESTAO_CHECKOUT_PEDIDOS.md)** - Sistema de checkout
- **[Minhas Compras](./docs/05-pedidos-checkout/GESTAO_MINHAS_COMPRAS_COMPLETA.md)** - Visualização completa de compras
- **[Sistema Completo](./docs/05-pedidos-checkout/SISTEMA_COMPLETO_PEDIDOS_PARCELAMENTOS_AGENDAMENTOS.md)** - Documentação consolidada

### 💳 06 - Parcelamentos
**Pasta**: `docs/06-parcelamentos/`
- **[Crediário Digital](./docs/06-parcelamentos/GESTAO_PARCELAMENTOS_COMPLETA.md)** - Sistema completo de parcelamentos (BNPL)

### 📅 07 - Agendamentos
**Pasta**: `docs/07-agendamentos/`
- **[Agendamentos de Entrega](./docs/07-agendamentos/GESTAO_AGENDAMENTOS_COMPLETA.md)** - Sistema completo de agendamentos

### 💰 08 - Financeiro
**Pasta**: `docs/08-financeiro/`
- **[Financeiro Geral](./docs/08-financeiro/FINANCEIRO_GERAL.md)** - Visão geral do sistema financeiro
- **[Financeiro Admin](./docs/08-financeiro/FINANCEIRO_ADMIN.md)** - Gestão financeira para administradores
- **[Financeiro Revenda](./docs/08-financeiro/FINANCEIRO_REVENDA.md)** - Gestão financeira para revendas
- **[Regras de Negócio](./docs/08-financeiro/FINANCEIRO_REGRAS_NEGOCIO.md)** - Regras e lógicas financeiras
- **[Cron Job](./docs/08-financeiro/FINANCEIRO_CRON_JOB.md)** - Jobs agendados
- **[Bloqueio Antecipação](./docs/08-financeiro/FINANCEIRO_BLOQUEIO_ANTECIPACAO.md)** - Sistema de bloqueio
- **[Implementação Completa](./docs/08-financeiro/FINANCEIRO_IMPLEMENTACAO_COMPLETA.md)** - Documentação completa

### 🔔 09 - Notificações e Comunicação
**Pasta**: `docs/09-notificacoes-comunicacao/`
- **[Sistema de Notificações](./docs/09-notificacoes-comunicacao/SISTEMA_NOTIFICACOES.md)** - Notificações em tempo real
- **[Sistema de Comunicação](./docs/09-notificacoes-comunicacao/SISTEMA_COMUNICACAO.md)** - Notificações push e banners

### 📊 10 - Relatórios e Dashboards
**Pasta**: `docs/10-relatorios-dashboards/`
- **[Relatórios](./docs/10-relatorios-dashboards/GESTAO_RELATORIOS_COMPLETA.md)** - Sistema completo de relatórios
- **[Dashboards](./docs/10-relatorios-dashboards/DASHBOARDS.md)** - Documentação dos dashboards

### 🎨 11 - Design e UI
**Pasta**: `docs/11-design-ui/`
- **[Design System](./docs/11-design-ui/DESIGN_SYSTEM.md)** - Guia completo de design e componentes

### 📄 Documentação Geral
- **[Funcionalidades Gerais](./docs/FUNCIONALIDADES_GERAIS.md)** - Visão geral completa de todas as funcionalidades


---

## 🔒 Segurança

- ✅ **Row Level Security (RLS)**: Configurado em todas as tabelas principais
- ✅ **Autenticação**: Sistema robusto com verificação de banimento
- ✅ **Validações**: Frontend (Zod) e Backend (SQL constraints)
- ✅ **Secrets**: Variáveis de ambiente no `.env` (nunca commitadas)
- ✅ **Edge Functions**: Funções serverless com SECURITY DEFINER

**Importante**: 
- Nunca commite arquivos `.env`
- Mantenha secrets apenas em variáveis de ambiente
- Use `.env.example` como referência

---

## 🧪 Desenvolvimento

### Estrutura de Código

- **Componentes**: Organizados por contexto (admin, cliente, revenda)
- **Bibliotecas**: Separação clara de responsabilidades em `lib/`
- **Tipos**: TypeScript em todo o projeto
- **Validações**: Zod para schemas e validação

### Padrões

- **Formulários**: React Hook Form + Zod
- **Estado**: useState/useEffect para estado local
- **Context**: Context API para tema
- **Hooks**: Custom hooks para lógica reutilizável
- **RLS**: Políticas de segurança no banco de dados

---

## 📊 Funcionalidades Implementadas

### ✅ Completas
- Sistema de Autenticação (login, registro, recuperação de senha)
- Gestão de Clientes
- Gestão de Revendas
- Sistema Multirevenda (unidades)
- Gestão de Produtos
- Loja Pública
- Sistema de Pedidos
- Crediário Digital (Parcelamentos)
- Agendamentos de Entrega
- Sistema Financeiro (repasses, transações)
- Sistema de Notificações em Tempo Real
- Sistema de Comunicação (push e banners)
- Sistema de Colaboradores
- Relatórios e Dashboards
- Sistema de Favoritos

### 🚧 Em Planejamento
- Sistema de Negociações
- Sistema de Ajuda/Suporte
- Histórico de Vendas (expansão)

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👥 Autores

- **Equipe Pixy Pay** - Desenvolvimento e manutenção

---

## 📞 Suporte

Para suporte, entre em contato através dos canais oficiais do projeto.

---

**Última atualização**: 2025-01-27  
**Versão**: 1.0.0
