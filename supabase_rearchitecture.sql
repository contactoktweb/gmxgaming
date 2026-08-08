-- ==========================================
-- GMX GAMING: DATABASE REARCHITECTURE
-- ==========================================

-- 1. PROFILES (Users, Managers, Players)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  nickname text UNIQUE,
  discord_handle text,
  role text DEFAULT 'user', -- 'user', 'admin'
  avatar_url text,
  cover_url text,
  
  -- Player specific
  is_player boolean DEFAULT false,
  player_status text DEFAULT 'none', -- 'none', 'pending', 'active', 'rejected', 'inactive', 'banned'
  is_featured boolean DEFAULT false,
  passport_number text,
  passport_photo_url text,
  id_photo_url text,
  closest_airport text,
  
  -- Social Media
  social_ig text,
  social_tiktok text,
  social_yt text,
  social_fb text,
  social_twitch text,
  social_kick text,
  social_x text,

  created_at timestamptz DEFAULT now()
);

-- 2. PLAYER GAME INFO (Many-to-One with Profiles, in case of multiple games later)
CREATE TABLE IF NOT EXISTS public.player_game_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  game text NOT NULL DEFAULT 'Mobile Legends',
  game_id text,
  server text,
  game_nickname text,
  country_account text,
  can_edit_core_data boolean DEFAULT false, -- If admin unlocked ID, Server, Country
  created_at timestamptz DEFAULT now()
);

-- 3. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  tag text,
  hashtag text,
  logo_url text,
  jersey_url text,
  country text,
  status text DEFAULT 'pending', -- 'pending', 'active', 'rejected', 'inactive', 'banned'
  
  -- Social Media
  social_ig text,
  social_tiktok text,
  social_yt text,
  social_fb text,
  social_twitch text,
  social_kick text,
  social_x text,

  created_at timestamptz DEFAULT now()
);

-- 4. CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  roles jsonb NOT NULL, -- Array of roles
  team_gender_category text DEFAULT 'mixed', -- 'mixed', 'female'
  
  start_date timestamptz,
  end_date timestamptz,
  conclusion_date timestamptz,
  
  status text DEFAULT 'pending_manager', -- 'pending_manager', 'active', 'cancel_req_player', 'cancel_req_manager', 'cancelled', 'rejected'
  
  created_at timestamptz DEFAULT now()
);

-- 5. TOURNAMENTS & MATCHES
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  game text DEFAULT 'Mobile Legends',
  type text, -- 'Relámpago', 'Clasificatorio'
  start_date timestamptz,
  end_date timestamptz,
  prizepool_total numeric,
  prizepool_distribution jsonb,
  status text DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'past'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_teams (
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_a_id uuid REFERENCES public.teams(id),
  team_b_id uuid REFERENCES public.teams(id),
  score_a integer DEFAULT 0,
  score_b integer DEFAULT 0,
  match_date timestamptz,
  phase text,
  status text DEFAULT 'scheduled', -- 'scheduled', 'completed'
  created_at timestamptz DEFAULT now()
);

-- 6. CONTENT (Media & Casters)
CREATE TABLE IF NOT EXISTS public.media_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  url text,
  type text DEFAULT 'youtube',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  nickname text,
  photo_url text,
  social_ig text,
  social_x text,
  social_twitch text,
  created_at timestamptz DEFAULT now()
);

-- 7. ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert Default Settings
INSERT INTO public.admin_settings (id, value)
VALUES 
  ('enabled_countries', '["Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela"]'),
  ('enabled_games', '["Mobile Legends"]'),
  ('tournament_types', '["Relámpago", "Clasificatorio", "Liga", "Exhibición"]')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- Enable RLS
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

-- Basic Public/Anon Policies (For dev purposes, can restrict later)
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

-- User Insert/Update Policies (Auth users can manage their own data)
CREATE POLICY "User Update Profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "User Insert Teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "User Update Teams" ON public.teams FOR UPDATE USING (auth.uid() = manager_id);
CREATE POLICY "User Insert Contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "User Update Contracts" ON public.contracts FOR UPDATE USING (auth.uid() = player_id);
