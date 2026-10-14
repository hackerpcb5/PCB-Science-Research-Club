(function () {
    'use strict';

    let currentArticle = null;
    let allArticles = [];
    let currentViews = 0;

    const PLACEHOLDER_IMG = 'https://via.placeholder.com/800x400/e0e0e0/666?text=Sin+Imagen';

    document.addEventListener('DOMContentLoaded', init);

    function getSlugFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('slug');
    }

    async function init() {
        const slug = getSlugFromUrl();
        if (!slug) {
            window.location.href = 'periodico.html';
            return;
        }

        await loadArticle(slug);
        await loadRelatedArticles();
        window.parent.postMessage({ type: 'recordView', slug: slug }, '*');
        setupEventListeners();
    }

    async function loadArticle(slug) {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_articulos')
                .select('*, periodico_categorias(*), periodico_autores(*)')
                .eq('slug', slug)
                .eq('publicado', true)
                .single();

            if (error) throw error;

            if (!data) {
                window.location.href = 'periodico.html';
                return;
            }

            currentArticle = data;
            window.PeriodicoGlobal = window.PeriodicoGlobal || {};
            window.PeriodicoGlobal.article = data;

            renderArticle(data);
            document.title = data.titulo + ' - Periódico Escolar PCB';
        } catch (error) {
            console.error('Error loading article:', error);
            const container = document.getElementById('newsArticle');
            if (container) {
                container.innerHTML = `
                    <div class="container">
                        <div class="article-error">
                            <h2>Error al cargar el artículo</h2>
                            <p>No se pudo cargar el artículo solicitado. Por favor, verifica que la URL sea correcta o vuelve a la <a href="periodico.html">página principal</a>.</p>
                        </div>
                    </div>
                `;
            }
        }
    }

    function renderArticle(article) {
        const categorias = article.periodico_categorias || {};
        const autor = article.periodico_autores || {};
        const readTime = estimateReadingTime(article.contenido);

        const articleElement = document.getElementById('newsArticle');
        if (!articleElement) return;

        articleElement.innerHTML = `
            <div class="article-header-bar">
                <a href="periodico.html" class="back-link">← Volver al Periódico</a>
            </div>
            <div class="article-hero">
                <span class="article-category-badge" style="background-color: ${categorias.color || '#f0b429'}">${categorias.nombre || 'General'}</span>
                <h1 class="article-title">${article.titulo}</h1>
                ${article.subtitulo ? `<p class="article-subtitle">${article.subtitulo}</p>` : ''}
                <div class="article-meta-bar">
                    <div class="article-author">
                        <img src="${autor.foto || 'https://via.placeholder.com/60x60?text=' + encodeURIComponent(autor.nombre || 'A')}" alt="${autor.nombre || 'Autor'}" class="author-avatar"
                             onerror="this.src='https://via.placeholder.com/60x60'">
                        <span class="author-name">${autor.nombre || 'Redacción'}</span>
                    </div>
                    <div class="article-meta-details">
                        <span class="article-date">${formatDate(article.fecha_publicacion)}</span>
                        <span class="article-readtime">· ${readTime} min de lectura</span>
                    </div>
                </div>
            </div>
            ${article.imagen_principal ? `
                <div class="article-featured-image">
                    <img src="${article.imagen_principal}" alt="${article.titulo}" loading="lazy"
                         onerror="this.src='${PLACEHOLDER_IMG}'">
                </div>
            ` : ''}
            <div class="article-body">
                ${formatContent(article.contenido)}
            </div>
            ${article.periodico_galeria && article.periodico_galeria.length ? `
                <div class="article-gallery">
                    <h3 class="gallery-title">Galería de Imágenes</h3>
                    <div class="gallery-grid">
                        ${article.periodico_galeria.map(g => `
                            <div class="gallery-item">
                                <img src="${g.url}" alt="${g.titulo || 'Imagen de galería'}" loading="lazy"
                                     onerror="this.src='${PLACEHOLDER_IMG}'">
                                ${g.titulo ? `<span class="gallery-caption">${g.titulo}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    function formatContent(content) {
        if (!content) return '<p class="loading-text">Contenido no disponible.</p>';
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        return paragraphs.map(p => {
            const trimmed = p.trim();
            if (trimmed.startsWith('<')) {
                return trimmed;
            }
            return `<p>${escapedHtml(trimmed)}</p>`;
        }).join('');
    }

    function escapedHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function loadRelatedArticles() {
        const slug = getSlugFromUrl();
        if (!currentArticle || !currentArticle.categoria_id) return;

        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_articulos')
                .select('*, periodico_categorias(*), periodico_autores(*)')
                .eq('categoria_id', currentArticle.categoria_id)
                .eq('publicado', true)
                .neq('slug', slug)
                .order('fecha_publicacion', { ascending: false })
                .limit(4);

            if (error) throw error;

            allArticles = data || [];
            renderRelated(allArticles);
        } catch (error) {
            console.error('Error loading related articles:', error);
        }
    }

    function renderRelated(articles) {
        const grid = document.getElementById('relatedGrid');
        if (!grid) return;

        if (!articles.length) {
            grid.innerHTML = '<p class="loading-text">No hay artículos relacionados.</p>';
            return;
        }

        grid.innerHTML = articles.map(article => {
            const categorias = article.periodico_categorias || {};
            const autor = article.periodico_autores || {};

            return `
                <article class="related-article" data-slug="${article.slug}">
                    <div class="related-article-image">
                        <img src="${article.imagen_principal || PLACEHOLDER_IMG}" alt="${article.titulo}" loading="lazy"
                             onerror="this.src='${PLACEHOLDER_IMG}'">
                    </div>
                    <div class="related-article-content">
                        <span class="related-article-category" style="color: ${categorias.color || '#f0b429'}">${categorias.nombre || 'General'}</span>
                        <h4 class="related-article-title">${article.titulo}</h4>
                        <div class="related-article-meta">
                            <span class="related-article-author">${autor.nombre || 'Redacción'}</span>
                            <span class="related-article-date">${formatDate(article.fecha_publicacion)}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        grid.addEventListener('click', (e) => {
            const item = e.target.closest('.related-article');
            if (item) {
                window.location.href = `periodico-article.html?slug=${item.dataset.slug}`;
            }
        });
    }

    function estimateReadingTime(content) {
        if (!content) return 1;
        const wordsPerMinute = 200;
        const wordCount = content.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function setupEventListeners() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mainNav = document.getElementById('mainNav');
        if (mobileMenuBtn && mainNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
            });
        }
    }
})();