
// About page functionality
(function() {
    'use strict';

    let currentSlide = 0;
    let slides = [];
    let slideshowInterval;

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadClubInformation();
        await loadGallery();
        await loadLeadership();
        setupMobileMenu();
        setupSlideshowControls();
    }

    async function loadClubInformation() {
        try {
            const { data, error } = await window.supabaseClient
                .from('club_information')
                .select('*')
                .single();

            if (error) throw error;

            if (data) {
                document.getElementById('clubHistory').innerHTML = `<p style="white-space: pre-wrap;">${data.history || 'Información no disponible.'}</p>`;
                document.getElementById('clubMission').innerHTML = `<p style="white-space: pre-wrap;">${data.mission || 'Información no disponible.'}</p>`;
                document.getElementById('clubVision').innerHTML = `<p style="white-space: pre-wrap;">${data.vision || 'Información no disponible.'}</p>`;
                document.getElementById('logoMeaning').innerHTML = `<p style="white-space: pre-wrap;">${data.logo_meaning || 'Información no disponible.'}</p>`;
            }
        } catch (error) {
            console.error('Error loading club information:', error);
            document.getElementById('clubHistory').innerHTML = '<p class="loading-text">Error al cargar la información.</p>';
        }
    }

    async function loadGallery() {
        try {
            const { data, error } = await window.supabaseClient
                .from('gallery_images')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;

            slides = data || [];

            if (slides.length === 0) {
                document.getElementById('slideTitle').textContent = 'Sin imágenes';
                document.getElementById('slideDescription').textContent = 'No hay imágenes en la galería.';
                return;
            }

            renderSlideshow(slides);
            startSlideshow();
        } catch (error) {
            console.error('Error loading gallery:', error);
        }
    }

    function renderSlideshow(slides) {
        const container = document.getElementById('slideshowContainer');
        const dotsContainer = document.getElementById('slideshowDots');

        container.innerHTML = slides.map((slide, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${slide.image_url}" alt="${slide.title}" class="slide-img" loading="lazy">
                <div class="slide-caption">
                    <h3>${slide.title}</h3>
                    <p>${slide.description || ''}</p>
                </div>
            </div>
        `).join('');

        dotsContainer.innerHTML = slides.map((_, index) => `
            <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
        `).join('');
    }

    function showSlide(index) {
        if (slides.length === 0) return;

        const slideElements = document.querySelectorAll('.slide');
        const dotElements = document.querySelectorAll('.dot');

        slideElements.forEach(s => s.classList.remove('active'));
        dotElements.forEach(d => d.classList.remove('active'));

        currentSlide = (index + slides.length) % slides.length;

        if (slideElements[currentSlide]) {
            slideElements[currentSlide].classList.add('active');
        }
        if (dotElements[currentSlide]) {
            dotElements[currentSlide].classList.add('active');
        }
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    function startSlideshow() {
        if (slideshowInterval) clearInterval(slideshowInterval);
        slideshowInterval = setInterval(nextSlide, 5000);
    }

    function setupSlideshowControls() {
        document.getElementById('nextBtn')?.addEventListener('click', () => {
            nextSlide();
            startSlideshow();
        });

        document.getElementById('prevBtn')?.addEventListener('click', () => {
            prevSlide();
            startSlideshow();
        });

        document.getElementById('slideshowDots')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const index = parseInt(e.target.dataset.index);
                showSlide(index);
                startSlideshow();
            }
        });
    }

    async function loadLeadership() {
        try {
            const { data, error } = await window.supabaseClient
                .from('leadership_members')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;

            const members = data || [];
            const grid = document.getElementById('leadershipGrid');

            if (members.length === 0) {
                grid.innerHTML = '<p class="loading-text">No hay miembros de la directiva registrados.</p>';
                return;
            }

            grid.innerHTML = members.map(member => `
                <div class="leadership-card">
                    <img src="${member.photo_url || 'https://via.placeholder.com/150x150/1a1a2e/ffffff?text=Sin+Foto'}" 
                         alt="${member.name}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/150x150/1a1a2e/ffffff?text=Sin+Foto'">
                    <h3>${member.name}</h3>
                    <p class="position">${member.position}</p>
                    <p class="bio">${member.biography || ''}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading leadership:', error);
            document.getElementById('leadershipGrid').innerHTML = '<p class="loading-text">Error al cargar la directiva.</p>';
        }
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
