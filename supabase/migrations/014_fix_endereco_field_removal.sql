-- Script SQL para aplicar diretamente no Supabase SQL Editor
-- Este script remove o campo "endereco" e configura os campos de endereço como obrigatórios

-- PASSO 1: Remover campo "endereco" se existir
DO $$ 
BEGIN
  -- Verifica se a coluna existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'endereco'
  ) THEN
    -- Tenta remover a constraint NOT NULL primeiro (se existir)
    BEGIN
      ALTER TABLE public.revendas ALTER COLUMN endereco DROP NOT NULL;
      RAISE NOTICE 'Constraint NOT NULL removida da coluna endereco';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não havia constraint NOT NULL na coluna endereco: %', SQLERRM;
    END;
    
    -- Remove a coluna
    ALTER TABLE public.revendas DROP COLUMN endereco;
    RAISE NOTICE 'Coluna "endereco" removida com sucesso';
  ELSE
    RAISE NOTICE 'Coluna "endereco" não existe, pulando remoção';
  END IF;
END $$;

-- PASSO 2: Tornar campos de endereço obrigatórios (exceto complemento)
DO $$ 
BEGIN
  -- CEP
  UPDATE public.revendas SET cep = '' WHERE cep IS NULL;
  BEGIN
    ALTER TABLE public.revendas ALTER COLUMN cep DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER TABLE public.revendas ALTER COLUMN cep SET NOT NULL;
  ALTER TABLE public.revendas ALTER COLUMN cep SET DEFAULT '';

  -- Logradouro
  UPDATE public.revendas SET logradouro = '' WHERE logradouro IS NULL;
  BEGIN
    ALTER TABLE public.revendas ALTER COLUMN logradouro DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER TABLE public.revendas ALTER COLUMN logradouro SET NOT NULL;
  ALTER TABLE public.revendas ALTER COLUMN logradouro SET DEFAULT '';

  -- Número
  UPDATE public.revendas SET numero = '' WHERE numero IS NULL;
  BEGIN
    ALTER TABLE public.revendas ALTER COLUMN numero DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER TABLE public.revendas ALTER COLUMN numero SET NOT NULL;
  ALTER TABLE public.revendas ALTER COLUMN numero SET DEFAULT '';

  -- Bairro
  UPDATE public.revendas SET bairro = '' WHERE bairro IS NULL;
  BEGIN
    ALTER TABLE public.revendas ALTER COLUMN bairro DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER TABLE public.revendas ALTER COLUMN bairro SET NOT NULL;
  ALTER TABLE public.revendas ALTER COLUMN bairro SET DEFAULT '';

  -- Cidade
  UPDATE public.revendas SET cidade = '' WHERE cidade IS NULL;
  BEGIN
    ALTER TABLE public.revendas ALTER COLUMN cidade DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER TABLE public.revendas ALTER COLUMN cidade SET NOT NULL;
  ALTER TABLE public.revendas ALTER COLUMN cidade SET DEFAULT '';

  -- Estado
  UPDATE public.revendas SET estado = '' WHERE estado IS NULL;
  BEGIN
    ALTER TABLE public.revendas ALTER COLUMN estado DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  ALTER TABLE public.revendas ALTER COLUMN estado SET NOT NULL;
  ALTER TABLE public.revendas ALTER COLUMN estado SET DEFAULT '';

  RAISE NOTICE 'Campos de endereço configurados como obrigatórios';
END $$;

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'revendas'
ORDER BY ordinal_position;

