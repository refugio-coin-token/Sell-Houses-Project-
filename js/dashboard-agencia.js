let currentUserId = null;

async function checkAccess() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'agencia') {
        window.location.href = 'index.html';
        return;
    }
    currentUserId = session.user.id;
    loadProperties();
}

async function loadProperties() {
    const grid = document.getElementById('propertiesGrid');
    const { data, error } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('agency_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) {
        grid.innerHTML = '<p>Error al cargar propiedades.</p>';
        return;
    }
    if (!data.length) {
        grid.innerHTML = '<p>Aún no tienes propiedades. Agrega la primera arriba.</p>';
        return;
    }

    grid.innerHTML = data.map(p => `
        <article class="property-card">
            <div class="property-info">
                <div class="price">$${Number(p.price).toLocaleString('es-MX')} <span>MXN</span></div>
                <h3 class="property-title">${p.title}</h3>
                <div class="features">
                    <span>🛏️ ${p.bedrooms || 0} Rec.</span>
                    <span>🚿 ${p.bathrooms || 0} Baños</span>
                    <span>📏 ${p.area_m2 || 0} m²</span>
                </div>
                <p>${p.operation} · ${p.status} · ${p.colonia || ''} ${p.ciudad || ''}</p>
                <button class="btn-search" onclick="editProperty('${p.id}')">Editar</button>
                <button class="btn-search" style="background:#c0392b;" onclick="deleteProperty('${p.id}')">Borrar</button>
            </div>
        </article>
    `).join('');
}

window.editProperty = async function (id) {
    const { data: p } = await supabaseClient.from('properties').select('*').eq('id', id).single();
    if (!p) return;
    document.getElementById('propertyId').value = p.id;
    document.getElementById('title').value = p.title;
    document.getElementById('operation').value = p.operation;
    document.getElementById('price').value = p.price;
    document.getElementById('colonia').value = p.colonia || '';
    document.getElementById('ciudad').value = p.ciudad || '';
    document.getElementById('bedrooms').value = p.bedrooms || '';
    document.getElementById('bathrooms').value = p.bathrooms || '';
    document.getElementById('area_m2').value = p.area_m2 || '';
    document.getElementById('status').value = p.status;
    document.getElementById('submitBtn').textContent = 'Actualizar propiedad';
    document.getElementById('cancelEdit').style.display = 'inline-block';
    window.scrollTo(0, 0);
};

window.deleteProperty = async function (id) {
    if (!confirm('¿Seguro que quieres borrar esta propiedad?')) return;
    const { error } = await supabaseClient.from('properties').delete().eq('id', id);
    if (error) {
        alert('Error al borrar: ' + error.message);
    } else {
        loadProperties();
    }
};

document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    document.getElementById('submitBtn').textContent = 'Guardar propiedad';
    document.getElementById('cancelEdit').style.display = 'none';
});

document.getElementById('propertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('propertyId').value;
    const payload = {
        title: document.getElementById('title').value,
        operation: document.getElementById('operation').value,
        price: Number(document.getElementById('price').value),
        colonia: document.getElementById('colonia').value,
        ciudad: document.getElementById('ciudad').value,
        bedrooms: Number(document.getElementById('bedrooms').value) || null,
        bathrooms: Number(document.getElementById('bathrooms').value) || null,
        area_m2: Number(document.getElementById('area_m2').value) || null,
        status: document.getElementById('status').value
    };

    const messageBox = document.getElementById('formMessage');
    let result;
    if (id) {
        result = await supabaseClient.from('properties').update(payload).eq('id', id);
    } else {
        payload.agency_id = currentUserId;
        result = await supabaseClient.from('properties').insert(payload);
    }

    if (result.error) {
        messageBox.textContent = 'Error: ' + result.error.message;
        messageBox.style.color = '#c0392b';
    } else {
        messageBox.textContent = 'Guardado correctamente.';
        messageBox.style.color = '#27ae60';
        document.getElementById('propertyForm').reset();
        document.getElementById('propertyId').value = '';
        document.getElementById('submitBtn').textContent = 'Guardar propiedad';
        document.getElementById('cancelEdit').style.display = 'none';
        loadProperties();
    }
});

checkAccess();
