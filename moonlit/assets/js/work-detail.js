(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const params=new URLSearchParams(location.search);
const workId=params.get('id')||'LoveOverImmortality';
const requestedTab=params.get('tab')||'characters';
const PAGE_SIZE=4;
const state={work:null,allCharacters:[],filter:'全部',page:1,locked:false,initialRendered:false};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const safe=(v)=>String(v==null?'':v);
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el}
function getCategory(char){return char.category||char.roleCategory||(Array.isArray(char.tags)&&char.tags.includes('主角線')?'主要角色':'其他角色')}
function categoryList(){return ['全部','主要角色','重要角色','其他角色','未分類'].filter(c=>c==='全部'||state.allCharacters.some(x=>c==='未分類'?!getCategory(x):getCategory(x)===c))}
function filteredChars(){return state.allCharacters.filter(c=>state.filter==='全部'||(state.filter==='未分類'?!getCategory(c):getCategory(c)===state.filter))}
function getCardSummary(c){return c.summary||c.description||c.quote||(Array.isArray(c.basic)?c.basic[0]:'角色故事尚待補充。')||'角色故事尚待補充。'}
function placeholderCard(){
 const card=node('article','role-placeholder');
 const inner=node('div','');
 inner.append(node('div','placeholder-emblem','✧'),node('b','','新角色預留位置'),node('small','','CHARACTER COMING SOON'));
 card.appendChild(inner);return card;
}
function renderRoleFilters(){
 const wrap=$('#roleFilters');wrap.replaceChildren();
 categoryList().forEach(cat=>{
  const b=node('button',cat===state.filter?'active':'',cat);b.type='button';b.dataset.category=cat;b.setAttribute('aria-pressed',cat===state.filter?'true':'false');wrap.appendChild(b);
 });
}
function createRoleCard(char){
 const a=node('a','role-card');a.href='character.html?id='+encodeURIComponent(char.id)+'&work='+encodeURIComponent(state.work.id);
 const frame=node('div','role-portrait');
 const img=document.createElement('img');img.src=char.full||char.avatar||state.work.cover||'images/characters/main.png';img.alt=(char.name||'角色')+'半身立繪';img.loading='lazy';img.decoding='async';frame.appendChild(img);
 const body=node('div','role-card-body');body.appendChild(node('h3','',char.name||'未命名角色'));
 const tags=node('div','role-tags');
 (Array.isArray(char.tags)?char.tags:[]).slice(0,3).forEach(t=>tags.appendChild(node('span','',t)));
 if(tags.childElementCount)body.appendChild(tags);
 body.appendChild(node('p','',getCardSummary(char)));
 body.appendChild(node('span','role-more','查看更多　→'));
 a.append(frame,body);return a;
}
function renderPagination(total){
 const wrap=$('#rolePagination');wrap.replaceChildren();
 const pageCount=Math.max(1,Math.ceil(total/PAGE_SIZE));
 const prev=node('button','arrow','←');prev.type='button';prev.dataset.page=String(state.page-1);prev.disabled=state.page<=1;prev.setAttribute('aria-label','上一頁');wrap.appendChild(prev);
 for(let i=1;i<=pageCount;i++){const b=node('button',i===state.page?'active':'',String(i));b.type='button';b.dataset.page=String(i);b.setAttribute('aria-current',i===state.page?'page':'false');wrap.appendChild(b)}
 const next=node('button','arrow','→');next.type='button';next.dataset.page=String(state.page+1);next.disabled=state.page>=pageCount;next.setAttribute('aria-label','下一頁');wrap.appendChild(next);
}
function renderCharacters(direction=0){
 const chars=filteredChars();const count=Math.max(1,Math.ceil(chars.length/PAGE_SIZE));state.page=Math.min(Math.max(1,state.page),count);
 const start=(state.page-1)*PAGE_SIZE;const items=chars.slice(start,start+PAGE_SIZE);
 const grid=$('#roleGrid');grid.replaceChildren();
 items.forEach(c=>grid.appendChild(createRoleCard(c)));
 if(items.length<PAGE_SIZE&&state.page===1){for(let i=items.length;i<PAGE_SIZE;i++)grid.appendChild(placeholderCard())}
 if(!items.length){grid.appendChild(node('p','story-loading','此分類目前尚未新增角色。'))}
 $('#characterCount').textContent=state.allCharacters.length+' CHARACTERS';
 if(direction&&!reduced){
  grid.classList.remove('roles-enter-left','roles-enter-right');void grid.offsetWidth;
  grid.classList.add(direction>0?'roles-enter-right':'roles-enter-left');
  setTimeout(()=>grid.classList.remove('roles-enter-left','roles-enter-right'),700);
 }else if(!state.initialRendered&&!reduced){
  grid.classList.remove('roles-arrive');void grid.offsetWidth;
  grid.classList.add('roles-arrive');
  setTimeout(()=>grid.classList.remove('roles-arrive'),1500);
  state.initialRendered=true;
 }
 renderPagination(count);observeCards();
}
function observeCards(){
 const cards=[...document.querySelectorAll('.role-card')];
 if(!('IntersectionObserver'in window)){cards.forEach(c=>c.classList.add('is-visible'));return}
 const ob=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-visible',e.isIntersecting)),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
 cards.forEach(c=>ob.observe(c));
}
function renderWorld(){
 const world=state.work.world||{};
 const sections=Array.isArray(world.sections)&&world.sections.length?world.sections:[
  {title:'世界概述',content:world.basic},{title:'居民與族群',content:world.races},{title:'勢力關係',content:world.factions},{title:'時代背景',content:world.timeline}
 ].filter(x=>x.content);
 const wrap=$('#worldSections');wrap.replaceChildren();
 (sections.length?sections:[{title:'世界設定',content:'此作品的世界觀資料尚待補充。'}]).forEach((s,i)=>{
  const card=node('article','world-section-card');card.append(node('span','info-card-mark',String(i+1).padStart(2,'0')),node('h3','',s.title||'設定'),node('p','',s.content||'內容待補充。'));wrap.appendChild(card);
 });
}
function renderMap(){
 const wrap=$('#storyMapWrap');wrap.replaceChildren();
 const map=state.work.map||{};const img=document.createElement('img');
 img.className='story-map-image';img.src=map.image||'images/bg/main.jpg';img.alt=state.work.title+'地圖';img.loading='lazy';wrap.appendChild(img);
 const locations=Array.isArray(map.locations)?map.locations:[];
 if(!locations.length){$('#mapLocationDetail').textContent='此作品的地圖標記資料尚待補充。';return}
 locations.forEach((loc,i)=>{
  const pin=node('button','map-pin',String(i+1));pin.type='button';pin.style.left=(loc.pos?.x||50)+'%';pin.style.top=(loc.pos?.y||50)+'%';pin.title=loc.name||'地點';
  pin.addEventListener('click',()=>{
   wrap.querySelectorAll('.map-pin').forEach(x=>x.classList.toggle('active',x===pin));
   const detail=$('#mapLocationDetail');detail.replaceChildren(node('b','',loc.name||'未命名地點'),node('br',''),node('span','',loc.description||'地點介紹待補充。'));
   if(loc.backdrop)detail.append(node('br',''),node('small','', '場景：'+loc.backdrop));
  });wrap.appendChild(pin);
 });
}
function tabIntro(key){
 const world=state.work.world||{},map=state.work.map||{},locations=Array.isArray(map.locations)?map.locations:[];
 const firstWorld=(Array.isArray(world.sections)?world.sections:[]).find(x=>x&&x.content&&x.content!=='待新增')?.content||world.basic;
 const desc={
  characters:state.work.shortDescription||'每一段故事，都因相遇而有了形狀。',
  world:firstWorld&&firstWorld!=='待新增'?firstWorld:'此作品的世界觀資料尚待補充。',
  map:locations.length?('地圖收錄 '+locations.length+' 處探索地點，點選標記即可查看各處的場景與介紹。'):'此作品的地圖節點尚待補充。'
 }[key];
 const copy={characters:{kicker:'THE SOULS WITHIN EACH STORY',title:'角色介紹',english:'CHARACTER'},
  world:{kicker:'WORLD LORE',title:'世界觀介紹',english:'WORLD LORE'},
  map:{kicker:'EXPLORE THE WORLD',title:'地圖探索',english:'WORLD MAP'}}[key];
 $('#introKicker').textContent=copy.kicker;
 $('#introTitle').textContent=copy.title;
 $('#introEnglish').textContent=copy.english;
 $('#workTitle').textContent=state.work.title||'作品世界';
 $('#workSubtitle').textContent=state.work.subtitle||'';
 $('#workDescription').textContent=desc;
}
function activateTab(key,updateUrl=true,animateIntro=true){
 const valid=['world','map','characters'];if(!valid.includes(key))key='characters';
 const current=document.querySelector('.story-panel:not(.is-hidden)');
 $('#storyTabs').querySelectorAll('button').forEach(b=>{const active=b.dataset.tab===key;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});
 ['world','map','characters'].forEach(k=>$('#panel-'+k).classList.toggle('is-hidden',k!==key));
 if(animateIntro&&!reduced){
  const copy=$('#introCopy');copy.classList.add('is-changing');
  setTimeout(()=>{tabIntro(key);copy.classList.remove('is-changing')},170);
 }else tabIntro(key);
 const panel=$('#panel-'+key);
 if(panel!==current&&!reduced){panel.classList.remove('panel-enter');void panel.offsetWidth;panel.classList.add('panel-enter');setTimeout(()=>panel.classList.remove('panel-enter'),1150)}
 if(updateUrl){const p=new URLSearchParams(location.search);p.set('tab',key);history.replaceState(null,'',location.pathname+'?'+p.toString())}
}
$('#storyTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(b)activateTab(b.dataset.tab)});
$('#roleFilters').addEventListener('click',e=>{
 const b=e.target.closest('button[data-category]');if(!b)return;
 state.filter=b.dataset.category;state.page=1;
 $('#roleFilters').querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b?'true':'false')});
 renderCharacters();
});
$('#rolePagination').addEventListener('click',e=>{
 const b=e.target.closest('button[data-page]');if(!b||b.disabled||state.locked)return;
 const target=Number(b.dataset.page),count=Math.max(1,Math.ceil(filteredChars().length/PAGE_SIZE));
 if(target<1||target>count||target===state.page)return;
 state.locked=true;const direction=target>state.page?1:-1;const grid=$('#roleGrid');grid.style.opacity='0';grid.style.transform='translateX('+(direction>0?'-28px':'28px')+')';
 setTimeout(()=>{state.page=target;renderCharacters(direction);grid.style.opacity='';grid.style.transform='';state.locked=false},220);
});
async function init(){
 try{
  const response=await fetch('./data/works.json',{cache:'no-cache'});if(!response.ok)throw new Error('資料讀取失敗');
  const data=await response.json();state.work=(data.works||[]).find(w=>w.id===workId)||(data.works||[])[0];
  if(!state.work)throw new Error('沒有作品資料');
  state.allCharacters=Array.isArray(state.work.characters)?state.work.characters:[];
  document.title=(state.work.title||'作品')+'｜角色介紹';
  $('#workTitle').textContent=state.work.title||'作品世界';
  $('#workSubtitle').textContent=state.work.subtitle||'';
  renderFiltersAndContent();
  activateTab(requestedTab,false,false);
 }catch(error){
  $('#workTitle').textContent='作品資料暫時無法載入';
  $('#workDescription').textContent='請返回作品一覽，稍後再試。';
  $('#roleGrid').replaceChildren(node('p','story-loading','目前無法讀取作品資料。'));
 }
}
function renderFiltersAndContent(){renderRoleFilters();renderCharacters();renderWorld();renderMap()}
init();

const petalCanvas=document.querySelector('.story-petals'),ctx=petalCanvas.getContext('2d',{alpha:true}),reducedMotion=reduced;
let w=0,h=0,dpr=1,petals=[],last=0;
const rand=(a,b)=>a+Math.random()*(b-a);
function resize(){
 w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.35);petalCanvas.width=Math.round(w*dpr);petalCanvas.height=Math.round(h*dpr);petalCanvas.style.width=w+'px';petalCanvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
 petals=Array.from({length:16},()=>({x:rand(0,w),y:rand(0,h),s:rand(3,6),v:rand(.18,.42),d:rand(-.15,.15),a:rand(.25,.58),r:rand(0,6.28),t:rand(-.01,.01),p:rand(0,6.28)}));
}
function drawPetal(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=p.a;for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);const g=ctx.createLinearGradient(0,-p.s,0,0);g.addColorStop(0,'rgba(255,247,249,.94)');g.addColorStop(.7,'rgba(246,190,211,.78)');g.addColorStop(1,'rgba(224,151,183,.4)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-p.s*.45,-p.s*.2,-p.s*.5,-p.s*.8,0,-p.s);ctx.bezierCurveTo(p.s*.5,-p.s*.8,p.s*.45,-p.s*.2,0,0);ctx.fill();ctx.restore()}ctx.restore()}
function animate(t){if(t-last<32){requestAnimationFrame(animate);return}last=t;ctx.clearRect(0,0,w,h);petals.forEach(p=>{drawPetal(p);p.y+=p.v;p.x+=p.d+Math.sin(t*.0005+p.p)*.1;p.r+=p.t;if(p.y>h+15){p.y=-15;p.x=rand(0,w)}});requestAnimationFrame(animate)}
resize();window.addEventListener('resize',resize,{passive:true});if(!reducedMotion)requestAnimationFrame(animate);
})();