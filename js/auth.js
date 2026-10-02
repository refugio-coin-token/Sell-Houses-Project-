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
        const { error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { full_name: fullName } }
        });

        if (error) {
            showMessage(error.message, true);
        } else {
            // El perfil en "profiles" ahora lo crea automáticamente
            // el trigger on_auth_user_created en Supabase.
            showMessage('Cuenta creada. Revisa tu correo si se pide confirmación.', false);
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            showMessage('Correo o contraseña incorrectos.', true);
        } else {
            showMessage('Sesión iniciada, redirigiendo...', false);
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    }
    submitBtn.disabled = false;
});

document.getElementById('forgotPasswordLink').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Escribe tu correo electrónico para recibir el enlace de recuperación:');
    if (!email) return;

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://refugio-coin-token.github.io/Sell-Houses-Project-/reset-password.html'
    });

    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Si el correo existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).');
    }
});
