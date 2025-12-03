-- Migration 054: Adicionar políticas RLS para DELETE em repasses e repasses_transacoes
-- Permite que admins e revendas excluam repasses

-- Política: Admins podem excluir repasses
CREATE POLICY "Admins podem excluir repasses"
ON public.repasses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Revendas podem excluir seus próprios repasses
CREATE POLICY "Revendas podem excluir seus repasses"
ON public.repasses FOR DELETE
USING (
  revenda_id IN (
    SELECT id FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política: Admins podem excluir relacionamentos repasses-transações
CREATE POLICY "Admins podem excluir relacionamentos repasses-transações"
ON public.repasses_transacoes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: Revendas podem excluir relacionamentos de seus repasses
CREATE POLICY "Revendas podem excluir relacionamentos de seus repasses"
ON public.repasses_transacoes FOR DELETE
USING (
  repasse_id IN (
    SELECT id FROM public.repasses 
    WHERE revenda_id IN (
      SELECT id FROM public.revendas WHERE user_id = auth.uid()
    )
  )
);

-- Comentários
COMMENT ON POLICY "Admins podem excluir repasses" ON public.repasses IS 'Permite que administradores excluam qualquer repasse';
COMMENT ON POLICY "Revendas podem excluir seus repasses" ON public.repasses IS 'Permite que revendas excluam seus próprios repasses';
COMMENT ON POLICY "Admins podem excluir relacionamentos repasses-transações" ON public.repasses_transacoes IS 'Permite que administradores excluam relacionamentos repasses-transações';
COMMENT ON POLICY "Revendas podem excluir relacionamentos de seus repasses" ON public.repasses_transacoes IS 'Permite que revendas excluam relacionamentos de seus próprios repasses';

