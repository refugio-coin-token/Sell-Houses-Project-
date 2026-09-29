let isSignup = false;

const form = document.getElementById('loginForm');
const toggleMode = document.getElementById('toggleMode');
const nameField = document.getElementById('nameField');
const submitBtn = document.getElementById('submitBtn');
const messageBox = document.getElementById('loginMessage');

toggleMode.addEventListener('click', (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    nameField.style.display = isSignup ? 'block' : 'none';
    submitBtn.textContent = isSignup ? 'Crear cuenta' : 'Iniciar Sesión';
    toggleMode.textContent = isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
    messageBox.style.display = 'none';
});

function showMessage(text, isError) {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    messageBox.style.color = isError ? '#c0392b' : '#27ae60';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    submitBtn.disabled = true;

    if (isSignup) {
        const fullName = document.getElementById('fullName').value.trim();
        const { data, error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { full_name: fullName } }
        });

        if (error) {
            showMessage(error.message, true);
        } else if (data.user) {
            // crea el perfil con rol 'cliente' por defecto
            await supabaseClient.from('profiles').insert({
                id: data.user.id,
                full_name: fullName,
                role: 'cliente'
            });
            showMessage('Cuenta creada. Revisa tu correo si se pide confirmación.', false);
        }
    } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            showMessage('Correo o contraseña incorrectos.', true);
        } else {
            showMessage('Sesión iniciada, redirigiendo...', false);
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }
    submitBtn.disabled = false;
});
