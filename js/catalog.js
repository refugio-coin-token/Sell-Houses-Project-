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
        const mainImage = images[0]?.url || 'https://placehold.co/600x400?text=Sin+foto';
        return `
        <article class="property-card">
            <div class="property-img">
                <span class="badge">${p.operation === 'venta' ? 'En Venta' : 'En Renta'}</span>
                <img src="${mainImage}" alt="${p.title}">
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
    loadCatalog();

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
