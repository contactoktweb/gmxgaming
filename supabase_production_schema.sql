-- ==============================================================================
-- GMX GAMING — ESQUEMA COMPLETO DE PRODUCCIÓN (SUPABASE)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu NUEVO proyecto de Supabase (Producción).
-- Crea todas las tablas, columnas, restricciones, storage buckets y políticas de seguridad (RLS).
-- ==============================================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA PROFILES (Usuarios, Administradores, Jugadores y Managers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  nickname text UNIQUE,
  discord_handle text,
  role text DEFAULT 'user', -- 'user', 'admin_principal', 'admin_secundario', 'admin_visitante'
  avatar_url text,
  cover_url text,
  bio text,
  country text DEFAULT 'México',
  phone text,
  gender text,
  birth_date date,
  
  -- Campos específicos de Jugador
  is_player boolean DEFAULT false,
  player_status text DEFAULT 'none', -- 'none', 'pending', 'active', 'rejected', 'inactive', 'banned'
  is_featured boolean DEFAULT false,
  passport_number text,
  passport_photo_url text,
  id_photo_url text,
  closest_airport text,
  
  -- Redes Sociales
  social_ig text,
  social_tiktok text,
  social_yt text,
  social_fb text,
  social_twitch text,
  social_kick text,
  social_x text,

  created_at timestamptz DEFAULT now()
);

-- 1.1 TRIGGER AUTOMÁTICO: CREACIÓN Y SINCRONIZACIÓN DE PERFIL AL REGISTRARSE (Google y Correo)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, role, is_player, player_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    'user',
    false,
    'none'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TABLA PLAYER_GAME_INFO (Cuentas de Juego)
CREATE TABLE IF NOT EXISTS public.player_game_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  game text NOT NULL DEFAULT 'Mobile Legends',
  game_id text,
  server text,
  game_nickname text,
  country_account text,
  can_edit_core_data boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. TABLA TEAMS (Equipos)
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  tag text,
  hashtag text,
  logo_url text,
  jersey_url text,
  country text DEFAULT 'México',
  region text,
  description text,
  gender_category text DEFAULT 'mixed', -- 'mixed', 'female'
  status text DEFAULT 'pending', -- 'pending', 'active', 'rejected', 'inactive', 'banned'
  foundation_date timestamptz DEFAULT now(),
  
  -- Redes Sociales del Equipo
  social_ig text,
  social_tiktok text,
  social_yt text,
  social_fb text,
  social_twitch text,
  social_kick text,
  social_x text,

  created_at timestamptz DEFAULT now()
);

-- 4. TABLA CONTRACTS (Contratos Jugador - Equipo)
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  roles jsonb NOT NULL DEFAULT '["Titular"]',
  team_gender_category text DEFAULT 'mixed', -- 'mixed', 'female'
  
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  conclusion_date timestamptz,
  
  status text DEFAULT 'pending_manager', -- 'pending_manager', 'active', 'cancel_req_player', 'cancel_req_manager', 'completado', 'cancelado', 'rejected'
  created_at timestamptz DEFAULT now()
);

-- 5. TABLA VALIDATIONS (Peticiones de Altas y Bajas para Administradores)
CREATE TABLE IF NOT EXISTS public.validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'equipo', 'jugador', 'contrato', 'baja_contrato', etc.
  target_name text,
  submitted_by text,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 6. TABLA TOURNAMENTS (Torneos)
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  game text DEFAULT 'Mobile Legends',
  type text DEFAULT 'Relámpago', -- 'Relámpago', 'Clasificatorio', 'Liga', 'Exhibición'
  start_date timestamptz,
  end_date timestamptz,
  prizepool_total numeric DEFAULT 0,
  prizepool_distribution jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'past'
  rules text,
  format text,
  max_teams integer DEFAULT 16,
  banner_url text,
  created_at timestamptz DEFAULT now()
);

-- 7. TABLA TOURNAMENT_TEAMS (Equipos inscritos en torneos)
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (tournament_id, team_id)
);

-- 8. TABLA MATCHES (Partidas y Cruces de Torneos)
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_a_id uuid REFERENCES public.teams(id),
  team_b_id uuid REFERENCES public.teams(id),
  score_a integer DEFAULT 0,
  score_b integer DEFAULT 0,
  match_date timestamptz,
  phase text,
  status text DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed'
  created_at timestamptz DEFAULT now()
);

-- 9. TABLAS DE CONTENIDO: MEDIA Y CASTERS
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nickname text,
  avatar_url text,
  instagram_url text,
  twitter_url text,
  twitch_url text,
  created_at timestamptz DEFAULT now()
);

-- 10. TABLA ADMIN_SETTINGS (Configuraciones dinámicas)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Configuración inicial por defecto
INSERT INTO public.admin_settings (id, value)
VALUES 
  ('enabled_countries', '["Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela"]'::jsonb),
  ('enabled_games', '["Mobile Legends"]'::jsonb),
  ('tournament_types', '["Relámpago", "Clasificatorio", "Liga", "Exhibición"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- ==============================================================================
-- SEGURIDAD: HABILITACIÓN DE RLS Y POLÍTICAS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_game_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Player Game Info" ON public.player_game_info;
CREATE POLICY "Public Read Player Game Info" ON public.player_game_info FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Teams" ON public.teams;
CREATE POLICY "Public Read Teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Contracts" ON public.contracts;
CREATE POLICY "Public Read Contracts" ON public.contracts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Validations" ON public.validations;
CREATE POLICY "Public Read Validations" ON public.validations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Tournaments" ON public.tournaments;
CREATE POLICY "Public Read Tournaments" ON public.tournaments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Tournament Teams" ON public.tournament_teams;
CREATE POLICY "Public Read Tournament Teams" ON public.tournament_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Matches" ON public.matches;
CREATE POLICY "Public Read Matches" ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Media" ON public.media;
CREATE POLICY "Public Read Media" ON public.media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Casters" ON public.casters;
CREATE POLICY "Public Read Casters" ON public.casters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Settings" ON public.admin_settings;
CREATE POLICY "Public Read Settings" ON public.admin_settings FOR SELECT USING (true);

-- Políticas de escritura (inserción y actualización)
DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users Insert Profile" ON public.profiles;
CREATE POLICY "Users Insert Profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users Insert Player Game Info" ON public.player_game_info;
CREATE POLICY "Users Insert Player Game Info" ON public.player_game_info FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users Update Player Game Info" ON public.player_game_info;
CREATE POLICY "Users Update Player Game Info" ON public.player_game_info FOR UPDATE USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users Insert Teams" ON public.teams;
CREATE POLICY "Users Insert Teams" ON public.teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users Update Teams" ON public.teams;
CREATE POLICY "Users Update Teams" ON public.teams FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users Insert Contracts" ON public.contracts;
CREATE POLICY "Users Insert Contracts" ON public.contracts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users Update Contracts" ON public.contracts;
CREATE POLICY "Users Update Contracts" ON public.contracts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users Insert Validations" ON public.validations;
CREATE POLICY "Users Insert Validations" ON public.validations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users Update Validations" ON public.validations;
CREATE POLICY "Users Update Validations" ON public.validations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users Delete Validations" ON public.validations;
CREATE POLICY "Users Delete Validations" ON public.validations FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admin Manage Media" ON public.media;
CREATE POLICY "Admin Manage Media" ON public.media FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin Manage Casters" ON public.casters;
CREATE POLICY "Admin Manage Casters" ON public.casters FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin Manage Settings" ON public.admin_settings;
CREATE POLICY "Admin Manage Settings" ON public.admin_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin Manage Tournaments" ON public.tournaments;
CREATE POLICY "Admin Manage Tournaments" ON public.tournaments FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin Manage Matches" ON public.matches;
CREATE POLICY "Admin Manage Matches" ON public.matches FOR ALL USING (true);

-- ==============================================================================
-- CREACIÓN DE STORAGE BUCKETS (teams, avatars, documents)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('teams', 'teams', true),
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para lectura y subida pública / autenticada
DROP POLICY IF EXISTS "Public Read Teams Bucket" ON storage.objects;
CREATE POLICY "Public Read Teams Bucket" ON storage.objects FOR SELECT USING (bucket_id IN ('teams', 'avatars'));

DROP POLICY IF EXISTS "Public Insert Teams Bucket" ON storage.objects;
CREATE POLICY "Public Insert Teams Bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('teams', 'avatars', 'documents'));

DROP POLICY IF EXISTS "Public Update Teams Bucket" ON storage.objects;
CREATE POLICY "Public Update Teams Bucket" ON storage.objects FOR UPDATE USING (bucket_id IN ('teams', 'avatars', 'documents'));

DROP POLICY IF EXISTS "Public Delete Teams Bucket" ON storage.objects;
CREATE POLICY "Public Delete Teams Bucket" ON storage.objects FOR DELETE USING (bucket_id IN ('teams', 'avatars', 'documents'));
