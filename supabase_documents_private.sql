-- ========================================================================================
-- DOCUMENTOS PRIVADOS (INE / PASAPORTE): SOLO ADMINISTRADORES PUEDEN VERLOS
-- ========================================================================================
-- Ejecutar una vez en el SQL Editor de Supabase (proyecto de producción).
--
-- Qué hace:
--   1. Bucket 'documents' privado: los enlaces públicos dejan de abrir.
--   2. Leer, modificar o borrar documentos: solo administradores. El panel los muestra con
--      enlaces firmados temporales que solo un admin puede generar.
--   3. Subir documentos: cualquier usuario con sesión (los jugadores suben su INE).
--
-- Las reglas 'restrictive' se SUMAN a las que ya existan (Postgres exige que se cumplan todas),
-- así que limitan solo el bucket 'documents' sin tocar las fotos y logos ('avatars', 'teams').

-- ----------------------------------------------------------------------------------------
-- 1. ¿Quién es administrador? (roles de profiles.role)
--    Si 'admin_visitante' no debe ver documentos, quítalo de la lista.
-- ----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_gmx_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'admin_principal', 'admin_secundario', 'admin_visitante')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_gmx_admin() TO anon, authenticated;

-- ----------------------------------------------------------------------------------------
-- 2. Reglas de acceso para el bucket 'documents'
-- ----------------------------------------------------------------------------------------
-- Leer (y generar enlaces firmados): solo administradores
DROP POLICY IF EXISTS "GMX documentos: solo admins leen" ON storage.objects;
CREATE POLICY "GMX documentos: solo admins leen" ON storage.objects
  AS RESTRICTIVE FOR SELECT TO public
  USING (bucket_id <> 'documents' OR public.is_gmx_admin());

DROP POLICY IF EXISTS "GMX documentos: admins pueden leer" ON storage.objects;
CREATE POLICY "GMX documentos: admins pueden leer" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.is_gmx_admin());

-- Subir: cualquier usuario con sesión
DROP POLICY IF EXISTS "GMX documentos: subir solo con sesion" ON storage.objects;
CREATE POLICY "GMX documentos: subir solo con sesion" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (bucket_id <> 'documents' OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMX documentos: usuarios pueden subir" ON storage.objects;
CREATE POLICY "GMX documentos: usuarios pueden subir" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Modificar o borrar: solo administradores
DROP POLICY IF EXISTS "GMX documentos: solo admins modifican" ON storage.objects;
CREATE POLICY "GMX documentos: solo admins modifican" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO public
  USING (bucket_id <> 'documents' OR public.is_gmx_admin())
  WITH CHECK (bucket_id <> 'documents' OR public.is_gmx_admin());

DROP POLICY IF EXISTS "GMX documentos: solo admins borran" ON storage.objects;
CREATE POLICY "GMX documentos: solo admins borran" ON storage.objects
  AS RESTRICTIVE FOR DELETE TO public
  USING (bucket_id <> 'documents' OR public.is_gmx_admin());

-- ----------------------------------------------------------------------------------------
-- 3. Bucket privado (no cambia nada si ya lo es). Va al final: si Supabase no permitiera
--    cambiarlo por SQL, las reglas de arriba ya quedaron creadas. En ese caso hazlo en
--    Storage > documents > Edit bucket > desactivar "Public bucket".
-- ----------------------------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- ----------------------------------------------------------------------------------------
-- 4. Verificación
-- ----------------------------------------------------------------------------------------
-- Debe decir public = false
SELECT id, public FROM storage.buckets WHERE id = 'documents';

-- Deben aparecer las 6 reglas "GMX documentos: ..."
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
