/* ============================================================
   БАНЯ НА ПОБЕДЕ — main.js
   Навигация, модальные окна, анимации, фильтры, поиск по меню.
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Иконки ---------- */
  var ico = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>'
  };

  /* ============================================================
     1. Шапка: залипание + мобильное меню
     ============================================================ */
  var header = $('.header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var burger = $('.burger');
  var mnav = $('.mnav');
  if (burger && mnav) {
    var closeNav = function () {
      mnav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
    };
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      if (open) { closeNav(); return; }
      mnav.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('is-open')) closeNav();
    });
  }

  /* ============================================================
     2. Появление блоков при скролле
     ============================================================ */

  /* заголовки — по словам */
  $$('[data-split]').forEach(function (el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    var html = el.innerHTML.split(/(<br\s*\/?>)/i).map(function (chunk) {
      if (/^<br/i.test(chunk)) return chunk;
      return chunk.split(/\s+/).filter(Boolean).map(function (w) {
        return '<span class="w"><i>' + w + '</i></span>';
      }).join(' ');
    }).join('');
    el.innerHTML = html;
    el.classList.add('split');
    $$('.w > i', el).forEach(function (i, n) {
      i.style.setProperty('--wd', n * 68 + 'ms');
    });
  });

  var rise = $$('[data-rise], [data-split]');
  if (rise.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      rise.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      rise.forEach(function (el) {
        // каскад внутри одной группы
        var group = el.parentElement;
        var sibs = group ? $$('[data-rise]', group).filter(function (n) { return n.parentElement === group; }) : [];
        var i = sibs.indexOf(el);
        if (i > 0) el.style.setProperty('--d', Math.min(i, 8) * 70 + 'ms');
        io.observe(el);
      });
    }
  }

  /* ============================================================
     2b. Полоса прочтения, параллакс декора, искры
     ============================================================ */
  var bar = $('.progress');
  var pars = $$('[data-par]');

  if (bar || pars.length) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || 0;

        if (bar) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
        }

        if (!reduced) {
          var vh = window.innerHeight;
          pars.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.bottom < -200 || r.top > vh + 200) return;
            var k = parseFloat(el.getAttribute('data-par')) || 0.12;
            var mid = r.top + r.height / 2 - vh / 2;
            el.style.transform = 'translate3d(0,' + (-mid * k).toFixed(1) + 'px,0)';
          });
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* искры над очагом */
  var embers = $('.embers');
  if (embers && !reduced) {
    for (var e = 0; e < 16; e++) {
      var sp = document.createElement('i');
      sp.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
      sp.style.setProperty('--dx', (Math.random() * 90 - 45).toFixed(0) + 'px');
      sp.style.animationDuration = (7 + Math.random() * 9).toFixed(1) + 's';
      sp.style.animationDelay = (-Math.random() * 14).toFixed(1) + 's';
      sp.style.opacity = '0';
      embers.appendChild(sp);
    }
  }

  /* ============================================================
     3. Счётчики в полосе фактов
     ============================================================ */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced || !('IntersectionObserver' in window)) {
      el.textContent = target.toLocaleString('ru-RU') + suffix;
      return;
    }
    el.textContent = '0' + suffix;
    var seen = false;
    var ob = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting || seen) return;
        seen = true;
        var start = performance.now(), dur = 1100;
        var tick = function (now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('ru-RU') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        ob.disconnect();
      });
    }, { threshold: 0.5 });
    ob.observe(el);
  });

  /* ============================================================
     4. Битые/отсутствующие фото → аккуратная заглушка
     ============================================================ */
  $$('.ph img').forEach(function (img) {
    var fail = function () { img.classList.add('is-missing'); };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ============================================================
     5. Модальные окна (правила, принадлежности, карточка отделения)
     ============================================================ */
  var lastFocus = null;

  function openModal(m) {
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('is-open');
    m.removeAttribute('aria-hidden');
    document.body.classList.add('is-locked');
    var f = m.querySelector('[data-autofocus]') || m.querySelector('.modal__x');
    if (f) setTimeout(function () { f.focus(); }, 60);
  }

  function closeModal(m) {
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    if (!$('.modal.is-open') && !(mnav && mnav.classList.contains('is-open'))) {
      document.body.classList.remove('is-locked');
    }
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      e.preventDefault();
      openModal(document.getElementById(opener.getAttribute('data-modal-open')));
      return;
    }
    var closer = e.target.closest('[data-modal-close]');
    if (closer) {
      e.preventDefault();
      closeModal(closer.closest('.modal'));
    }
  });

  document.addEventListener('keydown', function (e) {
    var open = $('.modal.is-open');
    if (!open) return;

    if (e.key === 'Escape') { closeModal(open); return; }

    if (e.key === 'Tab') {
      var f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', open)
        .filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* открытие модалки по хэшу: #pravila, #prinadlezhnosti */
  function fromHash() {
    var h = location.hash.replace('#', '');
    if (!h) return;
    var map = { pravila: 'm-rules', prinadlezhnosti: 'm-supplies' };
    if (map[h]) openModal(document.getElementById(map[h]));
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ============================================================
     6. FAQ-аккордеон
     ============================================================ */
  $$('.faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      $$('.faq__q').forEach(function (o) {
        o.setAttribute('aria-expanded', 'false');
        o.parentElement.classList.remove('is-open');
      });
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
      q.parentElement.classList.toggle('is-open', !open);
    });
  });

  /* ============================================================
     7. Страница отделений: фильтры и сортировка
     ============================================================ */
  var roomsGrid = $('[data-rooms]');
  if (roomsGrid) {
    var chips = $$('.chip[data-filter]');
    var sortSel = $('[data-sort]');
    var counter = $('[data-rooms-count]');

    var apply = function () {
      var active = ($('.chip[aria-pressed="true"]') || {}).dataset;
      var f = active ? active.filter : 'all';
      var cards = $$('.room', roomsGrid);
      var shown = 0;

      cards.forEach(function (c) {
        var ok = f === 'all' || c.getAttribute('data-type') === f;
        c.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });

      if (sortSel && sortSel.value !== 'default') {
        var val = function (c) {
          var n = parseInt(c.getAttribute('data-price') || '0', 10);
          return n > 0 ? n : Infinity;   // «по меню» — всегда в конце
        };
        var sorted = cards.slice().sort(function (a, b) {
          var pa = val(a), pb = val(b);
          if (pa === Infinity) return 1;
          if (pb === Infinity) return -1;
          return sortSel.value === 'asc' ? pa - pb : pb - pa;
        });
        sorted.forEach(function (c) { roomsGrid.appendChild(c); });
      }

      if (counter) counter.textContent = shown;
    };

    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        ch.setAttribute('aria-pressed', 'true');
        apply();
      });
    });
    if (sortSel) sortSel.addEventListener('change', apply);
    apply();

    /* карточка → модалка с деталями */
    var detail = $('#m-room');
    if (detail) {
      roomsGrid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-room-more]');
        if (!btn) return;
        var card = btn.closest('.room');
        var name = card.getAttribute('data-name');
        var key = card.getAttribute('data-photo') || 'photo';

        $('[data-room-title]', detail).textContent = name;
        $('[data-room-price]', detail).innerHTML = card.getAttribute('data-price-label');
        $('[data-room-tags]', detail).innerHTML = $('.room__tags', card).innerHTML;
        $('[data-room-note]', detail).textContent = $('.room__note', card).textContent;

        var main = $('[data-room-ph]', detail);
        main.setAttribute('data-ph', 'Фото · ' + key + '-01.jpg');
        main.setAttribute('data-caption', name + ' — общий вид');

        $$('[data-room-ph-extra]', detail).forEach(function (p, i) {
          p.setAttribute('data-ph', key + '-0' + (i + 2) + '.jpg');
          p.setAttribute('data-caption', name + ' — фото ' + (i + 2));
        });

        openModal(detail);
      });
    }
  }

  /* ============================================================
     7b. Просмотр фото по клику
     ============================================================ */
  var lbox = $('#lightbox');
  if (lbox) {
    var lboxPh = $('[data-lbox-ph]', lbox);
    var lboxCap = $('[data-lbox-cap]', lbox);

    document.addEventListener('click', function (e) {
      var z = e.target.closest('.ph--zoom');
      if (!z) return;
      e.preventDefault();

      lboxPh.setAttribute('data-ph', z.getAttribute('data-ph') || 'Фото');
      lboxCap.textContent = z.getAttribute('data-caption') || z.getAttribute('data-ph') || '';

      var src = z.querySelector('img');
      var old = lboxPh.querySelector('img');
      if (old) old.remove();
      if (src && !src.classList.contains('is-missing')) {
        var big = src.cloneNode(true);
        big.removeAttribute('loading');
        lboxPh.appendChild(big);
      }

      lbox.classList.add('is-open');
      document.body.classList.add('is-locked');
      var x = $('.lbox__x', lbox);
      if (x) setTimeout(function () { x.focus(); }, 60);
    });

    var closeLbox = function () {
      lbox.classList.remove('is-open');
      if (!$('.modal.is-open')) document.body.classList.remove('is-locked');
    };
    lbox.addEventListener('click', function (e) {
      if (e.target.closest('[data-lbox-close]')) closeLbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lbox.classList.contains('is-open')) {
        e.stopPropagation();
        closeLbox();
      }
    }, true);
  }

  /* ============================================================
     8. Страница меню: поиск + активная категория в рельсе
     ============================================================ */
  var msearch = $('[data-menu-search]');
  if (msearch) {
    var empty = $('[data-menu-empty]');
    var norm = function (s) { return s.toLowerCase().replace(/ё/g, 'е').trim(); };

    msearch.addEventListener('input', function () {
      var q = norm(msearch.value);
      var total = 0;

      $$('.mcat').forEach(function (cat) {
        var h = cat.querySelector('h2');
        var catHit = !!q && !!h && norm(h.textContent).indexOf(q) > -1;
        var items = $$('.plist li', cat);
        var vis = 0;
        items.forEach(function (li) {
          var hit = !q || catHit || norm(li.textContent).indexOf(q) > -1;
          li.classList.toggle('is-hidden', !hit);
          if (hit) vis++;
        });
        cat.classList.toggle('is-empty', vis === 0);
        total += vis;
      });

      if (empty) empty.classList.toggle('is-on', total === 0);
    });
  }

  var rail = $('.rail');
  if (rail) {
    var links = $$('a', rail);
    var cats = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
                    .filter(Boolean);

    if (cats.length) {
      // нижняя кромка липкой полосы разделов в «прилипшем» состоянии
      var railbar = rail.closest('.railbar') || rail;
      var topOffset = function () {
        var t = parseFloat(getComputedStyle(railbar).top);
        if (isNaN(t)) t = 66;
        return Math.round(t + railbar.getBoundingClientRect().height);
      };

      // якорь должен вставать под полосу, а не под неё
      var syncPad = function () {
        document.documentElement.style.scrollPaddingTop = (topOffset() + 18) + 'px';
      };
      syncPad();
      window.addEventListener('resize', syncPad);

      var current = null;
      var setActive = function (cat) {
        if (!cat || cat === current) return;
        current = cat;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + cat.id;
          a.classList.toggle('is-active', on);
          if (!on) return;
          var r = a.getBoundingClientRect(), rr = rail.getBoundingClientRect();
          if (r.left < rr.left || r.right > rr.right) {
            rail.scrollTo({ left: a.offsetLeft - 24, behavior: reduced ? 'auto' : 'smooth' });
          }
        });
      };

      var spy = function () {
        var line = topOffset() + 46;
        var best = cats[0];
        cats.forEach(function (c) {
          if (c.getBoundingClientRect().top <= line) best = c;
        });
        setActive(best);
      };

      // по клику подсвечиваем сразу, не дожидаясь докрутки
      links.forEach(function (a) {
        a.addEventListener('click', function () {
          var t = document.getElementById(a.getAttribute('href').slice(1));
          if (t) setActive(t);
        });
      });

      var railTicking = false;
      window.addEventListener('scroll', function () {
        if (railTicking) return;
        railTicking = true;
        requestAnimationFrame(function () { spy(); railTicking = false; });
      }, { passive: true });
      spy();
    }
  }

  /* ============================================================
     9. Текущий год в подвале
     ============================================================ */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();