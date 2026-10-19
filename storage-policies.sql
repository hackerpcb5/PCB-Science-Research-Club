-- ============================================================
-- Políticas de Storage (Supabase) — Bucket: uploads
-- ============================================================
-- Este script crea el bucket `uploads` y aplica políticas
-- de acceso (RLS) para subir, leer y borrar archivos.
--
-- El bucket `uploads` se usa para todo el contenido:
--   • Portadas de artículos científicos
--   • PDFs de artículos científicos
--   • Imágenes de la galería (slideshow)
--   • Fotos de los miembros de directiva
--   • Portadas de artículos del periódico escolar
--   • Fotos de autores del periódico
--   • Imágenes de eventos del periódico
--   • Imágenes de galería de artículos del periódico
--
-- Los archivos se guardan directamente en la raíz del bucket
-- sin subcarpetas, usando nombres únicos basados en timestamp.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Crear el bucket (solo se crea si no existe)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Habilitar RLS en storage.objects
-- ------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. Políticas
-- ------------------------------------------------------------

-- 3a. SELECT — Lectura pública (cualquiera puede ver archivos)
CREATE POLICY "Public read access for uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- 3b. INSERT — Sólo usuarios autenticados pueden subir
CREATE POLICY "Authenticated users can upload to uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- 3c. UPDATE — Sólo usuarios autenticados pueden modificar
CREATE POLICY "Authenticated users can update uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- 3d. DELETE — Sólo usuarios autenticados pueden borrar
CREATE POLICY "Authenticated users can delete uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- ------------------------------------------------------------
-- 4. Comentario resumen de permisos
-- ------------------------------------------------------------
COMMENT ON POLICY "Public read access for uploads"
ON storage.objects
IS 'Cualquier visita puede leer archivos del bucket uploads.';

COMMENT ON POLICY "Authenticated users can upload to uploads"
ON storage.objects
IS 'Usuarios autenticados pueden subir archivos al bucket uploads.';

COMMENT ON POLICY "Authenticated users can update uploads"
ON storage.objects
IS 'Usuarios autenticados pueden actualizar archivos del bucket uploads.';

COMMENT ON POLICY "Authenticated users can delete uploads"
ON storage.objects
IS 'Usuarios autenticados pueden borrar archivos del bucket uploads.';