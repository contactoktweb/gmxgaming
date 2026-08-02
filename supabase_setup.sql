-- ==========================================
-- 1. CREACIÓN DE TABLAS
-- ==========================================

-- Tabla app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insertar configuración inicial por defecto
INSERT INTO public.app_settings (id, value)
VALUES 
  ('enabled_countries', '["Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela"]'),
  ('enabled_games', '["Mobile Legends"]')
ON CONFLICT (id) DO NOTHING;

-- Tabla validations (Altas)
CREATE TABLE IF NOT EXISTS public.validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'equipo', 'jugador', 'contrato'
  target_name text,
  submitted_by text,
  status text DEFAULT 'pending',
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  game_nickname text,
  role text DEFAULT 'user',
  avatar_url text,
  cover_url text,
  created_at timestamptz DEFAULT now()
);

-- Tabla teams
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  tag text,
  logo_url text,
  country text,
  created_at timestamptz DEFAULT now()
);

-- Tabla tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 2. CREACIÓN DE BUCKETS DE STORAGE
-- ==========================================

-- Bucket 'teams' para logos y jerseys
INSERT INTO storage.buckets (id, name, public) 
VALUES ('teams', 'teams', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket 'avatars' para fotos de perfil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket 'documents' para pasaportes e INE
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket 'covers' para fotos de portada
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS) PARA STORAGE
-- ==========================================

-- Permitir a cualquier usuario (incluso anónimos por ahora) subir y leer archivos (Para facilitar pruebas)
CREATE POLICY "Public Access Teams" ON storage.objects FOR SELECT USING (bucket_id = 'teams');
CREATE POLICY "Public Insert Teams" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'teams');

CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Insert Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public Access Documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Public Insert Documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public Access Covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Public Insert Covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers');
