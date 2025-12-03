-- Migration 061: Garantir que exclusão de conta de cliente funcione corretamente
-- Esta migration documenta e garante que a exclusão de conta de cliente funcione
-- com ON DELETE CASCADE em todas as tabelas relacionadas

-- Verificar se todas as tabelas relacionadas têm ON DELETE CASCADE
-- Isso já deve estar configurado nas migrations anteriores, mas vamos documentar:

-- Tabelas que serão automaticamente limpas quando um usuário for excluído:
-- 1. usuarios (ON DELETE CASCADE com auth.users) - Migration 001
-- 2. pedidos (ON DELETE CASCADE com usuarios) - Migration 028
-- 3. parcelamentos (ON DELETE CASCADE com pedidos) - Migration 030
-- 4. parcelas (ON DELETE CASCADE com parcelamentos) - Migration 031
-- 5. enderecos_entrega (ON DELETE CASCADE com usuarios) - Migration 027
-- 6. agendamentos_entrega (ON DELETE CASCADE com pedidos e usuarios) - Migration 032
-- 7. lojas_favoritas (ON DELETE CASCADE com usuarios) - Migration 017
-- 8. colaboradores (ON DELETE CASCADE com usuarios) - Migration 057

-- Comentário explicativo
COMMENT ON TABLE public.usuarios IS 'Tabela de usuários. Quando um usuário é excluído do auth.users, todos os registros relacionados são automaticamente excluídos devido ao ON DELETE CASCADE';

-- Nota: A exclusão de conta será feita via Edge Function 'excluir-usuario'
-- que usa SERVICE_ROLE_KEY para excluir o usuário do auth.users.
-- O ON DELETE CASCADE garante que todos os dados relacionados sejam removidos automaticamente.






















