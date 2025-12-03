# Funcionalidades Gerais - Pixy Pay

## 📋 Visão Geral

Este documento descreve todas as funcionalidades implementadas no sistema Pixy Pay, suas integrações e relacionamentos entre si.

---

## 🔐 1. Sistema de Autenticação

### 1.1 Registro de Usuário
- **Localização**: `src/pages/Registro.tsx`
- **Biblioteca**: `src/lib/auth.ts` - `registrarUsuario()`
- **Funcionalidades**:
  - Criação de conta com email e senha
  - Validação de senha em tempo real (mínimo 8 caracteres)
  - Validação de confirmação de senha
  - Suporte a telefone e CPF (opcionais)
  - Envio automático de email de confirmação
  - Sincronização de telefone após registro
  - Role padrão: `cliente`
- **Integração**: 
  - Supabase Auth (`auth.users`)
  - Tabela `usuarios` (sincronização automática)
  - Edge Function para sincronização (se configurada)
- **Fluxo**: Registro → Email de Confirmação → Login

### 1.2 Login
- **Localização**: `src/pages/Login.tsx`
- **Biblioteca**: `src/lib/auth.ts` - `fazerLogin()`
- **Funcionalidades**:
  - Login com email e senha
  - Verificação prévia de banimento (bloqueio automático)
  - Verificação de email confirmado
  - Magic Link (login sem senha)
  - Redirecionamento baseado em role:
    - `admin` → `/admin`
    - `revenda` → `/conta`
    - `cliente` → `/conta`
  - Sincronização de telefone após login
- **Integração**:
  - RPC `verificar_usuario_banido()` (verificação de banimento)
  - Supabase Auth (`signInWithPassword`)
  - Sistema de roles (`src/lib/roles.ts`)
- **Segurança**: 
  - Verificação de banimento antes do login
  - Verificação após login (camada extra)
  - Logout automático se detectar banimento

### 1.3 Magic Link
- **Localização**: `src/pages/Login.tsx` e `src/pages/MagicLinkLogin.tsx`
- **Biblioteca**: `src/lib/auth.ts` - `enviarMagicLink()`
- **Funcionalidades**:
  - Envio de link de login por email
  - Apenas para usuários já registrados
  - Login automático ao clicar no link
  - Redirecionamento para `/magic-link-login`
- **Integração**: Supabase Auth (`signInWithOtp`)

### 1.4 Recuperação de Senha
- **Localização**: `src/pages/EsqueciSenha.tsx` e `src/pages/RedefinirSenha.tsx`
- **Biblioteca**: `src/lib/auth.ts` - `recuperarSenha()` e `redefinirSenha()`
- **Funcionalidades**:
  - Envio de email de recuperação
  - Redefinição de senha via link do email
  - Validação de sessão/token
  - Confirmação de senha
- **Integração**: Supabase Auth (`resetPasswordForEmail`)

### 1.5 Confirmação de Email
- **Localização**: `src/pages/ConfirmarEmail.tsx`
- **Funcionalidades**:
  - Processamento automático de tokens do Supabase
  - Verificação de email
  - Mensagem de sucesso
  - Redirecionamento para login
- **Integração**: Supabase Auth (processamento de URL)

---

## 👥 2. Gestão de Clientes

### 2.1 Listagem de Clientes
- **Localização**: `src/pages/admin/Clientes.tsx`
- **Biblioteca**: `src/lib/usuarios.ts` - `listarClientes()`
- **Funcionalidades**:
  - Lista todos os clientes cadastrados
  - Filtros avançados:
    - Busca por nome, email, telefone, CPF
    - Filtro por status (Todos, Ativo, Banido, Email Pendente)
    - Filtro por data de cadastro (Hoje, 7 dias, 15 dias, 30 dias, Personalizado)
  - Exibição de status visual (badges)
  - Paginação e ordenação
- **Integração**:
  - RPC `buscar_detalhes_clientes()` (fonte de verdade)
  - Consulta `auth.users.banned_until` para status de banimento
- **Dados Exibidos**:
  - Nome completo / Display Name
  - Email (com indicador de confirmação)
  - Telefone (com máscara e indicador de confirmação)
  - CPF (com máscara)
  - Status (Ativo, Banido, Email Pendente)

### 2.2 Criação de Cliente
- **Localização**: `src/pages/admin/Clientes.tsx` (Sheet) e `src/pages/admin/NovoCliente.tsx`
- **Biblioteca**: Edge Function `criar-usuario-admin`
- **Funcionalidades**:
  - Cadastro manual pelo admin
  - Campos: Nome, Email, Telefone (opcional), CPF (opcional)
  - Senha opcional (cliente cria via email se não informada)
  - Opção de enviar Magic Link ao invés de senha
  - Validação de dados
  - Envio automático de email para criação de senha
- **Integração**:
  - Edge Function `criar-usuario-admin`
  - Supabase Auth (criação de usuário)
  - Tabela `usuarios` (sincronização)

### 2.3 Edição de Cliente
- **Localização**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)
- **Biblioteca**: `src/lib/gerenciarCliente.ts` - `atualizarCliente()`
- **Funcionalidades**:
  - Edição de nome, email, telefone, CPF
  - Atualização em tempo real
  - Sincronização com `auth.users` e tabela `usuarios`
  - Validação de dados
- **Integração**:
  - Edge Function `atualizar-usuario-admin`
  - Tabela `usuarios`
  - Supabase Auth (`auth.users`)

### 2.4 Exclusão de Cliente
- **Localização**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)
- **Biblioteca**: `src/lib/gerenciarCliente.ts` - `excluirCliente()`
- **Funcionalidades**:
  - Exclusão de cliente com confirmação
  - Remoção de `auth.users` e tabela `usuarios`
- **Integração**: Edge Function `excluir-usuario`

### 2.5 Banimento de Cliente
- **Localização**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)
- **Biblioteca**: `src/lib/gerenciarCliente.ts` - `bloquearCliente()`
- **Funcionalidades**:
  - Banimento temporário (horas ou dias)
  - Banimento permanente
  - Desbanimento
  - Exibição de status de banimento
  - Data de expiração do banimento
- **Integração**:
  - Edge Function `bloquear-usuario`
  - RPC `update_user_banned_until()` (Migration 007)
  - `auth.users.banned_until` (fonte de verdade)
  - Tabela `usuarios` (cache/histórico)
- **Segurança**: 
  - Bloqueio automático no login
  - Verificação prévia ao login
  - Sincronização entre Auth e tabela

### 2.6 Ações Rápidas
- **Localização**: `src/pages/admin/Clientes.tsx` (Sheet de Detalhes)
- **Funcionalidades**:
  - Envio de Magic Link
  - Envio de email de redefinição de senha
- **Integração**: `src/lib/gerenciarCliente.ts`

---

## 🛒 2.7 Funcionalidades do Painel Cliente

### 2.7.1 Pedidos ✅
- **Localização**: `src/pages/cliente/Pedidos.tsx`
- **Acesso**: Usuários com role `cliente`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Visualização de pedidos realizados
  - Acompanhamento de status
  - Filtros avançados
- **Documentação Completa**: [Gestão de Pedidos](./GESTAO_PEDIDOS_COMPLETA.md)

### 2.7.2 Minhas Compras ✅
- **Localização**: `src/pages/cliente/MinhasCompras.tsx`
- **Acesso**: Usuários com role `cliente`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Histórico completo de compras
  - Detalhes de compras anteriores
  - Acompanhamento de entrega
  - Visualização de parcelamentos
- **Documentação Completa**: [Gestão de Minhas Compras](./GESTAO_MINHAS_COMPRAS_COMPLETA.md)

### 2.7.3 Parcelamentos ✅
- **Localização**: `src/pages/cliente/Parcelamentos.tsx`
- **Acesso**: Usuários com role `cliente`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Visualização de parcelamentos ativos
  - Parcelas pendentes e pagas
  - QR Code PIX para pagamento
  - Histórico de pagamentos
- **Documentação Completa**: [Gestão de Parcelamentos](./GESTAO_PARCELAMENTOS_COMPLETA.md)

### 2.7.4 Meus Favoritos ✅
- **Localização**: `src/pages/cliente/MeusFavoritos.tsx`
- **Acesso**: Usuários com role `cliente`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Lista de lojas favoritas
  - Adicionar/remover favoritos
  - Integração com loja pública
- **Documentação Completa**: [Gestão de Favoritos](./GESTAO_FAVORITOS.md)

### 2.7.5 Negociações 🚧
- **Localização**: `src/pages/cliente/Negociacoes.tsx`
- **Acesso**: Usuários com role `cliente`
- **Status**: 🚧 Em Planejamento
- **Funcionalidades Planejadas**:
  - Criar propostas de preço
  - Negociar condições de pagamento
  - Acompanhar status das negociações
  - Chat com revendas
- **Documentação Completa**: [Gestão de Negociações](./GESTAO_NEGOCIACOES.md)

### 2.7.6 Ajuda 🚧
- **Localização**: `src/pages/cliente/Ajuda.tsx`
- **Acesso**: Usuários com role `cliente`
- **Status**: 🚧 Em Planejamento
- **Funcionalidades Planejadas**:
  - FAQ (Perguntas Frequentes)
  - Tutoriais e guias
  - Contato com suporte
  - Acompanhamento de solicitações
- **Documentação Completa**: [Gestão de Ajuda](./GESTAO_AJUDA.md)

---

## 🏪 3. Gestão de Revendas
- **Localização**: `src/pages/admin/Revendas.tsx`
- **Biblioteca**: `src/lib/gerenciarRevenda.ts` - `listarRevendas()`
- **Funcionalidades**:
  - Lista todas as revendas cadastradas
  - Busca por nome ou CNPJ
  - Exibição de dados principais
- **Integração**: Tabela `revendas` (Migration 009)

### 3.2 Criação de Revenda
- **Localização**: `src/pages/admin/NovaRevenda.tsx`
- **Biblioteca**: Edge Function `criar-usuario-admin`
- **Funcionalidades**:
  - Cadastro manual pelo admin
  - Campos: Nome, Email, Senha
  - Validação de senha
  - Role: `revenda`
- **Integração**: Edge Function `criar-usuario-admin`

### 3.3 Edição e Exclusão de Revenda
- **Localização**: `src/pages/admin/Revendas.tsx`
- **Biblioteca**: `src/lib/gerenciarRevenda.ts`
- **Funcionalidades**:
  - Edição de dados da revenda
  - Exclusão com confirmação
- **Integração**: Tabela `revendas`

---

## 🛡️ 4. Sistema de Banimento

### 4.1 Verificação de Banimento
- **Localização**: `src/lib/auth.ts` - `fazerLogin()`
- **Biblioteca**: RPC `verificar_usuario_banido()` (Migration 008)
- **Funcionalidades**:
  - Verificação prévia ao login
  - Consulta `auth.users.banned_until`
  - Bloqueio automático se banido
- **Segurança**: Múltiplas camadas de verificação

### 4.2 Aplicação de Banimento
- **Localização**: `src/lib/gerenciarCliente.ts` - `bloquearCliente()`
- **Biblioteca**: Edge Function `bloquear-usuario`
- **Funcionalidades**:
  - Banimento por horas ou dias
  - Banimento permanente
  - Sincronização com `auth.users` e tabela `usuarios`
- **Integração**:
  - RPC `update_user_banned_until()` (Migration 007)
  - `auth.users.banned_until`
  - Tabela `usuarios` (campos `banido_at`, `banido_ate`)

### 4.3 Alerta Visual no Login
- **Localização**: `src/pages/Login.tsx`
- **Funcionalidades**:
  - Alerta diferenciado (amarelo/âmbar) para conta suspensa
  - Botões de contato com suporte (Email e WhatsApp)
  - Mensagem clara sobre suspensão
- **Design**: Diferenciação visual de erros comuns

---

## 👤 5. Sistema de Roles

### 5.1 Tipos de Roles
- **admin**: Acesso completo ao painel administrativo
- **revenda**: Acesso ao painel de revenda (futuro)
- **cliente**: Acesso ao painel do cliente

### 5.2 Verificação de Roles
- **Localização**: `src/lib/roles.ts`
- **Funcionalidades**:
  - `obterRoleUsuario()`: Obtém role do usuário atual
  - `isAdmin()`, `isRevenda()`, `isCliente()`: Verificações específicas
  - `obterRoleDeUsuario()`: Obtém role de um usuário específico
- **Integração**: `user.user_metadata.role`

### 5.3 Proteção de Rotas
- **Localização**: `src/layouts/AdminLayout.tsx`
- **Funcionalidades**:
  - Verificação de autenticação
  - Verificação de role (apenas admin)
  - Redirecionamento automático se não autorizado
- **Rotas Protegidas**: `/admin/*`

---

## 🎨 6. Sistema de Tema

### 6.1 Dark/Light Mode
- **Localização**: `src/contexts/ThemeContext.tsx` e `src/components/ThemeToggle.tsx`
- **Funcionalidades**:
  - Toggle entre Dark e Light mode
  - Persistência no `localStorage`
  - Transições suaves entre temas
  - Aplicação global via Context API
- **Design System**: Escala Neutral (50-950) para ambos os modos

---

## 📊 7. Dashboard Admin

### 7.1 Visão Geral
- **Localização**: `src/pages/admin/Dashboard.tsx`
- **Funcionalidades**:
  - Cards de navegação rápida
  - Acesso rápido a Revendas e Clientes
  - Estatísticas (futuro)
- **Integração**: Navegação para outras páginas admin

---

## 🏪 8. Gestão de Revendas

### 8.1 Visão Geral
- **Localização**: `src/pages/admin/Revendas.tsx` e `src/pages/revenda/GerenciarConta.tsx`
- **Acesso**: 
  - Cadastro e gerenciamento: Apenas `admin`
  - Conta própria: Usuários com role `revenda`
- **Funcionalidades**:
  - Cadastro completo de revendas (apenas admin)
  - Listagem com filtros avançados
  - Edição de dados (admin e própria revenda)
  - Sistema de banimento integrado
  - Sincronização bidirecional entre admin e revenda
- **Campos Específicos**:
  - Nome da Revenda
  - CNPJ (único, não editável após criação)
  - Nome e CPF do Responsável
  - Endereço completo (CEP, Logradouro, Número, Bairro, Cidade, Estado)
  - Marcas Trabalhadas (Ultragaz, Supergasbras, Liquigás, Copagaz, Nacional Gás, Outros)
- **Integração**: 
  - Tabela `revendas`
  - Tabela `usuarios` (sincronização)
  - `auth.users` (sincronização via Edge Functions)
  - RPC `listar_revendas_com_email()`
- **Documentação Completa**: [Gestão de Revendas](./GESTAO_REVENDAS.md)

---

## 📦 9. Gestão de Produtos (NOVO)

### 9.1 CRUD de Produtos
- **Localização**: `src/pages/revenda/Produtos.tsx`
- **Biblioteca**: `src/lib/gerenciarProduto.ts`
- **Funcionalidades**:
  - Cadastro de produtos (nome, descrição, preço, imagem)
  - Edição completa de produtos
  - Exclusão de produtos
  - Listagem em grid de 4 colunas
  - Switch Ativo/Inativo para controlar visibilidade
  - Busca e filtros (Todos, Ativos, Inativos)
- **Integração**:
  - Tabela `produtos` (Migration 015)
  - Supabase Storage (bucket `produtos`)
  - RLS configurado para isolamento por revenda
- **Documentação Completa**: [Gestão de Produtos](./GESTAO_PRODUTOS.md)

### 9.2 Upload de Imagens
- **Localização**: `src/components/revendas/UploadImagem.tsx`
- **Biblioteca**: `src/lib/storage.ts`
- **Funcionalidades**:
  - Upload de imagens de produtos
  - Upload de logos de revendas
  - Validação de tipo (JPG, PNG, WEBP)
  - Validação de tamanho (máx. 5MB)
  - Preview antes de salvar
- **Integração**: Supabase Storage

---

## 🏪 10. Dashboard da Revenda (NOVO)

### 10.1 Visão Geral
- **Localização**: `src/pages/revenda/Dashboard.tsx`
- **Acesso**: Usuários com role `revenda`
- **Funcionalidades**:
  - Gerenciamento de link público único
  - Validação de unicidade em tempo real
  - Geração automática de sugestão de link
  - Copiar link para compartilhamento
  - Visualizar loja pública
  - Estatísticas (total de produtos, produtos ativos)
- **Integração**:
  - Tabela `revendas` (campo `link_publico`)
  - Biblioteca `gerenciarPresenca.ts`

---

## 🎨 11. Presença na Loja (NOVO)

### 11.1 Configuração de Presença
- **Localização**: `src/pages/revenda/PresencaLoja.tsx`
- **Biblioteca**: `src/lib/gerenciarPresenca.ts`
- **Funcionalidades**:
  - Upload de logo da revenda
  - Configuração de nome público
  - Preview em tempo real
  - Remoção de logo anterior ao atualizar
- **Integração**:
  - Tabela `revendas` (campos `logo_url`, `nome_publico`)
  - Supabase Storage (bucket `logos-revendas`)

---

## 🌐 12. Loja Pública (NOVO)

### 12.1 Vitrine Online
- **Localização**: `src/pages/publica/LojaPublica.tsx`
- **Rota**: `/loja/:linkPublico` (pública, sem autenticação)
- **Funcionalidades**:
  - Acesso público via link único
  - Exibição de logo e nome da revenda
  - Grid de produtos ativos (4 colunas)
  - Cards de produtos com botão "Comprar"
  - Design público (sem sidebar, sem autenticação)
  - Footer com informações da revenda
- **Integração**:
  - Tabela `revendas` (busca por `link_publico`)
  - Tabela `produtos` (apenas produtos com `ativo = true`)
  - RLS público configurado
- **Documentação Completa**: [Loja Pública](./LOJA_PUBLICA.md)

---

## 🛒 13. Pedidos - Revenda ✅

### 13.1 Visão Geral
- **Localização**: `src/pages/revenda/Pedidos.tsx`
- **Acesso**: Usuários com role `revenda`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Listagem de pedidos recebidos
  - Processamento e atualização de status
  - Detalhes completos do pedido
  - Notificações de novos pedidos
  - Gestão de parcelamentos
- **Integração**:
  - Tabela `pedidos`
  - Tabela `itens_pedido`
  - Vinculação com produtos e clientes
- **Documentação Completa**: [Gestão de Pedidos](./GESTAO_PEDIDOS_COMPLETA.md)

---

## 📅 14. Agendamentos - Revenda ✅

### 14.1 Visão Geral
- **Localização**: `src/pages/revenda/Agendamentos.tsx`
- **Acesso**: Usuários com role `revenda`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Criação e gerenciamento de agendamentos
  - Configuração de horários disponíveis
  - Visualização de agendamentos realizados
  - Notificações de novos agendamentos
- **Integração**:
  - Tabela `agendamentos_entrega`
  - Vinculação com pedidos e clientes
- **Documentação Completa**: [Gestão de Agendamentos](./GESTAO_AGENDAMENTOS_COMPLETA.md)

---

## 📊 15. Histórico de Vendas - Revenda 🚧

### 15.1 Visão Geral
- **Localização**: `src/pages/revenda/HistoricoVendas.tsx`
- **Acesso**: Usuários com role `revenda`
- **Status**: 🚧 Em Planejamento
- **Funcionalidades Planejadas**:
  - Histórico completo de vendas
  - Estatísticas e métricas
  - Gráficos e visualizações
  - Exportação de dados (CSV, PDF)
- **Documentação Completa**: [Gestão de Histórico de Vendas](./GESTAO_HISTORICO_VENDAS.md)

---

## 💰 16. Financeiro - Revenda ✅

### 16.1 Visão Geral
- **Localização**: `src/pages/revenda/Financeiro.tsx`
- **Acesso**: Usuários com role `revenda`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Dashboard financeiro
  - Gestão de transações financeiras
  - Sistema de repasses
  - Configurações de repasse
  - Bloqueio de antecipação
- **Integração**:
  - Tabela `transacoes_financeiras`
  - Tabela `repasses`
  - Tabela `configuracoes_repasse_revenda`
- **Documentação Completa**: [Gestão Financeira](./FINANCEIRO_REVENDA.md)

---

## 📈 17. Relatórios - Revenda ✅

### 17.1 Visão Geral
- **Localização**: `src/pages/revenda/Relatorios.tsx`
- **Acesso**: Usuários com role `revenda`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Relatórios de vendas
  - Relatórios financeiros
  - KPIs e métricas
  - Gráficos e visualizações
- **Documentação Completa**: [Gestão de Relatórios](./GESTAO_RELATORIOS_COMPLETA.md)

---

## ⚙️ 18. Sistema de Colaboradores ✅

### 18.1 Visão Geral
- **Localização**: `src/pages/revenda/Colaboradores.tsx`
- **Acesso**: Usuários com role `revenda` e `admin`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Criação de colaboradores
  - Gerenciamento de permissões granulares
  - Vinculação a unidades específicas
  - Reset de senha
- **Integração**:
  - Tabela `colaboradores`
  - Tabela `permissoes_colaborador`
- **Documentação Completa**: [Sistema de Colaboradores](./SISTEMA_CONVITES_COLABORADORES.md)

---

## 📢 19. Sistema de Comunicação ✅

### 19.1 Visão Geral
- **Localização**: `src/pages/admin/Comunicacao.tsx`
- **Acesso**: Apenas `admin`
- **Status**: ✅ Implementado
- **Funcionalidades**:
  - Notificações Push (canto inferior direito)
  - Banners de Alerta (acima do título da página)
  - Gerenciamento completo de comunicações
  - Agendamento de exibição
  - Público-alvo personalizável (revendas, clientes, colaboradores)
- **Integração**:
  - Tabela `notificacoes_push`
  - Tabela `banners_alerta`
- **Documentação Completa**: [Sistema de Comunicação](./SISTEMA_COMUNICACAO.md)

---

## 🔗 20. Integrações e Dependências

### 9.1 Supabase
- **Auth**: Autenticação de usuários
- **Database**: Tabelas `usuarios`, `revendas` e `produtos`
- **Storage**: 
  - Bucket `produtos`: Imagens de produtos
  - Bucket `logos-revendas`: Logos das revendas
- **Edge Functions**: 
  - `bloquear-usuario`: Banimento/desbanimento
  - `criar-usuario-admin`: Criação de usuários pelo admin
  - `atualizar-usuario-admin`: Atualização de dados
  - `excluir-usuario`: Exclusão de usuários
- **RPC Functions**:
  - `buscar_detalhes_clientes()`: Listagem de clientes
  - `listar_revendas_com_email()`: Listagem de revendas com email e status
  - `buscar_detalhes_revenda()`: Detalhes completos de uma revenda
  - `verificar_usuario_banido()`: Verificação de banimento
  - `update_user_banned_until()`: Atualização de banimento
  - `validar_link_publico_unico()`: Validação de link único

### 9.2 Bibliotecas Frontend
- **React Router**: Roteamento
- **React Hook Form**: Formulários
- **Zod**: Validação
- **Shadcn UI**: Componentes de interface
- **Tailwind CSS**: Estilização
- **Lucide React**: Ícones

---

## 🔄 21. Relacionamentos entre Funcionalidades

### 14.1 Autenticação ↔ Gestão de Clientes
- Clientes são criados via registro ou pelo admin
- Status de banimento afeta login
- Edição de dados sincroniza Auth e tabela

### 14.2 Autenticação ↔ Sistema de Banimento
- Verificação de banimento no login
- Bloqueio automático se banido
- Alerta visual diferenciado

### 14.3 Gestão de Clientes ↔ Sistema de Banimento
- Admin pode banir/desbanir clientes
- Status sincronizado entre Auth e tabela
- Exibição de status na listagem

### 14.4 Sistema de Roles ↔ Proteção de Rotas
- Roles determinam acesso às rotas
- Admin tem acesso completo
- Revenda e Cliente têm acesso limitado

### 14.5 Gestão de Revendas ↔ Autenticação
- Revendas são criadas apenas pelo admin
- Login redireciona revendas para página específica (`/revenda`)
- Status de banimento afeta login
- Edição de dados sincroniza Auth e tabelas

### 14.6 Gestão de Revendas ↔ Sincronização Bidirecional
- Alterações do admin refletem na página da revenda
- Alterações da revenda refletem na página do admin
- Sincronização entre `revendas`, `usuarios` e `auth.users`

### 14.7 Gestão de Produtos ↔ Revendas (NOVO)
- Produtos são vinculados a revendas
- Cada revenda gerencia apenas seus produtos
- RLS garante isolamento completo

### 14.8 Loja Pública ↔ Produtos (NOVO)
- Loja pública exibe apenas produtos ativos
- Link público permite acesso sem autenticação
- Produtos inativos não aparecem na loja

### 14.9 Dashboard ↔ Presença na Loja (NOVO)
- Dashboard gerencia link público
- Presença na Loja gerencia logo e nome público
- Ambos trabalham juntos para personalizar a loja pública

### 14.10 Pedidos ↔ Produtos (EM PLANEJAMENTO)
- Pedidos são vinculados a produtos através de itens
- Produtos podem ter múltiplos pedidos
- Histórico de vendas baseado em pedidos concluídos

### 14.11 Pedidos ↔ Agendamentos (EM PLANEJAMENTO)
- Agendamentos podem ser vinculados a pedidos
- Entrega de produtos pode gerar agendamento automático
- Status de agendamento pode afetar status do pedido

### 14.12 Financeiro ↔ Pedidos (EM PLANEJAMENTO)
- Receitas são geradas a partir de pedidos concluídos
- Contas a receber baseadas em pedidos pendentes
- Relatórios financeiros incluem dados de vendas

### 14.13 Relatórios ↔ Todas as Funcionalidades (EM PLANEJAMENTO)
- Relatórios agregam dados de múltiplas fontes
- Vendas, produtos, clientes, financeiro e agendamentos
- Permite análise completa do negócio

### 14.14 Administração ↔ Todas as Funcionalidades (EM PLANEJAMENTO)
- Configurações administrativas afetam todas as funcionalidades
- Permissões controlam acesso às funcionalidades
- Logs de auditoria registram todas as ações

### 14.15 Funcionalidades Cliente ↔ Pedidos (EM PLANEJAMENTO)
- Minhas Compras baseada em pedidos do cliente
- Parcelamentos vinculados a pedidos
- Negociações podem gerar pedidos

### 14.16 Funcionalidades Cliente ↔ Produtos (EM PLANEJAMENTO)
- Favoritos vinculados a produtos
- Negociações vinculadas a produtos
- Produtos aparecem nas compras

### 21.17 Funcionalidades Cliente ↔ Revendas
- Compras vinculadas a revendas
- Parcelamentos conectam cliente e revenda
- Agendamentos conectam cliente e revenda
- Negociações (planejado) conectam cliente e revenda
- Suporte (planejado) pode envolver revendas

### 21.18 Sistema de Comunicação ↔ Todos os Usuários
- Notificações Push aparecem para revendas, clientes e colaboradores
- Banners de Alerta aparecem para revendas, clientes e colaboradores
- Admin controla todas as comunicações

---

## 📝 22. Documentação Relacionada

### Configuração e Setup
- [Setup Automatizado Supabase](./SETUP_AUTOMATICO_SUPABASE.md)
- [Guia Rápido de Configuração](./GUIA_RAPIDO_CONFIGURACAO.md)
- [Integração Supabase](./SUPABASE_INTEGRACAO.md)
- [Configuração Storage e Migrations](./CONFIGURACAO_STORAGE_MIGRATIONS.md)

### Design e Interface
- [Design System](./DESIGN_SYSTEM.md)
- [Verificação de Autenticação](./VERIFICACAO_AUTENTICACAO.md)

### Funcionalidades Principais
- [Gestão de Clientes](./GESTAO_CLIENTES.md)
- [Gestão de Revendas](./GESTAO_REVENDAS.md)
- [Sistema de Multirevenda](./SISTEMA_MULTIREVENDA.md)
- [Gestão de Produtos](./GESTAO_PRODUTOS.md)
- [Loja Pública](./LOJA_PUBLICA.md)
- [Gestão de Pedidos](./GESTAO_PEDIDOS_COMPLETA.md)
- [Gestão de Agendamentos](./GESTAO_AGENDAMENTOS_COMPLETA.md)
- [Gestão de Minhas Compras](./GESTAO_MINHAS_COMPRAS_COMPLETA.md)
- [Gestão de Parcelamentos](./GESTAO_PARCELAMENTOS_COMPLETA.md)
- [Gestão de Favoritos](./GESTAO_FAVORITOS.md)
- [Gestão de Relatórios](./GESTAO_RELATORIOS_COMPLETA.md)

### Sistemas Específicos
- [Sistema de Notificações](./SISTEMA_NOTIFICACOES.md)
- [Sistema de Comunicação](./SISTEMA_COMUNICACAO.md)
- [Sistema de Colaboradores](./SISTEMA_CONVITES_COLABORADORES.md)
- [Sistema Completo: Pedidos, Parcelamentos e Agendamentos](./SISTEMA_COMPLETO_PEDIDOS_PARCELAMENTOS_AGENDAMENTOS.md)

### Financeiro
- [Financeiro Geral](./FINANCEIRO_GERAL.md)
- [Financeiro Admin](./FINANCEIRO_ADMIN.md)
- [Financeiro Revenda](./FINANCEIRO_REVENDA.md)
- [Financeiro - Regras de Negócio](./FINANCEIRO_REGRAS_NEGOCIO.md)
- [Financeiro - Cron Job](./FINANCEIRO_CRON_JOB.md)
- [Financeiro - Bloqueio Antecipação](./FINANCEIRO_BLOQUEIO_ANTECIPACAO.md)
- [Financeiro - Implementação Completa](./FINANCEIRO_IMPLEMENTACAO_COMPLETA.md)

### Segurança
- [Solução Completa de Banimento](./SOLUCAO_COMPLETA_BANIMENTO.md)
- [Resumo Login e Banimento](./RESUMO_LOGIN_BANIMENTO.md)
- [Instruções Rápidas de Banimento](./INSTRUCOES_RAPIDAS_BANIMENTO.md)
- [Como Aplicar Migration de Banimento](./COMO_APLICAR_MIGRATION_BANIMENTO.md)
- [Como Testar Login com Banimento](./COMO_TESTAR_LOGIN_BANIMENTO.md)

### Planejadas
- [Gestão de Negociações](./GESTAO_NEGOCIACOES.md) 🚧 **EM PLANEJAMENTO**
- [Gestão de Ajuda](./GESTAO_AJUDA.md) 🚧 **EM PLANEJAMENTO**
- [Gestão de Histórico de Vendas](./GESTAO_HISTORICO_VENDAS.md) 🚧 **EM PLANEJAMENTO**

---

**Última atualização**: 2025-01-27  
**Versão**: 5.0

