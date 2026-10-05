document.addEventListener('DOMContentLoaded', () => {

    const menuOpen = document.getElementById('menuOpen');
    const menuClose = document.getElementById('menuClose');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const siteHeader = document.getElementById('siteHeader');
if (siteHeader) {
    window.addEventListener('scroll', () => {
        siteHeader.classList.toggle('scrolled', window.scrollY > 40);
    });
}
    function toggleMenu() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    if(menuOpen) menuOpen.addEventListener('click', toggleMenu);
    if(menuClose) menuClose.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', toggleMenu);
    const sidebarLinks = sidebar.querySelectorAll('a');
sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
});
});
