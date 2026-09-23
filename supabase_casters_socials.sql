-- Migración para añadir redes sociales completas a la tabla casters
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_fb text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_tiktok text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_kick text;
ALTER TABLE public.casters ADD COLUMN IF NOT EXISTS social_yt text;
