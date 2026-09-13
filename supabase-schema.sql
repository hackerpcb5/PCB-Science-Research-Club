
-- Supabase Schema for PCB Science Research Club
-- Execute this SQL in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    summary TEXT NOT NULL,
    pdf_url TEXT,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leadership members table
CREATE TABLE IF NOT EXISTS leadership_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    biography TEXT,
    photo_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery images table
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club information table
CREATE TABLE IF NOT EXISTS club_information (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    history TEXT,
    mission TEXT,
    vision TEXT,
    logo_meaning TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default category if none exists
INSERT INTO categories (name) VALUES ('General') ON CONFLICT (name) DO NOTHING;

-- Insert default club information
INSERT INTO club_information (history, mission, vision, logo_meaning)
VALUES (
    'El PCB Science Research Club fue fundado con la visión de fomentar la investigación científica entre estudiantes universitarios...',
    'Nuestra misión es promover la investigación científica, el periodismo científico y la divulgación del conocimiento entre la comunidad estudiantil...',
    'Ser un referente nacional en investigación estudiantil y divulgación científica, formando la próxima generación de científicos y comunicadores...',
    'El logo del club representa la unión entre la ciencia y la comunicación...'
) ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_information ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read leadership" ON leadership_members FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Public read club info" ON club_information FOR SELECT USING (true);

-- Admin full access (requires authentication)
CREATE POLICY "Admin insert articles" ON articles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update articles" ON articles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete articles" ON articles FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete categories" ON categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert leadership" ON leadership_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update leadership" ON leadership_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete leadership" ON leadership_members FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert gallery" ON gallery_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update gallery" ON gallery_images FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete gallery" ON gallery_images FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin update club info" ON club_information FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin insert club info" ON club_information FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery_images(order_index);
CREATE INDEX IF NOT EXISTS idx_leadership_order ON leadership_members(order_index);
