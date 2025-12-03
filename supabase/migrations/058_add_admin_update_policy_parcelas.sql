-- Migration 058: Adicionar políticas UPDATE para ADMINs em parcelas e parcelamentos
-- Permite que ADMINs atualizem status, data_pagamento e outros campos de todas as parcelas

-- Política: Admins podem atualizar todas as parcelas
CREATE POLICY "Admins podem atualizar todas as parcelas"
ON public.parcelas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Admins podem atualizar todos os parcelamentos
CREATE POLICY "Admins podem atualizar todos os parcelamentos"
ON public.parcelamentos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);






















