(function () {
    'use strict';

    let periodicoArticulos = [];
    let periodicoCategorias = [];
    let periodicoAutores = [];
    let periodicoEventos = [];
    let currentPSection = 'periodico-articulos';
    const UPLOAD_BUCKET = 'uploads';

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await checkAuth();
        await loadAllPeriodicoData();
        setupEventListeners();
    }

    async function checkAuth() {
        if (!window.supabaseClient || !window.supabaseClient.auth) {
            return;
        }
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) {
                return;
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
        }
    }

    async function loadAllPeriodicoData() {
        await Promise.all([
            loadPeriodicoArticulos(),
            loadPeriodicoCategorias(),
            loadPeriodicoAutores(),
            loadPeriodicoEventos()
        ]);
    }

    function setupEventListeners() {
        document.querySelectorAll('.periodicidad-subnav-item').forEach(item => {
            item.addEventListener('click', () => {
                switchPSection(item.dataset.psection);
            });
        });

        document.getElementById('addPeriodicoArticuloBtn')?.addEventListener('click', () => openPeriodicoArticuloModal());
        document.getElementById('addPeriodicoCategoriaBtn')?.addEventListener('click', () => openPeriodicoCategoriaModal());
        document.getElementById('addPeriodicoAutorBtn')?.addEventListener('click', () => openPeriodicoAutorModal());
        document.getElementById('addPeriodicoEventoBtn')?.addEventListener('click', () => openPeriodicoEventoModal());

        document.getElementById('periodicoArticulosTableBody')?.addEventListener('click', handlePeriodicoArticuloActions);
        document.getElementById('periodicoCategoriasTableBody')?.addEventListener('click', handlePeriodicoCategoriaActions);
        document.getElementById('periodicoAutoresTableBody')?.addEventListener('click', handlePeriodicoAutorActions);
        document.getElementById('periodicoEventosTableBody')?.addEventListener('click', handlePeriodicoEventoActions);

        document.getElementById('periodicoSearchInput')?.addEventListener('input', (e) => searchPeriodicoArticulos(e.target.value));

        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-cancel')) {
                const targetId = e.target.dataset.target;
                if (targetId) {
                    const modal = document.getElementById(targetId);
                    if (modal) modal.remove();
                }
            }
        });

        const nuevoDropdown = document.getElementById('nuevoDropdownBtn');
        if (nuevoDropdown) {
            document.querySelectorAll('.nav-dropdown-menu a').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const type = item.dataset.type;
                    switch (type) {
                        case 'periodico-articulo': openPeriodicoArticuloModal(); break;
                        case 'periodico-autor': openPeriodicoAutorModal(); break;
                        case 'periodico-evento': openPeriodicoEventoModal(); break;
                    }
                    nuevoDropdown.parentElement.classList.remove('active');
                });
            });
        }
    }

    function switchPSection(section) {
        currentPSection = section;

        document.querySelectorAll('.periodicidad-subnav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.psection === section);
        });

        document.querySelectorAll('.periodicidad-subsection').forEach(sec => {
            sec.classList.add('hidden');
        });

        const target = document.getElementById(`periodico-sub-${section.split('-')[1]}`) ||
                       document.getElementById(`periodico-sub-${section.replace('periodico-', '')}`);
        if (target) {
            target.classList.remove('hidden');
        }
    }

    async function loadPeriodicoArticulos() {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_articulos')
                .select('*, periodico_categorias(*), periodico_autores(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            periodicoArticulos = data || [];
            renderPeriodicoArticulosTable();
        } catch (error) {
            console.error('Error loading periodico articulos:', error);
        }
    }

    function renderPeriodicoArticulosTable(articulos = periodicoArticulos) {
        const tbody = document.getElementById('periodicoArticulosTableBody');
        if (!tbody) return;

        if (!articulos.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-text">No hay artículos.</td></tr>';
            return;
        }

        tbody.innerHTML = articulos.map(article => {
            const categoria = article.periodico_categorias || {};
            const autor = article.periodico_autores || {};
            const estado = article.publicado ? 'Publicado' : 'Borrador';
            const estadoClass = article.publicado ? 'status-published' : 'status-draft';

            return `
            <tr>
                <td>${article.titulo}</td>
                <td>${autor.nombre || 'Sin autor'}</td>
                <td>${categoria.nombre || 'Sin categoría'}</td>
                <td><span class="status-badge ${estadoClass}">${estado}</span></td>
                <td>${article.destacado ? '<span class="text-accent">Sí</span>' : 'No'}</td>
                <td>${formatDate(article.fecha_publicacion)}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${article.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${article.id}">Eliminar</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    function searchPeriodicoArticulos(query) {
        if (!query.trim()) {
            renderPeriodicoArticulosTable();
            return;
        }
        const filtered = periodicoArticulos.filter(a =>
            a.titulo.toLowerCase().includes(query.toLowerCase()) ||
            a.contenido.toLowerCase().includes(query.toLowerCase())
        );
        renderPeriodicoArticulosTable(filtered);
    }

    function handlePeriodicoArticuloActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const article = periodicoArticulos.find(a => a.id === id);
            if (article) openPeriodicoArticuloModal(article);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de eliminar este artículo?')) {
                deletePeriodicoArticulo(id);
            }
        }
    }

    async function openPeriodicoArticuloModal(article = null) {
        const isEdit = !!article;
        const categoriaOptions = await getPeriodicoCategoriaOptions(article ? article.categoria_id : null);
        const autorOptions = await getPeriodicoAutorOptions(article ? article.autor_id : null);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'periodicoArticuloFormModal';
        modal.innerHTML = `
            <div class="modal-content modal-wide modal-form-content">
                <button class="modal-close" id="closePeriodicoArticuloModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nuevo'} Artículo de Periódico</h2>
                </div>
                <form id="periodicoArticuloForm" class="modal-form" novalidate>
                    <input type="hidden" id="periodicoArticuloId" value="${isEdit ? article.id : ''}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="periodicoArticuloTitulo">Título <span class="required">*</span></label>
                            <input type="text" id="periodicoArticuloTitulo" required value="${isEdit ? article.titulo : ''}">
                        </div>
                        <div class="form-group">
                            <label for="periodicoArticuloSlug">Slug <span class="optional">(opcional)</span></label>
                            <input type="text" id="periodicoArticuloSlug" value="${isEdit ? article.slug || '' : ''}" placeholder="automático si se deja vacío">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="periodicoArticuloSubtitulo">Subtítulo <span class="optional">(opcional)</span></label>
                        <input type="text" id="periodicoArticuloSubtitulo" value="${isEdit ? article.subtitulo || '' : ''}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="periodicoArticuloCategoria">Categoría <span class="required">*</span></label>
                            <select id="periodicoArticuloCategoria" required>
                                <option value="">Seleccionar categoría</option>
                                ${categoriaOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="periodicoArticuloAutor">Autor <span class="required">*</span></label>
                            <select id="periodicoArticuloAutor" required>
                                <option value="">Seleccionar autor</option>
                                ${autorOptions}
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="periodicoArticuloContenido">Contenido <span class="required">*</span></label>
                        <textarea id="periodicoArticuloContenido" required rows="10" placeholder="Escribe el contenido del artículo...">${isEdit ? article.contenido : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="periodicoArticuloImagen">Imagen Principal <span class="optional">(opcional)</span></label>
                        <div class="url-with-upload">
                            <input type="url" id="periodicoArticuloImagen" value="${isEdit ? article.imagen_principal || '' : ''}" placeholder="https://...">
                            <button type="button" class="btn btn-sm btn-secondary" id="uploadPeriodicoArticuloImagen">Importar archivo</button>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="periodicoArticuloFechaPublicacion">Fecha de Publicación</label>
                            <input type="datetime-local" id="periodicoArticuloFechaPublicacion" value="${isEdit ? formatDateTimeLocal(article.fecha_publicacion) : formatDateTimeLocal(new Date())}">
                        </div>
                        <div class="form-group" style="justify-content: flex-end;">
                            <label class="checkbox-label">
                                <input type="checkbox" id="periodicoArticuloPublicado" ${isEdit ? (article.publicado ? 'checked' : '') : 'checked'}>
                                <span>Publicado</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="periodicoArticuloDestacado" ${isEdit ? (article.destacado ? 'checked' : '') : ''}>
                                <span>Destacado</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Artículo</button>
                        <button type="button" class="btn btn-secondary modal-cancel" data-target="periodicoArticuloFormModal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        addModalCloseHandler('closePeriodicoArticuloModal', modal);
        addFormSubmitHandler('periodicoArticuloForm', savePeriodicoArticulo);
        createFileInputHandler('periodicoArticuloImagen', 'uploadPeriodicoArticuloImagen', 'periodico');
    }

    async function getPeriodicoCategoriaOptions(selectedId = null) {
        try {
            const { data } = await window.supabaseClient.from('periodico_categorias').select('id, nombre').order('nombre');
            return (data || []).map(c => `
                <option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.nombre}</option>
            `).join('');
        } catch {
            return '';
        }
    }

    async function getPeriodicoAutorOptions(selectedId = null) {
        try {
            const { data } = await window.supabaseClient.from('periodico_autores').select('id, nombre').order('nombre');
            return (data || []).map(a => `
                <option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${a.nombre}</option>
            `).join('');
        } catch {
            return '';
        }
    }

    async function savePeriodicoArticulo() {
        const id = document.getElementById('periodicoArticuloId').value;
        let slug = document.getElementById('periodicoArticuloSlug').value.trim();
        const titulo = document.getElementById('periodicoArticuloTitulo').value;

        if (!slug) {
            slug = titulo.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
        }

        const fechaInput = document.getElementById('periodicoArticuloFechaPublicacion').value;
        const fechaPublicacion = fechaInput ? new Date(fechaInput).toISOString() : new Date().toISOString();

        const articleData = {
            titulo: titulo,
            subtitulo: document.getElementById('periodicoArticuloSubtitulo').value || null,
            slug: slug,
            contenido: document.getElementById('periodicoArticuloContenido').value,
            imagen_principal: document.getElementById('periodicoArticuloImagen').value || null,
            categoria_id: document.getElementById('periodicoArticuloCategoria').value || null,
            autor_id: document.getElementById('periodicoArticuloAutor').value || null,
            destacado: document.getElementById('periodicoArticuloDestacado').checked,
            publicado: document.getElementById('periodicoArticuloPublicado').checked,
            fecha_publicacion: fechaPublicacion,
            updated_at: new Date().toISOString()
        };

        try {
            let error;
            if (id) {
                const { error: err } = await window.supabaseClient
                    .from('periodico_articulos')
                    .update(articleData)
                    .eq('id', id);
                error = err;
            } else {
                const { error: err } = await window.supabaseClient
                    .from('periodico_articulos')
                    .insert([articleData]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('periodicoArticuloFormModal')?.remove();
            await loadPeriodicoArticulos();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deletePeriodicoArticulo(id) {
        try {
            const { error } = await window.supabaseClient
                .from('periodico_articulos')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await loadPeriodicoArticulos();
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }

    async function loadPeriodicoCategorias() {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_categorias')
                .select('*')
                .order('nombre');

            if (error) throw error;

            periodicoCategorias = data || [];
            renderPeriodicoCategoriasTable();
        } catch (error) {
            console.error('Error loading periodico categorias:', error);
        }
    }

    function renderPeriodicoCategoriasTable() {
        const tbody = document.getElementById('periodicoCategoriasTableBody');
        if (!tbody) return;

        if (!periodicoCategorias.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="loading-text">No hay categorías.</td></tr>';
            return;
        }

        tbody.innerHTML = periodicoCategorias.map(cat => `
            <tr>
                <td>${cat.nombre}</td>
                <td><span class="category-color-swatch" style="background-color: ${cat.color || '#f0b429'}"></span> ${cat.color || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${cat.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${cat.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function handlePeriodicoCategoriaActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const cat = periodicoCategorias.find(c => c.id === id);
            if (cat) openPeriodicoCategoriaModal(cat);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar esta categoría?')) {
                deletePeriodicoCategoria(id);
            }
        }
    }

    function openPeriodicoCategoriaModal(categoria = null) {
        const isEdit = !!categoria;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'periodicoCategoriaFormModal';
        modal.innerHTML = `
            <div class="modal-content modal-small modal-form-content">
                <button class="modal-close" id="closePeriodicoCategoriaModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nueva'} Categoría</h2>
                </div>
                <form id="periodicoCategoriaForm" class="modal-form" novalidate>
                    <input type="hidden" id="periodicoCategoriaId" value="${isEdit ? categoria.id : ''}">
                    <div class="form-group">
                        <label for="periodicoCategoriaNombre">Nombre <span class="required">*</span></label>
                        <input type="text" id="periodicoCategoriaNombre" required value="${isEdit ? categoria.nombre : ''}">
                    </div>
                    <div class="form-group">
                        <label for="periodicoCategoriaColor">Color</label>
                        <div class="url-with-upload">
                            <input type="color" id="periodicoCategoriaColor" value="${isEdit ? categoria.color || '#f0b429' : '#f0b429'}">
                            <input type="text" id="periodicoCategoriaColorText" value="${isEdit ? categoria.color || '#f0b429' : '#f0b429'}" readonly style="flex: 1; text-align: center;">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Categoría</button>
                        <button type="button" class="btn btn-secondary modal-cancel" data-target="periodicoCategoriaFormModal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        addModalCloseHandler('closePeriodicoCategoriaModal', modal);
        addFormSubmitHandler('periodicoCategoriaForm', savePeriodicoCategoria);

        const colorPicker = document.getElementById('periodicoCategoriaColor');
        const colorText = document.getElementById('periodicoCategoriaColorText');
        if (colorPicker && colorText) {
            colorPicker.addEventListener('input', () => {
                colorText.value = colorPicker.value;
            });
        }
    }

    async function savePeriodicoCategoria() {
        const id = document.getElementById('periodicoCategoriaId').value;
        const categoriaData = {
            nombre: document.getElementById('periodicoCategoriaNombre').value,
            color: document.getElementById('periodicoCategoriaColor').value
        };

        try {
            let error;
            if (id) {
                const { error: err } = await window.supabaseClient
                    .from('periodico_categorias')
                    .update(categoriaData)
                    .eq('id', id);
                error = err;
            } else {
                const { error: err } = await window.supabaseClient
                    .from('periodico_categorias')
                    .insert([categoriaData]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('periodicoCategoriaFormModal')?.remove();
            await loadPeriodicoCategorias();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deletePeriodicoCategoria(id) {
        try {
            const { error } = await window.supabaseClient
                .from('periodico_categorias')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await loadPeriodicoCategorias();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function loadPeriodicoAutores() {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_autores')
                .select('*')
                .order('nombre');

            if (error) throw error;

            periodicoAutores = data || [];
            renderPeriodicoAutoresTable();
        } catch (error) {
            console.error('Error loading periodico autores:', error);
        }
    }

    function renderPeriodicoAutoresTable() {
        const tbody = document.getElementById('periodicoAutoresTableBody');
        if (!tbody) return;

        if (!periodicoAutores.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No hay autores.</td></tr>';
            return;
        }

        tbody.innerHTML = periodicoAutores.map(autor => `
            <tr>
                <td><img src="${autor.foto || 'https://via.placeholder.com/40x40'}" alt="${autor.nombre}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"
                         onerror="this.src='https://via.placeholder.com/40x40'"></td>
                <td>${autor.nombre}</td>
                <td>${autor.descripcion || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${autor.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${autor.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function handlePeriodicoAutorActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const autor = periodicoAutores.find(a => a.id === id);
            if (autor) openPeriodicoAutorModal(autor);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar este autor?')) {
                deletePeriodicoAutor(id);
            }
        }
    }

    function openPeriodicoAutorModal(autor = null) {
        const isEdit = !!autor;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'periodicoAutorFormModal';
        modal.innerHTML = `
            <div class="modal-content modal-narrow modal-form-content">
                <button class="modal-close" id="closePeriodicoAutorModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nuevo'} Autor</h2>
                </div>
                <form id="periodicoAutorForm" class="modal-form" novalidate>
                    <input type="hidden" id="periodicoAutorId" value="${isEdit ? autor.id : ''}">
                    <div class="form-group">
                        <label for="periodicoAutorNombre">Nombre <span class="required">*</span></label>
                        <input type="text" id="periodicoAutorNombre" required value="${isEdit ? autor.nombre : ''}">
                    </div>
                    <div class="form-group">
                        <label for="periodicoAutorDescripcion">Descripción <span class="optional">(opcional)</span></label>
                        <textarea id="periodicoAutorDescripcion" rows="3">${isEdit ? autor.descripcion || '' : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="periodicoAutorFoto">Foto <span class="optional">(opcional)</span></label>
                        <div class="url-with-upload">
                            <input type="url" id="periodicoAutorFoto" value="${isEdit ? autor.foto || '' : ''}" placeholder="https://...">
                            <button type="button" class="btn btn-sm btn-secondary" id="uploadPeriodicoAutorFoto">Importar archivo</button>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Autor</button>
                        <button type="button" class="btn btn-secondary modal-cancel" data-target="periodicoAutorFormModal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        addModalCloseHandler('closePeriodicoAutorModal', modal);
        addFormSubmitHandler('periodicoAutorForm', savePeriodicoAutor);
        createFileInputHandler('periodicoAutorFoto', 'uploadPeriodicoAutorFoto', 'periodico-autores');
    }

    async function savePeriodicoAutor() {
        const id = document.getElementById('periodicoAutorId').value;
        const autorData = {
            nombre: document.getElementById('periodicoAutorNombre').value,
            descripcion: document.getElementById('periodicoAutorDescripcion').value || null,
            foto: document.getElementById('periodicoAutorFoto').value || null
        };

        try {
            let error;
            if (id) {
                const { error: err } = await window.supabaseClient
                    .from('periodico_autores')
                    .update(autorData)
                    .eq('id', id);
                error = err;
            } else {
                const { error: err } = await window.supabaseClient
                    .from('periodico_autores')
                    .insert([autorData]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('periodicoAutorFormModal')?.remove();
            await loadPeriodicoAutores();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deletePeriodicoAutor(id) {
        try {
            const { error } = await window.supabaseClient
                .from('periodico_autores')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await loadPeriodicoAutores();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function loadPeriodicoEventos() {
        try {
            const { data, error } = await window.supabaseClient
                .from('periodico_eventos')
                .select('*')
                .order('fecha_evento', { ascending: false });

            if (error) throw error;

            periodicoEventos = data || [];
            renderPeriodicoEventosTable();
        } catch (error) {
            console.error('Error loading periodico eventos:', error);
        }
    }

    function renderPeriodicoEventosTable() {
        const tbody = document.getElementById('periodicoEventosTableBody');
        if (!tbody) return;

        if (!periodicoEventos.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No hay eventos.</td></tr>';
            return;
        }

        tbody.innerHTML = periodicoEventos.map(event => `
            <tr>
                <td>${event.titulo}</td>
                <td>${formatDate(event.fecha_evento)}</td>
                <td>${event.publicado ? '<span class="status-badge status-published">Publicado</span>' : '<span class="status-badge status-draft">No publicado</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${event.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${event.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    function handlePeriodicoEventoActions(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.classList.contains('edit-btn')) {
            const evento = periodicoEventos.find(e => e.id === id);
            if (evento) openPeriodicoEventoModal(evento);
        } else if (btn.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar este evento?')) {
                deletePeriodicoEvento(id);
            }
        }
    }

    function openPeriodicoEventoModal(evento = null) {
        const isEdit = !!evento;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'periodicoEventoFormModal';
        modal.innerHTML = `
            <div class="modal-content modal-narrow modal-form-content">
                <button class="modal-close" id="closePeriodicoEventoModal">&times;</button>
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar' : 'Nuevo'} Evento</h2>
                </div>
                <form id="periodicoEventoForm" class="modal-form" novalidate>
                    <input type="hidden" id="periodicoEventoId" value="${isEdit ? evento.id : ''}">
                    <div class="form-group">
                        <label for="periodicoEventoTitulo">Título <span class="required">*</span></label>
                        <input type="text" id="periodicoEventoTitulo" required value="${isEdit ? evento.titulo : ''}">
                    </div>
                    <div class="form-group">
                        <label for="periodicoEventoDescripcion">Descripción <span class="optional">(opcional)</span></label>
                        <textarea id="periodicoEventoDescripcion" rows="3">${isEdit ? evento.descripcion || '' : ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="periodicoEventoFecha">Fecha del Evento</label>
                            <input type="datetime-local" id="periodicoEventoFecha" value="${isEdit ? formatDateTimeLocal(evento.fecha_evento) : formatDateTimeLocal(new Date())}">
                        </div>
                        <div class="form-group">
                            <label for="periodicoEventoEnlace">Enlace <span class="optional">(opcional)</span></label>
                            <input type="url" id="periodicoEventoEnlace" value="${isEdit ? evento.enlace || '' : ''}" placeholder="https://...">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="periodicoEventoImagen">Imagen <span class="optional">(opcional)</span></label>
                        <div class="url-with-upload">
                            <input type="url" id="periodicoEventoImagen" value="${isEdit ? evento.imagen || '' : ''}" placeholder="https://...">
                            <button type="button" class="btn btn-sm btn-secondary" id="uploadPeriodicoEventoImagen">Importar archivo</button>
                        </div>
                    </div>
                    <label class="checkbox-label">
                        <input type="checkbox" id="periodicoEventoPublicado" ${isEdit ? (evento.publicado !== false ? 'checked' : '') : 'checked'}>
                        <span>Publicado</span>
                    </label>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear'} Evento</button>
                        <button type="button" class="btn btn-secondary modal-cancel" data-target="periodicoEventoFormModal">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        addModalCloseHandler('closePeriodicoEventoModal', modal);
        addFormSubmitHandler('periodicoEventoForm', savePeriodicoEvento);
        createFileInputHandler('periodicoEventoImagen', 'uploadPeriodicoEventoImagen', 'periodico-eventos');
    }

    async function savePeriodicoEvento() {
        const id = document.getElementById('periodicoEventoId').value;
        const fechaInput = document.getElementById('periodicoEventoFecha').value;
        const eventoData = {
            titulo: document.getElementById('periodicoEventoTitulo').value,
            descripcion: document.getElementById('periodicoEventoDescripcion').value || null,
            fecha_evento: fechaInput ? new Date(fechaInput).toISOString() : new Date().toISOString(),
            enlace: document.getElementById('periodicoEventoEnlace').value || null,
            imagen: document.getElementById('periodicoEventoImagen').value || null,
            publicado: document.getElementById('periodicoEventoPublicado').checked
        };

        try {
            let error;
            if (id) {
                const { error: err } = await window.supabaseClient
                    .from('periodico_eventos')
                    .update(eventoData)
                    .eq('id', id);
                error = err;
            } else {
                const { error: err } = await window.supabaseClient
                    .from('periodico_eventos')
                    .insert([eventoData]);
                error = err;
            }

            if (error) throw error;

            document.getElementById('periodicoEventoFormModal')?.remove();
            await loadPeriodicoEventos();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function deletePeriodicoEvento(id) {
        try {
            const { error } = await window.supabaseClient
                .from('periodico_eventos')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await loadPeriodicoEventos();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    function addModalCloseHandler(closeBtnId, modalElement) {
        const closeBtn = document.getElementById(closeBtnId);
        if (!closeBtn) return;
        closeBtn.addEventListener('click', () => {
            if (modalElement && modalElement.parentNode) {
                modalElement.remove();
            }
        });
    }

    function addFormSubmitHandler(formId, handler) {
        const form = document.getElementById(formId);
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handler();
        });
    }

    async function uploadFile(file, bucket = UPLOAD_BUCKET, folder = '') {
        try {
            if (!file) return null;

            if (file.type.startsWith('image/')) {
                const originalSize = file.size;
                file = await resizeImage(file, 1200, 0.85);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            const { data, error } = await window.supabaseClient.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = window.supabaseClient.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('[upload] Error:', error);
            alert('Error al subir el archivo: ' + error.message);
            return null;
        }
    }

    function resizeImage(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                blob.name = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
                                resolve(blob);
                            } else {
                                reject(new Error('No se pudo procesar la imagen'));
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = () => reject(new Error('Error al cargar la imagen'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }

    function createFileInputHandler(urlFieldId, uploadBtnId, bucket = UPLOAD_BUCKET) {
        const urlField = document.getElementById(urlFieldId);
        const uploadBtn = document.getElementById(uploadBtnId);
        if (!uploadBtn || !urlField) return;

        uploadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';

            input.onchange = async (ev) => {
                const file = ev.target.files[0];
                if (!file) return;

                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Subiendo...';

                const url = await uploadFile(file, bucket);
                if (url) {
                    urlField.value = url;
                }

                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Importar archivo';
            };

            input.click();
        });
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

    function formatDateTimeLocal(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    window.PeriodicoAdmin = {
        loadPeriodicoArticulos,
        loadPeriodicoCategorias,
        loadPeriodicoAutores,
        loadPeriodicoEventos
    };
})();