-- Habilitar RLS na tabela de revendas
ALTER TABLE public.revendas ENABLE ROW LEVEL SECURITY;

-- Política para permitir que administradores leiam todas as revendas
CREATE POLICY "Permitir leitura de revendas para admins" ON public.revendas
FOR SELECT USING (
  (SELECT eh_admin(auth.uid()))
);

-- Política para permitir que administradores insiram novas revendas
CREATE POLICY "Permitir inserção de revendas para admins" ON public.revendas
FOR INSERT WITH CHECK (
  (SELECT eh_admin(auth.uid()))
);

-- Política para permitir que administradores atualizem revendas
CREATE POLICY "Permitir atualização de revendas para admins" ON public.revendas
FOR UPDATE USING (
  (SELECT eh_admin(auth.uid()))
) WITH CHECK (
  (SELECT eh_admin(auth.uid()))
);

-- Política para permitir que administradores excluam revendas
CREATE POLICY "Permitir exclusão de revendas para admins" ON public.revendas
FOR DELETE USING (
  (SELECT eh_admin(auth.uid()))
);

-- Função auxiliar para verificar se o usuário é admin
-- Verifica se já existe antes de criar
CREATE OR REPLACE FUNCTION eh_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM usuarios
    WHERE id = user_id AND LOWER(role) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
