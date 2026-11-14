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

function formatMultilineText(text = '') {
  return String(text).split('\n').join('<br>');
}

function getWorldSections(world = {}) {
  if (Array.isArray(world.sections) && world.sections.length) return world.sections;
  const fallbackOrder = [
    { key: 'basic', title: '基本介紹' },
    { key: 'races', title: '種族設定' },
    { key: 'factions', title: '勢力劃分' },
    { key: 'timeline', title: '時間線' },
  ];
  return fallbackOrder
    .map(({ key, title }) => ({ title, content: world[key] }))
    .filter((section) => section.content);
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

  const worldSections = getWorldSections(work.world);
  $('#worldSection').innerHTML = `
    <div class="panel ui-fade-panel" style="padding:14px; display:grid; grid-template-columns:220px 1fr; gap:14px;">
      <img src="${work.cover}" alt="cover" style="width:100%; border-radius:10px;">
      <div class="world-intro-grid">
        ${worldSections.map((section) => `
          <article class="world-intro-card">
            <h3>${section.title}</h3>
            <p>${section.content}</p>
          </article>
        `).join('')}
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
  const workIdFromQuery = getQuery('work');
  const { works } = await loadJson('./data/works.json');
  const allChars = works.flatMap((w) => w.characters.map((c) => ({ ...c, workId: w.id })));
  const character = allChars.find((c) => c.id === charId) || allChars[0];
  if (!character) return;
  const resolvedWorkId = workIdFromQuery || character.workId;

  $('#charName').textContent = character.name;
  $('#charQuote').textContent = `「${character.quote}」`;
  $('#charBasic').innerHTML = character.basic.map((x) => `<li>${x}</li>`).join('');
  const oldTagList = $('.char-tag-list');
  if (oldTagList) oldTagList.remove();
  const tags = Array.isArray(character.tags) ? character.tags : [];
  if (tags.length) {
    $('#charBasic').insertAdjacentHTML('afterend', `
      <div class="char-tag-list">
        ${tags.map((tag) => `<span class="char-tag">${tag}</span>`).join('')}
      </div>
    `);
  }
  $('#charArt').src = character.full;
  const summary = $('.character-summary');
  const existing = $('#playLinkBtn', summary);
  if (existing) existing.remove();
  const existingWorld = $('#worldLinkBtn', summary);
  if (existingWorld) existingWorld.remove();

  if (resolvedWorkId) {
    const worldLink = document.createElement('a');
    worldLink.id = 'worldLinkBtn';
    worldLink.className = 'btn';
    worldLink.href = `work.html?id=${resolvedWorkId}`;
    worldLink.textContent = '世界觀連結';
    summary.appendChild(worldLink);
  }

  if (character.playUrl) {
    const playLink = document.createElement('a');
    playLink.id = 'playLinkBtn';
    playLink.className = 'btn';
    playLink.href = character.playUrl;
    playLink.target = '_blank';
    playLink.rel = 'noreferrer';
    playLink.textContent = '遊玩連結';
    summary.appendChild(playLink);
  }

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

async function renderCharactersPage() {
  const { works } = await loadJson('./data/works.json');
  const board = $('#charactersBoard');
  board.innerHTML = works.map((work) => {
    const cards = work.characters.length
      ? work.characters.map((character) => {
        const tags = Array.isArray(character.tags) ? character.tags : [];
        return `
          <a class="character-card" href="character.html?id=${character.id}&work=${work.id}">
            <img src="${character.avatar}" alt="${character.name}">
            <div class="character-tags">
              ${tags.map((t) => `<span>${t}</span>`).join('')}
            </div>
            <div class="character-name">${character.name}</div>
          </a>
        `;
      }).join('')
      : '<p>此分類暫無角色，之後新增在 <code>data/works.json</code> 會自動顯示。</p>';
    return `
      <section class="characters-group panel ui-fade-panel" style="padding:14px;">
        <h3>${work.title} / ${work.subtitle}</h3>
        <div class="characters-grid">${cards}</div>
      </section>
    `;
  }).join('');
}

async function renderGallery() {
  const { categories } = await loadJson('./data/gallery.json');
  const grid = $('#galleryGrid');
  if (!Array.isArray(categories) || !categories.length) {
    grid.innerHTML = '<p class="panel" style="padding:12px;">目前尚無畫廊分類。</p>';
    return;
  }

  const filterRow = document.createElement('div');
  filterRow.className = 'gallery-filter-row';
  const listWrap = document.createElement('div');
  listWrap.className = 'gallery-grid';
  const viewer = document.createElement('div');
  viewer.className = 'gallery-lightbox hidden';
  viewer.innerHTML = `
    <div class="gallery-lightbox-backdrop" data-close="1"></div>
    <figure class="gallery-lightbox-card panel">
      <button class="gallery-close-btn" type="button" aria-label="關閉">✕</button>
      <img src="" alt="" id="galleryLightboxImg">
      <figcaption id="galleryLightboxCap"></figcaption>
    </figure>
  `;
  grid.append(filterRow, listWrap, viewer);

  const viewerImg = $('#galleryLightboxImg', viewer);
  const viewerCap = $('#galleryLightboxCap', viewer);
  const closeViewer = () => viewer.classList.add('hidden');
  $('.gallery-close-btn', viewer).addEventListener('click', closeViewer);
  $('.gallery-lightbox-backdrop', viewer).addEventListener('click', closeViewer);

  const renderItems = (catKey) => {
    const selected = categories.find((c) => c.key === catKey) || categories[0];
    const items = Array.isArray(selected.items) ? selected.items : [];
    listWrap.innerHTML = items.map((item) => `
      <figure class="gallery-item ui-fade-panel">
        <img src="${item.image}" alt="${item.title}" data-image="${item.image}" data-title="${item.title}">
        <figcaption>${item.title}</figcaption>
      </figure>
    `).join('');
    if (!items.length) {
      listWrap.innerHTML = '<p class="panel" style="padding:12px;">此分類尚未新增圖片。</p>';
      return;
    }
    $$('img[data-image]', listWrap).forEach((img) => {
      img.addEventListener('click', () => {
        viewerImg.src = img.dataset.image;
        viewerImg.alt = img.dataset.title;
        viewerCap.textContent = img.dataset.title;
        viewer.classList.remove('hidden');
      });
    });
  };

  categories.forEach((cat, index) => {
    const btn = document.createElement('button');
    btn.className = `gallery-filter-btn${index === 0 ? ' active' : ''}`;
    btn.textContent = cat.label;
    btn.addEventListener('click', () => {
      $$('.gallery-filter-btn', filterRow).forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      renderItems(cat.key);
    });
    filterRow.appendChild(btn);
  });

  renderItems(categories[0]?.key);
}

async function renderProfile() {
  const { profile } = await loadJson('./data/site.json');
  $('#authorQuote').innerHTML = formatMultilineText(profile.quote);
  $('#authorBio').innerHTML = formatMultilineText(profile.bio);
  $('#profileAvatar').src = profile.avatar;
  const links = $('#profileLinks');
  links.innerHTML = profile.links.map((l) => `<li><a href="${l.url}" target="_blank" rel="noreferrer">${l.name}</a></li>`).join('');
}

async function renderFaq() {
  const { faqs } = await loadJson('./data/faqs.json');
  const list = $('#faqList');
  list.innerHTML = faqs.map((f) => `<details><summary>${f.question}</summary><p>${f.answer}</p></details>`).join('');
}


/** 首頁雙場景開場：像素春日草原 → 浮世繪山水小屋 */
function initHomeIntro() {
  const portal = $('#portalScreen');
  const portalEnter = $('#portalEnter');
  const portalSkip = $('#portalSkip');
  const stage = $('#introStage');
  if (portal && !portal.dataset.pointerBound) {
    portal.dataset.pointerBound = 'true';
    const fog = $('#portalFog');
    const water = $('#portalWater');
    const ctx = fog?.getContext('2d');
    const waterCtx = water?.getContext('2d');
    let wiping = false, didWipe = false, downPoint = null, lastPoint = null;
    let restoreFrame = 0, restoreTime = 0, restoreLast = 0, waterFrame = 0, baseFog = null, erasedFog = null;
    const brushRadius = 52, restoreDuration = 18000;
    const droplets = [], ripples = [];
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const sizeCanvases = () => {
      const rect = portal.getBoundingClientRect(), ratio = dpr();
      [fog,water].forEach(canvas => { if(canvas){canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';} });
      if(ctx){ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,rect.width,rect.height);
        const haze=ctx.createLinearGradient(0,0,rect.width,rect.height);
        haze.addColorStop(0,'rgba(220,237,242,.24)');haze.addColorStop(.5,'rgba(205,225,235,.18)');haze.addColorStop(1,'rgba(226,238,241,.25)');
        ctx.fillStyle=haze;ctx.fillRect(0,0,rect.width,rect.height);
        ctx.save();ctx.filter='blur(55px)';
        [[.16,.2,230,.2],[.72,.3,280,.17],[.44,.78,330,.18],[.9,.82,240,.16]].forEach(([x,y,r,a])=>{const g=ctx.createRadialGradient(rect.width*x,rect.height*y,0,rect.width*x,rect.height*y,r);g.addColorStop(0,`rgba(239,247,249,${a})`);g.addColorStop(1,'rgba(239,247,249,0)');ctx.fillStyle=g;ctx.fillRect(rect.width*x-r,rect.height*y-r,r*2,r*2);});ctx.restore();
      }
      if(waterCtx)waterCtx.setTransform(ratio,0,0,ratio,0,0);
      baseFog=document.createElement('canvas');baseFog.width=fog.width;baseFog.height=fog.height;
      baseFog.getContext('2d').drawImage(fog,0,0);erasedFog=null;
    };
    const pointFrom=e=>{const r=portal.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
    const eraseAt=(x,y)=>{if(!ctx)return;ctx.save();ctx.globalCompositeOperation='destination-out';const g=ctx.createRadialGradient(x,y,5,x,y,brushRadius);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.62,'rgba(0,0,0,.94)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,brushRadius,0,Math.PI*2);ctx.fill();ctx.restore();};
    const addWater=(x,y,strength=1)=>{
      const now=performance.now();
      ripples.push({x,y,start:now,radius:48+Math.random()*28,strength,delay:0});
      ripples.push({x:x+2,y:y-1,start:now+95,radius:30+Math.random()*20,strength:strength*.48,delay:95});
      if(Math.random()<.62)droplets.push({x:x+(Math.random()-.5)*13,y:y+(Math.random()-.5)*10,rx:2.1+Math.random()*2.2,ry:3.4+Math.random()*3.4,life:1,vy:-.08-Math.random()*.16});
      if(droplets.length>70)droplets.splice(0,droplets.length-70);
      if(ripples.length>90)ripples.splice(0,ripples.length-90);
    };
    const paintWater=now=>{
      if(!waterCtx||!water)return;
      const rect=portal.getBoundingClientRect();waterCtx.clearRect(0,0,rect.width,rect.height);
      for(let i=ripples.length-1;i>=0;i--){
        const p=ripples[i],age=Math.max(0,now-p.start-p.delay),t=age/1050;
        if(t>=1){ripples.splice(i,1);continue;}if(age<=0)continue;
        const eased=1-Math.pow(1-t,1.45),r=7+eased*p.radius,fade=Math.sin(Math.PI*t)*p.strength;
        const grad=waterCtx.createRadialGradient(p.x,p.y,Math.max(1,r-2),p.x,p.y,r+3);
        grad.addColorStop(0,'rgba(220,244,244,0)');grad.addColorStop(.72,'rgba(210,239,239,'+(fade*.10)+')');grad.addColorStop(1,'rgba(242,252,250,'+(fade*.42)+')');
        waterCtx.save();waterCtx.globalAlpha=Math.min(.78,fade*1.15);
        waterCtx.beginPath();waterCtx.arc(p.x,p.y,r,0,Math.PI*2);waterCtx.strokeStyle=grad;waterCtx.lineWidth=2.2;waterCtx.stroke();
        waterCtx.beginPath();waterCtx.arc(p.x-r*.012,p.y-r*.018,r*.94,Math.PI*1.08,Math.PI*1.88);waterCtx.strokeStyle='rgba(255,255,255,'+(fade*.5)+')';waterCtx.lineWidth=.8;waterCtx.stroke();
        waterCtx.beginPath();waterCtx.arc(p.x+r*.01,p.y+r*.012,r*1.055,Math.PI*.08,Math.PI*.78);waterCtx.strokeStyle='rgba(133,183,190,'+(fade*.24)+')';waterCtx.lineWidth=1;waterCtx.stroke();
        waterCtx.restore();
      }
      for(let i=droplets.length-1;i>=0;i--){
        const p=droplets[i];p.y+=p.vy;p.life-=.006;
        if(p.life<=0){droplets.splice(i,1);continue;}
        waterCtx.save();waterCtx.globalAlpha=p.life*.76;
        const g=waterCtx.createRadialGradient(p.x-p.rx*.38,p.y-p.ry*.48,.2,p.x,p.y,p.ry*1.25);
        g.addColorStop(0,'rgba(255,255,255,.98)');g.addColorStop(.22,'rgba(237,250,249,.88)');g.addColorStop(.62,'rgba(180,218,222,.46)');g.addColorStop(1,'rgba(103,158,168,0)');
        waterCtx.fillStyle=g;waterCtx.beginPath();waterCtx.ellipse(p.x,p.y,p.rx,p.ry,-.18,0,Math.PI*2);waterCtx.fill();
        waterCtx.strokeStyle='rgba(239,252,250,.62)';waterCtx.lineWidth=.65;waterCtx.stroke();
        waterCtx.fillStyle='rgba(255,255,255,.9)';waterCtx.beginPath();waterCtx.ellipse(p.x-p.rx*.3,p.y-p.ry*.42,p.rx*.25,p.ry*.16,-.5,0,Math.PI*2);waterCtx.fill();
        waterCtx.restore();
      }
      if(droplets.length||ripples.length)waterFrame=requestAnimationFrame(paintWater);else waterFrame=0;
    };
    const animateWater=()=>{if(!waterFrame)waterFrame=requestAnimationFrame(paintWater);};
    const stopRestore=()=>{if(restoreFrame)cancelAnimationFrame(restoreFrame);restoreFrame=0;restoreTime=0;};
    const restoreMist=now=>{
      if(!ctx||!fog||wiping||!baseFog||!erasedFog){restoreFrame=0;return;}
      if(!restoreTime){restoreTime=now;restoreLast=now;}
      const elapsed=now-restoreTime,rect=portal.getBoundingClientRect(),t=Math.min(1,elapsed/restoreDuration),amount=t*t*(3-2*t);
      ctx.clearRect(0,0,rect.width,rect.height);ctx.drawImage(erasedFog,0,0,rect.width,rect.height);
      ctx.save();ctx.globalAlpha=amount;ctx.drawImage(baseFog,0,0,rect.width,rect.height);ctx.restore();restoreLast=now;
      if(t<1)restoreFrame=requestAnimationFrame(restoreMist);else{
        ctx.clearRect(0,0,rect.width,rect.height);ctx.drawImage(baseFog,0,0,rect.width,rect.height);
        restoreFrame=0;restoreTime=0;restoreLast=0;erasedFog=null;
      }
    };
    if(fog&&ctx){
      sizeCanvases();window.addEventListener('resize',sizeCanvases,{passive:true});
      portal.addEventListener('pointerdown',e=>{
        if(e.button!==undefined&&e.button!==0)return;
        wiping=true;didWipe=false;downPoint=pointFrom(e);lastPoint=downPoint;stopRestore();
      });
      portal.addEventListener('pointermove',e=>{
        const rect=portal.getBoundingClientRect();
        portal.style.setProperty('--pointer-x',((e.clientX-rect.left)/rect.width*100)+'%');
        portal.style.setProperty('--pointer-y',((e.clientY-rect.top)/rect.height*100)+'%');
        if(!wiping)return;
        const next=pointFrom(e),dx=next.x-lastPoint.x,dy=next.y-lastPoint.y;
        if(!didWipe&&Math.hypot(next.x-downPoint.x,next.y-downPoint.y)>4){didWipe=true;eraseAt(downPoint.x,downPoint.y);addWater(downPoint.x,downPoint.y);}
        if(!didWipe)return;
        const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/12));
        for(let i=1;i<=steps;i++){const x=lastPoint.x+dx*i/steps,y=lastPoint.y+dy*i/steps;eraseAt(x,y);if(i===steps||i%4===0)addWater(x,y);}
        lastPoint=next;animateWater();
      },{passive:true});
      const endWipe=()=>{
        if(!wiping)return;wiping=false;lastPoint=null;downPoint=null;
        if(didWipe){erasedFog=document.createElement('canvas');erasedFog.width=fog.width;erasedFog.height=fog.height;erasedFog.getContext('2d').drawImage(fog,0,0);const suppress=e=>{e.preventDefault();e.stopImmediatePropagation();portal.removeEventListener('click',suppress,true);};portal.addEventListener('click',suppress,true);}
        restoreTime=0;restoreLast=0;if(didWipe&&erasedFog)restoreFrame=requestAnimationFrame(restoreMist);
      };
      window.addEventListener('pointerup',endWipe,{passive:true});window.addEventListener('pointercancel',endWipe,{passive:true});
      portal.addEventListener('pointerleave',()=>{portal.style.setProperty('--pointer-x','50%');portal.style.setProperty('--pointer-y','50%');},{passive:true});
      portal.addEventListener('dragstart',e=>e.preventDefault());
    } else {
      portal.addEventListener('pointermove',e=>{const r=portal.getBoundingClientRect();portal.style.setProperty('--pointer-x',((e.clientX-r.left)/r.width*100)+'%');portal.style.setProperty('--pointer-y',((e.clientY-r.top)/r.height*100)+'%');},{passive:true});
    }
  }
  if (portal && portalEnter && stage) {
    const openPortal = () => {
      if (document.body.classList.contains('portal-opened')) return;
      document.body.classList.add('portal-opened');
      window.setTimeout(() => { portal.remove(); }, 1000);
    };
    portalEnter.addEventListener('click', openPortal);
    portalSkip?.addEventListener('click', openPortal);
  }
  const wakeButton = $('#wakeCharacter');
  const transition = $('#ukiyoTransition');
  const world = $('#homeWorld');
  if (!stage || !wakeButton || !transition || !world) return;
  let started = false;
  wakeButton.addEventListener('click', () => {
    if (started) return;
    started = true;
    document.body.classList.add('intro-waking');
    $('#introHint')?.classList.add('hidden');
    wakeButton.setAttribute('aria-label', '旅人已醒來');
    window.setTimeout(() => {
      document.body.classList.add('intro-leaving');
      transition.classList.add('active');
      transition.setAttribute('aria-hidden', 'false');
    }, 1650);
    window.setTimeout(() => {
      world.classList.add('entered');
      world.setAttribute('aria-hidden', 'false');
    }, 4050);
    window.setTimeout(() => {
      stage.remove();
      transition.remove();
      document.body.classList.remove('intro-waking', 'intro-leaving');
    }, 5650);
  });

  const door = $('#openDoor');
  const room = $('#roomInterior');
  const returnDoor = $('#roomReturn');
  door?.addEventListener('click', () => {
    if (!room || room.classList.contains('room-opening') || room.classList.contains('room-visible')) return;
    door.classList.add('door-opening');
    world.classList.add('door-opened');
    window.setTimeout(() => {
      room.classList.add('room-opening');
      room.setAttribute('aria-hidden', 'false');
    }, 420);
    window.setTimeout(() => {
      room.classList.add('room-visible');
      room.classList.remove('room-opening');
      world.classList.add('inside-room');
    }, 1500);
  });
  returnDoor?.addEventListener('click', () => {
    if (!room) return;
    room.classList.remove('room-visible');
    room.classList.add('room-closing');
    world.classList.remove('inside-room', 'door-opened');
    window.setTimeout(() => {
      room.classList.remove('room-closing', 'room-opening');
      room.setAttribute('aria-hidden', 'true');
      door?.classList.remove('door-opening');
    }, 1050);
  });
}

async function init() {
  const page = document.body.dataset.page;
  if (page === 'home') {
    initHomeIntro();
    return;
  }
  createParticles();

  // 頁面初次進場時，所有標示 ui-fade-panel 的區塊會淡入
  $$('.ui-fade-panel').forEach((el) => activateFadeIn(el));

  if (page === 'works') await renderWorks();
  if (page === 'work') await renderWorkPage();
  if (page === 'character') await renderCharacterPage();
  if (page === 'characters') await renderCharactersPage();
  if (page === 'gallery') await renderGallery();
  if (page === 'profile') await renderProfile();
  if (page === 'faq') await renderFaq();
}

init();
