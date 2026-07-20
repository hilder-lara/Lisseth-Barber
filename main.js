(function () {
  "use strict";

  /* Número de WhatsApp del estudio en formato internacional (sin '+' ni espacios).
     Placeholder — reemplázalo por el número real antes de publicar. */
  var STUDIO_WHATSAPP_NUMBER = "51939096308";

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro de carga: una vez por sesión, se omite con reduced-motion ---------- */
  (function initIntro() {
    var overlay = document.getElementById('introOverlay');
    if (!overlay) return;
    var seen = false;
    try { seen = sessionStorage.getItem('lbsIntroShown') === '1'; } catch (err) { seen = false; }

    if (seen || prefersReducedMotion) {
      overlay.remove();
      return;
    }
    document.body.classList.add('intro-lock');
    window.setTimeout(function () {
      overlay.classList.add('hide');
      document.body.classList.remove('intro-lock');
      try { sessionStorage.setItem('lbsIntroShown', '1'); } catch (err) { }
      window.setTimeout(function () { overlay.remove(); }, 650);
    }, 1000);
  })();

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('mobileToggle');
  var menu = document.getElementById('mobileMenu');
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- Hero video: avoid unhandled-rejection noise if autoplay is blocked
     or the placeholder source hasn't been replaced with real footage yet ---------- */
  document.querySelectorAll('.hero-video').forEach(function (video) {
    var playPromise = video.play();
    if (playPromise !== undefined) { playPromise.catch(function () { }); }
  });

  /* ---------- Reveal on scroll (staggered by position within parent) ---------- */
  function initReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
          return c.classList.contains('reveal');
        });
        var index = siblings.indexOf(el);
        el.style.transitionDelay = Math.min(Math.max(index, 0) * 70, 420) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Parallax: hero video + framed images drift slower than scroll ---------- */
  function initParallax() {
    if (prefersReducedMotion) return;
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!els.length) return;
    var ticking = false;

    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var factor = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var offset = (center - vh / 2) * factor;
        el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Magnetic CTA buttons ---------- */
  function initMagnetic() {
    if (prefersReducedMotion) return;
    var strength = 0.35;
    var maxOffset = 14;
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = Math.max(-maxOffset, Math.min(maxOffset, (e.clientX - rect.left - rect.width / 2) * strength));
        var y = Math.max(-maxOffset, Math.min(maxOffset, (e.clientY - rect.top - rect.height / 2) * strength));
        btn.style.transition = 'transform 0.12s ease-out';
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transition = 'transform 0.5s cubic-bezier(.25,.8,.25,1)';
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------- Cursor: rastro de tinta dorada (solo con mouse fino) ---------- */
  function initCursorTrail() {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var canvas = document.getElementById('cursorCanvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var maxAge = 350;
    var lastX = null, lastY = null, lastEmit = 0;
    var minDist = 18, minInterval = 45;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', function (e) {
      if (document.body.classList.contains('trail-paused')) return;
      var now = performance.now();
      if (lastX !== null) {
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && (now - lastEmit) < minInterval) return;
      }
      lastX = e.clientX; lastY = e.clientY; lastEmit = now;
      particles.push({ x: e.clientX, y: e.clientY, born: now });
      if (particles.length > 18) particles.shift();
    });

    function frame() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      var now = performance.now();
      particles = particles.filter(function (p) { return now - p.born < maxAge; });
      particles.forEach(function (p) {
        var age = (now - p.born) / maxAge;
        var alpha = 1 - age;
        var r = 3.5 * (1 - age) + 0.8;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(212,175,55,' + (alpha * 0.35).toFixed(2) + ')';
        ctx.shadowColor = 'rgba(212,175,55,0.5)';
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  /* ---------- Firma: se dibuja al llegar por scroll, no al cargar la página ---------- */
  function initSignatureDraw() {
    var wrap = document.querySelector('.signature-name-wrap');
    if (!wrap) return;
    if (!('IntersectionObserver' in window)) { wrap.classList.add('in-view'); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        wrap.classList.add('in-view');
        obs.unobserve(wrap);
      });
    }, { threshold: 0.6 });
    obs.observe(wrap);
  }

  /* ---------- Lookbook: slider antes / después ---------- */
  function initCompareSlider() {
    var el = document.getElementById('compareSlider');
    if (!el) return;
    var after = el.querySelector('.compare-after');
    var handle = el.querySelector('.compare-handle');
    var dragging = false;

    function setPct(pct) {
      pct = Math.max(0, Math.min(100, pct));
      after.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
    function updateFromClientX(clientX) {
      var rect = el.getBoundingClientRect();
      setPct(((clientX - rect.left) / rect.width) * 100);
    }

    el.addEventListener('pointerdown', function (e) {
      dragging = true;
      document.body.classList.add('trail-paused');
      el.setPointerCapture(e.pointerId);
      updateFromClientX(e.clientX);
    });
    el.addEventListener('pointermove', function (e) {
      if (dragging) updateFromClientX(e.clientX);
    });
    ['pointerup', 'pointercancel'].forEach(function (evt) {
      el.addEventListener(evt, function () {
        dragging = false;
        document.body.classList.remove('trail-paused');
      });
    });

    handle.addEventListener('keydown', function (e) {
      var current = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowLeft') { setPct(current - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPct(current + 5); e.preventDefault(); }
    });

    setPct(50);
  }

  /* ---------- Lookbook data + filters ----------
     Fotos temporales de stock (Pexels) — ver assets/images/README.txt
     para licencia y reemplazo por material real del estudio. */
  var frames = [
    { n: '01', cat: 'clasicos', label: 'Clásico Ejecutivo', img: 'assets/images/Clasico ejecutivo.webp', pos: 'center' },
    { n: '02', cat: 'urbanos', label: 'Fade de Contraste', img: 'assets/images/Fade de contraste.webp', pos: 'center' },
    { n: '03', cat: 'barba', label: 'Barba Perfilada', img: 'assets/images/Barba perfilada.webp', pos: 'center' },
    { n: '04', cat: 'clasicos', label: 'Estilo Clásico', img: 'assets/images/Estilo clasico.webp', pos: 'center' },
    { n: '05', cat: 'urbanos', label: 'Diseño en Movimiento', img: 'assets/images/Diseño en movimiento.webp', pos: 'center' },
    { n: '06', cat: 'barba', label: 'Ritual Toalla Caliente', img: 'assets/images/Barba ritual toalla caliente.webp', pos: 'center' },
    { n: '07', cat: 'clasicos', label: 'Corte de Precisión', img: 'assets/images/Corte de precision.webp', pos: 'center' },
    { n: '08', cat: 'urbanos', label: 'Herramientas de Autor', img: 'assets/images/Herramientas de autor.webp', pos: 'center' }
  ];
  var galleryGrid = document.getElementById('galleryGrid');
  galleryGrid.innerHTML = frames.map(function (f, i) {
    return '<div class="frame reveal" data-cat="' + f.cat + '">' +
      '<img class="frame-tex" src="' + f.img + '" alt="' + f.label + '" loading="lazy" draggable="false" style="object-position:' + f.pos + '">' +
      '<span class="frame-tag">Frame ' + f.n + '</span>' +
      '<span class="frame-cat">' + f.label + '</span>' +
      '<span class="frame-cat-2">' + f.cat + '</span>' +
      '</div>';
  }).join('');

  var filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');
      document.querySelectorAll('.frame').forEach(function (card) {
        var match = (f === 'todos' || card.getAttribute('data-cat') === f);
        card.classList.toggle('hidden-item', !match);
      });
    });
  });

  /* ---------- Booking widget ---------- */
  var services = [
    { name: 'Corte de Autor', price: '$38', duration: '45 min' },
    { name: 'Ritual de Barba con Toalla Caliente', price: '$32', duration: '45 min' },
    { name: 'Combo Ejecutivo', price: '$62', duration: '60 min' },
    { name: 'Diseño Urbano', price: '$40', duration: '50 min' },
    { name: 'Afeitado Clásico a Navaja', price: '$35', duration: '45 min' }
  ];
  var days = ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var allTimes = ['9:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  var unavailableByDay = {
    'Martes': ['11:00', '16:00'],
    'Miércoles': ['9:00', '13:00', '18:00'],
    'Jueves': ['10:00', '15:00'],
    'Viernes': ['9:00', '12:00', '17:00', '19:00'],
    'Sábado': ['11:00', '13:00', '16:00', '18:00']
  };

  var state = { service: null, price: null, duration: null, day: null, time: null, faceShape: null };

  var serviceChips = document.getElementById('serviceChips');
  serviceChips.innerHTML = services.map(function (s) {
    return '<button class="chip" data-service="' + s.name + '" data-price="' + s.price + '" data-duration="' + s.duration + '">' + s.name + '<span class="chip-price">' + s.price + ' · ' + s.duration + '</span></button>';
  }).join('');

  var dayChips = document.getElementById('dayChips');
  dayChips.innerHTML = days.map(function (d) {
    return '<button class="chip" data-day="' + d + '">' + d + '</button>';
  }).join('');

  var timeGrid = document.getElementById('timeGrid');
  var summaryLine = document.getElementById('summaryLine');
  var confirmBtn = document.getElementById('confirmBtn');
  var confirmation = document.getElementById('confirmation');
  var confirmationText = document.getElementById('confirmationText');

  function selectChip(container, selector, value, attr) {
    container.querySelectorAll(selector).forEach(function (c) {
      c.classList.toggle('selected', c.getAttribute(attr) === value);
    });
  }

  function renderTimes() {
    if (!state.day) {
      timeGrid.innerHTML = '<span style="color:var(--muted); font-size:0.82rem;">Selecciona un día para ver los horarios disponibles.</span>';
      return;
    }
    var unavailable = unavailableByDay[state.day] || [];
    timeGrid.innerHTML = allTimes.map(function (t) {
      var off = unavailable.indexOf(t) !== -1;
      return '<button class="time-slot" data-time="' + t + '" ' + (off ? 'disabled' : '') + '>' + t + '</button>';
    }).join('');
    timeGrid.querySelectorAll('.time-slot').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.time = btn.getAttribute('data-time');
        selectChip(timeGrid, '.time-slot', state.time, 'data-time');
        updateSummary();
      });
    });
  }

  function updateSummary() {
    if (state.service && state.day && state.time) {
      summaryLine.innerHTML = 'Reservando <b>' + state.service + '</b> (' + state.price + ' · ' + state.duration + ') el <b>' + state.day + '</b> a las <b>' + state.time + '</b>.';
      confirmBtn.disabled = false;
    } else {
      var missing = [];
      if (!state.service) missing.push('experiencia');
      if (!state.day) missing.push('día');
      if (!state.time) missing.push('hora');
      summaryLine.textContent = 'Falta seleccionar: ' + missing.join(', ') + '.';
      confirmBtn.disabled = true;
    }
    confirmation.classList.remove('show');
  }

  serviceChips.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      state.service = c.getAttribute('data-service');
      state.price = c.getAttribute('data-price');
      state.duration = c.getAttribute('data-duration');
      selectChip(serviceChips, '.chip', state.service, 'data-service');
      updateSummary();
    });
  });

  dayChips.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      state.day = c.getAttribute('data-day');
      state.time = null;
      selectChip(dayChips, '.chip', state.day, 'data-day');
      renderTimes();
      updateSummary();
    });
  });



  /* Reserva real: arma un mensaje formateado y abre WhatsApp con la
     conversación lista para enviar al número del estudio. */
  function buildWhatsAppUrl() {
    var message = [
      'Hola Lisseth! Quiero confirmar mi cita en el estudio:',
      '',
      '• Servicio: ' + state.service + ' (' + state.price + ' · ' + state.duration + ')',
      '• Día: ' + state.day,
      '• Hora: ' + state.time,
      '• Mi nombre: ',
    ];
    if (state.faceShape) {
      message.push('• Diagnóstico de Visajismo: Rostro ' + state.faceShape);
    }
    message.push('', '¿Confirmamos este horario?');
    return 'https://wa.me/' + STUDIO_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message.join('\n'));
  }

  confirmBtn.addEventListener('click', function () {
    if (confirmBtn.disabled) return;
    confirmationText.textContent = state.service + ' — ' + state.day + ' a las ' + state.time + ' · ' + state.price + ' · ' + state.duration + '. Abriendo WhatsApp para confirmar con el estudio…';
    confirmation.classList.add('show');
    window.open(buildWhatsAppUrl(), '_blank', 'noopener');
  });

  /* service cards -> pre-select in booking widget */
  document.querySelectorAll('[data-book]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-book');
      var target = services.filter(function (s) { return s.name === name; })[0];
      if (target) {
        state.service = target.name;
        state.price = target.price;
        state.duration = target.duration;
        selectChip(serviceChips, '.chip', state.service, 'data-service');
        updateSummary();
      }
      document.getElementById('reservas').scrollIntoView({ behavior: 'smooth' });
    });
  });

  updateSummary();

  /* ---------- FAQ accordion ---------- */
  var faqQuestions = document.querySelectorAll('.faq-q');
  faqQuestions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var answer = document.getElementById(btn.getAttribute('aria-controls'));
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      faqQuestions.forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          var otherAnswer = document.getElementById(other.getAttribute('aria-controls'));
          otherAnswer.style.maxHeight = null;
          otherAnswer.classList.remove('open');
        }
      });

      if (isOpen) {
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
        answer.classList.remove('open');
      } else {
        btn.setAttribute('aria-expanded', 'true');
        answer.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Credentials accordion ---------- */
  var credTriggers = document.querySelectorAll('.credential-trigger');
  credTriggers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var content = document.getElementById(btn.getAttribute('aria-controls'));
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      credTriggers.forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          var otherContent = document.getElementById(other.getAttribute('aria-controls'));
          if (otherContent) {
            otherContent.style.maxHeight = null;
            otherContent.classList.remove('open');
          }
        }
      });

      if (isOpen) {
        btn.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = null;
        content.classList.remove('open');
      } else {
        btn.setAttribute('aria-expanded', 'true');
        content.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Visagismo interactive logic ---------- */
  var visBtns = document.querySelectorAll('.vis-btn');
  var visPanels = document.querySelectorAll('.visagismo-panel');

  visBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var face = btn.getAttribute('data-face');

      visBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      visPanels.forEach(function (panel) {
        var isActive = panel.getAttribute('id') === 'face-' + face;
        panel.classList.toggle('active', isActive);
      });
    });
  });

  /* ---------- CTA logic linking Visajismo to Booking widget ---------- */
  document.querySelectorAll('.vis-cta-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var serviceName = btn.getAttribute('data-preset-service');
      var faceShapeName = btn.getAttribute('data-preset-face');

      state.faceShape = faceShapeName;

      // Select the service chip
      var targetService = services.filter(function (s) { return s.name === serviceName; })[0];
      if (targetService) {
        state.service = targetService.name;
        state.price = targetService.price;
        state.duration = targetService.duration;
        selectChip(serviceChips, '.chip', state.service, 'data-service');
        updateSummary();
      }

      // Scroll to booking widget
      document.getElementById('reservas').scrollIntoView({ behavior: 'smooth' });
    });
  });

  initReveal();
  initParallax();
  initMagnetic();
  initCursorTrail();
  initSignatureDraw();
  initCompareSlider();
})();
