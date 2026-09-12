-- ==========================================
-- GMX GAMING: MIGRATION (ALTER TABLES)
-- ==========================================

-- 1. PROFILES (Add new columns)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS nickname text UNIQUE,
  ADD COLUMN IF NOT EXISTS discord_handle text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_player boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS player_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_number text,
  ADD COLUMN IF NOT EXISTS passport_photo_url text,
  ADD COLUMN IF NOT EXISTS id_photo_url text,
  ADD COLUMN IF NOT EXISTS closest_airport text,
  ADD COLUMN IF NOT EXISTS social_ig text,
  ADD COLUMN IF NOT EXISTS social_tiktok text,
  ADD COLUMN IF NOT EXISTS social_yt text,
  ADD COLUMN IF NOT EXISTS social_fb text,
  ADD COLUMN IF NOT EXISTS social_twitch text,
  ADD COLUMN IF NOT EXISTS social_kick text,
  ADD COLUMN IF NOT EXISTS social_x text;

-- 2. TEAMS (Add new columns)
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS hashtag text,
  ADD COLUMN IF NOT EXISTS jersey_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS social_ig text,
  ADD COLUMN IF NOT EXISTS social_tiktok text,
  ADD COLUMN IF NOT EXISTS social_yt text,
  ADD COLUMN IF NOT EXISTS social_fb text,
  ADD COLUMN IF NOT EXISTS social_twitch text,
  ADD COLUMN IF NOT EXISTS social_kick text,
  ADD COLUMN IF NOT EXISTS social_x text;

-- 2.5. TOURNAMENT_TEMPLATES (Plantillas de Torneos)
CREATE TABLE IF NOT EXISTS public.tournament_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  game text DEFAULT 'Mobile Legends',
  type text DEFAULT 'Relámpago',
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tournament_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.tournament_templates;
CREATE POLICY "Public Access" ON public.tournament_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.tournament_templates;
CREATE POLICY "Admin All" ON public.tournament_templates FOR ALL USING (true);

-- 3. TOURNAMENTS (Add new columns)
ALTER TABLE public.tournaments 
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.tournament_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS game text DEFAULT 'Mobile Legends',
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS prizepool_total numeric,
  ADD COLUMN IF NOT EXISTS prizepool_distribution jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Sincronizar imágenes en torneos ya existentes que tengan plantilla vinculada
UPDATE public.tournaments t
SET 
  logo_url = tmpl.logo_url,
  banner_url = tmpl.logo_url,
  image_url = tmpl.logo_url
FROM public.tournament_templates tmpl
WHERE t.template_id = tmpl.id
  AND (t.logo_url IS NULL OR t.logo_url = '');

-- 4. MATCHES (Recreate completely)
DROP TABLE IF EXISTS public.matches CASCADE;
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_a_id uuid REFERENCES public.teams(id),
  team_b_id uuid REFERENCES public.teams(id),
  score_a integer DEFAULT 0,
  score_b integer DEFAULT 0,
  match_date timestamptz,
  phase text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

-- 5. NEW TABLES (Player Game Info, Contracts, Media Links, Casters, Admin Settings)
DROP TABLE IF EXISTS public.player_game_info CASCADE;
CREATE TABLE public.player_game_info (
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

DROP TABLE IF EXISTS public.contracts CASCADE;
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  roles jsonb NOT NULL,
  team_gender_category text DEFAULT 'mixed',
  start_date timestamptz,
  end_date timestamptz,
  conclusion_date timestamptz,
  status text DEFAULT 'pending_manager',
  created_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS public.tournament_teams CASCADE;
CREATE TABLE public.tournament_teams (
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, team_id)
);

DROP TABLE IF EXISTS public.media_links CASCADE;
CREATE TABLE public.media_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  url text,
  type text DEFAULT 'youtube',
  created_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS public.casters CASCADE;
CREATE TABLE public.casters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  nickname text,
  photo_url text,
  social_ig text,
  social_x text,
  social_twitch text,
  created_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS public.admin_settings CASCADE;
CREATE TABLE public.admin_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. Insert Default Settings
INSERT INTO public.admin_settings (id, value)
VALUES 
  ('enabled_countries', '["Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela"]'),
  ('enabled_games', '["Mobile Legends"]'),
  ('tournament_types', '["Relámpago", "Clasificatorio", "Liga", "Exhibición"]')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- 7. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_game_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 8. Policies
-- DROP policies if they exist so we can recreate them safely without errors
DROP POLICY IF EXISTS "Public Access" ON public.profiles;
DROP POLICY IF EXISTS "Public Access" ON public.player_game_info;
DROP POLICY IF EXISTS "Public Access" ON public.teams;
DROP POLICY IF EXISTS "Public Access" ON public.contracts;
DROP POLICY IF EXISTS "Public Access" ON public.tournaments;
DROP POLICY IF EXISTS "Public Access" ON public.tournament_teams;
DROP POLICY IF EXISTS "Public Access" ON public.matches;
DROP POLICY IF EXISTS "Public Access" ON public.media_links;
DROP POLICY IF EXISTS "Public Access" ON public.casters;
DROP POLICY IF EXISTS "Public Access" ON public.admin_settings;

CREATE POLICY "Public Access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.player_game_info FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.tournament_teams FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.media_links FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.casters FOR SELECT USING (true);
CREATE POLICY "Public Access" ON public.admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "User Update Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin All" ON public.profiles;
CREATE POLICY "Admin All" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "User Insert Teams" ON public.teams;
CREATE POLICY "User Insert Teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS "User Update Teams" ON public.teams;
CREATE POLICY "User Update Teams" ON public.teams FOR UPDATE USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS "User Insert Contracts" ON public.contracts;
CREATE POLICY "User Insert Contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "User Update Contracts" ON public.contracts;
CREATE POLICY "User Update Contracts" ON public.contracts FOR UPDATE USING (auth.uid() = player_id);
