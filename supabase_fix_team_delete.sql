-- ========================================================================================
-- FIX: Equipos "eliminados" que siguen existiendo (caso GMXVIXENS / GMX VIXENS)
-- ========================================================================================
-- En producción, las tablas teams y contracts tienen RLS con políticas SELECT/INSERT/UPDATE
-- pero NINGUNA política DELETE. Supabase no devuelve error en ese caso: el DELETE afecta
-- 0 filas, el panel muestra "Equipo eliminado" y el registro sigue en la base de datos.
-- Ejecutar en el SQL Editor de Supabase (proyecto de producción).

-- ----------------------------------------------------------------------------------------
-- 1. Políticas DELETE para administradores
-- ----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin Delete Teams" ON public.teams;
CREATE POLICY "Admin Delete Teams" ON public.teams FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'admin_principal', 'admin_secundario'))
);

DROP POLICY IF EXISTS "Admin Delete Contracts" ON public.contracts;
CREATE POLICY "Admin Delete Contracts" ON public.contracts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'admin_principal', 'admin_secundario'))
);

-- ----------------------------------------------------------------------------------------
-- 2. Diagnóstico: ver los dos registros de Vixens
-- ----------------------------------------------------------------------------------------
SELECT t.id, t.name, t.tag, t.status, t.created_at,
       (SELECT count(*) FROM public.contracts c WHERE c.team_id = t.id) AS contratos
FROM public.teams t
WHERE replace(upper(t.name), ' ', '') = 'GMXVIXENS'
ORDER BY t.created_at;

-- ----------------------------------------------------------------------------------------
-- 3. Corrección de datos: mover las jugadoras al equipo correcto y borrar el viejo
--    Revisar el resultado del paso 2 antes de ejecutar este bloque.
--    Equipo correcto: 'GMX VIXENS' (id d78946ec-aded-4a24-bbb5-bde2aa5616c7)
-- ----------------------------------------------------------------------------------------
BEGIN;

-- Reasignar contratos del registro viejo al correcto
UPDATE public.contracts
SET team_id = 'd78946ec-aded-4a24-bbb5-bde2aa5616c7'
WHERE team_id IN (SELECT id FROM public.teams WHERE name = 'GMXVIXENS');

-- Reasignar inscripciones a torneos y partidos, si las hubiera
UPDATE public.tournament_teams
SET team_id = 'd78946ec-aded-4a24-bbb5-bde2aa5616c7'
WHERE team_id IN (SELECT id FROM public.teams WHERE name = 'GMXVIXENS');

UPDATE public.matches SET team_a_id = 'd78946ec-aded-4a24-bbb5-bde2aa5616c7'
WHERE team_a_id IN (SELECT id FROM public.teams WHERE name = 'GMXVIXENS');
UPDATE public.matches SET team_b_id = 'd78946ec-aded-4a24-bbb5-bde2aa5616c7'
WHERE team_b_id IN (SELECT id FROM public.teams WHERE name = 'GMXVIXENS');

-- Asegurar que el equipo correcto sea visible en el sitio público
UPDATE public.teams SET status = 'active'
WHERE id = 'd78946ec-aded-4a24-bbb5-bde2aa5616c7';

-- Borrar el registro viejo
DELETE FROM public.teams WHERE name = 'GMXVIXENS';

COMMIT;

-- ----------------------------------------------------------------------------------------
-- 4. Diagnóstico de foto distinta (caso MY KILLARI)
--    El sitio público usa profiles.avatar_url; el panel de admin calcula la foto a partir
--    de las solicitudes de modificación. Si hay una modificación pendiente/rechazada cuya
--    foto propuesta ya está en profiles, cada vista muestra una imagen diferente.
-- ----------------------------------------------------------------------------------------
SELECT p.id, p.nickname, p.player_status, p.avatar_url AS foto_publica
FROM public.profiles p
WHERE upper(p.nickname) = 'MY KILLARI';

SELECT v.id, v.type, v.status, v.created_at,
       v.details->>'avatar_url'      AS foto_propuesta,
       v.details->>'original_avatar' AS foto_original
FROM public.validations v
WHERE v.details->>'user_id' = (SELECT id::text FROM public.profiles WHERE upper(nickname) = 'MY KILLARI')
ORDER BY v.created_at DESC;
