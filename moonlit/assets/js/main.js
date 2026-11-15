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
  const grid = $('#workMap'), filters = $('#workFilters');
  if (!grid || !filters) return;
  const categories = ['全部', ...new Set(works.flatMap(w => w.tags || w.categories || ['原創']))];
  filters.innerHTML = categories.map((tag,i)=>`<button type="button" class="${i===0?'active':''}" data-filter="${tag}">${tag}</button>`).join('');
  const render = (filter='全部') => {
    const visible = works.filter(w => filter==='全部' || (w.tags || w.categories || ['原創']).includes(filter));
    grid.innerHTML = visible.map((w,index)=> {
      const cover = w.cover || 'assets/images/ukiyo-valley.webp';
      const tags = (w.tags || w.categories || ['原創']).slice(0,2);
      return `<a class="atlas-work-card" href="work.html?id=${encodeURIComponent(w.id)}" style="animation:fadeUpIn .55s ${index*70}ms both">
        <div class="work-cover"><img src="${cover}" alt="${w.title}作品封面" loading="lazy"><div class="work-tags">${tags.map(t=>`<span>${t}</span>`).join('')}</div></div>
        <div class="work-card-body"><h3>${w.title}</h3><span class="work-en">${w.subtitle || 'Original World'}</span><p>${w.shortDescription || '一段等待被探索的故事。'}</p><span class="work-explore">探索世界　◇</span></div>
      </a>`;
    }).join('') || '<p class="atlas-loading">此分類尚未收錄作品。</p>';
  };
  filters.addEventListener('click',e=>{const btn=e.target.closest('button[data-filter]');if(!btn)return;filters.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));render(btn.dataset.filter);});
  render();
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
  if (!board) return;
  board.innerHTML = works.map(work => {
    const cards = (work.characters || []).map(character => {
      const tags = Array.isArray(character.tags) ? character.tags : [];
      const description = character.summary || character.description || character.quote || '故事仍在書寫，更多人物資訊將陸續公開。';
      return `<a class="atlas-character-card" href="character.html?id=${encodeURIComponent(character.id)}&work=${encodeURIComponent(work.id)}">
        <div class="character-portrait"><img src="${character.avatar || character.full}" alt="${character.name}" loading="lazy"></div>
        <div class="character-card-info"><h4>${character.name}</h4><div class="character-tags">${tags.slice(0,3).map(t=>`<span>${t}</span>`).join('')}</div><p>${description}</p><span class="character-more">查看人物誌　→</span></div>
      </a>`;
    }).join('');
    return `<section class="atlas-character-group"><h3>${work.title} <small>/ ${work.subtitle || ''}</small></h3><div class="atlas-character-grid">${cards || '<p class="atlas-loading">此世界的角色資料尚待補充。</p>'}</div></section>`;
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


/** 首頁：濕潤玻璃雨幕 → 三座仙境入口 */
function initHomeIntro() {
  const portal=$('#portalScreen'),enter=$('#portalEnter'),world=$('#homeWorld');
  if(!portal||!world)return;
  const fog=$('#portalFog'),rain=$('#portalRain'),water=$('#portalWater'),worldRain=$('#worldRain'),worldWater=$('#worldWater');
  const fogCtx=fog?.getContext('2d'),rainCtx=rain?.getContext('2d'),waterCtx=water?.getContext('2d'),worldRainCtx=worldRain?.getContext('2d'),worldWaterCtx=worldWater?.getContext('2d');
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w=0,h=0,dpr=1,raf=0,wiping=false,moved=false,start=null,last=null,restoreCanvas=null,restoreAt=0,lastRestoreFrame=0,lastRipple=0;
  const drops=[],worldDrops=[],ripples=[],lakeRipples=[];
  const rand=(a,b)=>a+Math.random()*(b-a);
  const point=e=>{const r=portal.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  const newDrop=(initial=false)=>({x:rand(0,w),y:initial?rand(0,h):rand(-h*.25,-12),r:rand(2.8,7.8),speed:rand(.18,.72),slide:rand(-.18,.18),phase:rand(0,6.28),alpha:rand(.28,.62),trail:rand(12,42)});
  function sizeCanvas(c){
    if(!c)return;const r=c.getBoundingClientRect(),cw=Math.max(1,r.width||w),ch=Math.max(1,r.height||h);
    c.width=Math.round(cw*dpr);c.height=Math.round(ch*dpr);c.style.width=cw+'px';c.style.height=ch+'px';
    const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
  }
  function resize(){
    const r=portal.getBoundingClientRect();w=r.width||innerWidth;h=r.height||innerHeight;dpr=Math.min(devicePixelRatio||1,1.35);
    [fog,rain,water,worldRain,worldWater].forEach(sizeCanvas);
    if(fogCtx){
      fogCtx.clearRect(0,0,w,h);const g=fogCtx.createLinearGradient(0,0,w,h);
      g.addColorStop(0,'rgba(219,241,242,.075)');g.addColorStop(.5,'rgba(204,230,235,.055)');g.addColorStop(1,'rgba(224,241,240,.09)');
      fogCtx.fillStyle=g;fogCtx.fillRect(0,0,w,h);
      fogCtx.save();fogCtx.filter='blur(34px)';
      [[.13,.2,190,.07],[.76,.27,230,.07],[.42,.79,270,.075],[.9,.82,180,.06]].forEach(([x,y,r,a])=>{const q=fogCtx.createRadialGradient(w*x,h*y,0,w*x,h*y,r);q.addColorStop(0,'rgba(235,249,248,'+a+')');q.addColorStop(1,'rgba(235,249,248,0)');fogCtx.fillStyle=q;fogCtx.fillRect(w*x-r,h*y-r,r*2,r*2);});
      fogCtx.restore();
    }
    drops.length=0;worldDrops.length=0;for(let i=0;i<45;i++){drops.push(newDrop(true));worldDrops.push(newDrop(true));}
  }
  function bead(ctx,d,t){
    const x=d.x+Math.sin(t*.00025+d.phase)*1.3,y=d.y,r=d.r;
    ctx.save();ctx.globalAlpha=d.alpha;
    const g=ctx.createRadialGradient(x-r*.38,y-r*.5,.2,x,y,r*1.55);
    g.addColorStop(0,'rgba(255,255,255,.98)');g.addColorStop(.18,'rgba(246,255,255,.84)');g.addColorStop(.48,'rgba(197,233,237,.34)');g.addColorStop(.82,'rgba(114,174,186,.13)');g.addColorStop(1,'rgba(90,145,157,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r*.72,r*1.22,-.12,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(248,255,255,.68)';ctx.lineWidth=.8;ctx.stroke();
    ctx.strokeStyle='rgba(90,142,154,.22)';ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(x+r*.1,y+r*.12,r*.62,r*1.05,.12,.3,2.7);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.94)';ctx.beginPath();ctx.ellipse(x-r*.22,y-r*.48,r*.2,r*.1,-.45,0,Math.PI*2);ctx.fill();
    if(r>5){ctx.globalAlpha*=.45;ctx.strokeStyle='rgba(244,255,255,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+r);ctx.bezierCurveTo(x-1,y+r+8,x+2,y+r+16,x+d.slide*10,y+r+d.trail);ctx.stroke();}
    ctx.restore();
  }
  function drawRain(ctx,t,list){
    if(!ctx)return;ctx.clearRect(0,0,w,h);
    for(const d of list){d.y+=d.speed;d.x+=d.slide*.14;if(d.y>h+55)Object.assign(d,newDrop());bead(ctx,d,t);}
    ctx.save();ctx.lineCap='round';
    for(let i=0;i<52;i++){
      const x=(i*139.7+t*.012)%w,y=(i*91.3+t*.075)%(h+60)-30,len=rand(8,23);
      ctx.strokeStyle='rgba(237,252,252,'+(i%4===0?.31:.17)+')';ctx.lineWidth=i%5===0?1.05:.65;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y+len);ctx.stroke();
    }
    ctx.restore();
  }
  function ripple(ctx,p,t){
    const k=(t-p.t)/1550;if(k>=1)return false;
    const radius=5+k*p.r,fade=Math.sin(Math.PI*k)*p.power;
    ctx.save();ctx.globalAlpha=fade*.7;ctx.strokeStyle='rgba(244,255,255,.82)';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(p.x,p.y,radius,radius*.25,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=fade*.28;ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(p.x,p.y,radius*1.38,radius*.39,0,0,Math.PI*2);ctx.stroke();ctx.restore();return true;
  }
  function drawRipples(ctx,list,t){if(!ctx)return;ctx.clearRect(0,0,w,h);for(let i=list.length-1;i>=0;i--)if(!ripple(ctx,list[i],t))list.splice(i,1);}
  function erase(x,y){
    if(!fogCtx)return;fogCtx.save();fogCtx.globalCompositeOperation='destination-out';
    const g=fogCtx.createRadialGradient(x,y,5,x,y,50);g.addColorStop(0,'rgba(0,0,0,.86)');g.addColorStop(.72,'rgba(0,0,0,.62)');g.addColorStop(1,'rgba(0,0,0,0)');
    fogCtx.fillStyle=g;fogCtx.beginPath();fogCtx.arc(x,y,50,0,Math.PI*2);fogCtx.fill();fogCtx.restore();
  }
  function restore(t){
    if(!restoreCanvas||!fogCtx)return;
    if(t-lastRestoreFrame<50){requestAnimationFrame(restore);return;}lastRestoreFrame=t;
    const p=Math.min(1,(t-restoreAt)/6200),ease=p*p*(3-2*p);
    fogCtx.clearRect(0,0,w,h);fogCtx.drawImage(restoreCanvas,0,0,w,h);
    fogCtx.save();fogCtx.globalAlpha=ease;fogCtx.drawImage(fogBase,0,0,w,h);fogCtx.restore();
    if(p<1)requestAnimationFrame(restore);else restoreCanvas=null;
  }
  let fogBase=null;
  function saveBase(){if(!fog)return;fogBase=document.createElement('canvas');fogBase.width=fog.width;fogBase.height=fog.height;fogBase.getContext('2d').drawImage(fog,0,0);}
  function animate(t){
    drawRain(rainCtx,t,drops);drawRain(worldRainCtx,t,worldDrops);
    drawRipples(waterCtx,ripples,t);drawRipples(worldWaterCtx,lakeRipples,t);
    if(t>lastRipple){lakeRipples.push({x:rand(w*.12,w*.9),y:rand(h*.7,h*.95),t,r:rand(18,48),power:rand(.16,.28)});lastRipple=t+rand(2300,4800);}
    raf=requestAnimationFrame(animate);
  }
  resize();saveBase();window.addEventListener('resize',()=>{resize();saveBase();},{passive:true});
  if(!reduceMotion)raf=requestAnimationFrame(animate);else{drawRain(rainCtx,0,drops);drawRain(worldRainCtx,0,worldDrops);}
  portal.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a'))return;wiping=true;moved=false;start=last=point(e);},{passive:true});
  portal.addEventListener('pointermove',e=>{
    if(!wiping)return;const p=point(e),dx=p.x-last.x,dy=p.y-last.y,dist=Math.hypot(dx,dy);
    if(!moved&&Math.hypot(p.x-start.x,p.y-start.y)>8){moved=true;erase(start.x,start.y);}
    if(moved&&dist>2){const steps=Math.min(3,Math.ceil(dist/24));for(let i=1;i<=steps;i++)erase(last.x+dx*i/steps,last.y+dy*i/steps);const now=performance.now();if(now-lastRipple>120){ripples.push({x:p.x,y:p.y,t:now,r:rand(18,30),power:.22});lastRipple=now;}}
    last=p;
  },{passive:true});
  const stop=()=>{if(!wiping)return;wiping=false;if(moved&&fog){restoreCanvas=document.createElement('canvas');restoreCanvas.width=fog.width;restoreCanvas.height=fog.height;restoreCanvas.getContext('2d').drawImage(fog,0,0);restoreAt=performance.now();lastRestoreFrame=0;requestAnimationFrame(restore);}start=last=null;};
  window.addEventListener('pointerup',stop,{passive:true});window.addEventListener('pointercancel',stop,{passive:true});
  const open=()=>{if(document.body.classList.contains('portal-opened'))return;document.body.classList.add('portal-opened');world.classList.add('entered');world.setAttribute('aria-hidden','false');};
  enter?.addEventListener('click',open);
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
