// Simple horizontal carousel scrolling
(() => {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  const prev = document.querySelector('.carousel-btn.prev');
  const next = document.querySelector('.carousel-btn.next');

  const scrollAmount = () => track.clientWidth * 0.9;

  prev?.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });

  next?.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
})();

// Fade-in and directional float animations on view
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');

  const animated = document.querySelectorAll('.anim');
  if (!animated.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  animated.forEach((el, idx) => {
    // small stagger via transition delay
    el.style.transitionDelay = `${Math.min(idx * 60, 360)}ms`;
    observer.observe(el);
  });
});
