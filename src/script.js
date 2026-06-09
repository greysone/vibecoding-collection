// Navbar scroll effect
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  const bt = document.getElementById('backTop');
  if (bt) bt.classList.toggle('visible', window.scrollY > 500);
});

// Category tabs
const tabs = document.querySelectorAll('.cat-tab');
const secs = document.querySelectorAll('.category-section');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const t = tab.dataset.target;
    secs.forEach(s => {
      s.style.display = t === 'all' ? '' : (s.dataset.category === t ? '' : 'none');
    });
  });
});

// Toggle project details
function toggleDetails(btn) {
  const card = btn.closest('.project-card');
  const d = card.querySelector('.project-details');
  const o = d.classList.toggle('open');
  btn.classList.toggle('open');
  btn.querySelector('span:first-child').textContent = o ? '收起详情' : '查看开工详情';
  if (o) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const el = document.querySelector(a.getAttribute('href'));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// Scroll reveal animation
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.project-card, .star-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  obs.observe(el);
});
