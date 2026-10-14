(function () {
    'use strict';

    let allArticles = [];
    let allCategories = [];
    let allAuthors = [];
    let filteredArticles = [];
    let featuredArticles = [];
    let heroArticle = null;
    let mostReadArticles = [];
    let upcomingEvents = [];
    let currentFilter = '';

    const PLACEHOLDER_IMG = 'https://via.placeholder.com/800x400/e0e0e0/666?text=Sin+Imagen';

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadCategories();
        await loadAuthors();
        await loadArticles();
        await loadEvents();
        setupEventListeners();
    }

    async function loadCategories() {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_categorias')
                .select('*')
                .order('nombre');

            if (error) throw error;

            allCategories = data || [];
            populateCategoryList(allCategories);
            populateCategoryFilter(allCategories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    function populateCategoryFilter(categories) {
        const filter = document.getElementById('categoryFilter');
        if (!filter) return;
        filter.innerHTML = '<option value="">Todas las categorías</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            filter.appendChild(option);
        });
    }

    function populateCategoryList(categories) {
        const list = document.getElementById('categoryList');
        if (!list) return;

        if (!categories.length) {
            list.innerHTML = '<p class="loading-text">No hay categorías.</p>';
            return;
        }

        list.innerHTML = categories.map(cat => `
            <a href="#" class="category-item" data-id="${cat.id}">
                <span class="category-color" style="background-color: ${cat.color || '#f0b429'}"></span>
                ${cat.nombre}
            </a>
        `).join('');
    }

    async function loadAuthors() {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_autores')
                .select('*')
                .order('nombre');

            if (error) throw error;

            allAuthors = data || [];
        } catch (error) {
            console.error('Error loading authors:', error);
        }
    }

    async function loadArticles() {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_articulos')
                .select('*, periodico_categorias(*), periodico_autores(*)')
                .eq('publicado', true)
                .order('fecha_publicacion', { ascending: false });

            if (error) throw error;

            allArticles = data || [];
            organizeArticles();
            renderContent();
        } catch (error) {
            console.error('Error loading articles:', error);
            const grid = document.getElementById('heroFeatured');
            if (grid) grid.innerHTML = '<p class="loading-text">Error al cargar noticias.</p>';
        }
    }

    function organizeArticles() {
        const now = new Date();
        const publishedArticles = allArticles.filter(a => new Date(a.fecha_publicacion) <= now);

        heroArticle = publishedArticles.find(a => a.destacado) || publishedArticles[0] || null;
        featuredArticles = publishedArticles.filter(a => a.destacado && a !== heroArticle).slice(0, 4);
        const latest = publishedArticles.slice(0, 10);
        filteredArticles = latest;
        mostReadArticles = [...publishedArticles].sort((a, b) => (b.vistas_count || 0) - (a.vistas_count || 0)).slice(0, 5);
    }

    function renderContent() {
        renderHero(heroArticle);
        renderFeatured(featuredArticles);
        renderLatest(filteredArticles);
        renderMostRead(mostReadArticles);
    }

    function renderHero(article) {
        const container = document.getElementById('heroFeatured');
        if (!container) return;

        if (!article) {
            container.innerHTML = '<p class="loading-text">No hay noticias destacadas.</p>';
            return;
        }

        const categorias = article.periodico_categorias || {};
        const autor = article.periodico_autores || {};
        const readTime = estimateReadingTime(article.contenido);

        container.innerHTML = `
            <article class="hero-main-article" data-slug="${article.slug}">
                <div class="hero-article-image">
                    <img src="${article.imagen_principal || PLACEHOLDER_IMG}" alt="${article.titulo}" loading="lazy"
                         onerror="this.src='${PLACEHOLDER_IMG}'">
                    <span class="article-category-badge" style="background-color: ${categorias.color || '#f0b429'}">${categorias.nombre || 'General'}</span>
                </div>
                <div class="hero-article-content">
                    <h1 class="hero-article-title">${article.titulo}</h1>
                    ${article.subtitulo ? `<p class="hero-article-subtitle">${article.subtitulo}</p>` : ''}
                    <div class="hero-article-meta">
                        <span class="hero-article-author">${autor.nombre || 'Redacción'}</span>
                        <span class="hero-article-date">${formatDate(article.fecha_publicacion)}</span>
                        <span class="hero-article-readtime">· ${readTime} min de lectura</span>
                    </div>
                </div>
            </article>
        `;

        container.querySelector('.hero-main-article').addEventListener('click', () => {
            window.location.href = `periodico-article.html?slug=${article.slug}`;
        });
    }

    function renderFeatured(articles) {
        const grid = document.getElementById('featuredGrid');
        if (!grid) return;

        if (!articles.length) {
            grid.innerHTML = '<p class="loading-text">No hay otras noticias destacadas.</p>';
            return;
        }

        grid.innerHTML = articles.map(article => {
            const categorias = article.periodico_categorias || {};
            const autor = article.periodico_autores || {};
            const readTime = estimateReadingTime(article.contenido);

            return `
                <article class="featured-article" data-slug="${article.slug}">
                    <div class="featured-article-image">
                        <img src="${article.imagen_principal || PLACEHOLDER_IMG}" alt="${article.titulo}" loading="lazy"
                             onerror="this.src='${PLACEHOLDER_IMG}'">
                        <span class="article-category-badge" style="background-color: ${categorias.color || '#f0b429'}">${categorias.nombre || 'General'}</span>
                    </div>
                    <div class="featured-article-content">
                        <h3 class="featured-article-title">${article.titulo}</h3>
                        ${article.subtitulo ? `<p class="featured-article-subtitle">${article.subtitulo}</p>` : ''}
                        <div class="featured-article-meta">
                            <span class="featured-article-author">${autor.nombre || 'Redacción'}</span>
                            <span class="featured-article-date">${formatDate(article.fecha_publicacion)}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        grid.addEventListener('click', (e) => {
            const article = e.target.closest('.featured-article');
            if (article) {
                window.location.href = `periodico-article.html?slug=${article.dataset.slug}`;
            }
        });
    }

    function renderLatest(articles) {
        const list = document.getElementById('latestList');
        if (!list) return;

        if (!articles.length) {
            list.innerHTML = '<p class="loading-text">No hay noticias recientes.</p>';
            return;
        }

        list.innerHTML = articles.map(article => {
            const categorias = article.periodico_categorias || {};
            const autor = article.periodico_autores || {};

            return `
                <article class="news-item" data-slug="${article.slug}">
                    <div class="news-item-image">
                        <img src="${article.imagen_principal || PLACEHOLDER_IMG}" alt="${article.titulo}" loading="lazy"
                             onerror="this.src='${PLACEHOLDER_IMG}'">
                    </div>
                    <div class="news-item-content">
                        <span class="news-item-category" style="color: ${categorias.color || '#f0b429'}">${categorias.nombre || 'General'}</span>
                        <h3 class="news-item-title">${article.titulo}</h3>
                        <div class="news-item-meta">
                            <span class="news-item-author">${autor.nombre || 'Redacción'}</span>
                            <span class="news-item-date">${formatDate(article.fecha_publicacion)}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        list.addEventListener('click', (e) => {
            const item = e.target.closest('.news-item');
            if (item) {
                window.location.href = `periodico-article.html?slug=${item.dataset.slug}`;
            }
        });
    }

    function renderMostRead(articles) {
        const list = document.getElementById('mostReadList');
        if (!list) return;

        if (!articles.length) {
            list.innerHTML = '<p class="loading-text">No hay artículos para mostrar.</p>';
            return;
        }

        list.innerHTML = articles.map((article, index) => `
            <a href="periodico-article.html?slug=${article.slug}" class="most-read-item">
                <span class="most-read-rank">${index + 1}</span>
                <span class="most-read-title">${article.titulo}</span>
            </a>
        `).join('');
    }

    async function loadEvents() {
        const now = new Date().toISOString();
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_eventos')
                .select('*')
                .eq('publicado', true)
                .gte('fecha_evento', now)
                .order('fecha_evento', { ascending: true });

            if (error) throw error;

            upcomingEvents = data || [];
            renderEvents(upcomingEvents);
        } catch (error) {
            console.error('Error loading events:', error);
            const list = document.getElementById('eventsList');
            if (list) list.innerHTML = '<p class="loading-text">No hay eventos próximos.</p>';
        }
    }

    function renderEvents(events) {
        const list = document.getElementById('eventsList');
        if (!list) return;

        if (!events.length) {
            list.innerHTML = '<p class="loading-text">No hay eventos próximos.</p>';
            return;
        }

        list.innerHTML = events.map(event => `
            <div class="event-item">
                <div class="event-date">${formatDate(event.fecha_evento, true)}</div>
                <div class="event-content">
                    <h4 class="event-title">${event.titulo}</h4>
                    ${event.descripcion ? `<p class="event-desc">${event.descripcion}</p>` : ''}
                    ${event.enlace ? `<a href="${event.enlace}" class="event-link" target="_blank" rel="noopener">Más info</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    async function recordView(articleSlug) {
        try {
            const { data: articleData, error: fetchError } = await window.supabaseClient
                .from('periodico_articulos')
                .select('id')
                .eq('slug', articleSlug)
                .eq('publicado', true)
                .single();

            if (fetchError || !articleData) return;

            await window.supabaseClient
                .from('periodico_vistas')
                .insert([{ articulo_id: articleData.id }]);
        } catch (error) {
            console.error('Error recording view:', error);
        }
    }

    function estimateReadingTime(content) {
        if (!content) return 1;
        const wordsPerMinute = 200;
        const wordCount = content.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    function formatDate(dateString, shortMonth = false) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: shortMonth ? 'short' : 'long',
            day: 'numeric'
        });
    }

    function filterByCategory(categoryId) {
        currentFilter = categoryId;
        if (!categoryId) {
            filteredArticles = allArticles.filter(a => new Date(a.fecha_publicacion) <= new Date()).slice(0, 10);
        } else {
            filteredArticles = allArticles.filter(a => a.categoria_id === categoryId && new Date(a.fecha_publicacion) <= new Date()).slice(0, 10);
        }
        renderLatest(filteredArticles);
    }

    function handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) {
            const now = new Date();
            filteredArticles = allArticles.filter(a => new Date(a.fecha_publicacion) <= now).slice(0, 10);
        } else {
            filteredArticles = allArticles.filter(a =>
                (a.titulo && a.titulo.toLowerCase().includes(searchTerm)) ||
                (a.subtitulo && a.subtitulo.toLowerCase().includes(searchTerm)) ||
                (a.contenido && a.contenido.toLowerCase().includes(searchTerm))
            ).slice(0, 10);
        }
        renderLatest(filteredArticles);
    }

    function setupEventListeners() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                filterByCategory(e.target.value);
            });
        }

        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
            categoryList.addEventListener('click', (e) => {
                const item = e.target.closest('.category-item');
                if (item) {
                    e.preventDefault();
                    filterByCategory(item.dataset.id);
                    categoryFilter.value = item.dataset.id;
                }
            });
        }

        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                handleSearch(searchInput.value);
            });
        }
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    handleSearch(e.target.value);
                }
            });
        }

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mainNav = document.getElementById('mainNav');
        if (mobileMenuBtn && mainNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
            });
        }

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'recordView' && e.data.slug) {
                recordView(e.data.slug);
            }
        });
    }

    window.Periodico = {
        recordView,
        formatDate,
        estimateReadingTime
    };
})();