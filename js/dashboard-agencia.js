let currentUserId = null;

async function checkAccess() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    const { data: profile } = await supabaseClient
        .from('profiles').select('role').eq('id', session.user.id).single();

    if (profile?.role !== 'agencia') { window.location.href = 'index.html'; return; }

    currentUserId = session.user.id;
    loadStats();
    loadProperties();
    loadInquiries();
}

function showMessage(text, isError) {
    const box = document.getElementById('formMessage');
    box.textContent = text;
    box.style.display = 'block';
    box.style.background = isError ? '#4a1f1f' : '#1f4a2a';
    box.style.color = isError ? '#ff8a8a' : '#8aff9e';
}

async function loadStats() {
    const { data, error } = await supabaseClient
        .from('properties').select('price, status')
        .eq('agency_id', currentUserId);

    const box = document.getElementById('statsGrid');
    if (error || !data) { box.innerHTML = ''; return; }

    const total = data.length;
    const disponibles = data.filter(p => p.status === 'disponible').length;
    const sumaValor = data.reduce((acc, p) => acc + Number(p.price), 0);
    const vendidasRentadas = data.filter(p => p.status === 'vendida' || p.status === 'rentada').length;

    box.innerHTML = `
        <div class="stat-box"><div class="num">${total}</div><div class="lbl">Total propiedades</div></div>
        <div class="stat-box"><div class="num">${disponibles}</div><div class="lbl">Disponibles</div></div>
        <div class="stat-box"><div class="num">$${sumaValor.toLocaleString('es-MX', {maximumFractionDigits:0})}</div><div class="lbl">Valor en catálogo (MXN)</div></div>
        <div class="stat-box"><div class="num">${vendidasRentadas}</div><div class="lbl">Vendidas/Rentadas</div></div>
    `;
}

async function loadProperties() {
    const grid = document.getElementById('propertiesGrid');
    const { data: props, error } = await supabaseClient
        .from('properties').select('*, property_images(url)')
        .eq('agency_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) { grid.innerHTML = '<p>Error al cargar: ' + error.message + '</p>'; return; }
    if (!props.length) { grid.innerHTML = '<p>Aún no tienes propiedades.</p>'; return; }

    grid.innerHTML = props.map(p => `
        <div class="card">
            ${p.property_images?.[0] ? `<img src="${p.property_images[0].url}">` : ''}
            <strong>$${Number(p.price).toLocaleString('es-MX')} MXN</strong>
            <h3>${p.title}</h3>
            <p>${p.operation} · ${p.status} · ${p.bedrooms || 0} rec · ${p.bathrooms || 0} baños · ${p.area_m2 || 0} m²</p>
            <p>${p.colonia || ''} ${p.ciudad || ''}</p>
            ${p.property_images?.length ? `<div class="thumbs">${p.property_images.map(img => `<img src="${img.url}">`).join('')}</div>` : ''}
            <div class="card-actions">
                <button class="btn secondary" onclick="editProperty('${p.id}')">Editar</button>
                <button class="btn danger" onclick="deleteProperty('${p.id}')">Borrar</button>
            </div>
        </div>
    `).join('');
}
async function loadInquiries() {
    const list = document.getElementById('inquiriesList');
    if (!list) return;

    const { data, error } = await supabaseClient
        .from('inquiries')
        .select('*, properties!inner(title, agency_id)')
        .eq('properties.agency_id', currentUserId)
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = '<p>Error al cargar consultas: ' + error.message + '</p>';
        return;
    }
    if (!data.length) {
        list.innerHTML = '<p>Aún no has recibido consultas.</p>';
        return;
    }

    list.innerHTML = data.map(i => `
        <div class="card">
            <strong>${i.properties.title}</strong>
            <p>${new Date(i.created_at).toLocaleString('es-MX')}</p>
            <p>👤 ${i.name} · ✉️ ${i.email} ${i.phone ? '· 📞 ' + i.phone : ''}</p>
            <p>${i.message || ''}</p>
        </div>
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
    document.getElementById('description').value = p.description || '';
    document.getElementById('status').value = p.status;
    document.getElementById('submitBtn').textContent = 'Actualizar propiedad';
    document.getElementById('cancelEdit').style.display = 'block';
    window.scrollTo(0, 0); me 
};

window.deleteProperty = async function (id) {
    if (!confirm('¿Borrar esta propiedad?')) return;
    const { error } = await supabaseClient.from('properties').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); } else { loadProperties(); }
};

document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    document.getElementById('submitBtn').textContent = 'Guardar propiedad';
    document.getElementById('cancelEdit').style.display = 'none';
});

async function uploadPhotos(propertyId, files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${propertyId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabaseClient
            .storage.from('property-images').upload(path, file);

        if (uploadError) { console.error(uploadError); continue; }

        const { data: urlData } = supabaseClient
            .storage.from('property-images').getPublicUrl(path);

        await supabaseClient.from('property_images').insert({
            property_id: propertyId,
            url: urlData.publicUrl,
            position: i
        });
    }
}

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
    description: document.getElementById('description').value,
    status: document.getElementById('status').value
};

    let propertyId = id;
    let result;

    if (id) {
        result = await supabaseClient.from('properties').update(payload).eq('id', id);
    } else {
        payload.agency_id = currentUserId;
        result = await supabaseClient.from('properties').insert(payload).select().single();
        if (result.data) propertyId = result.data.id;
    }

    if (result.error) {
        showMessage('Error: ' + result.error.message, true);
        return;
    }

    const photoInput = document.getElementById('photos');
    if (photoInput.files.length > 0 && propertyId) {
        await uploadPhotos(propertyId, photoInput.files);
    }

    showMessage('Guardado correctamente.', false);
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    document.getElementById('submitBtn').textContent = 'Guardar propiedad';
    document.getElementById('cancelEdit').style.display = 'none';
    loadProperties();
});

checkAccess();
