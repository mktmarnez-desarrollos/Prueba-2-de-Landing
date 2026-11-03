const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#proposal-menu');
const menuCopy=menu.querySelector('[data-copy]');const menuLabel=menuCopy?.textContent||menu.textContent;
function closeMenu(){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});matchMedia('(min-width:701px)').addEventListener('change',e=>{if(e.matches)closeMenu()});
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
if(!reduce&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);const el=entry.target.querySelector('[data-copy]')||entry.target,original=el.textContent.trim();if(!/^\+?[\d,]+(?:\.\d+)?$/.test(original))continue;const end=Number(original.replace(/[+,]/g,'')),decimals=original.includes('.')?original.split('.')[1].length:0,start=performance.now();function tick(now){const progress=Math.min((now-start)/1400,1);el.textContent=progress===1?original:(original.startsWith('+')?'+':'')+(end*(1-Math.pow(1-progress,3))).toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});if(progress<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)}},{threshold:.5});document.querySelectorAll('[data-count]').forEach(el=>observer.observe(el))}
const floating=document.querySelector('.floating-booking'),heroButton=document.querySelector('[data-cta-location="inicio"]'),closing=document.querySelector('#contacto');
let raf=false;
function floatingState(){raf=false;const show=scrollY>25;floating.classList.toggle('visible',show);floating.inert=!show;observeJourney()}
function scrollUpdate(){if(!raf){raf=true;requestAnimationFrame(floatingState)}}
window.addEventListener('scroll',scrollUpdate,{passive:true});window.addEventListener('resize',scrollUpdate);
// Anonymous, cumulative page snapshots; no keystrokes, identity, IP or external referrer.
const visit=crypto.randomUUID(),sectionElements=[...document.querySelectorAll('section[data-track-section]')];const reached=new Set(),clicks={};let last='inicio',depth=0,sequence=0,timer=null,dirty=false;
function queueJourney(){return;dirty=true;if(!timer)timer=setTimeout(()=>flushJourney('visible'),1200)}
function observeJourney(){if(document.visibilityState!=='visible')return;let nearest=null,distance=Infinity;for(const el of sectionElements){const r=el.getBoundingClientRect(),visible=Math.min(r.bottom,innerHeight)-Math.max(r.top,0);if(visible>=Math.min(150,r.height*.2)&&!reached.has(el.id)){reached.add(el.id);queueJourney()}if(visible>0){const d=Math.abs(Math.max(r.top,0)-innerHeight*.25);if(d<distance){distance=d;nearest=el.id}}}if(nearest&&nearest!==last){last=nearest;queueJourney()}const current=Math.min(100,Math.floor(((scrollY+innerHeight)/Math.max(document.documentElement.scrollHeight,innerHeight))*20)*5);if(current>depth){depth=current;queueJourney()}}
function flushJourney(reason){return;clearTimeout(timer);timer=null;if(!dirty&&reason==='visible')return;dirty=false;const body=JSON.stringify({visit,seq:++sequence,sections:[...reached],last,depth,clicks,reason});try{const blob=new Blob([body],{type:'application/json'});if(!navigator.sendBeacon?.('/api/engagement',blob))void fetch('/api/engagement',{method:'POST',body,headers:{'Content-Type':'application/json'},keepalive:true}).catch(()=>{})}catch{}}
function bookingClick(e){if(e.type==='auxclick'&&e.button!==1)return;const a=e.target.closest('a[data-cta-location]');if(!a)return;const id=a.dataset.ctaLocation;clicks[id]=Math.min(100,(clicks[id]||0)+1);observeJourney();flushJourney('calendly')}
document.addEventListener('click',bookingClick);document.addEventListener('auxclick',bookingClick);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushJourney('hidden');else{observeJourney();queueJourney()}});window.addEventListener('pagehide',()=>flushJourney('pagehide'));window.addEventListener('pageshow',()=>{observeJourney();queueJourney()});floatingState();queueJourney();

const lotSelector=document.getElementById('lots');
function updateProjection(){
 const valueIds={'3':'manual-v4-copy-066','4':'manual-v4-copy-068','5':'manual-v4-copy-070'};
 document.getElementById('projection-total').value=document.querySelector('[data-copy="'+valueIds[lotSelector.value]+'"]').textContent;
}
lotSelector.addEventListener('change',updateProjection);
updateProjection();
