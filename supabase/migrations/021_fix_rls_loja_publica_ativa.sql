-- Migration 021: Ajustar política RLS para garantir acesso público quando loja está ativa
-- Esta migration ajusta a política para garantir que lojas com link_publico_ativo = true sejam acessíveis

-- Remove a política antiga
DROP POLICY IF EXISTS "Dados de presença são públicos" ON public.revendas;

-- Cria nova política que permite acesso público quando:
-- 1. link_publico não é NULL (tem link configurado)
-- 2. link_publico_ativo = true (loja está ativa)
CREATE POLICY "Dados de presença são públicos"
ON public.revendas FOR SELECT
USING (
  link_publico IS NOT NULL 
  AND (link_publico_ativo = true OR link_publico_ativo IS NULL)
);

-- Comentário explicativo
COMMENT ON POLICY "Dados de presença são públicos" ON public.revendas IS 
'Permite acesso público de leitura aos dados de presença (link_publico, nome_publico, logo_url, descricao_loja) quando a loja tem link público configurado e está ativa. Se link_publico_ativo for NULL, assume true para compatibilidade com dados antigos.';

