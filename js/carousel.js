document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dots span');
    if (!slides.length) return;

    let current = 0;
    function showSlide(i) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[i].classList.add('active');
        dots[i].classList.add('active');
        current = i;
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => showSlide(Number(dot.dataset.i)));
    });

    setInterval(() => {
        showSlide((current + 1) % slides.length);
    }, 5000);
});
