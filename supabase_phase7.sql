-- Phase 7: Home Page, Casters, Media & Featured Players

-- 1. Featured Players
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 2. Media Table
CREATE TABLE IF NOT EXISTS media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media are viewable by everyone" ON media FOR SELECT USING (true);
CREATE POLICY "Media are insertable by admins" ON media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Media are updatable by admins" ON media FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Media are deletable by admins" ON media FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Casters Table
CREATE TABLE IF NOT EXISTS casters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    twitch_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Casters
ALTER TABLE casters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Casters are viewable by everyone" ON casters FOR SELECT USING (true);
CREATE POLICY "Casters are insertable by admins" ON casters FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Casters are updatable by admins" ON casters FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Casters are deletable by admins" ON casters FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
