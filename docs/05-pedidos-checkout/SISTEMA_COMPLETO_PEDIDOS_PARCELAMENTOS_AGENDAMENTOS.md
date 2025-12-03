# 📦 Sistema Completo: Pedidos, Parcelamentos e Agendamentos

## 📋 Visão Geral

Documentação consolidada de todo o sistema de pedidos, parcelamentos (Crediário Digital) e agendamentos de entrega implementado na plataforma Pixy Pay.

---

## 🎯 Módulos Implementados

### 1. **Sistema de Pedidos**
- ✅ Gestão completa de pedidos para Clientes e Revendas
- ✅ Visualização em Grid (4 colunas) ou Lista
- ✅ Filtros avançados (busca, status, data)
- ✅ Detalhes completos do pedido
- ✅ Atualização de status (Revenda)
- ✅ Integração com parcelamentos e agendamentos

**Documentação:** [GESTAO_PEDIDOS_COMPLETA.md](./GESTAO_PEDIDOS_COMPLETA.md)

---

### 2. **Crediário Digital (Parcelamentos)**
- ✅ Visualização de parcelamentos para Clientes e Revendas
- ✅ Grid de 3 colunas com cards de parcelas
- ✅ Filtros avançados
- ✅ Geração automática de PIX
- ✅ QR Code e código PIX copia e cola
- ✅ Gestão estratégica para Revendas (dar baixa, marcar como vencida, reverter)
- ✅ PIX oculto para Revendas (visível por 3 horas após ação)

**Documentação:** [GESTAO_PARCELAMENTOS_COMPLETA.md](./GESTAO_PARCELAMENTOS_COMPLETA.md)

---

### 3. **Agendamentos de Entrega**
- ✅ Configuração de agendamento (Revenda)
- ✅ Agendamento livre ou configurado (dias e horários)
- ✅ Visualização de agendamentos realizados
- ✅ Criação de agendamento no checkout (Cliente)
- ✅ Integração com pedidos

**Documentação:** [GESTAO_AGENDAMENTOS_COMPLETA.md](./GESTAO_AGENDAMENTOS_COMPLETA.md)

---

### 4. **Minhas Compras (Cliente)**
- ✅ Visualização completa de compras
- ✅ Filtros avançados
- ✅ Visualização em Grid ou Lista
- ✅ Detalhes completos com parcelamentos
- ✅ Integração com Crediário Digital

**Documentação:** [GESTAO_MINHAS_COMPRAS_COMPLETA.md](./GESTAO_MINHAS_COMPRAS_COMPLETA.md)

---

### 5. **Checkout e Carrinho**
- ✅ Carrinho de compras
- ✅ Checkout completo
- ✅ Seleção de parcelamento
- ✅ Seleção de entrega/agendamento
- ✅ Criação de pedidos, parcelamentos e agendamentos

**Documentação:** [GESTAO_CHECKOUT_PEDIDOS.md](./GESTAO_CHECKOUT_PEDIDOS.md)

---

## 🗄️ Estrutura de Banco de Dados

### **Tabelas Principais:**

1. **`pedidos`** - Armazena pedidos
2. **`itens_pedido`** - Itens de cada pedido
3. **`parcelamentos`** - Parcelamentos de pedidos
4. **`parcelas`** - Parcelas individuais
5. **`agendamentos_entrega`** - Agendamentos de entrega
6. **`enderecos_entrega`** - Endereços de entrega
7. **`carrinho`** - Carrinho temporário

### **Campos Adicionais:**

- **`revendas.agendamento_entrega_livre`** - Configuração de agendamento livre
- **`revendas.agendamento_horarios_disponiveis`** - Horários disponíveis
- **`revendas.agendamento_dias_disponiveis`** - Dias da semana disponíveis
- **`produtos.max_parcelas`** - Máximo de parcelas (1-3)
- **`produtos.permite_parcelamento`** - Se permite parcelamento

---

## 🔄 Fluxos Principais

### **Fluxo Completo de Compra:**

1. Cliente adiciona produtos ao carrinho
2. Cliente vai para checkout
3. Cliente preenche dados e escolhe:
   - Forma de pagamento (PIX à vista ou parcelado)
   - Número de parcelas (se parcelado, máximo 3x)
   - Tipo de entrega (retirar, receber, agendar)
   - Endereço ou agendamento (se necessário)
4. Sistema cria:
   - Pedido
   - Itens do pedido
   - Parcelamento e parcelas (se parcelado)
   - Agendamento (se agendado)
5. Cliente vê confirmação
6. Pedido aparece em:
   - Cliente: "Pedidos" e "Minhas Compras"
   - Revenda: "Pedidos"
   - Agendamento aparece em "Agendamentos" (se aplicável)

---

## 🔐 Segurança (RLS)

### **Políticas Implementadas:**

- **Pedidos:** Clientes veem apenas seus pedidos, Revendas veem apenas seus pedidos
- **Parcelamentos:** Herda permissões do pedido
- **Agendamentos:** Clientes veem apenas seus agendamentos, Revendas veem agendamentos de seus pedidos
- **Admins:** Veem tudo

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/gerenciarPedidos.ts`
- `src/lib/gerenciarParcelamentos.ts`
- `src/lib/gerenciarAgendamentoEntrega.ts`
- `src/lib/gerenciarCarrinho.ts`

### **Componentes:**
- `src/components/parcelamentos/ParcelaCard.tsx`
- `src/components/revendas/QRCode.tsx`

### **Páginas Cliente:**
- `src/pages/cliente/Pedidos.tsx`
- `src/pages/cliente/MinhasCompras.tsx`
- `src/pages/cliente/DetalhesPedido.tsx`
- `src/pages/cliente/Parcelamentos.tsx`
- `src/pages/cliente/Checkout.tsx`
- `src/pages/cliente/Carrinho.tsx`

### **Páginas Revenda:**
- `src/pages/revenda/Pedidos.tsx`
- `src/pages/revenda/DetalhesPedido.tsx`
- `src/pages/revenda/Parcelamentos.tsx`
- `src/pages/revenda/Agendamentos.tsx`

---

## 📊 Regras de Negócio

### **Parcelamento:**
- Máximo de 3 parcelas por pedido
- 2x: Entrada + segunda em 15 ou 30 dias (escolha do cliente)
- 3x: Entrada + segunda em 15 dias + terceira em 30 dias
- Primeira parcela sempre paga como entrada

### **Agendamento:**
- Revenda configura se é livre ou com horários específicos
- Cliente escolhe apenas entre opções configuradas
- Agendamento vinculado ao pedido

### **Ordenação:**
- Pedidos: Mais recentes primeiro
- Parcelamentos: Mais recentes primeiro (por data do pedido)
- Agendamentos: Mais próximos primeiro (por data e horário)

---

## 📝 Status e Versão

**Status**: ✅ Implementado e Funcional  
**Última atualização**: 2025-01-12  
**Versão**: 2.0

---

## 🔗 Documentações Detalhadas

- [Pedidos Completa](./GESTAO_PEDIDOS_COMPLETA.md)
- [Parcelamentos Completa](./GESTAO_PARCELAMENTOS_COMPLETA.md)
- [Agendamentos Completa](./GESTAO_AGENDAMENTOS_COMPLETA.md)
- [Minhas Compras Completa](./GESTAO_MINHAS_COMPRAS_COMPLETA.md)
- [Checkout e Pedidos](./GESTAO_CHECKOUT_PEDIDOS.md)

