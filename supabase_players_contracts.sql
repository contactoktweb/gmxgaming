-- ==========================================
-- 2. TABLAS FALTANTES: JUGADORES Y CONTRATOS
-- ==========================================

-- Tabla de players (Jugadores Aprobados)
CREATE TABLE IF NOT EXISTS public.players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  role text,
  team text,
  status text DEFAULT 'active',
  avatar text,
  phone text,
  game_id text,
  discord text,
  country text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de contracts (Contratos Aprobados)
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name text NOT NULL,
  player_email text,
  team text,
  role text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text DEFAULT 'active',
  document_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar RLS (Permitir lectura publica)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public Access Contracts" ON public.contracts FOR SELECT USING (true);

-- Otorgar permisos al usuario anónimo
GRANT SELECT ON public.players TO anon;
GRANT SELECT ON public.contracts TO anon;
GRANT ALL ON public.players TO authenticated;
GRANT ALL ON public.contracts TO authenticated;
