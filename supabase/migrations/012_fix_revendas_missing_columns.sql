-- Migration para adicionar campos faltantes na tabela revendas caso ela já exista
-- Esta migration é idempotente e pode ser executada mesmo se os campos já existirem

-- Adicionar campo user_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_revendas_user_id ON revendas(user_id);
  END IF;
END $$;

-- Verificar e adicionar campos de endereço se não existirem
DO $$ 
BEGIN
  -- CEP
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'cep'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN cep VARCHAR(9);
  END IF;

  -- Logradouro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'logradouro'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN logradouro VARCHAR(255);
  END IF;

  -- Número
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'numero'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN numero VARCHAR(50);
  END IF;

  -- Complemento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'complemento'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN complemento VARCHAR(255);
  END IF;

  -- Bairro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'bairro'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN bairro VARCHAR(100);
  END IF;

  -- Cidade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN cidade VARCHAR(100);
  END IF;

  -- Estado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'estado'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN estado VARCHAR(2);
  END IF;

  -- Marcas Trabalhadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'marcas_trabalhadas'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN marcas_trabalhadas JSONB;
  END IF;
END $$;

