-- Migration 018: Atualizar políticas RLS do Storage para suportar impersonation de admin
-- Esta migration atualiza as políticas RLS para permitir que admins acessem arquivos de revendas
-- quando estiverem em modo impersonation (visualizando como revenda)

-- =====================================================
-- ATUALIZAÇÃO DAS POLÍTICAS PARA BUCKET "produtos"
-- =====================================================

-- Política 1: Upload permitido para revendas E admins
DROP POLICY IF EXISTS "Revendas podem fazer upload de produtos" ON storage.objects;
CREATE POLICY "Revendas podem fazer upload de produtos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'produtos' AND
  (
    -- Revendas podem fazer upload de seus próprios produtos
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
    )
    OR
    -- Admins podem fazer upload de produtos de qualquer revenda
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Política 2: Leitura pública de produtos
DROP POLICY IF EXISTS "Produtos são públicos para leitura" ON storage.objects;
CREATE POLICY "Produtos são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produtos');

-- Política 3: Revendas E admins podem deletar produtos
DROP POLICY IF EXISTS "Revendas podem deletar seus produtos" ON storage.objects;
CREATE POLICY "Revendas podem deletar seus produtos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'produtos' AND
  (
    -- Revendas podem deletar seus próprios produtos
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
    )
    OR
    -- Admins podem deletar produtos de qualquer revenda
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Política 4: Revendas E admins podem atualizar produtos
DROP POLICY IF EXISTS "Revendas podem atualizar seus produtos" ON storage.objects;
CREATE POLICY "Revendas podem atualizar seus produtos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'produtos' AND
  (
    -- Revendas podem atualizar seus próprios produtos
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
    )
    OR
    -- Admins podem atualizar produtos de qualquer revenda
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- =====================================================
-- ATUALIZAÇÃO DAS POLÍTICAS PARA BUCKET "logos-revendas"
-- =====================================================

-- Política 1: Upload permitido para revendas E admins
DROP POLICY IF EXISTS "Revendas podem fazer upload de logos" ON storage.objects;
CREATE POLICY "Revendas podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos-revendas' AND
  (
    -- Revendas podem fazer upload de suas próprias logos
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
    )
    OR
    -- Admins podem fazer upload de logos de qualquer revenda
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Política 2: Leitura pública de logos
DROP POLICY IF EXISTS "Logos são públicas para leitura" ON storage.objects;
CREATE POLICY "Logos são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos-revendas');

-- Política 3: Revendas E admins podem deletar logos
DROP POLICY IF EXISTS "Revendas podem deletar suas logos" ON storage.objects;
CREATE POLICY "Revendas podem deletar suas logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos-revendas' AND
  (
    -- Revendas podem deletar suas próprias logos
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
    )
    OR
    -- Admins podem deletar logos de qualquer revenda
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Política 4: Revendas E admins podem atualizar logos
DROP POLICY IF EXISTS "Revendas podem atualizar suas logos" ON storage.objects;
CREATE POLICY "Revendas podem atualizar suas logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos-revendas' AND
  (
    -- Revendas podem atualizar suas próprias logos
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
    )
    OR
    -- Admins podem atualizar logos de qualquer revenda
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

