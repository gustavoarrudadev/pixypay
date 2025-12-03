-- Migration 036: Adicionar políticas UPDATE para parcelas
-- Permite que revendas atualizem status e data_pagamento das parcelas

-- Política: Revendas podem atualizar parcelas de seus pedidos
CREATE POLICY "Revendas podem atualizar parcelas de seus pedidos"
ON public.parcelas FOR UPDATE
USING (
  parcelamento_id IN (
    SELECT id FROM public.parcelamentos 
    WHERE pedido_id IN (
      SELECT id FROM public.pedidos 
      WHERE revenda_id IN (
        SELECT id FROM public.revendas WHERE user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  parcelamento_id IN (
    SELECT id FROM public.parcelamentos 
    WHERE pedido_id IN (
      SELECT id FROM public.pedidos 
      WHERE revenda_id IN (
        SELECT id FROM public.revendas WHERE user_id = auth.uid()
      )
    )
  )
);

-- Política: Revendas podem atualizar parcelamentos de seus pedidos
CREATE POLICY "Revendas podem atualizar parcelamentos de seus pedidos"
ON public.parcelamentos FOR UPDATE
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos 
    WHERE revenda_id IN (
      SELECT id FROM public.revendas WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  pedido_id IN (
    SELECT id FROM public.pedidos 
    WHERE revenda_id IN (
      SELECT id FROM public.revendas WHERE user_id = auth.uid()
    )
  )
);

-- Política: Revendas podem atualizar pix_copia_cola das parcelas
CREATE POLICY "Revendas podem atualizar pix_copia_cola"
ON public.parcelas FOR UPDATE
USING (
  parcelamento_id IN (
    SELECT id FROM public.parcelamentos 
    WHERE pedido_id IN (
      SELECT id FROM public.pedidos 
      WHERE revenda_id IN (
        SELECT id FROM public.revendas WHERE user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  parcelamento_id IN (
    SELECT id FROM public.parcelamentos 
    WHERE pedido_id IN (
      SELECT id FROM public.pedidos 
      WHERE revenda_id IN (
        SELECT id FROM public.revendas WHERE user_id = auth.uid()
      )
    )
  )
);

