(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  // Mobile menu
  const toggle = qs('.nav__toggle');
  const menu = qs('#navMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    qsa('a', menu).forEach(a => a.addEventListener('click', () => {
      if (menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }));

    document.addEventListener('click', (e) => {
      const target = e.target;
      const clickedInside = menu.contains(target) || toggle.contains(target);
      if (!clickedInside && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Scroll suave com offset do header
  const header = qs('.header');
  const headerH = () => (header ? header.offsetHeight : 0);

  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;

      const target = qs(id);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerH() - 10;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // barra de progresso + voltar pro topo
  const progress = qs('.progress');
  const toTop = qs('.toTop');

  const onScroll = () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docH > 0 ? (window.scrollY / docH) * 100 : 0;
    if (progress) progress.style.width = `${scrolled}%`;

    if (toTop) {
      if (window.scrollY > 520) toTop.classList.add('is-visible');
      else toTop.classList.remove('is-visible');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Contadores do hero
  const counters = qsa('.count[data-count]');
  const animateCount = (el) => {
    const final = Number(el.dataset.count || 0);
    if (!Number.isFinite(final) || final <= 0) return;

    const duration = 900;
    const start = performance.now();
    const from = 0;

    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (final - from) * eased);
      el.textContent = String(val);
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => io.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  // Listagens
  const listings = qsa('.listing[data-tags]');

  // Atualiza contador total (curadoria) + ouro automaticamente
  const totalCountEl = qs('.count[data-count]:not(#ouroCount)');
  if (totalCountEl) {
    totalCountEl.dataset.count = String(listings.length);
    totalCountEl.textContent = String(listings.length);
  }

  const ouroTotal = listings.filter(card => (card.dataset.tags || '').toLowerCase().includes('ouro')).length;
  const ouroCountEl = qs('#ouroCount');
  if (ouroCountEl) {
    ouroCountEl.dataset.count = String(ouroTotal);
    ouroCountEl.textContent = String(ouroTotal);
  }

  // ===== CARROSSEL (prev/next) =====
  const viewport = qs('#listingViewport');
  const prevBtn = qs('[data-carousel-prev]');
  const nextBtn = qs('[data-carousel-next]');

  const getStep = () => {
    const firstVisible = listings.find(el => el.style.display !== 'none');
    const w = firstVisible ? firstVisible.getBoundingClientRect().width : 280;
    return Math.round(w + 14); // 14 = gap
  };

  const scrollByStep = (dir) => {
    if (!viewport) return;
    viewport.scrollBy({ left: dir * getStep(), behavior: 'smooth' });
  };

  if (prevBtn) prevBtn.addEventListener('click', () => scrollByStep(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollByStep(1));

  // Filtro de listagens
  const chips = qsa('.chip[data-filter]');

  const applyFilter = (filter) => {
    const f = String(filter || 'all').toLowerCase();

    listings.forEach(card => {
      const tags = (card.dataset.tags || '').toLowerCase();
      let show = false;

      if (f === 'all') show = true;
      else show = tags.includes(f);

      card.style.display = show ? '' : 'none';
    });

    // após filtrar, volta o carrossel pro início (evita “vazio”)
    if (viewport) viewport.scrollTo({ left: 0, behavior: 'smooth' });
  };

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilter(chip.dataset.filter);
    });
  });

  // Lead form validação + toast (front-only)
  const form = qs('#leadForm');
  const toast = qs('.form__toast');

  const showToast = (msg, ok = true) => {
    if (!toast) return;
    toast.style.display = 'block';
    toast.textContent = msg;
    toast.style.borderStyle = 'solid';
    toast.style.borderColor = ok ? 'rgba(3,152,208,.35)' : 'rgba(220,53,69,.35)';
  };

  const normalizePhone = (value) => (value || '').replace(/\D/g, '');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const phoneRaw = String(fd.get('phone') || '').trim();
      const phone = normalizePhone(phoneRaw);

      const type = String(fd.get('type') || '').trim();
      const priority = String(fd.get('priority') || '').trim();
      const must = String(fd.get('must') || '').trim();

      if (name.length < 2) return showToast('Preencha seu nome direitinho 🙂', false);
      if (phone.length < 10) return showToast('WhatsApp incompleto. Coloque DDD + número.', false);
      if (!type) return showToast('Escolha o tipo desejado.', false);
      if (!priority) return showToast('Selecione sua prioridade.', false);
      if (must.length < 6) return showToast('Escreva pelo menos 1 requisito importante (ex.: baixo condomínio).', false);

      showToast('Perfeito! Curadoria recebida. Em breve um especialista te chama. ✅', true);
      form.reset();
    });
  }

  // MODAL de detalhes do imóvel
  const modal = qs('#listingModal');
  const modalImg = qs('#modalImg');
  const modalBadge = qs('#modalBadge');
  const modalNeighborhood = qs('#modalNeighborhood');
  const modalTitle = qs('#modalTitle');
  const modalPrice = qs('#modalPrice');
  const modalDesc = qs('#modalDesc');
  const modalMeta = qs('#modalMeta');
  const modalWhats = qs('#modalWhats');
  const modalOfficial = qs('#modalOfficial');

  const openModal = () => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  qsa('[data-close="1"]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal();
  });

  const toWhatsAppLink = ({ title, price, neighborhood }) => {
    const base = 'https://api.whatsapp.com/send';
    const phone = '5519981611842';
    const text =
      `Olá! Tenho interesse neste imóvel da Curadoria Cambuí (até R$ 350 mil):\n\n` +
      `*${title}*\n${neighborhood}\nPreço: ${price}\n\n` +
      `Pode me passar mais detalhes e agenda de visita?`;

    const params = new URLSearchParams({ phone, text });
    return `${base}?${params.toString()}`;
  };

  listings.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();

      const title = card.dataset.title || qs('h3', card)?.textContent?.trim() || 'Imóvel';
      const neighborhood = card.dataset.neighborhood || qs('.muted', card)?.textContent?.trim() || 'Cambuí • Campinas';
      const price = card.dataset.price || qs('.price', card)?.textContent?.trim() || 'R$ —';
      const img = card.dataset.img || qs('img', card)?.getAttribute('src') || '';
      const desc = card.dataset.desc || '';
      const featuresRaw = card.dataset.features || '';
      const isOuro = (card.dataset.tags || '').toLowerCase().includes('ouro');
      const officialUrl = (card.dataset.url || '').trim();

      if (modalImg) {
        modalImg.src = img;
        modalImg.alt = title;
      }
      if (modalNeighborhood) modalNeighborhood.textContent = neighborhood;
      if (modalTitle) modalTitle.textContent = title;
      if (modalPrice) modalPrice.textContent = price;
      if (modalDesc) modalDesc.textContent = desc;

      if (modalBadge) modalBadge.hidden = !isOuro;

      if (modalMeta) {
        modalMeta.innerHTML = '';
        const features = featuresRaw
          .split('|')
          .map(s => s.trim())
          .filter(Boolean);

        features.forEach(f => {
          const li = document.createElement('li');
          li.textContent = f;
          modalMeta.appendChild(li);
        });
      }

      if (modalWhats) {
        modalWhats.href = toWhatsAppLink({ title, price, neighborhood });
      }

      // Link oficial: único por imóvel
      if (modalOfficial) {
        if (officialUrl) {
          modalOfficial.href = officialUrl;
          modalOfficial.style.display = '';
          modalOfficial.setAttribute('aria-disabled', 'false');
        } else {
          modalOfficial.href = '#';
          modalOfficial.style.display = 'none';
          modalOfficial.setAttribute('aria-disabled', 'true');
        }
      }

      openModal();
    });
  });
})();
