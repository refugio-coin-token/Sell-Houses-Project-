let currentUserId = null;

async function checkAccess() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    currentUserId = session.user.id;
    loadFavorites();
    loadMyInquiries();
}

async function loadFavorites() {
    const list = document.getElementById('favoritesList');
    const { data, error } = await supabaseClient
        .from('favorites')
        .select('property_id, properties(id, title, price, operation, property_images(url, position))')
        .eq('user_id', currentUserId);

    if (error) { list.innerHTML = '<p>Error: ' + error.message + '</p>'; return; }
    if (!data.length) { list.innerHTML = '<p>Aún no tienes favoritos.</p>'; return; }

    list.innerHTML = data.map(f => {
        const p = f.properties;
        if (!p) return '';
        const images = (p.property_images || []).sort((a, b) => a.position - b.position);
        const img = images[0]?.url || 'https://placehold.co/400x250?text=Sin+foto';
        return `
        <div class="card">
            <img src="${img}">
            <strong>$${Number(p.price).toLocaleString('es-MX')} MXN</strong>
            <h3>${p.title}</h3>
            <a class="btn btn-primary" href="propiedad.html?id=${p.id}">Ver propiedad</a>
            <button class="btn btn-danger" onclick="removeFavorite('${p.id}')">Quitar</button>
        </div>`;
    }).join('');
}

window.removeFavorite = async function (propertyId) {
    await supabaseClient.from('favorites').delete()
        .eq('user_id', currentUserId).eq('property_id', propertyId);
    loadFavorites();
};

async function loadMyInquiries() {
    const list = document.getElementById('myInquiriesList');
    const { data, error } = await supabaseClient
        .from('inquiries')
        .select('*, properties(title)')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) { list.innerHTML = '<p>Error: ' + error.message + '</p>'; return; }
    if (!data.length) { list.innerHTML = '<p>Aún no has enviado consultas.</p>'; return; }

    list.innerHTML = data.map(i => `
        <div class="card">
            <strong>${i.properties?.title || 'Propiedad eliminada'}</strong>
            <p>${new Date(i.created_at).toLocaleString('es-MX')}</p>
            <p>${i.message || ''}</p>
        </div>
    `).join('');
}

checkAccess();
