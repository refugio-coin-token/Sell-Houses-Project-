const messageBox = document.getElementById('message');

function showMessage(text, isError) {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    messageBox.style.background = isError ? '#4a1f1f' : '#1f4a2a';
    messageBox.style.color = isError ? '#ff8a8a' : '#8aff9e';
}

// Supabase procesa el token del enlace automáticamente y dispara este evento
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        showMessage('Enlace válido. Escribe tu nueva contraseña.', false);
    }
});

document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

    if (error) {
        showMessage('Error: ' + error.message, true);
    } else {
        showMessage('Contraseña actualizada. Redirigiendo al login...', false);
        setTimeout(() => window.location.href = 'login.html', 2000);
    }
});
