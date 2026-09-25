-- ==========================================================
-- GMX GAMING — MIGRACIÓN OFICIAL: REDES SOCIALES PARA CASTERS
-- ==========================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- URL: https://supabase.com/dashboard/project/zobxsyipyhlanigjakel/sql/new

-- 1. Asegurar todas las columnas de la tabla casters (idempotente)
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_twitch text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_ig text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_x text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS twitch_url text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS twitter_url text;

-- Columnas añadidas para las 7 plataformas completas:
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_fb text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_tiktok text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_kick text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_yt text;

-- 2. Recargar caché de esquema de PostgREST inmediatamente
NOTIFY pgrst, 'reload schema';
