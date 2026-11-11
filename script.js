const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/6YBRPGS8NY';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* header */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav');
  const closeNav = () => { burger.classList.remove('is-open'); nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', closeNav));

  /* hero title split */
  const title = $('[data-split]');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  }

  /* smooth anchors */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const t = $(href);
    if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* preselect request from links with data-fmt */
  const reqSelect = $('#reqSelect');
  const setReq = v => { if (reqSelect) [...reqSelect.options].forEach(o => { if (o.text === v) reqSelect.value = o.value; }); };
  $$('[data-fmt]').forEach(a => a.addEventListener('click', () => setReq(a.dataset.fmt)));

  /* ---- hero field: figure follows attention ---- */
  const field = $('#field');
  const discs = [];
  if (field) {
    const COLS = 9, ROWS = 9;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = document.createElement('i');
      d.className = 'disc';
      const x = (c + .5) / COLS, y = (r + .5) / ROWS;
      d.style.left = x * 100 + '%'; d.style.top = y * 100 + '%';
      const size = 100 / COLS * .86;
      d.style.width = size + '%'; d.style.height = 'auto'; d.style.aspectRatio = '1';
      field.appendChild(d);
      discs.push({ el: d, x, y });
    }
    let fig = null;
    const setFig = f => { if (fig === f) return; if (fig) fig.el.classList.remove('is-fig'); fig = f; fig.el.classList.add('is-fig'); };
    const paint = (px, py) => {
      let best = null, bd = 9;
      discs.forEach(d => {
        const dist = Math.hypot(d.x - px, d.y - py);
        if (dist < bd) { bd = dist; best = d; }
        d.el.style.setProperty('--s', (.32 + Math.max(0, .55 - dist * 1.5)).toFixed(2));
      });
      if (best) { best.el.style.setProperty('--s', '1.15'); setFig(best); }
    };
    const base = () => discs.forEach(d => d.el.style.setProperty('--s', '.32'));
    base();
    paint(.5, .5);
    const hint = $('#heroHint');
    if (fine && !reduce) {
      field.addEventListener('pointermove', e => {
        const r = field.getBoundingClientRect();
        paint((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      });
      field.addEventListener('pointerleave', () => { paint(.5, .5); });
    } else {
      if (hint) hint.textContent = 'Фигура на поле меняется сама: внимание переходит с одного на другое.';
      if (!reduce) {
        let t = 0;
        setInterval(() => { t += 1; paint(.5 + Math.cos(t * 1.7) * .32, .5 + Math.sin(t * 1.3) * .32); }, 1600);
      }
    }
  }

  /* ---- scroll scene: 7x7 pattern ---- */
  const PATTERNS = {
    solo: [
      '.......',
      '.......',
      '..ooo..',
      '..oXo..',
      '..ooo..',
      '.......',
      '.......'],
    group: [
      '.......',
      '..XXX..',
      '.X...X.',
      '.X.o.X.',
      '.X...X.',
      '..XXX..',
      '.......'],
    team: [
      '...X...',
      '..ooo..',
      '.o.o.o.',
      'XXXXXXX',
      '.o.o.o.',
      '..ooo..',
      '.......'],
    learn: [
      '......X',
      '.....Xo',
      '....Xo.',
      '...Xo..',
      '..Xo...',
      '.Xo....',
      'Xo.....'],
    rooms: [
      '.......',
      '.XX.XX.',
      '.XX.XX.',
      '.......',
      '.XX.XX.',
      '.XX.XX.',
      '.......']
  };
  const grid = $('#grid7');
  const cells = [];
  if (grid) {
    for (let i = 0; i < 49; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      c.innerHTML = '<i></i>';
      grid.appendChild(c);
      cells.push(c);
    }
  }
  const showPattern = key => {
    const p = PATTERNS[key];
    if (!p) return;
    cells.forEach((c, i) => {
      const r = Math.floor(i / 7), col = i % 7;
      const ch = p[r][col];
      const dist = Math.hypot(r - 3, col - 3);
      c.classList.toggle('f', ch === 'X');
      c.classList.toggle('m', ch === 'o');
      c.firstChild.style.setProperty('--s', ch === 'X' ? '1' : ch === 'o' ? '.62' : '.28');
      c.firstChild.style.setProperty('--dl', reduce ? '0s' : (dist * .035).toFixed(2) + 's');
    });
  };
  const steps = $$('.step');
  const cap = $('#sceneCap');
  let shown = -1;
  const updateScene = () => {
    if (!steps.length) return;
    const vh = window.innerHeight;
    let best = 0, bd = 1e9;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh * (window.innerWidth <= 900 ? .72 : .5));
      if (d < bd) { bd = d; best = i; }
    });
    if (best !== shown) {
      shown = best;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === best));
      showPattern(steps[best].dataset.pattern);
      if (cap) cap.textContent = steps[best].dataset.label;
    }
  };

  /* ---- reveal + header ---- */
  const revealEls = $$('[data-reveal]');
  const parents = new Map();
  revealEls.forEach(el => {
    const p = el.parentElement;
    const n = parents.get(p) || 0;
    el.style.setProperty('--d', Math.min(n, 6) * 70 + 'ms');
    parents.set(p, n + 1);
  });
  let ticking = false;
  const check = () => {
    ticking = false;
    const vh = window.innerHeight;
    header?.classList.toggle('scrolled', window.scrollY > 8);
    revealEls.forEach(el => {
      if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < vh * .94) el.classList.add('is-in');
    });
    updateScene();
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('load', req);
  req(); setTimeout(req, 400);

  /* magnetic button */
  if (!reduce && fine) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---- picker ---- */
  const PICK = {
    self: { f: 'Индивидуальная сессия', w: 'Один на один, 50 минут. Выбираем тему, которая сейчас на переднем плане, и работаем с ней. Подходит, если хочется разобраться с собой без свидетелей.', p: '15–20 тыс. ₽ за сессию', s: 'Личная терапия' },
    people: { f: 'Групповая терапия', w: 'Раз в две недели по три часа. Другие участники помогают увидеть то, что не видно в одиночку. Хорошо дополняет индивидуальную работу.', p: '5 000 ₽ с участника', s: 'Групповая терапия' },
    boss: { f: 'Группа руководителей или бизнес-трекинг', w: 'Группа для руководителей и собственников: раз в две недели по три часа. Если нужна работа с командой и компанией целиком — бизнес-трекинг или оргконсультирование, формат обсуждаем отдельно.', p: 'Группа — 20 000 ₽, трекинг — 300 000 ₽ в месяц с организации', s: 'Группа для руководителей' },
    pro: { f: 'Супервизия и обучение', w: 'Групповая супервизия раз в две недели, индивидуальная работа с супервизантами и программа подготовки гештальт-терапевтов в МГИ: первая и вторая ступени.', p: 'Супервизия — 5 000 ₽, трёхдневка обучения — 20–25 тыс. ₽', s: 'Групповая супервизия' },
    room: { f: 'Кабинет в почасовую аренду', w: 'Три кабинета для индивидуальной работы и один для групп. Посчитайте стоимость в калькуляторе ниже.', p: '350 ₽ в час, групповой — 400 ₽ в час', s: 'Аренда кабинета' }
  };
  const pickOut = $('.pick__out');
  let pickTimer;
  const renderPick = animate => {
    const v = ($('input[name="pk"]:checked') || {}).value || 'self';
    const d = PICK[v];
    const apply = () => {
      $('#pickFormat').textContent = d.f;
      $('#pickWhy').textContent = d.w;
      $('#pickPrice').textContent = d.p;
      pickOut.classList.remove('is-swap');
      $('#pickGo').dataset.fmt = d.s;
    };
    if (animate && !reduce) { pickOut.classList.add('is-swap'); clearTimeout(pickTimer); pickTimer = setTimeout(apply, 260); } else apply();
  };
  $$('input[name="pk"]').forEach(i => i.addEventListener('change', () => renderPick(true)));
  $('#pickGo')?.addEventListener('click', e => setReq(e.currentTarget.dataset.fmt));
  renderPick(false);

  /* ---- rooms calculator ---- */
  const hours = $('#hours');
  const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ');
  const calc = () => {
    if (!hours) return;
    const rate = +($('input[name="room"]:checked') || { value: 350 }).value;
    const h = +hours.value;
    const month = Math.round(h * 52 / 12 * rate / 50) * 50;
    $('#hOut').textContent = h;
    $('#sumMonth').textContent = fmt(month);
    $('#sumNote').textContent = `в месяц за ${h} ${h % 10 === 1 && h !== 11 ? 'час' : (h % 10 >= 2 && h % 10 <= 4 && (h < 12 || h > 14)) ? 'часа' : 'часов'} в неделю, ${rate} ₽ в час`;
  };
  hours?.addEventListener('input', calc);
  $$('input[name="room"]').forEach(i => i.addEventListener('change', calc));
  calc();

  /* phone mask */
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      const raw = e.target.value;
      if (/[a-zA-Zа-яА-Я@]/.test(raw)) return;
      let v = raw.replace(/\D/g, '');
      if (!v) { e.target.value = ''; return; }
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  /* ---- form → Worker → Telegram ---- */
  const form = $('#leadForm'), note = $('#formNote');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { note.textContent = 'Заполните имя и телефон или Telegram'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    btn.disabled = true; btn.textContent = 'Отправляем…'; note.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Мы свяжемся с вами и предложим время.';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
      note.textContent = 'Не удалось отправить. Напишите в Telegram: @Drches';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3500);
    }
  });
})();
