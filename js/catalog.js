// Función para pasar las imágenes de cada propiedad manualmente
function movePropertySlide(button, direction, event) {
    if (event) event.stopPropagation(); // Evita abrir la propiedad al hacer clic en las flechas

    const card = button.closest('.property-card');
    const slidesContainer = card.querySelector('.property-slides');
    const totalSlides = slidesContainer.children.length;

    if (totalSlides <= 1) return;

    let currentIndex = parseInt(card.getAttribute('data-current-slide') || '0', 10);
    currentIndex += direction;

    if (currentIndex < 0) {
        currentIndex = totalSlides - 1; // Vuelve a la última foto
    } else if (currentIndex >= totalSlides) {
        currentIndex = 0; // Vuelve a la primera foto
    }

    card.setAttribute('data-current-slide', currentIndex);
    slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
}

async function loadCatalog(filters = {}) {
    const grid = document.getElementById('propertiesGrid');
    if (!grid) return;

    let query = supabaseClient
        .from('properties')
        .select('*, property_images(url, position)')
        .in('status', ['disponible'])
        .order('created_at', { ascending: false });

    if (filters.operation) query = query.eq('operation', filters.operation);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.location) {
        query = query.or(`colonia.ilike.%${filters.location}%,ciudad.ilike.%${filters.location}%`);
    }

    const { data, error } = await query;

    if (error) {
        grid.innerHTML = '<p>No se pudieron cargar las propiedades.</p>';
        return;
    }
    if (!data.length) {
        grid.innerHTML = '<p>No hay propiedades que coincidan con tu búsqueda.</p>';
        return;
    }

    grid.innerHTML = data.map(p => {
        const images = (p.property_images || []).sort((a, b) => a.position - b.position);
        const imageUrls = images.length > 0 ? images.map(img => img.url) : ['https://placehold.co/600x400?text=Sin+foto'];

        const slidesHtml = imageUrls.map(url => `<img src="${url}" alt="${p.title}">`).join('');
        const arrowsHtml = imageUrls.length > 1 ? `
            <button class="card-arrow prev" onclick="movePropertySlide(this, -1, event)" aria-label="Anterior">‹</button>
            <button class="card-arrow next" onclick="movePropertySlide(this, 1, event)" aria-label="Siguiente">›</button>
        ` : '';

        return `
        <article class="property-card" data-current-slide="0" onclick="window.location.href='propiedad.html?id=${p.id}'" style="cursor:pointer;">
            <div class="property-img">
                <span class="badge">${p.operation === 'venta' ? 'En Venta' : 'En Renta'}</span>
                <div class="property-slides">
                    ${slidesHtml}
                </div>
                ${arrowsHtml}
            </div>
            <div class="property-info">
                <div class="price">$${Number(p.price).toLocaleString('es-MX')} <span>MXN</span></div>
                <h3 class="property-title">${p.title}</h3>
                <div class="features">
                    <span>🛏️ ${p.bedrooms || 0} Rec.</span>
                    <span>🚿 ${p.bathrooms || 0} Baños</span>
                    <span>📏 ${p.area_m2 || 0} m²</span>
                </div>
            </div>
        </article>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const operationFromUrl = params.get('operacion');

    if (operationFromUrl) {
        const filterOp = document.getElementById('filterOperation');
        if (filterOp) filterOp.value = operationFromUrl;
        loadCatalog({ operation: operationFromUrl });
    } else {
        loadCatalog();
    }

    const btn = document.getElementById('btnSearch');
    if (btn) {
        btn.addEventListener('click', () => {
            loadCatalog({
                operation: document.getElementById('filterOperation').value,
                location: document.getElementById('filterLocation').value.trim(),
                maxPrice: document.getElementById('filterMaxPrice').value
            });
        });
    }
});
