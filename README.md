# PCB Science Research Club - Plataforma Web

Plataforma web completa para el PCB Science Research Club, una organización estudiantil dedicada a la investigación científica y el periodismo científico.

## Tecnologías

- HTML5
- CSS3 (Responsive Design)
- JavaScript Vanilla
- Supabase (Backend, Base de Datos y Storage)

## Estructura del Proyecto

```
PCB-Science-Research-Club-main/
├── index.html              # Página principal con artículos
├── about.html              # Página informativa del club
├── admin.html              # Panel de administración
├── login.html              # Acceso administrativo
├── Logo.png                # Logo del club
├── style.css               # Estilos CSS
├── config.js               # Configuración de Supabase
├── main.js                 # Lógica de la página principal
├── about.js                # Lógica de la página about
├── admin.js                # Lógica del panel de administración
├── login.js                # Lógica del login
├── supabase-schema.sql     # Script SQL para Supabase
├── supabase.min.js         # Supabase JS client library
└── README.md               # Este archivo
```

## Configuración de Supabase

### Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota tu **Project URL** y **anon key**

### Paso 2: Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Copia y pega el contenido del archivo `supabase-schema.sql`
3. Ejecuta el script

### Paso 3: Configurar Storage

Crea los siguientes buckets en Supabase Storage:

1. Ve a **Storage** en el dashboard
2. Crea los siguientes buckets:
   - `articles-pdfs` (para PDFs de artículos)
   - `article-covers` (para imágenes de portada)
   - `gallery` (para imágenes de la galería)
   - `leadership` (para fotos de la directiva)

**Políticas de Storage (RLS):**

```sql
-- Políticas para articles-pdfs
CREATE POLICY "Public read articles-pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'articles-pdfs');
CREATE POLICY "Admin upload articles-pdfs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'articles-pdfs' AND auth.role() = 'authenticated');
CREATE POLICY "Admin update articles-pdfs" ON storage.objects FOR UPDATE USING (bucket_id = 'articles-pdfs' AND auth.role() = 'authenticated');
CREATE POLICY "Admin delete articles-pdfs" ON storage.objects FOR DELETE USING (bucket_id = 'articles-pdfs' AND auth.role() = 'authenticated');

-- Políticas para article-covers
CREATE POLICY "Public read article-covers" ON storage.objects FOR SELECT USING (bucket_id = 'article-covers');
CREATE POLICY "Admin upload article-covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'article-covers' AND auth.role() = 'authenticated');
CREATE POLICY "Admin update article-covers" ON storage.objects FOR UPDATE USING (bucket_id = 'article-covers' AND auth.role() = 'authenticated');
CREATE POLICY "Admin delete article-covers" ON storage.objects FOR DELETE USING (bucket_id = 'article-covers' AND auth.role() = 'authenticated');

-- Políticas para gallery
CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admin upload gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Admin update gallery" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Admin delete gallery" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');

-- Políticas para leadership
CREATE POLICY "Public read leadership" ON storage.objects FOR SELECT USING (bucket_id = 'leadership');
CREATE POLICY "Admin upload leadership" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'leadership' AND auth.role() = 'authenticated');
CREATE POLICY "Admin update leadership" ON storage.objects FOR UPDATE USING (bucket_id = 'leadership' AND auth.role() = 'authenticated');
CREATE POLICY "Admin delete leadership" ON storage.objects FOR DELETE USING (bucket_id = 'leadership' AND auth.role() = 'authenticated');
```

### Paso 4: Configurar Autenticación

1. Ve a **Authentication** en el dashboard
2. En **Providers**, asegúrate de que **Email** esté habilitado
3. Crea usuarios administradores:
   - Ve a **Authentication** > **Users**
   - Haz clic en **Add User**
   - Ingresa el correo y contraseña del administrador

### Paso 5: Configurar Credenciales en el Código

Edita el archivo `config.js` y reemplaza los valores:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key';
```

## Despliegue

### Opción 1: Netlify (Recomendado)

1. Crea una cuenta en [netlify.com](https://netlify.com)
2. Arrastra la carpeta del proyecto a Netlify
3. El sitio se desplegará automáticamente

### Opción 2: Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Sigue las instrucciones

### Opción 3: GitHub Pages

1. Crea un repositorio en GitHub
2. Sube los archivos
3. Ve a **Settings** > **Pages**
4. Selecciona la rama y carpeta

### Opción 4: Servidor Propio

Sube los archivos a cualquier servidor web (Apache, Nginx, etc.)

## Características

### Página Principal (index.html)
- Visualización de artículos en tarjetas estilo National Geographic
- Filtrado por categorías
- Modal para ver artículos completos con visor PDF
- Diseño responsive
- Animaciones suaves
- Lazy loading de imágenes

### Página Informativa (about.html)
- Hero section con logo y frase inspiradora
- Historia, misión y visión del club
- Significado del logo
- Galería con slideshow automático
- Directiva del club con fotos y biografías
- Diseño responsive

### Panel de Administración (admin.html)
- Autenticación con Supabase
- CRUD de artículos
- CRUD de categorías
- CRUD de galería
- CRUD de directiva
- Configuración del club
- Interfaz intuitiva

## Seguridad

- Autenticación mediante Supabase Auth
- Políticas RLS en Supabase
- Validación de datos en formularios
- Protección contra CSRF
- URLs de Supabase Storage con tokens temporales

## Accesibilidad

- Etiquetas ARIA
- Navegación por teclado
- Contraste de colores WCAG
- Textos alternativos en imágenes
- Estructura semántica HTML5

## SEO

- Metaetiquetas completas
- URLs semánticas
- Datos estructurados (JSON-LD recomendado)
- Sitemap.xml (recomendado)
- robots.txt (recomendado)

## Personalización

### Colores

Edita las variables CSS en `style.css`:

```css
:root {
    --primary: #0f3460;
    --secondary: #16213e;
    --accent: #e94560;
    --gold: #d4af37;
}
```

### Logo

Reemplaza `Logo.png` con el logo oficial del club.

### Contenido

Edita el contenido directamente desde el panel de administración o modifica la base de datos.

## Mantenimiento

- Actualiza las dependencias de Supabase periódicamente
- Realiza backups de la base de datos
- Monitorea el rendimiento en Supabase Dashboard
- Revisa los logs de error regularmente

## Soporte

Para reportar problemas o solicitar características, contacta al equipo de desarrollo del PCB Science Research Club.

## Licencia

Todos los derechos reservados © 2024 PCB Science Research Club.
