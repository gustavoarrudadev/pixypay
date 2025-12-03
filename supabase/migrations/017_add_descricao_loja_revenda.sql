-- Migration 017: Adicionar campo descricao_loja para revendas
-- Este campo permite que revendas personalizem a descrição que aparece na loja pública

-- Adicionar campo descricao_loja
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'descricao_loja'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN descricao_loja TEXT;
    COMMENT ON COLUMN public.revendas.descricao_loja IS 'Descrição personalizada que aparece na loja pública abaixo do nome';
    RAISE NOTICE 'Campo descricao_loja adicionado';
  ELSE
    RAISE NOTICE 'Campo descricao_loja já existe';
  END IF;
END $$;

