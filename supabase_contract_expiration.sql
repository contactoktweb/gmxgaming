-- ========================================================================================
-- EXPIRACIÓN AUTOMÁTICA DE CONTRATOS
-- ========================================================================================
-- Los contratos guardan su fecha de fin en contracts.end_date, pero nada cambiaba su estado
-- al vencer: seguían 'active' indefinidamente (el panel solo mostraba "Expirado").
-- Ejecutar una vez en el SQL Editor de Supabase (proyecto de producción).

-- ----------------------------------------------------------------------------------------
-- 1. Función que concluye los contratos vencidos
--    end_date se guarda como fecha (medianoche), así que el contrato es válido durante
--    todo su último día y vence al terminar ese día.
-- ----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_contracts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.contracts
  SET status = 'completado',
      conclusion_date = end_date + interval '1 day'
  WHERE status IN ('active', 'activo', 'pending_player_release', 'pending_manager_release')
    AND end_date IS NOT NULL
    AND end_date + interval '1 day' <= now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Permite que el panel y el formulario de contratos la ejecuten como respaldo
GRANT EXECUTE ON FUNCTION public.expire_contracts() TO authenticated;

-- ----------------------------------------------------------------------------------------
-- 2. Tarea programada: ejecutar cada hora
--    Si falla con "extension pg_cron does not exist", actívala en
--    Supabase → Database → Extensions → pg_cron, y vuelve a ejecutar este bloque.
-- ----------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('expire-contracts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-contracts');

SELECT cron.schedule('expire-contracts', '0 * * * *', $$SELECT public.expire_contracts()$$);

-- ----------------------------------------------------------------------------------------
-- 3. Concluir ahora los contratos que ya vencieron (devuelve cuántos cambió)
-- ----------------------------------------------------------------------------------------
SELECT public.expire_contracts() AS contratos_concluidos;
