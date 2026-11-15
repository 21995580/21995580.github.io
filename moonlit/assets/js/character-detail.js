(() => {
'use strict';
const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search),charId=params.get('id')||'',workId=params.get('work')||'';
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
function fieldFromBasic(basic,label){if(!Array.isArray(basic))return '';const line=basic.find(x=>String(x).trim().startsWith(label));return line?String(line).replace(/^.*?[：:]/,'').trim():''}
function fillFacts(char){
 const basic=Array.isArray(char.basic)?char.basic:[];
 const values=[
  ['姓名',char.name||''],['種族',char.species||fieldFromBasic(basic,'種族')||'待補充'],
  ['年齡',fieldFromBasic(basic,'年齡')||char.age||'待補充'],
  ['身分',fieldFromBasic(basic,'身份')||char.identity||'待補充'],
  ['身高',fieldFromBasic(basic,'身高')||'待補充'],
  ['陣營',fieldFromBasic(basic,'陣營')||'待補充']
 ];
 const dl=$('#characterFacts');dl.replaceChildren();
 values.forEach(([k,v])=>{const wrap=node('div','character-fact');wrap.append(node('dt','',k),node('dd','',v));dl.appendChild(wrap)});
}
function createOther(char,work){
 const a=node('a','other-character-link');a.href='character.html?id='+encodeURIComponent(char.id)+'&work='+encodeURIComponent(work.id);
 const img=document.createElement('img');img.src=char.avatar||char.full||'images/characters/main.png';img.alt='';
 a.append(img,node('span','',char.name||'未命名角色'));return a;
}
async function init(){
 try{
  const response=await fetch('./data/works.json',{cache:'no-cache'});if(!response.ok)throw new Error('資料讀取失敗');
  const data=await response.json();const works=data.works||[];
  const work=works.find(w=>w.id===workId)||works[0];
  if(!work)throw new Error('作品不存在');
  const character=(work.characters||[]).find(c=>c.id===charId);
  if(!character)throw new Error('角色不存在');
  document.title=(character.name||'角色')+'｜角色檔案';
  $('#backToWork').href='work.html?id='+encodeURIComponent(work.id)+'&tab=characters';
  $('#backToWork').textContent='← 返回 '+(work.title||'作品');
  $('#characterName').textContent=character.name||'未命名角色';
  $('#characterEn').textContent=character.subtitle||'CHARACTER PROFILE';
  $('#characterQuote').textContent=character.quote?'「'+character.quote+'」':'角色語錄尚待補充。';
  $('#characterFullArt').src=character.full||character.avatar||work.cover||'images/characters/main.png';
  $('#characterFullArt').alt=(character.name||'角色')+'全身立繪';
  $('#portraitCaption').textContent=character.name||'';
  const tags=$('#characterTags');(Array.isArray(character.tags)?character.tags:[]).forEach(t=>tags.appendChild(node('span','',t)));
  fillFacts(character);
  const info=character.info||{};
  $('#characterBackground').textContent=info.background?.content||character.background||'角色背景故事尚待補充。';
  $('#characterPersonality').textContent=info.personality?.content||character.personality||'性格設定尚待補充。';
  const rel=character.relationships||info.relationships?.content||'角色關係尚待補充。';
  $('#characterRelationships').textContent=Array.isArray(rel)?rel.join('、'):rel;
  if(character.playUrl){const link=$('#characterPlay');link.href=character.playUrl;link.classList.remove('is-hidden')}
  const others=$('#otherCharacters');others.replaceChildren();
  (work.characters||[]).filter(c=>c.id!==character.id).forEach(c=>others.appendChild(createOther(c,work)));
  if(!others.childElementCount)others.appendChild(node('p','', '此作品目前沒有其他已登錄角色。'));
 }catch(error){
  $('#characterName').textContent='角色資料暫時無法載入';
  $('#characterBackground').textContent='請返回作品頁面重新選擇角色。';
 }
}
init();

const canvas=document.querySelector('.story-petals'),ctx=canvas.getContext('2d',{alpha:true}),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let w=0,h=0,d=1,petals=[],last=0;const rand=(a,b)=>a+Math.random()*(b-a);
function resize(){w=innerWidth;h=innerHeight;d=Math.min(devicePixelRatio||1,1.3);canvas.width=w*d;canvas.height=h*d;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);petals=Array.from({length:13},()=>({x:rand(0,w),y:rand(0,h),s:rand(3,6),v:rand(.16,.38),dx:rand(-.14,.14),a:rand(.2,.48),r:rand(0,6),t:rand(-.01,.01),p:rand(0,6)}))}
function draw(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=p.a;for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);ctx.fillStyle='rgba(250,211,226,.78)';ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-p.s*.45,-p.s*.2,-p.s*.5,-p.s*.8,0,-p.s);ctx.bezierCurveTo(p.s*.5,-p.s*.8,p.s*.45,-p.s*.2,0,0);ctx.fill();ctx.restore()}ctx.restore()}
function animate(t){if(t-last<34){requestAnimationFrame(animate);return}last=t;ctx.clearRect(0,0,w,h);petals.forEach(p=>{draw(p);p.y+=p.v;p.x+=p.dx+Math.sin(t*.0006+p.p)*.08;p.r+=p.t;if(p.y>h+20){p.y=-20;p.x=rand(0,w)}});requestAnimationFrame(animate)}
resize();addEventListener('resize',resize,{passive:true});if(!reduce)requestAnimationFrame(animate);
})();