document.documentElement.classList.remove('no-js');

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Custom cursor ---------- */
var customCursor = document.getElementById('customCursor');
if (customCursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  var cursorTargetX = 0, cursorTargetY = 0;
  var cursorX = 0, cursorY = 0;
  var cursorStarted = false;

  window.addEventListener('mousemove', function (e) {
    cursorTargetX = e.clientX;
    cursorTargetY = e.clientY;
    if (!cursorStarted) {
      cursorStarted = true;
      cursorX = cursorTargetX;
      cursorY = cursorTargetY;
      customCursor.classList.add('is-active');
    }
  });

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest('a, button, .faq-question')) customCursor.classList.add('is-hovering');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest('a, button, .faq-question')) customCursor.classList.remove('is-hovering');
  });

  function tickCursor() {
    if (prefersReducedMotion) {
      cursorX = cursorTargetX;
      cursorY = cursorTargetY;
    } else {
      cursorX += (cursorTargetX - cursorX) * 0.2;
      cursorY += (cursorTargetY - cursorY) * 0.2;
    }
    customCursor.style.left = cursorX + 'px';
    customCursor.style.top = cursorY + 'px';
    requestAnimationFrame(tickCursor);
  }
  tickCursor();
}

/* ---------- Footer year ---------- */
var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Theme toggle ---------- */
var themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ascend-theme', next);
  });
}

/* ---------- Nav link smooth scroll ---------- */
document.querySelectorAll('.nav-link').forEach(function (link) {
  link.addEventListener('click', function (e) {
    var targetId = link.getAttribute('href');
    var target = targetId && document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ---------- Sticky header state ---------- */
var header = document.getElementById('siteHeader');
function onScrollHeader() {
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}
window.addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

/* ---------- Ambient rising particles ---------- */
var particleField = document.getElementById('particles');
if (particleField && !prefersReducedMotion) {
  var count = window.innerWidth < 700 ? 16 : 30;
  for (var i = 0; i < count; i++) {
    var p = document.createElement('span');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = 10 + Math.random() * 14 + 's';
    p.style.animationDelay = Math.random() * 20 + 's';
    p.style.opacity = String(0.2 + Math.random() * 0.4);
    particleField.appendChild(p);
  }
}

/* ---------- Word-by-word heading reveal ---------- */
var splitHeadings = [];
if (!prefersReducedMotion) {
  document.querySelectorAll('h2.reveal').forEach(function (h2) {
    if (h2.children.length > 0) return; // skip headings with nested markup (e.g. highlight spans)
    var words = h2.textContent.trim().split(/\s+/);
    h2.innerHTML = words.map(function (w) {
      return '<span class="word-wrap"><span class="word-inner">' + w + '</span></span>';
    }).join(' ');
    h2.classList.remove('reveal');
    h2.style.opacity = 1;
    splitHeadings.push(h2);
  });
}

/* ---------- Tilt-on-hover for cards ---------- */
if (!prefersReducedMotion) {
  document.querySelectorAll('.card, .pillar, .testimonial-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transition = '';
      card.style.transform = 'perspective(700px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 7).toFixed(2) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transition = 'transform 0.4s ease';
      card.style.transform = '';
    });
  });

  /* ---------- Magnetic hover for mega buttons ---------- */
  document.querySelectorAll('.btn-mega').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var mx = (e.clientX - rect.left) / rect.width - 0.5;
      var my = (e.clientY - rect.top) / rect.height - 0.5;
      btn.style.transition = '';
      btn.style.transform = 'translate(' + (mx * 10).toFixed(1) + 'px, ' + (my * 10 - 2).toFixed(1) + 'px)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transition = 'transform 0.4s ease';
      btn.style.transform = '';
    });
  });
}

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq-item').forEach(function (item) {
  var question = item.querySelector('.faq-question');
  var answer = item.querySelector('.faq-answer');
  question.addEventListener('click', function () {
    var isActive = item.classList.contains('active');

    document.querySelectorAll('.faq-item.active').forEach(function (other) {
      if (other !== item) {
        other.classList.remove('active');
        other.querySelector('.faq-answer').style.maxHeight = null;
      }
    });

    if (isActive) {
      item.classList.remove('active');
      answer.style.maxHeight = null;
    } else {
      item.classList.add('active');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

/* ---------- GSAP scroll reveals ---------- */
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  if (prefersReducedMotion) {
    gsap.set('.reveal, .reveal-line', { opacity: 1, y: 0 });
  } else {
    // Navbar logo: subtle fade + slide-down entrance on load
    gsap.from('.logo', { opacity: 0, y: -10, duration: 0.6, ease: 'power2.out' });

    // Hero: animate in on load, staggered (only on pages that have a hero)
    if (document.querySelector('.hero')) {
      var heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
      heroTl
        .to('.hero .reveal-line', { opacity: 1, y: 0, stagger: 0.12 })
        .to('.hero .hero-sub.reveal', { opacity: 1, y: 0 }, '-=0.6')
        .to('.hero .hero-media.reveal', { opacity: 1, y: 0 }, '-=0.5')
        .to('.hero .hero-cta-row.reveal', { opacity: 1, y: 0 }, '-=0.4');
    }

    // Everything else: reveal on scroll into view
    document.querySelectorAll('.section .reveal, .site-footer .reveal').forEach(function (el) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    });

    // Section headings: word-by-word stagger reveal
    splitHeadings.forEach(function (h2) {
      gsap.to(h2.querySelectorAll('.word-inner'), {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: h2,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    });

    // Grouped cards: staggered reveal
    document.querySelectorAll('.reveal-group').forEach(function (group) {
      var items = group.querySelectorAll('.reveal');
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: group,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });
  }
}
