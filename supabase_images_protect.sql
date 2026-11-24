-- ========================================================================================
-- PROTECCIÓN DE FOTOS Y LOGOS (buckets 'avatars' y 'teams')
-- ========================================================================================
-- Ejecutar una vez en el SQL Editor de Supabase (proyecto de producción), DESPUÉS de que Vercel
-- haya publicado la versión que sube imágenes sin "upsert" (si no, las subidas de los jugadores
-- fallarían, porque "upsert" exige permiso para reemplazar archivos).
--
-- Requiere haber ejecutado antes supabase_documents_private.sql (crea public.is_gmx_admin()).
--
-- NO borra, mueve ni modifica ningún archivo existente: solo limita quién puede hacerlo desde
-- ahora. Las fotos y logos se siguen viendo públicamente igual que antes.
--   - Subir:              cualquier usuario con sesión iniciada (jugadores, managers, admins)
--   - Reemplazar/borrar:  solo administradores (la página nunca lo hace; evita que alguien
--                         borre o cambie imágenes desde fuera de la página)
--
-- Las reglas 'restrictive' se SUMAN a las que ya existan, así que solo afectan a estos buckets.

-- ----------------------------------------------------------------------------------------
-- 0. Antes: cuántos archivos hay por bucket (anótalo; al final debe dar lo mismo)
-- ----------------------------------------------------------------------------------------
SELECT bucket_id, count(*) AS archivos FROM storage.objects GROUP BY bucket_id ORDER BY bucket_id;

-- ----------------------------------------------------------------------------------------
-- 1. Subir: solo con sesión iniciada
-- ----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "GMX imagenes: subir solo con sesion" ON storage.objects;
CREATE POLICY "GMX imagenes: subir solo con sesion" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (bucket_id NOT IN ('avatars', 'teams') OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMX imagenes: usuarios pueden subir" ON storage.objects;
CREATE POLICY "GMX imagenes: usuarios pueden subir" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'teams'));

-- ----------------------------------------------------------------------------------------
-- 2. Reemplazar o borrar: solo administradores
-- ----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "GMX imagenes: solo admins modifican" ON storage.objects;
CREATE POLICY "GMX imagenes: solo admins modifican" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO public
  USING (bucket_id NOT IN ('avatars', 'teams') OR public.is_gmx_admin())
  WITH CHECK (bucket_id NOT IN ('avatars', 'teams') OR public.is_gmx_admin());

DROP POLICY IF EXISTS "GMX imagenes: solo admins borran" ON storage.objects;
CREATE POLICY "GMX imagenes: solo admins borran" ON storage.objects
  AS RESTRICTIVE FOR DELETE TO public
  USING (bucket_id NOT IN ('avatars', 'teams') OR public.is_gmx_admin());

-- ----------------------------------------------------------------------------------------
-- 3. Verificación
-- ----------------------------------------------------------------------------------------
-- Deben aparecer 10 reglas "GMX ...": 6 de documentos y 4 de imágenes
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'GMX %'
ORDER BY policyname;

-- Después: debe dar los mismos números que el paso 0
SELECT bucket_id, count(*) AS archivos FROM storage.objects GROUP BY bucket_id ORDER BY bucket_id;
