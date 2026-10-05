document.addEventListener('DOMContentLoaded', async () => {
    const portalLink = document.getElementById('portalLink');
    if (!portalLink) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabaseClient
        .from('profiles').select('role, full_name')
        .eq('id', session.user.id).single();

    const dashboardUrl = profile?.role === 'agencia' ? 'dashboard-agencia.html' : 'dashboard-usuario.html';
    const initial = (profile?.full_name || 'U').charAt(0).toUpperCase();

    portalLink.outerHTML = `
        <li style="display:flex;align-items:center;gap:10px;">
            <a href="${dashboardUrl}" style="display:flex;align-items:center;gap:8px;">
                <span style="width:34px;height:34px;border-radius:50%;background:var(--gold-accent);color:var(--dark-charcoal);display:flex;align-items:center;justify-content:center;font-weight:700;">${initial}</span>
                ${profile?.full_name || 'Mi cuenta'}
            </a>
        </li>
        <li><a href="#" id="logoutLink">Cerrar sesión</a></li>
    `;

    document.getElementById('logoutLink').addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.reload();
    });
});
