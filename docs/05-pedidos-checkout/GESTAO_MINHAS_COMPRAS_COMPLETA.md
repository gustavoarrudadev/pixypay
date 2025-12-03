# 🛍️ Minhas Compras - Documentação Completa

## 📋 Visão Geral

Sistema completo de visualização e acompanhamento de compras para Clientes, incluindo histórico detalhado, filtros avançados, visualização em grid/lista e integração com parcelamentos.

---

## 🎯 Funcionalidades Implementadas

### 1. **Página "Minhas Compras" (`/cliente/compras`)**

#### 1.1. Visualização
- **Grid (4 colunas)** ou **Lista** (toggle)
- Cards informativos com todas as informações relevantes
- Ordenação por data de criação (mais recentes primeiro)

#### 1.2. Filtros Avançados
- **Busca por texto:**
  - Número do pedido
  - Nome da revenda
  - Nome do cliente
  - Email do cliente
  - Telefone do cliente

- **Filtro por Status:**
  - Todos
  - Pendente
  - Confirmado
  - Preparando
  - Pronto
  - Em Trânsito
  - Entregue
  - Cancelado

- **Filtro por Data:**
  - Tudo
  - Hoje
  - 7 dias
  - 15 dias
  - 30 dias
  - Personalizado (com DateRangePicker)

- **Botão "Limpar":**
  - Reseta todos os filtros

#### 1.3. Informações Exibidas
- Número do pedido
- Data de criação
- Status do pedido (com cores)
- Revenda
- Forma de pagamento
- Tipo de entrega
- Valor total
- Parcelamentos resumidos (se aplicável):
  - Total de parcelas
  - Parcelas pagas
  - Parcelas pendentes
  - Primeiras 3 parcelas com data de vencimento
- Botão "Ver Detalhes"

---

### 2. **Detalhes do Pedido (`/cliente/compras/:id`)**

#### 2.1. Informações Completas
- **Dados do Pedido:**
  - Número do pedido
  - Data de criação
  - Status atual
  - Valor total
  - Forma de pagamento
  - Tipo de entrega

- **Dados da Revenda:**
  - Nome da revenda
  - Logo (se disponível)

- **Dados do Cliente:**
  - Nome
  - Email
  - Telefone
  - CPF (se informado)

- **Itens do Pedido:**
  - Lista completa de produtos
  - Imagem do produto
  - Nome do produto
  - Quantidade
  - Preço unitário
  - Subtotal

- **Informações de Entrega:**
  - Endereço completo (se entrega)
  - OU Informações de retirada (se retirada)
  - OU Detalhes do agendamento (se agendado)

#### 2.2. Parcelamentos Completos (Se Aplicável)
- **Seção "Crediário Digital":**
  - Grid de 3 colunas com cards de parcelas
  - Cada card mostra:
    - Número da parcela
    - Valor
    - Data de vencimento
    - Status
    - QR Code PIX (sempre visível)
    - Código PIX copia e cola
    - Botão "Ações" para ver detalhes
  
  - Sheet lateral com detalhes completos:
    - Informações da parcela
    - QR Code PIX
    - Código PIX copia e cola
    - Data de vencimento
    - Status
    - Informações do pedido vinculado

---

## 🗄️ Estrutura de Banco de Dados

### **Baseado na Tabela `pedidos`**

A funcionalidade utiliza a tabela `pedidos` existente, filtrando por `cliente_id`:

```sql
SELECT 
  p.*,
  r.nome_revenda,
  r.logo_url as revenda_logo,
  parcelamento:parcelamentos (
    *,
    parcelas:parcelas (*)
  ),
  agendamento_entrega:agendamentos_entrega (*),
  endereco_entrega:enderecos_entrega (*),
  itens:itens_pedido (
    *,
    produto:produtos (
      id,
      nome,
      imagem_url
    )
  )
FROM pedidos p
JOIN revendas r ON p.revenda_id = r.id
WHERE p.cliente_id = auth.uid()
ORDER BY p.criado_em DESC;
```

---

## 🔄 Fluxos Implementados

### **Fluxo de Visualização:**

1. Cliente acessa "Minhas Compras"
2. Sistema carrega pedidos ordenados por data (mais recentes primeiro)
3. Cliente pode:
   - Alternar entre Grid e Lista
   - Aplicar filtros avançados
   - Buscar por texto
   - Filtrar por status
   - Filtrar por data
4. Cliente visualiza resumo de cada pedido
5. Cliente clica em "Ver Detalhes" para ver informações completas

### **Fluxo de Detalhes:**

1. Cliente clica em "Ver Detalhes" em um pedido
2. Sistema carrega informações completas:
   - Dados do pedido
   - Itens do pedido
   - Informações de entrega/agendamento
   - Parcelamentos completos (se aplicável)
3. Cliente pode:
   - Ver todas as parcelas com QR Code PIX
   - Copiar código PIX
   - Ver detalhes de cada parcela em Sheet lateral

---

## 🔐 Segurança (RLS)

### **Políticas Implementadas:**

1. **Clientes podem ver apenas suas próprias compras**
   - Consulta apenas pedidos onde `cliente_id` corresponde ao usuário logado

2. **Dados são somente leitura**
   - Cliente não pode editar pedidos, apenas visualizar

---

## 📁 Estrutura de Arquivos

### **Bibliotecas:**
- `src/lib/gerenciarPedidos.ts` - Funções de consulta de pedidos

### **Páginas:**
- `src/pages/cliente/MinhasCompras.tsx` - Página principal
- `src/pages/cliente/DetalhesPedido.tsx` - Detalhes do pedido

---

## 🎨 Design e UX

### **Princípios:**
- Design clean e moderno
- Responsivo (mobile-first)
- Filtros avançados consistentes
- Visualização em Grid ou Lista
- Cards informativos
- Animações suaves
- Feedback visual claro

---

## 📊 Ordenação

### **Padrão de Ordenação:**
- **Pedidos:** Ordenados por `criado_em` DESC (mais recentes primeiro)

---

## 🔗 Integração com Outras Funcionalidades

### **Parcelamentos:**
- Parcelamentos aparecem resumidos na listagem
- Parcelamentos completos aparecem nos detalhes do pedido
- Integração com página "Crediário Digital"

### **Agendamentos:**
- Agendamentos aparecem nos detalhes do pedido
- Informações completas de data, horário e observações

---

## 📝 Status e Versão

**Status**: ✅ Implementado e Funcional  
**Última atualização**: 2025-01-12  
**Versão**: 2.0

---

## 🔗 Referências Relacionadas

- [Pedidos Completa](./GESTAO_PEDIDOS_COMPLETA.md)
- [Parcelamentos Completa](./GESTAO_PARCELAMENTOS_COMPLETA.md)
- [Checkout e Pedidos](./GESTAO_CHECKOUT_PEDIDOS.md)

