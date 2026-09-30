document.addEventListener('DOMContentLoaded', async () => {
    const portalLink = document.getElementById('portalLink');
    if (!portalLink) return;

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .single();

        const dashboardUrl = profile?.role === 'agencia'
            ? 'dashboard-agencia.html'
            : 'dashboard-usuario.html';

        portalLink.textContent = profile?.full_name
            ? `Hola, ${profile.full_name}`
            : 'Mi cuenta';
        portalLink.href = dashboardUrl;

        // Añadir enlace de cerrar sesión justo después
        const logoutLi = document.createElement('li');
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Cerrar sesión';
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.reload();
        });
        logoutLi.appendChild(logoutLink);
        portalLink.closest('li').insertAdjacentElement('afterend', logoutLi);
    }
});
