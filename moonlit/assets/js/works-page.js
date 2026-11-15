(() => {
  'use strict';
  const $ = (selector, root) => (root || document).querySelector(selector);
  const grid = $('#workGrid');
  const filters = $('#workFilters');
  const pagination = $('#workPagination');
  const PAGE_SIZE = 6;
  const state = { works: [], filter: '全部', page: 1, direction: 1, locked: false };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[char]));
  }
  function getTags(work) {
    return Array.isArray(work.tags) ? work.tags : (Array.isArray(work.categories) ? work.categories : ['原創']);
  }
  const reservedWorks = [
    { placeholder:true, title:'新作預留位置', subtitle:'COMING SOON', shortDescription:'下一個世界正在醞釀，完整故事即將公開。', cover:'images/bg/dragon-star-map.jpg' },
    { placeholder:true, title:'新作預留位置', subtitle:'A NEW TALE', shortDescription:'此處保留給未來的新篇章，封面與內容都可以替換。', cover:'assets/images/teahouse-interior.webp' },
    { placeholder:true, title:'新作預留位置', subtitle:'TO BE CONTINUED', shortDescription:'待作品資料加入後，這個位置便會自動更新。', cover:'images/bg/main.jpg' }
  ];
  function visibleWorks() {
    const filtered = state.works.filter((work) => state.filter === '全部' || getTags(work).includes(state.filter));
    if (state.filter !== '全部' || filtered.length >= PAGE_SIZE) return filtered;
    return filtered.concat(reservedWorks.slice(0, PAGE_SIZE - filtered.length));
  }
  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function renderFilters() {
    const categories = ['全部'];
    state.works.forEach((work) => getTags(work).forEach((tag) => {
      if (tag && !categories.includes(tag)) categories.push(tag);
    }));
    filters.replaceChildren();
    categories.forEach((category) => {
      const button = makeElement('button', category === state.filter ? 'active' : '', category);
      button.type = 'button';
      button.dataset.filter = category;
      button.setAttribute('aria-pressed', category === state.filter ? 'true' : 'false');
      filters.appendChild(button);
    });
  }

  function observeReveal(elements) {
    const observer = ('IntersectionObserver' in window) ? new IntersectionObserver((entries, current) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        current.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }) : null;
    elements.forEach((element) => {
      if (observer) observer.observe(element);
      else element.classList.add('is-visible');
    });
  }

  function createCard(work, index) {
    const card = makeElement(work.placeholder ? 'article' : 'a', work.placeholder ? 'work-card is-placeholder' : 'work-card');
    if (!work.placeholder) card.href = 'work.html?id=' + encodeURIComponent(work.id || '');
    card.style.setProperty('--order', String(index));
    card.setAttribute('aria-label', work.placeholder ? '新作品預留位置' : '探索作品：' + (work.title || '未命名作品'));

    const cover = makeElement('div', 'work-cover');
    const image = document.createElement('img');
    image.src = work.cover || 'assets/images/ukiyo-valley.webp';
    image.alt = (work.title || '作品') + '作品封面';
    image.loading = 'lazy';
    image.decoding = 'async';
    cover.appendChild(image);

    const tagWrap = makeElement('div', 'work-tags');
    (work.placeholder ? ['新作籌備中'] : getTags(work).slice(0, 2)).forEach((tag) => tagWrap.appendChild(makeElement('span', '', tag)));
    const content = makeElement('div', 'work-card-content');
    content.appendChild(makeElement('h3', '', work.title || '未命名作品'));
    content.appendChild(makeElement('span', 'work-en', work.subtitle || 'Original World'));
    content.appendChild(makeElement('p', '', work.shortDescription || '一段等待被探索的故事。'));
    content.appendChild(makeElement('span', 'work-explore', work.placeholder ? '敬請期待　◇' : '探索世界　◇'));

    card.append(cover, tagWrap, content);
    return card;
  }

  function renderPagination(pageCount) {
    pagination.replaceChildren();
    const previous = makeElement('button', 'page-arrow', '←');
    previous.type = 'button';
    previous.disabled = state.page <= 1;
    previous.setAttribute('aria-label', '上一頁');
    previous.dataset.page = String(state.page - 1);
    pagination.appendChild(previous);

    for (let page = 1; page <= pageCount; page += 1) {
      const button = makeElement('button', page === state.page ? 'active' : '', String(page));
      button.type = 'button';
      button.dataset.page = String(page);
      button.setAttribute('aria-current', page === state.page ? 'page' : 'false');
      button.setAttribute('aria-label', '第 ' + page + ' 頁');
      pagination.appendChild(button);
    }
    const next = makeElement('button', 'page-arrow', '→');
    next.type = 'button';
    next.disabled = state.page >= pageCount;
    next.setAttribute('aria-label', '下一頁');
    next.dataset.page = String(state.page + 1);
    pagination.appendChild(next);
  }

  function paintPage(direction) {
    const all = visibleWorks();
    const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    state.page = Math.max(1, Math.min(state.page, pageCount));
    const start = (state.page - 1) * PAGE_SIZE;
    const pageWorks = all.slice(start, start + PAGE_SIZE);
    grid.replaceChildren();

    if (!pageWorks.length) {
      grid.appendChild(makeElement('p', 'atlas-loading', '此分類尚未收錄作品。'));
    } else {
      pageWorks.forEach((work, index) => grid.appendChild(createCard(work, index)));
    }

    grid.classList.remove('exit-next', 'exit-prev', 'enter-next', 'enter-prev');
    if (direction && !reduceMotion && pageWorks.length) {
      void grid.offsetWidth;
      grid.classList.add(direction > 0 ? 'enter-next' : 'enter-prev');
      window.setTimeout(() => grid.classList.remove('enter-next', 'enter-prev'), 750);
    } else {
      observeReveal(Array.from(document.querySelectorAll('.reveal')));
    }
    renderPagination(pageCount);
    observeReveal(Array.from(grid.querySelectorAll('.work-card')));
  }

  function changePage(nextPage) {
    const count = Math.max(1, Math.ceil(visibleWorks().length / PAGE_SIZE));
    if (state.locked || nextPage < 1 || nextPage > count || nextPage === state.page) return;
    const direction = nextPage > state.page ? 1 : -1;
    state.locked = true;
    grid.classList.remove('enter-next', 'enter-prev');
    grid.classList.add(direction > 0 ? 'exit-next' : 'exit-prev');
    window.setTimeout(() => {
      state.page = nextPage;
      state.direction = direction;
      paintPage(direction);
      state.locked = false;
    }, reduceMotion ? 0 : 270);
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    state.page = 1;
    filters.querySelectorAll('button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    paintPage(0);
  });
  pagination.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-page]');
    if (!button || button.disabled) return;
    changePage(Number(button.dataset.page));
  });

  async function initWorks() {
    try {
      const response = await fetch('./data/works.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('作品資料讀取失敗');
      const data = await response.json();
      state.works = Array.isArray(data.works) ? data.works : [];
      renderFilters();
      paintPage(0);
      observeReveal(Array.from(document.querySelectorAll('.reveal')));
    } catch (error) {
      grid.replaceChildren(makeElement('p', 'atlas-loading', '作品資料暫時無法載入，請稍後重新整理頁面。'));
      pagination.replaceChildren();
    }
  }

  const petalCanvas = $('#worksPetals');
  const petalCtx = petalCanvas.getContext('2d', { alpha: true });
  const petals = [];
  let width = 0, height = 0, dpr = 1, raf = 0, previous = 0;
  const random = (min, max) => min + Math.random() * (max - min);
  function resizePetals() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    petalCanvas.width = Math.round(width * dpr);
    petalCanvas.height = Math.round(height * dpr);
    petalCanvas.style.width = width + 'px';
    petalCanvas.style.height = height + 'px';
    petalCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    petals.length = 0;
    for (let i = 0; i < 20; i += 1) petals.push({
      x: random(0, width), y: random(0, height), size: random(3.5, 7.2),
      speed: random(.18, .48), drift: random(-.16, .16), turn: random(-.012, .012),
      angle: random(0, Math.PI * 2), phase: random(0, Math.PI * 2),
      alpha: random(.28, .65), tint: random(0, 1)
    });
  }
  function drawPetal(p) {
    petalCtx.save();
    petalCtx.translate(p.x, p.y);
    petalCtx.rotate(p.angle);
    petalCtx.globalAlpha = p.alpha;
    for (let i = 0; i < 5; i += 1) {
      petalCtx.save();
      petalCtx.rotate(i * Math.PI * 2 / 5);
      const gradient = petalCtx.createLinearGradient(0, -p.size, 0, 0);
      gradient.addColorStop(0, p.tint > .5 ? 'rgba(255,248,250,.94)' : 'rgba(255,226,237,.94)');
      gradient.addColorStop(.72, 'rgba(246,188,208,.78)');
      gradient.addColorStop(1, 'rgba(225,155,183,.4)');
      petalCtx.fillStyle = gradient;
      petalCtx.beginPath();
      petalCtx.moveTo(0, 0);
      petalCtx.bezierCurveTo(-p.size * .48, -p.size * .18, -p.size * .52, -p.size * .82, 0, -p.size);
      petalCtx.bezierCurveTo(p.size * .52, -p.size * .82, p.size * .48, -p.size * .18, 0, 0);
      petalCtx.fill();
      petalCtx.restore();
    }
    petalCtx.restore();
  }
  function animatePetals(time) {
    if (time - previous < 32) { raf = requestAnimationFrame(animatePetals); return; }
    previous = time;
    petalCtx.clearRect(0, 0, width, height);
    petals.forEach((petal) => {
      drawPetal(petal);
      petal.y += petal.speed;
      petal.x += petal.drift + Math.sin(time * .0006 + petal.phase) * .1;
      petal.angle += petal.turn;
      if (petal.y > height + 20) { petal.y = -20; petal.x = random(0, width); }
    });
    raf = requestAnimationFrame(animatePetals);
  }

  const background = $('.atmosphere-image');
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      background.style.setProperty('--parallax-y', (-window.scrollY * .19).toFixed(1) + 'px');
      scrollFrame = 0;
    });
  }, { passive: true });

  resizePetals();
  window.addEventListener('resize', resizePetals, { passive: true });
  if (!reduceMotion) raf = requestAnimationFrame(animatePetals);
  initWorks();
})();