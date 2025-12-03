-- Migration 072: Adicionar política RLS para admins atualizarem unidades_revenda
-- Permite que admins possam atualizar todas as unidades, incluindo configurações financeiras

-- Política: Admins podem atualizar todas as unidades
CREATE POLICY "Admins podem atualizar todas as unidades"
ON public.unidades_revenda FOR UPDATE
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

-- Política: Admins podem ver todas as unidades
CREATE POLICY "Admins podem ver todas as unidades"
ON public.unidades_revenda FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.revendas r
    WHERE r.id = unidades_revenda.revenda_id 
    AND r.user_id = auth.uid()
  )
);


















