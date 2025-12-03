-- Migration 020: Adicionar campo link_publico_ativo na tabela revendas
-- Esta migration adiciona um campo booleano para controlar se o link público está ativo ou não

-- Adiciona coluna link_publico_ativo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'revendas' 
        AND column_name = 'link_publico_ativo'
    ) THEN
        ALTER TABLE public.revendas ADD COLUMN link_publico_ativo BOOLEAN DEFAULT true NOT NULL;
        RAISE NOTICE 'Campo link_publico_ativo adicionado';
    ELSE
        RAISE NOTICE 'Campo link_publico_ativo já existe';
    END IF;
END $$;

-- Atualiza política pública para incluir link_publico_ativo
-- Permite que qualquer pessoa leia link_publico_ativo para verificar se a loja está disponível
DROP POLICY IF EXISTS "Dados de presença são públicos" ON public.revendas;
CREATE POLICY "Dados de presença são públicos"
ON public.revendas FOR SELECT
USING (link_publico IS NOT NULL);

-- Comentário na coluna
COMMENT ON COLUMN public.revendas.link_publico_ativo IS 'Indica se o link público da loja está ativo e visível. Se false, a loja não será acessível pelo link público.';

