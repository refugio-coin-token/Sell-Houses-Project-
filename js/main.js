// Esperamos a que todo el documento HTML (DOM) haya cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // Seleccionamos los elementos del DOM
    const menuOpen = document.getElementById('menuOpen');
    const menuClose = document.getElementById('menuClose');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    // Función para alternar (abrir/cerrar) el menú lateral
    function toggleMenu() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    // Escuchadores de eventos (clicks)
    if(menuOpen) menuOpen.addEventListener('click', toggleMenu);
    if(menuClose) menuClose.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', toggleMenu);
    // --- LÓGICA DE LOGIN (INTERFAZ) ---
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita que la página se recargue

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Como aún no tenemos base de datos conectada, mostramos un aviso
            loginMessage.style.display = 'block';
            loginMessage.className = 'login-message error-msg';
            loginMessage.textContent = 'Sistema de autenticación en construcción. Pronto estará disponible.';
            
            /* Aquí es donde en el futuro pondremos el código de Firebase/Supabase
            para verificar que la contraseña es correcta y dejarte entrar al Dashboard.
            */
        });
    }

});
