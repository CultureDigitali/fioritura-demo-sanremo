'use strict';
const observerSupported = 'IntersectionObserver' in window;
if (observerSupported) {
  const elements = document.querySelectorAll('.journey-list article, .experience-steps article');
  const obs = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    }
  }, { threshold: 0.11 });
  for (const el of elements) obs.observe(el);
}
