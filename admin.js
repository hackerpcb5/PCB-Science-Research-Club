
// Admin panel functionality
(function() {
    'use strict';

    let currentUser = null;
    let currentSection = 'articles';
    let articles = [];
    let categories = [];
    let gallery = [];
    let leadership = [];

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await checkAuth();
        setupEventListeners();
    }

    async function checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            currentUser = session.user;
            document.getElementById('loginModal').classList.remove('active');
        } else {
            showLoginModal();
        }
    }

    function showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    }

    function setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', handleLogin);

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);

        // Login modal close
        document.getElementById('loginModalClose').addEventListener('click', () => {
            document.getElementById('loginModal').classList.remove('active');
        });

        // Admin navigation
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                switchSection(section);
            });
        });

        // Articles section
        document.getElementById('addArticleBtn')?.addEventListener('click', () => openArticleModal());
        document.getElementById('articlesTableBody')?.addEventListener('click', handleArticleActions);

        // Categories section
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => openCategoryModal());
        document.getElementById('categoriesTableBody')?.addEventListener('click', handleCategoryActions);

        // Gallery section
        document.getElementById('addGalleryBtn')?.addEventListener('click', () => openGalleryModal());
        document.getElementById('adminGalleryGrid')?.addEventListener('click', handleGalleryActions);

        // Leadership section
        document.getElementById('addLeadershipBtn')?.addEventListener('click', () => openLeadershipModal());
        document.getElementById('leadershipTableBody')?.addEventListener('click', handleLeadershipActions);

        // Settings form
        document.getElementById('settingsForm')?.addEventListener('submit', handleSettingsSave);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            currentUser = data.user;
            document.getElementById('loginModal').classList.remove('active');
            await loadAllData();
        } catch (error) {
            alert('Error al iniciar sesión: ' + error.message);
        }
    }

    async function handleLogout(e) {
        e.preventDefault();
        await supabase.auth.signOut();
        currentUser = null;
        location.reload();
    }

    async function loadAllData() {
        await Promise.all([
            loadArticles(),
            loadCategories(),
            loadGallery(),
            loadLeadership(),
            loadSettings()
        ]);
    }

    function switchSection(section) {
        currentSection = section;

        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.add('hidden');
        });

        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    }

    // Articles CRUD
    async function loadArticles() {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('*, categories(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            articles = data || [];
            renderArticlesTable();
        } catch (error) {
            console.error('Error loading articles:', error);
        }
    }

    function renderArticlesTable() {
        const tbody = document.getElementById('articlesTableBody');

        if (!articles.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-text">No hay artículos.</td></tr>';
            return;
        }

        tbody.innerHTML = articles.map(article => `
            <tr>
                <td>${article.title}</td>
                <td>${article.author}</td>
                <td>${article.categories?.name || 'N/A'}</td>
                <td>${formatDate(article.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${article.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${article.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function handleArticleActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const article = articles.find(a => a.id === id);
            if (article) openArticleModal(article);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de eliminar este artículo?')) {
                deleteArticle(id);
            }
        }
    }

    async function openArticleModal(article = null) {
        const isEdit = !!article;
        const categoriesSelect = await getCategoriesOptions();

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'articleFormModal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" id="closeArticleModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nuevo'} Artículo</h2>
                </div>
                <form id="articleForm" class="modal-form">
                    <input type="hidden" id="articleId" value="${isEdit ? article.id : ''}">
                    <div class="form-group">
                        <label for="articleTitle">Título</label>
                        <input type="text" id="articleTitle" required value="${isEdit ? article.title : ''}">
                    </div>
                    <div class="form-group">
                        <label for="articleAuthor">Autor</label>
                        <input type="text" id="articleAuthor" required value="${isEdit ? article.author : ''}">
                    </div>
                    <div class="form-group">
                        <label for="articleCategory">Categoría</label>
                        <select id="articleCategory" required>
                            <option value="">Seleccionar categoría</option>
                            ${categoriesSelect}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="articleSummary">Resumen</label>
                        <textarea id="articleSummary" required rows="4">${isEdit ? article.summary : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="articleCover">Imagen de Portada (URL)</label>
                        <input type="url" id="articleCover" value="${isEdit ? article.cover_image || '' : ''}" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label for="articlePdf">PDF (URL)</label>
                        <input type="url" id="articlePdf" value="${isEdit ? article.pdf_url || '' : ''}" placeholder="https://...">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Actualizar' : 'Crear'} Artículo</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeArticleModal')?.addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('articleForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveArticle();
        });
    }

    async function getCategoriesOptions() {
        try {
            const { data } = await supabase.from('categories').select('id, name').order('name');
            return (data || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        } catch {
            return '';
        }
    }

    async function saveArticle() {
        const id = document.getElementById('articleId').value;
        const articleData = {
            title: document.getElementById('articleTitle').value,
            author: document.getElementById('articleAuthor').value,
            category_id: document.getElementById('articleCategory').value || null,
            summary: document.getElementById('articleSummary').value,
            cover_image: document.getElementById('articleCover').value || null,
            pdf_url: document.getElementById('articlePdf').value || null,
        };

        try {
            let error;
            if (id) {
                const { error: err } = await supabase.from('articles').update(articleData).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabase.from('articles').insert([articleData]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('articleFormModal')?.remove();
            await loadArticles();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deleteArticle(id) {
        try {
            const { error } = await supabase.from('articles').delete().eq('id', id);
            if (error) throw error;
            await loadArticles();
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }

    // Categories CRUD
    async function loadCategories() {
        try {
            const { data, error } = await supabase.from('categories').select('*').order('name');
            if (error) throw error;
            categories = data || [];
            renderCategoriesTable();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    function renderCategoriesTable() {
        const tbody = document.getElementById('categoriesTableBody');

        if (!categories.length) {
            tbody.innerHTML = '<tr><td colspan="2" class="loading-text">No hay categorías.</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.name}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${cat.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${cat.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function handleCategoryActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const cat = categories.find(c => c.id === id);
            if (cat) openCategoryModal(cat);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar esta categoría?')) {
                deleteCategory(id);
            }
        }
    }

    function openCategoryModal(category = null) {
        const isEdit = !!category;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'categoryFormModal';
        modal.innerHTML = `
            <div class="modal-content modal-small">
                <button class="modal-close" id="closeCategoryModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nueva'} Categoría</h2>
                </div>
                <form id="categoryForm" class="modal-form">
                    <input type="hidden" id="categoryId" value="${isEdit ? category.id : ''}">
                    <div class="form-group">
                        <label for="categoryName">Nombre</label>
                        <input type="text" id="categoryName" required value="${isEdit ? category.name : ''}">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Actualizar' : 'Crear'} Categoría</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeCategoryModal')?.addEventListener('click', () => modal.remove());

        document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveCategory();
        });
    }

    async function saveCategory() {
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value;

        try {
            let error;
            if (id) {
                const { error: err } = await supabase.from('categories').update({ name }).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabase.from('categories').insert([{ name }]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('categoryFormModal')?.remove();
            await loadCategories();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deleteCategory(id) {
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            await loadCategories();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    // Gallery CRUD
    async function loadGallery() {
        try {
            const { data, error } = await supabase.from('gallery_images').select('*').order('order_index');
            if (error) throw error;
            gallery = data || [];
            renderAdminGallery();
        } catch (error) {
            console.error('Error loading gallery:', error);
        }
    }

    function renderAdminGallery() {
        const grid = document.getElementById('adminGalleryGrid');

        if (!gallery.length) {
            grid.innerHTML = '<p class="loading-text">No hay imágenes en la galería.</p>';
            return;
        }

        grid.innerHTML = gallery.map(img => `
            <div class="gallery-item">
                <img src="${img.image_url}" alt="${img.title}" loading="lazy">
                <div class="gallery-item-info">
                    <h4>${img.title}</h4>
                    <p>${img.description || ''}</p>
                </div>
                <div class="gallery-item-actions">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${img.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${img.id}">Eliminar</button>
                </div>
            </div>
        `).join('');
    }

    function handleGalleryActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const img = gallery.find(g => g.id === id);
            if (img) openGalleryModal(img);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar esta imagen?')) {
                deleteGalleryImage(id);
            }
        }
    }

    function openGalleryModal(image = null) {
        const isEdit = !!image;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'galleryFormModal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" id="closeGalleryModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nueva'} Imagen de Galería</h2>
                </div>
                <form id="galleryForm" class="modal-form">
                    <input type="hidden" id="galleryId" value="${isEdit ? image.id : ''}">
                    <div class="form-group">
                        <label for="galleryTitle">Título</label>
                        <input type="text" id="galleryTitle" required value="${isEdit ? image.title : ''}">
                    </div>
                    <div class="form-group">
                        <label for="galleryDescription">Descripción</label>
                        <textarea id="galleryDescription" rows="3">${isEdit ? image.description || '' : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="galleryImageUrl">URL de Imagen</label>
                        <input type="url" id="galleryImageUrl" required value="${isEdit ? image.image_url : ''}">
                    </div>
                    <div class="form-group">
                        <label for="galleryOrder">Orden</label>
                        <input type="number" id="galleryOrder" value="${isEdit ? image.order_index : 0}">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Actualizar' : 'Agregar'} Imagen</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeGalleryModal')?.addEventListener('click', () => modal.remove());

        document.getElementById('galleryForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveGalleryImage();
        });
    }

    async function saveGalleryImage() {
        const id = document.getElementById('galleryId').value;
        const imageData = {
            title: document.getElementById('galleryTitle').value,
            description: document.getElementById('galleryDescription').value,
            image_url: document.getElementById('galleryImageUrl').value,
            order_index: parseInt(document.getElementById('galleryOrder').value) || 0,
        };

        try {
            let error;
            if (id) {
                const { error: err } = await supabase.from('gallery_images').update(imageData).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabase.from('gallery_images').insert([imageData]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('galleryFormModal')?.remove();
            await loadGallery();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deleteGalleryImage(id) {
        try {
            const { error } = await supabase.from('gallery_images').delete().eq('id', id);
            if (error) throw error;
            await loadGallery();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    // Leadership CRUD
    async function loadLeadership() {
        try {
            const { data, error } = await supabase
                .from('leadership_members')
                .select('*')
                .order('order_index');

            if (error) throw error;
            leadership = data || [];
            renderLeadershipTable();
        } catch (error) {
            console.error('Error loading leadership:', error);
        }
    }

    function renderLeadershipTable() {
        const tbody = document.getElementById('leadershipTableBody');

        if (!leadership.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No hay miembros.</td></tr>';
            return;
        }

        tbody.innerHTML = leadership.map(member => `
            <tr>
                <td><img src="${member.photo_url || 'https://via.placeholder.com/40x40'}" alt="${member.name}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"></td>
                <td>${member.name}</td>
                <td>${member.position}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${member.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${member.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function handleLeadershipActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const member = leadership.find(m => m.id === id);
            if (member) openLeadershipModal(member);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar este miembro?')) {
                deleteLeadershipMember(id);
            }
        }
    }

    function openLeadershipModal(member = null) {
        const isEdit = !!member;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'leadershipFormModal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" id="closeLeadershipModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nuevo'} Miembro</h2>
                </div>
                <form id="leadershipForm" class="modal-form">
                    <input type="hidden" id="leadershipId" value="${isEdit ? member.id : ''}">
                    <div class="form-group">
                        <label for="memberName">Nombre</label>
                        <input type="text" id="memberName" required value="${isEdit ? member.name : ''}">
                    </div>
                    <div class="form-group">
                        <label for="memberPosition">Cargo</label>
                        <input type="text" id="memberPosition" required value="${isEdit ? member.position : ''}">
                    </div>
                    <div class="form-group">
                        <label for="memberPhoto">URL de Foto</label>
                        <input type="url" id="memberPhoto" value="${isEdit ? member.photo_url || '' : ''}">
                    </div>
                    <div class="form-group">
                        <label for="memberBio">Biografía</label>
                        <textarea id="memberBio" rows="4">${isEdit ? member.biography || '' : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="memberOrder">Orden</label>
                        <input type="number" id="memberOrder" value="${isEdit ? member.order_index : 0}">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Actualizar' : 'Agregar'} Miembro</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeLeadershipModal')?.addEventListener('click', () => modal.remove());

        document.getElementById('leadershipForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveLeadershipMember();
        });
    }

    async function saveLeadershipMember() {
        const id = document.getElementById('leadershipId').value;
        const memberData = {
            name: document.getElementById('memberName').value,
            position: document.getElementById('memberPosition').value,
            photo_url: document.getElementById('memberPhoto').value || null,
            biography: document.getElementById('memberBio').value,
            order_index: parseInt(document.getElementById('memberOrder').value) || 0,
        };

        try {
            let error;
            if (id) {
                const { error: err } = await supabase.from('leadership_members').update(memberData).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabase.from('leadership_members').insert([memberData]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('leadershipFormModal')?.remove();
            await loadLeadership();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deleteLeadershipMember(id) {
        try {
            const { error } = await supabase.from('leadership_members').delete().eq('id', id);
            if (error) throw error;
            await loadLeadership();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    // Settings
    async function loadSettings() {
        try {
            const { data, error } = await supabase.from('club_information').select('*').single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                document.getElementById('settingHistory').value = data.history || '';
                document.getElementById('settingMission').value = data.mission || '';
                document.getElementById('settingVision').value = data.vision || '';
                document.getElementById('settingLogoMeaning').value = data.logo_meaning || '';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async function handleSettingsSave(e) {
        e.preventDefault();

        const settingsData = {
            history: document.getElementById('settingHistory').value,
            mission: document.getElementById('settingMission').value,
            vision: document.getElementById('settingVision').value,
            logo_meaning: document.getElementById('settingLogoMeaning').value,
            updated_at: new Date().toISOString(),
        };

        try {
            const { data: existing } = await supabase.from('club_information').select('id').single();

            let error;
            if (existing) {
                const { error: err } = await supabase.from('club_information').update(settingsData).eq('id', existing.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('club_information').insert([settingsData]);
                error = err;
            }

            if (error) throw error;

            alert('Configuración guardada exitosamente.');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
})();
