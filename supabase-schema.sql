
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
    pdf_show_in_modal BOOLEAN DEFAULT true,
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

-- Migration: add pdf_show_in_modal column if it doesn't exist
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_show_in_modal BOOLEAN DEFAULT true;

-- ===========================================================================
-- Periódico Escolar tables
-- ===========================================================================

-- Categories for the school newspaper
CREATE TABLE IF NOT EXISTS periodico_categorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#f0b429',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authors for the school newspaper
CREATE TABLE IF NOT EXISTS periodico_autores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    foto TEXT,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles for the school newspaper
CREATE TABLE IF NOT EXISTS periodico_articulos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    slug TEXT UNIQUE,
    contenido TEXT NOT NULL,
    imagen_principal TEXT,
    categoria_id UUID REFERENCES periodico_categorias(id),
    autor_id UUID REFERENCES periodico_autores(id),
    destacado BOOLEAN DEFAULT false,
    publicado BOOLEAN DEFAULT false,
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery images for newspaper articles
CREATE TABLE IF NOT EXISTS periodico_galeria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    articulo_id UUID REFERENCES periodico_articulos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    titulo TEXT,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View counter for "most read" articles
CREATE TABLE IF NOT EXISTS periodico_vistas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    articulo_id UUID REFERENCES periodico_articulos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School events (upcoming events section)
CREATE TABLE IF NOT EXISTS periodico_eventos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_evento TIMESTAMP WITH TIME ZONE,
    imagen TEXT,
    enlace TEXT,
    publicado BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default newspaper categories
INSERT INTO periodico_categorias (nombre, color) VALUES
    ('Noticias Escolares', '#e74c3c'),
    ('Deportes', '#3498db'),
    ('Cultura', '#9b59b6'),
    ('Ciencia y Tecnología', '#2ecc71'),
    ('Opinión', '#f39c12'),
    ('Logros Estudiantiles', '#1abc9c'),
    ('Comunidad Escolar', '#34495e')
ON CONFLICT (nombre) DO NOTHING;

-- Enable RLS on newspaper tables
ALTER TABLE periodico_articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodico_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodico_autores ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodico_galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodico_vistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodico_eventos ENABLE ROW LEVEL SECURITY;

-- Public read access for newspaper tables
CREATE POLICY "Public read articulos" ON periodico_articulos FOR SELECT USING (publicado = true);
CREATE POLICY "Public read categorias" ON periodico_categorias FOR SELECT USING (true);
CREATE POLICY "Public read autores" ON periodico_autores FOR SELECT USING (true);
CREATE POLICY "Public read galeria" ON periodico_galeria FOR SELECT USING (true);
CREATE POLICY "Public read vistas" ON periodico_vistas FOR SELECT USING (true);
CREATE POLICY "Public read eventos" ON periodico_eventos FOR SELECT USING (publicado = true);

-- Admin full access (requires authentication) for newspaper tables
CREATE POLICY "Admin insert articulos" ON periodico_articulos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update articulos" ON periodico_articulos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete articulos" ON periodico_articulos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert categorias" ON periodico_categorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update categorias" ON periodico_categorias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete categorias" ON periodico_categorias FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert autores" ON periodico_autores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update autores" ON periodico_autores FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete autores" ON periodico_autores FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert galeria" ON periodico_galeria FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update galeria" ON periodico_galeria FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete galeria" ON periodico_galeria FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert vistas" ON periodico_vistas FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin delete vistas" ON periodico_vistas FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert eventos" ON periodico_eventos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update eventos" ON periodico_eventos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete eventos" ON periodico_eventos FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes for newspaper performance
CREATE INDEX IF NOT EXISTS idx_periodico_articulos_fecha_pub ON periodico_articulos(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_periodico_articulos_categoria ON periodico_articulos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_periodico_articulos_autor ON periodico_articulos(autor_id);
CREATE INDEX IF NOT EXISTS idx_periodico_articulos_destacado ON periodico_articulos(destacado) WHERE destacado = true AND publicado = true;
CREATE INDEX IF NOT EXISTS idx_periodico_articulos_slug ON periodico_articulos(slug);
CREATE INDEX IF NOT EXISTS idx_periodico_galeria_articulo ON periodico_galeria(articulo_id);
CREATE INDEX IF NOT EXISTS idx_periodico_eventos_fecha ON periodico_eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_periodico_vistas_articulo ON periodico_vistas(articulo_id);
