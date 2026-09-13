
// Main page functionality
(function() {
    'use strict';

    let allArticles = [];
    let allCategories = [];
    let currentFilter = '';

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadCategories();
        await loadArticles();
        setupEventListeners();
        setupMobileMenu();
    }

    async function loadCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;

            allCategories = data;
            populateCategoryFilter(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    function populateCategoryFilter(categories) {
        const filter = document.getElementById('categoryFilter');
        filter.innerHTML = '<option value="">Todas las categorías</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            filter.appendChild(option);
        });
    }

    async function loadArticles() {
        const grid = document.getElementById('articlesGrid');
        grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Cargando artículos...</p></div>';

        try {
            let query = supabase
                .from('articles')
                .select('*, categories(name)')
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            allArticles = data || [];
            renderArticles(allArticles);
            updateArticlesCount(allArticles.length);
        } catch (error) {
            console.error('Error loading articles:', error);
            grid.innerHTML = '<p class="loading-text">Error al cargar artículos. Por favor, intenta de nuevo más tarde.</p>';
        }
    }

    function renderArticles(articles) {
        const grid = document.getElementById('articlesGrid');

        if (!articles || articles.length === 0) {
            grid.innerHTML = '<p class="loading-text">No hay artículos publicados aún.</p>';
            return;
        }

        grid.innerHTML = articles.map(article => `
            <article class="article-card" data-id="${article.id}">
                <div class="article-card-image">
                    <img src="${article.cover_image || 'https://via.placeholder.com/600x400/e0e0e0/666?text=Sin+Imagen'}" 
                         alt="${article.title}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/600x400/e0e0e0/666?text=Sin+Imagen'">
                    <span class="article-card-category">${article.categories?.name || 'General'}</span>
                </div>
                <div class="article-card-content">
                    <h3 class="article-card-title">${article.title}</h3>
                    <div class="article-card-meta">
                        <span>Por ${article.author}</span>
                        <span>${formatDate(article.created_at)}</span>
                    </div>
                    <p class="article-card-summary">${article.summary}</p>
                    <button class="btn btn-primary btn-sm read-article-btn" data-id="${article.id}">
                        Leer Artículo
                    </button>
                </div>
            </article>
        `).join('');
    }

    function updateArticlesCount(count) {
        const countEl = document.getElementById('articlesCount');
        countEl.textContent = `${count} artículo${count !== 1 ? 's' : ''} publicado${count !== 1 ? 's' : ''}`;
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

    async function openArticleModal(articleId) {
        const modal = document.getElementById('articleModal');
        const article = allArticles.find(a => a.id === articleId);

        if (!article) return;

        document.getElementById('modalCover').src = article.cover_image || 'https://via.placeholder.com/1200x600/e0e0e0/666?text=Sin+Imagen';
        document.getElementById('modalTitle').textContent = article.title;
        document.getElementById('modalCategory').textContent = article.categories?.name || 'General';
        document.getElementById('modalAuthor').textContent = `Por ${article.author}`;
        document.getElementById('modalDate').textContent = formatDate(article.created_at);
        document.getElementById('modalSummary').textContent = article.summary;

        const pdfBtn = document.getElementById('modalPdfBtn');
        const downloadBtn = document.getElementById('modalDownloadBtn');

        if (article.pdf_url) {
            pdfBtn.href = article.pdf_url;
            pdfBtn.style.display = 'inline-flex';
            downloadBtn.href = article.pdf_url;
            downloadBtn.style.display = 'inline-flex';
        } else {
            pdfBtn.style.display = 'none';
            downloadBtn.style.display = 'none';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const modal = document.getElementById('articleModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function setupEventListeners() {
        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            currentFilter = e.target.value;
            filterArticles();
        });

        // Modal close
        document.getElementById('modalClose').addEventListener('click', closeModal);

        // Close modal on backdrop click
        document.getElementById('articleModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Article card clicks
        document.getElementById('articlesGrid').addEventListener('click', (e) => {
            const btn = e.target.closest('.read-article-btn');
            const card = e.target.closest('.article-card');

            if (btn) {
                e.stopPropagation();
                openArticleModal(btn.dataset.id);
                return;
            }

            if (card) {
                openArticleModal(card.dataset.id);
            }
        });
    }

    function filterArticles() {
        if (!currentFilter) {
            renderArticles(allArticles);
            return;
        }

        const filtered = allArticles.filter(a => a.category_id === currentFilter);
        renderArticles(filtered);
    }

    function setupMobileMenu() {
        const btn = document.getElementById('mobileMenuBtn');
        const nav = document.getElementById('mainNav');

        if (btn && nav) {
            btn.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
    }
})();
