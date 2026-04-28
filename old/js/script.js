/* =============================================
   SOAA - Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Hero Image Slider ─────────────────── */
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.slider-dot');
  const prevBtn = document.querySelector('.slider-arrow-prev');
  const nextBtn = document.querySelector('.slider-arrow-next');
  let current = 0;
  let sliderTimer = null;

  function goToSlide(n) {
    slides[current].classList.remove('active');
    dots[current] && dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current] && dots[current].classList.add('active');
  }

  function startAutoplay() {
    sliderTimer = setInterval(() => goToSlide(current + 1), 5000);
  }

  function resetAutoplay() {
    clearInterval(sliderTimer);
    startAutoplay();
  }

  if (slides.length > 0) {
    slides[0].classList.add('active');
    dots[0] && dots[0].classList.add('active');
    startAutoplay();

    prevBtn && prevBtn.addEventListener('click', () => { goToSlide(current - 1); resetAutoplay(); });
    nextBtn && nextBtn.addEventListener('click', () => { goToSlide(current + 1); resetAutoplay(); });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goToSlide(i); resetAutoplay(); });
    });
  }


  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  /* ── Hamburger / Mobile Menu ─────────────── */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-menu-close');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
  }
  if (mobileClose) {
    mobileClose.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        if (hamburger) hamburger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Active nav link ─────────────────────── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Scroll animations ─────────────────── */
  const animEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animEls.forEach(el => observer.observe(el));
  } else {
    animEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Counter animation ─────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const counterEls = document.querySelectorAll('[data-target]');
  if (counterEls.length) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => counterObs.observe(el));
  }

  /* ── Members search / filter ─────────────── */
  const searchInput = document.getElementById('memberSearch');
  const filterSelect = document.getElementById('memberFilter');
  const memberCards = document.querySelectorAll('.member-card');

  function filterMembers() {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const filterVal = filterSelect ? filterSelect.value : 'all';
    memberCards.forEach(card => {
      const name = card.querySelector('.member-name')?.textContent.toLowerCase() || '';
      const company = card.querySelector('.member-company')?.textContent.toLowerCase() || '';
      const type = card.getAttribute('data-type') || '';
      const matchesSearch = name.includes(query) || company.includes(query);
      const matchesFilter = filterVal === 'all' || type === filterVal;
      card.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
  }

  if (searchInput) searchInput.addEventListener('input', filterMembers);
  if (filterSelect) filterSelect.addEventListener('change', filterMembers);

  /* ── Form validation helper ─────────────── */
  window.validateForm = function(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    let valid = true;

    form.querySelectorAll('[required]').forEach(field => {
      const err = field.parentElement.querySelector('.form-error');
      if (!field.value.trim()) {
        field.style.borderColor = '#e53e3e';
        if (err) { err.textContent = 'This field is required.'; err.style.display = 'block'; }
        valid = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        field.style.borderColor = '#e53e3e';
        if (err) { err.textContent = 'Enter a valid email address.'; err.style.display = 'block'; }
        valid = false;
      } else {
        field.style.borderColor = '';
        if (err) err.style.display = 'none';
      }
    });

    return valid;
  };

  /* ── Contact form submit ─────────────────── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (window.validateForm('contactForm')) {
        this.reset();
        const msg = document.getElementById('contactSuccess');
        if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 5000); }
      }
    });
  }

  /* ── Membership form submit ──────────────── */
  const memberForm = document.getElementById('membershipForm');
  if (memberForm) {
    memberForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (window.validateForm('membershipForm')) {
        this.reset();
        const msg = document.getElementById('memberSuccess');
        if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 6000); }
      }
    });
  }

});
