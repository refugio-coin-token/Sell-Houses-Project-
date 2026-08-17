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

});
