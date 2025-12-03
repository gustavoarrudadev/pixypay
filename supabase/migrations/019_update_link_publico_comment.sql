-- Migration 019: Atualizar comentário da coluna link_publico para refletir novo nome do projeto
-- Esta migration atualiza o comentário da coluna link_publico para usar exemplo genérico

COMMENT ON COLUMN public.revendas.link_publico IS 'Slug único para acesso público à loja (ex: revenda-exemplo)';

