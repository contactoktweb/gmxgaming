-- ==========================================
-- GMX GAMING: PHASE 3 ADDITIONS
-- ==========================================

-- Add games array to teams to store which games the team plays
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS games jsonb DEFAULT '[]'::jsonb;
