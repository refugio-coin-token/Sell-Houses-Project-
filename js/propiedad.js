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
        <button id="favBtn" class="btn" style="background:#333;color:#fff;width:auto;margin:0.5rem 0;">🤍 Guardar en favoritos</button>
        <div class="meta">
            <span>🛏️ ${p.bedrooms || 0} Rec.</span>
            <span>🚿 ${p.bathrooms || 0} Baños</span>
            <span>📏 ${p.area_m2 || 0} m²</span>
            <span>📍 ${p.colonia || ''} ${p.ciudad || ''}</span>
        </div>
        <p>${p.operation === 'venta' ? 'En venta' : 'En renta'} · Estado: ${p.status}</p>
       ${p.latitude && p.longitude ? '<div id="map"></div>' : ''}
        <div class="section">
            <a class="btn btn-whatsapp" target="_blank" href="https://wa.me/34604824126?text=${whatsappMessage}">💬 Contactar por WhatsApp</a>
        </div>
        <div class="section">
    <h2>Calculadora de Hipoteca</h2>
    <div class="field-inline">
        <div class="field">
            <label>Enganche (%)</label>
            <input type="number" id="downPct" value="20" min="0" max="100">
        </div>
        <div class="field">
            <label>Tasa anual (%)</label>
            <input type="number" id="rate" value="11" step="0.1">
        </div>
        <div class="field">
            <label>Plazo (años)</label>
            <input type="number" id="years" value="20">
        </div>
    </div>
    <button type="button" class="btn btn-submit" id="calcBtn">Calcular</button>
    <div id="mortgageResult" style="display:none;"></div>
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
    const favBtn = document.getElementById('favBtn');
favBtn.addEventListener('click', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('Inicia sesión para guardar favoritos.');
        window.location.href = 'login.html';
        return;
    }

    const { data: existing } = await supabaseClient
        .from('favorites').select('*')
        .eq('user_id', session.user.id).eq('property_id', p.id).maybeSingle();

    if (existing) {
        await supabaseClient.from('favorites').delete()
            .eq('user_id', session.user.id).eq('property_id', p.id);
        favBtn.textContent = '🤍 Guardar en favoritos';
    } else {
        await supabaseClient.from('favorites').insert({
            user_id: session.user.id, property_id: p.id
        });
        favBtn.textContent = '❤️ En tus favoritos';
    }
});

// Marcar el botón si ya es favorito
const { data: { session: s } } = await supabaseClient.auth.getSession();
if (s) {
    const { data: fav } = await supabaseClient
        .from('favorites').select('*')
        .eq('user_id', s.user.id).eq('property_id', p.id).maybeSingle();
    if (fav) favBtn.textContent = '❤️ En tus favoritos';
}
    if (p.latitude && p.longitude) {
    const map = L.map('map').setView([p.latitude, p.longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    L.marker([p.latitude, p.longitude]).addTo(map);
}
    document.getElementById('calcBtn').addEventListener('click', () => {
    const price = Number(p.price);
    const downPct = Number(document.getElementById('downPct').value);
    const annualRate = Number(document.getElementById('rate').value);
    const years = Number(document.getElementById('years').value);

    const downPayment = price * (downPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = (annualRate / 100) / 12;
    const months = years * 12;

    const monthlyPayment = monthlyRate === 0
        ? loanAmount / months
        : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    const resultBox = document.getElementById('mortgageResult');
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
        <p>Enganche: $${downPayment.toLocaleString('es-MX', {maximumFractionDigits:0})} MXN</p>
        <p>Monto a financiar: $${loanAmount.toLocaleString('es-MX', {maximumFractionDigits:0})} MXN</p>
        <p>Pago mensual estimado: <strong>$${monthlyPayment.toLocaleString('es-MX', {maximumFractionDigits:0})} MXN</strong></p>
        <p style="font-size:0.8rem;color:#999;">Estimación informativa, no es una oferta de crédito.</p>
    `;
});
}

loadProperty();
