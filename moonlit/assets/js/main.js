const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/**
 * 產生背景漂浮粒子（全頁共用）
 * @param {number} count 粒子數量
 */
function createParticles(count = 32) {
  const layer = document.createElement('div');
  layer.className = 'particles';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = Math.random() * 5 + 2;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDuration = `${15 + Math.random() * 22}s`;
    p.style.animationDelay = `${Math.random() * -20}s`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
}

/** 安全讀 JSON 檔 */
async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`資料讀取失敗: ${path}`);
  return res.json();
}

/** 取得網址 query 參數 */
function getQuery(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * 從 min~max 取隨機整數（含上下限）
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 加上 UI 進場動畫 class
 * 用在動態插入的區塊，讓它由下往上淡入
 */
function activateFadeIn(element) {
  if (!element) return;
  element.classList.add('ui-fade-panel');
}

/**
 * works.html：渲染作品星圖
 * - 作品 icon 隨機大小（有上下限）
 * - icon 文字置中
 * - 配色與首頁 icon 統一（由 CSS 共用樣式控制）
 */
async function renderWorks() {
  const { works } = await loadJson('./data/works.json');
  const map = $('#workMap');
  const detail = $('#workDetail');
  let selected = works[0];

  works.forEach((w) => {
    const node = document.createElement('button');
    node.className = 'work-node';
    node.style.left = `${w.starPos.x}%`;
    node.style.top = `${w.starPos.y}%`;

    // 作品 icon 隨機大小：避免過大或過小
    const size = randInt(122, 176);
    node.style.setProperty('--work-size', `${size}px`);

    node.innerHTML = `<strong>${w.title}</strong><small>${w.subtitle}</small>`;
    node.addEventListener('click', () => {
      selected = w;
      renderDetail();
    });
    map.appendChild(node);
  });

  function renderDetail() {
    detail.innerHTML = `
      <img src="${selected.cover}" alt="${selected.title}封面">
      <div>
        <h3>${selected.title}</h3>
        <p>${selected.shortDescription}</p>
      </div>
      <a class="btn" href="work.html?id=${selected.id}">進入世界觀</a>
    `;
    activateFadeIn(detail);
  }

  renderDetail();
}

/**
 * 地圖除錯模式：
 * URL 加上 ?debugPins=1 後，滑鼠移動可看到地圖座標百分比。
 * 幫助你新增地圖星點到正確位置。
 */
function enableMapDebug(mapWrap) {
  if (getQuery('debugPins') !== '1' || !mapWrap) return;

  const tag = document.createElement('div');
  tag.style.cssText = `
    position:absolute; right:8px; top:8px; z-index:4;
    padding:6px 10px; border-radius:8px; font-size:12px;
    color:#ffe9b0; background:rgba(8,20,36,.72); border:1px solid rgba(224,197,140,.35);
  `;
  tag.textContent = 'x: --, y: --';
  mapWrap.appendChild(tag);

  mapWrap.addEventListener('mousemove', (e) => {
    const rect = mapWrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    tag.textContent = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
  });

  mapWrap.addEventListener('click', (e) => {
    const rect = mapWrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    console.log(`可複製到 works.json 的座標 => {"x": ${x.toFixed(2)}, "y": ${y.toFixed(2)}}`);
  });
}

async function renderWorkPage() {
  const workId = getQuery('id') || 'requiem';
  const { works } = await loadJson('./data/works.json');
  const work = works.find((w) => w.id === workId) || works[0];
  $('#workTitle').textContent = work.title;
  $('#workSubtitle').textContent = work.subtitle;

  const tabs = $$('.tab[data-target]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.classList.remove('active'));
    t.classList.add('active');

    // 先做淡出，再切換到下一個區塊（看起來比較柔順）
    $$('.tab-section').forEach((sec) => {
      sec.style.opacity = '0';
      setTimeout(() => sec.classList.add('hidden'), 180);
    });

    const target = $(`#${t.dataset.target}`);
    setTimeout(() => {
      target.classList.remove('hidden');
      target.style.opacity = '1';
      activateFadeIn(target);
    }, 190);
  }));

  $('#worldSection').innerHTML = `
    <div class="panel ui-fade-panel" style="padding:14px; display:grid; grid-template-columns:220px 1fr; gap:14px;">
      <img src="${work.cover}" alt="cover" style="width:100%; border-radius:10px;">
      <div>
        <p><strong>基本介紹：</strong>${work.world.basic}</p>
        <p><strong>種族設定：</strong>${work.world.races}</p>
        <p><strong>勢力劃分：</strong>${work.world.factions}</p>
        <p><strong>時間線：</strong>${work.world.timeline}</p>
      </div>
    </div>`;

  const mapSection = $('#mapSection');
  mapSection.innerHTML = `
    <div class="map-wrap ui-fade-panel">
      <img src="${work.map.image}" alt="map" id="worldMap">
    </div>
    <div class="location-detail" id="locationDetail">請點擊地圖星點查看地點介紹。<br><small>新增星點：在網址加上 <code>?debugPins=1</code> 觀看座標，點擊地圖可在 console 取得 x/y。</small></div>
  `;

  const mapWrap = $('.map-wrap', mapSection);
  const locationDetail = $('#locationDetail');
  work.map.locations.forEach((loc) => {
    const pin = document.createElement('button');
    pin.className = 'map-pin';
    pin.style.left = `${loc.pos.x}%`;
    pin.style.top = `${loc.pos.y}%`;
    pin.title = loc.name;
    pin.addEventListener('click', () => {
      locationDetail.innerHTML = `<details open><summary>${loc.name}</summary><p>${loc.description}</p><p><small>地點背景：${loc.backdrop}</small></p></details>`;
    });
    mapWrap.appendChild(pin);
  });
  enableMapDebug(mapWrap);

  // 已依需求移除「單人 / 多人」切換，改為直接顯示所有角色
  const charSection = $('#charactersSection');
  charSection.innerHTML = '<div class="char-cloud ui-fade-panel" id="charCloud"></div>';
  const cloud = $('#charCloud', charSection);

  work.characters.forEach((c, index) => {
    const d = document.createElement('a');
    d.className = 'char-dot';
    d.style.left = `${c.layout.x}%`;
    d.style.top = `${c.layout.y}%`;

    // 角色 icon 隨機大小：有上下限，避免過大或過小
    const size = randInt(92, 140);
    d.style.setProperty('--char-size', `${size}px`);

    // 依照索引做逐一淡入
    d.style.setProperty('--stagger', index);

    d.href = `character.html?id=${c.id}&work=${work.id}`;
    d.innerHTML = `<img src="${c.avatar}" alt="${c.name}"><div>${c.name}</div>`;
    cloud.appendChild(d);
  });
}

async function renderCharacterPage() {
  const charId = getQuery('id') || 'nameless';
  const { works } = await loadJson('./data/works.json');
  const allChars = works.flatMap((w) => w.characters);
  const character = allChars.find((c) => c.id === charId) || allChars[0];

  $('#charName').textContent = character.name;
  $('#charQuote').textContent = `「${character.quote}」`;
  $('#charBasic').innerHTML = character.basic.map((x) => `<li>${x}</li>`).join('');
  $('#charArt').src = character.full;

  const tabButtons = $$('.tab[data-info]');
  const infoBox = $('#infoBox');
  const renderInfo = (key) => {
    const conf = character.info[key] || { title: 'FAQ', content: '目前尚未補上此分頁內容。', locked: false };
    if (conf.locked) {
      infoBox.innerHTML = `<h4>${conf.title}</h4><p class="locked">${conf.content}</p><button class="btn" id="unlockBtn">點擊解鎖顯示</button><p><small>※你之後要隱藏內容時，只要在 data/works.json 內把 locked 設為 true。</small></p>`;
      $('#unlockBtn').addEventListener('click', () => {
        conf.locked = false;
        renderInfo(key);
      });
      return;
    }
    infoBox.innerHTML = `<h4>${conf.title}</h4><p>${conf.content}</p>`;
  };

  tabButtons.forEach((btn) => btn.addEventListener('click', () => {
    tabButtons.forEach((x) => x.classList.remove('active'));
    btn.classList.add('active');
    renderInfo(btn.dataset.info);
  }));
  renderInfo('background');
}

async function renderProfile() {
  const { profile } = await loadJson('./data/site.json');
  $('#authorQuote').textContent = profile.quote;
  $('#authorBio').textContent = profile.bio;
  $('#profileAvatar').src = profile.avatar;
  const links = $('#profileLinks');
  links.innerHTML = profile.links.map((l) => `<li><a href="${l.url}" target="_blank" rel="noreferrer">${l.name}</a></li>`).join('');
}

async function renderFaq() {
  const { faqs } = await loadJson('./data/faqs.json');
  const list = $('#faqList');
  list.innerHTML = faqs.map((f) => `<details><summary>${f.question}</summary><p>${f.answer}</p></details>`).join('');
}

async function init() {
  createParticles();

  // 頁面初次進場時，所有標示 ui-fade-panel 的區塊會淡入
  $$('.ui-fade-panel').forEach((el) => activateFadeIn(el));

  const page = document.body.dataset.page;
  if (page === 'works') await renderWorks();
  if (page === 'work') await renderWorkPage();
  if (page === 'character') await renderCharacterPage();
  if (page === 'profile') await renderProfile();
  if (page === 'faq') await renderFaq();
}

init();
