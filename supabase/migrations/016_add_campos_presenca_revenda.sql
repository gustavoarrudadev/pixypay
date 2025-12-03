-- Migration 016: Adicionar campos de presença na loja para revendas
-- Esta migration adiciona campos para link público, nome público e logo
-- e atualiza as políticas RLS para permitir que revendas atualizem esses campos

-- Adicionar campos de presença na loja
DO $$ 
BEGIN
  -- Link público (slug único para acesso à loja)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'link_publico'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN link_publico VARCHAR(100) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_revendas_link_publico ON public.revendas(link_publico);
    RAISE NOTICE 'Campo link_publico adicionado';
  END IF;

  -- Nome público (nome que aparece na loja pública)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'nome_publico'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN nome_publico VARCHAR(255);
    RAISE NOTICE 'Campo nome_publico adicionado';
  END IF;

  -- URL da logo da revenda
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'revendas' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.revendas ADD COLUMN logo_url TEXT;
    RAISE NOTICE 'Campo logo_url adicionado';
  END IF;
END $$;

-- Política: Revendas podem atualizar seus próprios campos de presença
-- Esta política permite que revendas atualizem link_publico, nome_publico e logo_url
-- NOTA: A validação de unicidade do link_publico é feita via trigger para evitar recursão infinita
DROP POLICY IF EXISTS "Revendas podem atualizar presença" ON public.revendas;
CREATE POLICY "Revendas podem atualizar presença"
ON public.revendas FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política: Acesso público para ler dados de presença (necessário para loja pública)
-- Permite que qualquer pessoa leia link_publico, nome_publico e logo_url
CREATE POLICY IF NOT EXISTS "Dados de presença são públicos"
ON public.revendas FOR SELECT
USING (link_publico IS NOT NULL);

-- Trigger para validar unicidade do link_publico
-- Isso evita recursão infinita na política RLS
CREATE OR REPLACE FUNCTION validar_link_publico_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Se link_publico está sendo alterado e não é NULL
  IF NEW.link_publico IS NOT NULL AND (OLD.link_publico IS NULL OR NEW.link_publico != OLD.link_publico) THEN
    -- Verifica se já existe outra revenda com o mesmo link
    IF EXISTS (
      SELECT 1 FROM public.revendas
      WHERE link_publico = NEW.link_publico
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Link público "%" já está sendo usado por outra revenda', NEW.link_publico;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validar_link_publico ON public.revendas;
CREATE TRIGGER trigger_validar_link_publico
BEFORE UPDATE ON public.revendas
FOR EACH ROW
WHEN (NEW.link_publico IS DISTINCT FROM OLD.link_publico)
EXECUTE FUNCTION validar_link_publico_trigger();

-- Comentários nas colunas
COMMENT ON COLUMN public.revendas.link_publico IS 'Slug único para acesso público à loja (ex: revenda-exemplo)';
COMMENT ON COLUMN public.revendas.nome_publico IS 'Nome que aparece na loja pública';
COMMENT ON COLUMN public.revendas.logo_url IS 'URL da logo da revenda no Supabase Storage';

