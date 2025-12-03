-- =====================================================
-- POLÍTICAS RLS PARA STORAGE BUCKETS
-- Execute este script APÓS criar os buckets no Supabase Dashboard
-- =====================================================

-- IMPORTANTE: Primeiro crie os buckets manualmente:
-- 1. Supabase Dashboard > Storage > New bucket
-- 2. Criar bucket "produtos" (público)
-- 3. Criar bucket "logos-revendas" (público)

-- =====================================================
-- POLÍTICAS PARA BUCKET "produtos"
-- =====================================================

-- Política 1: Upload permitido para revendas
-- NOTA: storage.foldername retorna [bucket, revendaId, produtoId, ...]
-- Então o revendaId está em [2], não em [1]!
DROP POLICY IF EXISTS "Revendas podem fazer upload de produtos" ON storage.objects;
CREATE POLICY "Revendas podem fazer upload de produtos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'produtos' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política 2: Leitura pública
DROP POLICY IF EXISTS "Produtos são públicos para leitura" ON storage.objects;
CREATE POLICY "Produtos são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produtos');

-- Política 3: Revendas podem deletar seus arquivos
DROP POLICY IF EXISTS "Revendas podem deletar seus produtos" ON storage.objects;
CREATE POLICY "Revendas podem deletar seus produtos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'produtos' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política 4: Revendas podem atualizar seus arquivos
DROP POLICY IF EXISTS "Revendas podem atualizar seus produtos" ON storage.objects;
CREATE POLICY "Revendas podem atualizar seus produtos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'produtos' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- POLÍTICAS PARA BUCKET "logos-revendas"
-- =====================================================

-- Política 1: Upload permitido para revendas
DROP POLICY IF EXISTS "Revendas podem fazer upload de logos" ON storage.objects;
CREATE POLICY "Revendas podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos-revendas' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política 2: Leitura pública
DROP POLICY IF EXISTS "Logos são públicas para leitura" ON storage.objects;
CREATE POLICY "Logos são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos-revendas');

-- Política 3: Revendas podem deletar suas logos
DROP POLICY IF EXISTS "Revendas podem deletar suas logos" ON storage.objects;
CREATE POLICY "Revendas podem deletar suas logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos-revendas' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- Política 4: Revendas podem atualizar suas logos
DROP POLICY IF EXISTS "Revendas podem atualizar suas logos" ON storage.objects;
CREATE POLICY "Revendas podem atualizar suas logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos-revendas' AND
  (storage.foldername(name))[2] IN (
    SELECT id::text FROM public.revendas WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

