-- Migration 037: Permitir que clientes leiam dados básicos de revendas relacionadas aos seus pedidos
-- Esta migration permite que clientes vejam informações da revenda (nome, logo, etc.) quando visualizam seus pedidos

-- Política: Clientes podem ler dados básicos de revendas relacionadas aos seus pedidos
CREATE POLICY IF NOT EXISTS "Clientes podem ler revendas de seus pedidos"
ON public.revendas FOR SELECT
USING (
  -- Cliente pode ler revenda se ela está relacionada a um pedido do cliente
  id IN (
    SELECT revenda_id 
    FROM public.pedidos 
    WHERE cliente_id = auth.uid()
  )
  OR
  -- Ou se a revenda tem link público (dados de presença públicos)
  link_publico IS NOT NULL
);

-- Comentário
COMMENT ON POLICY "Clientes podem ler revendas de seus pedidos" ON public.revendas IS 
'Permite que clientes vejam informações básicas da revenda (nome, logo, descrição) quando visualizam seus pedidos ou lojas públicas';

