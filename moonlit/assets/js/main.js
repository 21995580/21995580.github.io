const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

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

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`資料讀取失敗: ${path}`);
  return res.json();
}

function getQuery(name) {
  return new URLSearchParams(window.location.search).get(name);
}

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
  }

  renderDetail();
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
    $$('.tab-section').forEach((sec) => sec.classList.add('hidden'));
    $(`#${t.dataset.target}`).classList.remove('hidden');
  }));

  $('#worldSection').innerHTML = `
    <div class="panel" style="padding:14px; display:grid; grid-template-columns:220px 1fr; gap:14px;">
      <img src="${work.cover}" alt="cover" style="width:100%; border-radius:10px;">
      <div>
        <p><strong>基本介紹：</strong>${work.world.basic}</p>
        <p><strong>種族設定：</strong>${work.world.races}</p>
        <p><strong>勢力劃分：</strong>${work.world.factions}</p>
        <p><strong>時間線：</strong>${work.world.timeline}</p>
      </div>
    </div>`;

  const mapSection = $('#mapSection');
  mapSection.innerHTML = `<div class="map-wrap"><img src="${work.map.image}" alt="map" id="worldMap"></div><div class="location-detail" id="locationDetail">請點擊地圖星點查看地點介紹。</div>`;
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

  const charSection = $('#charactersSection');
  const singleBtn = $('#singleMode');
  const multiBtn = $('#multiMode');
  const renderMode = (mode) => {
    charSection.innerHTML = '<div class="char-cloud" id="charCloud"></div>';
    const cloud = $('#charCloud', charSection);
    const chars = work.characters.filter((c) => (mode === 'all' ? true : c.mode === mode));
    chars.forEach((c) => {
      const d = document.createElement('a');
      d.className = 'char-dot';
      d.style.left = `${c.layout.x}%`;
      d.style.top = `${c.layout.y}%`;
      d.href = `character.html?id=${c.id}&work=${work.id}`;
      d.innerHTML = `<img src="${c.avatar}" alt="${c.name}"><div>${c.name}</div>`;
      cloud.appendChild(d);
    });
  };
  singleBtn.addEventListener('click', () => renderMode('single'));
  multiBtn.addEventListener('click', () => renderMode('multi'));
  renderMode('all');
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
    const conf = character.info[key];
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
  const page = document.body.dataset.page;
  if (page === 'works') await renderWorks();
  if (page === 'work') await renderWorkPage();
  if (page === 'character') await renderCharacterPage();
  if (page === 'profile') await renderProfile();
  if (page === 'faq') await renderFaq();
}

init();
