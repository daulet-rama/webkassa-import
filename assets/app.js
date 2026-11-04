/*
 * «Импорт Webkassa: где теряются продажи» — interactive parts of the page.
 * Plain JavaScript, no libraries and no network requests.
 *
 * 1. Step-through simulation (data and texts kept verbatim from the approved version).
 * 2. Section menu for narrow screens, current-section highlight.
 * 3. Light / dark switch (choice kept in localStorage, guarded by try/catch).
 * 4. Stories: open from links, «Пройти по шагам», expand / collapse all.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------
   * 1. Simulation data
   * ------------------------------------------------------------------ */

  const TONES = [
    {k: 'w', name: 'ждёт'},
    {k: 'p', name: 'в работе'},
    {k: 'd', name: 'галочка'},
    {k: 'f', name: 'брошена'},
    {k: 'u', name: 'не тронута'}
  ];
  const tone = code => TONES.find(z => z.k === code);
  const sh = (x, st) => ({b: x.b, n: x.n, st});
  const step = (s, b, l, t, r) => ({s, b, l, t, r});
  const q = a => a.map(x => '?' + x);
  const K15 = {b: 'Кофейня', n: 'смена 15'}, O7 = {b: 'Обувь', n: 'смена 7'}, C22 = {b: 'Цветы', n: 'смена 22'}, K16 = {b: 'Кофейня', n: 'смена 16'};
  const K = ['К1', 'К2', 'К3'], O = ['О1', 'О2', 'О3'], C = ['Ц1', 'Ц2', 'Ц3'], K2ND = ['К4', 'К5', 'К6'];
  const ALL = [...K, ...O, ...C];
  const SC = [
    {k: 'ok', label: 'Обычный обход', steps: [
      step([sh(K15, 'w'), sh(O7, 'w'), sh(C22, 'w')], [], [], 'Обход начался. В тетради три смены без галочки, бухгалтер берёт их по очереди.'),
      step([sh(K15, 'p'), sh(O7, 'w'), sh(C22, 'w')], K, [], 'Взял ключ Кофейни, вошёл в Webkassa, получил ленту смены 15 и сложил её чеки в корзину.'),
      step([sh(K15, 'd'), sh(O7, 'w'), sh(C22, 'w')], [], K, 'Высыпал корзину в книгу продаж, вытряхнул корзину и поставил смене галочку.'),
      step([sh(K15, 'd'), sh(O7, 'p'), sh(C22, 'w')], O, K, 'Так же с Обувью: вошёл её ключом и сложил чеки смены 7 в корзину.'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'd')], [], ALL, 'Обувь и Цветы переписаны. У всех трёх смен галочка, все чеки в книге. Так и задумано.')
    ]},
    {k: 'stop', label: '1 · Плохая смена', steps: [
      step([sh(K15, 'w'), sh(O7, 'w'), sh(C22, 'w')], [], [], 'Арендатор «Обувь» съехал, и его учётку Webkassa в ASSP отключили. А в тетради осталась его смена 7 без галочки.'),
      step([sh(K15, 'd'), sh(O7, 'w'), sh(C22, 'w')], [], K, 'Кофейня проходит как обычно: чеки в книге, галочка стоит.'),
      step([sh(K15, 'd'), sh(O7, 'f'), sh(C22, 'w')], [], K, 'Очередь Обуви. Ключ бухгалтер ищет ещё без защиты от ошибок. Ключа нет, и он бросает весь обход, а не только эту смену.'),
      step([sh(K15, 'd'), sh(O7, 'f'), sh(C22, 'u')], [], K, 'До Цветов он не дошёл. Их чеки в книгу не попали, хотя с самими Цветами всё в порядке.'),
      step([sh(O7, 'w'), sh(C22, 'w'), sh(K16, 'w')], [], K, 'Через 2 часа новый обход. У Кофейни смена 15 уже с галочкой, а в тетради появилась её новая смена 16. Смена Обуви всё ещё без галочки, и обход снова до неё дойдёт.'),
      step([sh(O7, 'f'), sh(C22, 'u'), sh(K16, 'u')], [], K, 'Снова обрыв на Обуви. Так будет на каждом обходе, пока эту смену не уберут вручную или не вернут учётку.', 'Новые продажи Webkassa не приходят почти ни у кого'),
      step([sh(O7, 'f'), sh(C22, 'd'), sh(K16, 'd')], [], [...K, ...C, ...K2ND], 'Для сравнения: если бы Обувь просто сменила пароль, а учётку никто не трогал, вход бы не удался. Судя по открытым источникам, бухгалтер тогда пропустил бы только её смену и пошёл дальше.')
    ]},
    {k: 'poison', label: '2 · Отравленная корзина', steps: [
      step([sh(K15, 'w'), sh(O7, 'w'), sh(C22, 'w')], [], [], 'В смене Кофейни есть чек К2, который книга отказывается записывать каждый раз: например, у него нет суммы.'),
      step([sh(K15, 'p'), sh(O7, 'w'), sh(C22, 'w')], ['К1', '!К2', 'К3'], [], 'Бухгалтер сложил чеки Кофейни в корзину.'),
      step([sh(K15, 'f'), sh(O7, 'w'), sh(C22, 'w')], ['К1', '!К2', 'К3'], ['К1'], 'Начал высыпать в книгу: К1 записан, на К2 ошибка. Смену он бросает, но корзину не вытряхивает: это делается только после удачной записи.'),
      step([sh(K15, 'f'), sh(O7, 'p'), sh(C22, 'w')], ['К1', '!К2', 'К3', ...O], ['К1'], 'Чеки Обуви ложатся в ту же корзину, поверх старых.'),
      step([sh(K15, 'f'), sh(O7, 'f'), sh(C22, 'w')], ['К1', '!К2', 'К3', ...O], ['К1'], 'Он снова высыпает корзину с самого начала. К1 пропускает как уже записанный, на К2 опять ошибка. Чеки Обуви до книги не дошли.'),
      step([sh(K15, 'f'), sh(O7, 'f'), sh(C22, 'f')], ['К1', '!К2', 'К3', ...O, ...C], ['К1'], 'С Цветами то же самое. Корзина растёт, а в книгу не попадает ни одного нового чека, ни у кого.', 'В книгу не попадает ничего нового'),
      step([sh(K15, 'w'), sh(O7, 'w'), sh(C22, 'w')], [], ['К1'], 'Сервис перезапустили, и корзина опустела. Но смена Кофейни всё ещё без галочки, и на ближайшем обходе К2 снова попадёт в корзину и снова её отравит.')
    ]},
    {k: 'status', label: '4 · Пустой статус', steps: [
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'd')], [], ALL, 'Обход прошёл как задумано: у всех смен галочка, все девять чеков в книге.'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'd')], [], q(ALL), 'Но графу «статус» у этих чеков бухгалтер оставил пустой. Пунктирная рамка — чек без статуса.'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'd')], [], q(ALL), 'Суммы для Task и часть отчётов берут только строки с заполненным статусом; пустую графу пропускают.', 'В книге 9 чеков, а в Task и в части отчётов — 0'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'd')], [], q(ALL), 'Так во всех историях: чеки Webkassa доходят до книги, но без статуса не попадают в Task и в часть отчётов. В других историях рамки сплошные только для простоты.', 'В книге 9 чеков, а в Task и в части отчётов — 0')
    ]},
    {k: 'empty', label: '5 · Чужой ключ', steps: [
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'w')], [], [...K, ...O], 'Кофейня и Обувь уже переписаны. У Цветов два кабинета в Webkassa, а касса смены 22 стоит во втором.'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'p')], [], [...K, ...O], 'Ключ бухгалтер берёт первый попавшийся — от первого кабинета — и просит им ленту смены 22.'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'p')], [], [...K, ...O], 'Что Webkassa ответит на чужой ключ, мы не проверяли. Если откажет, смена зависнет без галочки навсегда. Если отдаст пустую ленту, в корзину ничего не ляжет и ошибки не будет.'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'd')], [], [...K, ...O], 'Во втором случае высыпать нечего, и бухгалтер ставит галочку. Смена 22 отмечена как переписанная.'),
      step([sh(K15, 'd'), sh(O7, 'd'), sh(C22, 'd')], [], [...K, ...O], 'Чеков Цветов в книге нет и не будет: смену с галочкой больше никто не открывает. В журнале ни одной ошибки.', 'Потеряны: Ц1, Ц2, Ц3')
    ]},
    {k: 'date', label: '11 · Кривая дата', steps: [
      step([sh(K15, 'w'), sh(O7, 'w'), sh(C22, 'w')], [], [], 'У чека К2 в смене Кофейни дата пришла в непонятном формате.'),
      step([sh(K15, 'f'), sh(O7, 'w'), sh(C22, 'w')], ['К1'], [], 'Бухгалтер положил К1 в корзину, а дату К2 прочитать не смог. Смену он бросает без галочки, до К3 даже не доходит. К1 так и остаётся в корзине.'),
      step([sh(K15, 'f'), sh(O7, 'p'), sh(C22, 'w')], ['К1', ...O], [], 'Обувь докладывает свои чеки в ту же корзину.'),
      step([sh(K15, 'f'), sh(O7, 'd'), sh(C22, 'w')], [], ['К1', ...O], 'Корзина высыпана: К1 уехал в книгу вместе с Обувью. А К2 и К3 не попали.'),
      step([sh(K15, 'f'), sh(O7, 'd'), sh(C22, 'd')], [], ['К1', ...O, ...C], 'Цветы прошли нормально.'),
      step([sh(K15, 'f'), sh(O7, 'd'), sh(C22, 'd')], [], ['К1', ...O, ...C], 'Каждый новый обход начинает смену Кофейни заново и снова спотыкается на К2. К3 не попадёт в книгу никогда, а смена так и висит без галочки.', 'Потеряны: К2, К3')
    ]}
  ];

  /* ------------------------------------------------------------------
   * Rendering helpers. They build HTML strings and need no DOM, so the
   * same code can be exercised step by step outside the browser.
   * ------------------------------------------------------------------ */

  const ESC = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
  const esc = s => String(s).replace(/[&<>"']/g, ch => ESC[ch]);
  const findScenario = key => SC.find(x => x.k === key);
  const EMPTY_HTML = '<span class="sim-empty">пусто</span>';

  function chipHTML(c, fresh) {
    const bad = c.startsWith('!'), nos = c.startsWith('?');
    const label = bad || nos ? c.slice(1) : c;
    const cls = 'chip' + (bad ? ' chip-bad' : '') + (nos ? ' chip-blank' : '') + (fresh ? ' is-fresh' : '');
    const hint = bad ? '<span class="visually-hidden"> — чек с ошибкой</span>'
      : nos ? '<span class="visually-hidden"> — без статуса</span>' : '';
    return '<li class="' + cls + '">' + esc(label) + hint + '</li>';
  }

  function chipsHTML(list, prevList) {
    if (!list.length) return EMPTY_HTML;
    return '<ul class="chips">' + list.map(c => chipHTML(c, !!prevList && prevList.indexOf(c) === -1)).join('') + '</ul>';
  }

  function rowHTML(r, prevRows) {
    const z = tone(r.st);
    let fresh = false;
    if (prevRows) {
      const old = prevRows.find(p => p.b === r.b && p.n === r.n);
      fresh = !old || old.st !== r.st;
    }
    return '<li class="sim-row">' +
      '<span class="sim-who"><span class="sim-brand">' + esc(r.b) + '</span><span class="sim-shift">' + esc(r.n) + '</span></span>' +
      '<span class="badge tone-' + z.k + (fresh ? ' is-fresh' : '') + '">' + esc(z.name) + '</span>' +
      '</li>';
  }

  /** Everything the page shows for one step. `prevIndex` marks what changed since that step. */
  function view(key, i, prevIndex) {
    const sc = findScenario(key);
    if (!sc) return null;
    const n = sc.steps.length;
    const idx = Math.min(Math.max(0, i | 0), n - 1);
    const st = sc.steps[idx];
    const prev = typeof prevIndex === 'number' && prevIndex !== idx ? sc.steps[prevIndex] : null;
    return {
      key: sc.k,
      label: sc.label,
      index: idx,
      total: n,
      first: idx === 0,
      last: idx === n - 1,
      rows: '<ul class="sim-rows">' + st.s.map(r => rowHTML(r, prev && prev.s)).join('') + '</ul>',
      basket: chipsHTML(st.b, prev && prev.b),
      book: chipsHTML(st.l, prev && prev.l),
      count: 'Шаг ' + (idx + 1) + ' из ' + n,
      next: idx === n - 1 ? 'Сначала' : 'Дальше →',
      note: st.r || '',
      text: st.t
    };
  }

  let simApi = null;
  const WK = root.WK || {};
  WK.scenarios = SC;
  WK.tones = TONES;
  WK.view = view;
  /** Select a scenario, reset it to step 1 and bring the simulation into view. */
  WK.openScenario = (key, fromStory) => (simApi ? simApi.open(key, fromStory) : false);
  root.WK = WK;

  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------------------
   * Browser-only part
   * ------------------------------------------------------------------ */

  const reducedMotion = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const scrollBehavior = () => (reducedMotion() ? 'auto' : 'smooth');

  function initSim() {
    const el = document.getElementById('sim');
    if (!el) return;
    const part = name => el.querySelector('[data-sim="' + name + '"]');
    const pills = part('pills'), rows = part('rows'), basket = part('basket'), book = part('book');
    const back = part('back'), next = part('next'), count = part('count');
    const note = part('note'), text = part('text'), ret = part('return');
    const liveCount = part('live-count');
    let k = 'ok', i = 0;

    pills.innerHTML = SC.map(x =>
      '<button type="button" class="pill" data-key="' + esc(x.k) + '" aria-pressed="false">' + esc(x.label) + '</button>'
    ).join('');

    function render(prevIndex) {
      const v = view(k, i, prevIndex);
      rows.innerHTML = v.rows;
      basket.innerHTML = v.basket;
      book.innerHTML = v.book;
      count.textContent = v.count;
      if (liveCount) liveCount.textContent = v.count + '. ';
      back.setAttribute('aria-disabled', String(v.first));
      next.innerHTML = v.last ? 'Сначала' : 'Дальше <span aria-hidden="true">→</span>';
      note.textContent = v.note;
      note.hidden = !v.note;
      text.textContent = v.text;
      pills.querySelectorAll('button[data-key]').forEach(b => {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-key') === k));
      });
    }

    function total() { return findScenario(k).steps.length; }

    function go(to) {
      if (to < 0 || to > total() - 1 || to === i) return;
      const from = i;
      i = to;
      render(from);
    }

    function pick(key) {
      if (!findScenario(key)) return false;
      k = key;
      i = 0;
      render(null);
      return true;
    }

    function hideReturn() {
      if (ret) { ret.hidden = true; ret.removeAttribute('href'); }
    }

    pills.addEventListener('click', e => {
      const b = e.target.closest('button[data-key]');
      if (b) { hideReturn(); pick(b.getAttribute('data-key')); }
    });
    back.addEventListener('click', () => go(i - 1));
    next.addEventListener('click', () => {
      if (i >= total() - 1) { i = 0; render(null); } else { go(i + 1); }
    });
    el.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === 'ArrowRight' || e.key === 'Right') { e.preventDefault(); go(i + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'Left') { e.preventDefault(); go(i - 1); }
    });
    if (ret) ret.addEventListener('click', () => setTimeout(hideReturn, 0));

    render(null);

    simApi = {
      open(key, fromStory) {
        if (!pick(key)) return false;
        if (ret) {
          if (fromStory) {
            ret.setAttribute('href', '#' + fromStory);
            ret.querySelector('[data-sim="return-n"]').textContent = fromStory.replace(/\D+/g, '');
            ret.hidden = false;
          } else {
            hideReturn();
          }
        }
        el.scrollIntoView({behavior: scrollBehavior(), block: 'start'});
        try { el.focus({preventScroll: true}); } catch (err) { el.focus(); }
        return true;
      }
    };
  }

  function initStories() {
    const openFromHash = () => {
      const id = (root.location.hash || '').slice(1);
      if (!/^story-\d+$/.test(id)) return;
      const d = document.getElementById(id);
      if (d && d.tagName === 'DETAILS') d.open = true;
    };
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#story-"]');
      if (!a) return;
      const d = document.getElementById(a.getAttribute('href').slice(1));
      if (d && d.tagName === 'DETAILS') d.open = true;
    });
    root.addEventListener('hashchange', openFromHash);
    openFromHash();

    document.querySelectorAll('[data-scenario]').forEach(btn => {
      btn.addEventListener('click', () => {
        const story = btn.closest('details');
        WK.openScenario(btn.getAttribute('data-scenario'), story ? story.id : null);
      });
    });

    const all = () => document.querySelectorAll('details.story');
    const expand = document.querySelector('[data-stories="open"]');
    const collapse = document.querySelector('[data-stories="close"]');
    if (expand) expand.addEventListener('click', () => all().forEach(d => { d.open = true; }));
    if (collapse) collapse.addEventListener('click', () => all().forEach(d => { d.open = false; }));

    let printOpened = [];
    root.addEventListener('beforeprint', () => {
      all().forEach(d => { if (!d.open) { d.open = true; printOpened.push(d); } });
    });
    root.addEventListener('afterprint', () => {
      printOpened.forEach(d => { d.open = false; });
      printOpened = [];
    });
  }

  function initMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(!isOpen()));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', e => {
      if (isOpen() && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  function initSpy() {
    const links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
    const byId = {};
    links.forEach(a => { byId[a.getAttribute('href').slice(1)] = a; });
    const sections = Object.keys(byId).map(id => document.getElementById(id)).filter(Boolean);
    if (!('IntersectionObserver' in root) || !sections.length) return;
    const visible = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id); });
      const current = sections.find(s => visible.has(s.id));
      links.forEach(a => a.removeAttribute('aria-current'));
      if (current) byId[current.id].setAttribute('aria-current', 'true');
    }, {rootMargin: '-30% 0px -60% 0px'});
    sections.forEach(s => io.observe(s));
  }

  function initTheme() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const html = document.documentElement;
    const mq = root.matchMedia ? root.matchMedia('(prefers-color-scheme: dark)') : null;
    const isDark = () => {
      const t = html.getAttribute('data-theme');
      if (t === 'dark') return true;
      if (t === 'light') return false;
      return !!(mq && mq.matches);
    };
    const sync = () => btn.setAttribute('aria-pressed', String(isDark()));
    btn.addEventListener('click', () => {
      const dark = !isDark();
      html.setAttribute('data-theme', dark ? 'dark' : 'light');
      try { root.localStorage.setItem('wk-theme', dark ? 'dark' : 'light'); } catch (err) { /* storage unavailable */ }
      sync();
    });
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', sync);
      else if (mq.addListener) mq.addListener(sync);
    }
    sync();
  }

  function init() {
    const html = document.documentElement;
    html.classList.remove('no-js');
    html.classList.add('js');
    initTheme();
    initMenu();
    initSim();
    initStories();
    initSpy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
