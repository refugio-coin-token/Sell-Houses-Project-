function getPropertyId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function setMainImage(url) {
    document.getElementById('mainImg').src = url;
    document.querySelectorAll('.gallery-thumbs img').forEach(img => {
        img.classList.toggle('active', img.src === url);
    });
}

async function loadProperty() {
    const id = getPropertyId();
    const content = document.getElementById('content');

    if (!id) { content.innerHTML = '<p>Propiedad no especificada.</p>'; return; }

    const { data: p, error } = await supabaseClient
        .from('properties')
        .select('*, property_images(url, position)')
        .eq('id', id)
        .single();

    if (error || !p) { content.innerHTML = '<p>No se encontró esta propiedad.</p>'; return; }

    const images = (p.property_images || []).sort((a, b) => a.position - b.position);
    const mainImage = images[0]?.url || 'https://placehold.co/800x450?text=Sin+foto';

    const whatsappMessage = encodeURIComponent(
        `Hola, me interesa la propiedad "${p.title}" (${window.location.href})`
    );

    content.innerHTML = `
        <img id="mainImg" class="gallery-main" src="${mainImage}" alt="${p.title}">
        ${images.length > 1 ? `
            <div class="gallery-thumbs">
                ${images.map(img => `<img src="${img.url}" class="${img.url === mainImage ? 'active' : ''}" onclick="setMainImage('${img.url}')">`).join('')}
            </div>` : ''}

        <h1>${p.title}</h1>
        <div class="price">$${Number(p.price).toLocaleString('es-MX')} MXN</div>
        <div class="meta">
            <span>🛏️ ${p.bedrooms || 0} Rec.</span>
            <span>🚿 ${p.bathrooms || 0} Baños</span>
            <span>📏 ${p.area_m2 || 0} m²</span>
            <span>📍 ${p.colonia || ''} ${p.ciudad || ''}</span>
        </div>
        <p>${p.operation === 'venta' ? 'En venta' : 'En renta'} · Estado: ${p.status}</p>

        <div class="section">
            <a class="btn btn-whatsapp" target="_blank" href="https://wa.me/34604824126?text=${whatsappMessage}">💬 Contactar por WhatsApp</a>
        </div>

        <div class="section">
            <h2>Enviar una consulta</h2>
            <form id="inquiryForm">
                <div class="field">
                    <label>Nombre</label>
                    <input type="text" id="inqName" required>
                </div>
                <div class="field">
                    <label>Correo</label>
                    <input type="email" id="inqEmail" required>
                </div>
                <div class="field">
                    <label>Teléfono (opcional)</label>
                    <input type="text" id="inqPhone">
                </div>
                <div class="field">
                    <label>Mensaje</label>
                    <textarea id="inqMessage" rows="3">Hola, me interesa esta propiedad.</textarea>
                </div>
                <button type="submit" class="btn btn-submit">Enviar consulta</button>
            </form>
            <div id="formMessage"></div>
        </div>
    `;

    document.getElementById('inquiryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { data: { session } } = await supabaseClient.auth.getSession();

        const { error: insertError } = await supabaseClient.from('inquiries').insert({
            property_id: p.id,
            user_id: session?.user?.id || null,
            name: document.getElementById('inqName').value,
            email: document.getElementById('inqEmail').value,
            phone: document.getElementById('inqPhone').value,
            message: document.getElementById('inqMessage').value
        });

        const box = document.getElementById('formMessage');
        box.style.display = 'block';
        if (insertError) {
            box.textContent = 'Error al enviar: ' + insertError.message;
            box.style.background = '#4a1f1f'; box.style.color = '#ff8a8a';
        } else {
            box.textContent = 'Consulta enviada. Te contactaremos pronto.';
            box.style.background = '#1f4a2a'; box.style.color = '#8aff9e';
            document.getElementById('inquiryForm').reset();
        }
    });
}

loadProperty();
