-- ==========================================
-- GMX GAMING: PHASE 5 ADDITIONS
-- ==========================================

-- 1. TOURNAMENT TEMPLATES
CREATE TABLE IF NOT EXISTS public.tournament_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  type text DEFAULT 'Relámpago',
  game text DEFAULT 'Mobile Legends',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tournament_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON public.tournament_templates;
CREATE POLICY "Public Access" ON public.tournament_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.tournament_templates;
CREATE POLICY "Admin All" ON public.tournament_templates FOR ALL USING (true); -- Only admin in UI

-- 2. TOURNAMENTS UPDATE
ALTER TABLE public.tournaments 
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.tournament_templates(id);

-- Note: PRIZEPOOL columns (prizepool_total, prizepool_distribution) already exist from previous phase.
-- Note: tournament_teams already exists.
-- Note: matches already has phase and date.

-- 3. ENABLE POLICIES FOR ADMIN UPDATES (Using true for ALL as MVP, real RLS should check admin role)
DROP POLICY IF EXISTS "Admin All" ON public.tournaments;
CREATE POLICY "Admin All" ON public.tournaments FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.tournament_teams;
CREATE POLICY "Admin All" ON public.tournament_teams FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.matches;
CREATE POLICY "Admin All" ON public.matches FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.contracts;
CREATE POLICY "Admin All" ON public.contracts FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.profiles;
CREATE POLICY "Admin All" ON public.profiles FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.teams;
CREATE POLICY "Admin All" ON public.teams FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin All" ON public.admin_settings;
CREATE POLICY "Admin All" ON public.admin_settings FOR ALL USING (true);

-- End of Phase 5 SQL
