-- Migration para tornar campos de endereço obrigatórios na tabela revendas
-- Apenas complemento permanece opcional

-- IMPORTANTE: Remover campo "endereco" se existir (campo antigo que está causando erro)
-- Primeiro remove a constraint NOT NULL se existir, depois remove a coluna
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
    EXCEPTION WHEN OTHERS THEN
      -- Ignora erro se não houver constraint NOT NULL
      NULL;
    END;
    
    -- Remove a coluna
    ALTER TABLE public.revendas DROP COLUMN endereco;
    
    RAISE NOTICE 'Coluna "endereco" removida com sucesso';
  ELSE
    RAISE NOTICE 'Coluna "endereco" não existe, pulando remoção';
  END IF;
END $$;

-- Tornar campos de endereço obrigatórios (exceto complemento)
-- Primeiro atualiza valores NULL para string vazia, depois torna NOT NULL
DO $$ 
BEGIN
  -- CEP
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'cep'
  ) THEN
    -- Atualiza valores NULL para string vazia
    UPDATE public.revendas SET cep = '' WHERE cep IS NULL;
    -- Remove constraint NOT NULL se existir e adiciona novamente
    BEGIN
      ALTER TABLE public.revendas ALTER COLUMN cep DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    ALTER TABLE public.revendas ALTER COLUMN cep SET NOT NULL;
    ALTER TABLE public.revendas ALTER COLUMN cep SET DEFAULT '';
    RAISE NOTICE 'Campo CEP configurado como obrigatório';
  END IF;

  -- Logradouro
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'logradouro'
  ) THEN
    UPDATE public.revendas SET logradouro = '' WHERE logradouro IS NULL;
    BEGIN
      ALTER TABLE public.revendas ALTER COLUMN logradouro DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    ALTER TABLE public.revendas ALTER COLUMN logradouro SET NOT NULL;
    ALTER TABLE public.revendas ALTER COLUMN logradouro SET DEFAULT '';
    RAISE NOTICE 'Campo Logradouro configurado como obrigatório';
  END IF;

  -- Número
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'numero'
  ) THEN
    UPDATE public.revendas SET numero = '' WHERE numero IS NULL;
    BEGIN
      ALTER TABLE public.revendas ALTER COLUMN numero DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    ALTER TABLE public.revendas ALTER COLUMN numero SET NOT NULL;
    ALTER TABLE public.revendas ALTER COLUMN numero SET DEFAULT '';
    RAISE NOTICE 'Campo Número configurado como obrigatório';
  END IF;

  -- Bairro
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'bairro'
  ) THEN
    UPDATE public.revendas SET bairro = '' WHERE bairro IS NULL;
    BEGIN
      ALTER TABLE public.revendas ALTER COLUMN bairro DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    ALTER TABLE public.revendas ALTER COLUMN bairro SET NOT NULL;
    ALTER TABLE public.revendas ALTER COLUMN bairro SET DEFAULT '';
    RAISE NOTICE 'Campo Bairro configurado como obrigatório';
  END IF;

  -- Cidade
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'cidade'
  ) THEN
    UPDATE public.revendas SET cidade = '' WHERE cidade IS NULL;
    BEGIN
      ALTER TABLE public.revendas ALTER COLUMN cidade DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    ALTER TABLE public.revendas ALTER COLUMN cidade SET NOT NULL;
    ALTER TABLE public.revendas ALTER COLUMN cidade SET DEFAULT '';
    RAISE NOTICE 'Campo Cidade configurado como obrigatório';
  END IF;

  -- Estado
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'estado'
  ) THEN
    UPDATE public.revendas SET estado = '' WHERE estado IS NULL;
    BEGIN
      ALTER TABLE public.revendas ALTER COLUMN estado DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    ALTER TABLE public.revendas ALTER COLUMN estado SET NOT NULL;
    ALTER TABLE public.revendas ALTER COLUMN estado SET DEFAULT '';
    RAISE NOTICE 'Campo Estado configurado como obrigatório';
  END IF;

  -- Complemento permanece opcional (não alteramos)
  RAISE NOTICE 'Migration concluída: campos de endereço configurados como obrigatórios (exceto complemento)';
END $$;

