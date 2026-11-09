'use strict';
import { WORLD_W, WORLD_H, paintWorld, paintForeground } from './garden-world.js';

export const GARDEN_WIDTH = WORLD_W;
export const GARDEN_HEIGHT = WORLD_H;

const PALETTES = {
  pink: ['#ffb3c4', '#ed73a7', '#eeb1d7'],
  gold: ['#ffe7a2', '#f8bd5c', '#fba96d'],
  violet: ['#b3d8fd', '#9783e9', '#d9afea'],
};
const NAMES = ['Alba', 'Marea', 'Sole', 'Gentile', 'Aurora', 'Petalo', 'Corallo', 'Luce', 'Nuvola', 'Sogno', 'Edera', 'Gioia', 'Viola', 'Brezza', 'Rugiada', 'Fiaba', 'Miraggio', 'Luna', 'Vento', 'Stella', 'Primula', 'Dalia', 'Anemone', 'Farfalla', 'Zefiro', 'Iris', 'Lilla', 'Gelsomino'];
const hash = (i) => { let x = (i + 1773) * 214013 + 2531011; x = ((x ^ (x >>> 11)) * 1103515245) >>> 0; return (x % 10000) / 10000; };

export function createDemoFlowers() {
  return Array.from({ length: 28 }, (_, i) => {
    const band = Math.floor(i / 7);
    const col = i % 7;
    const palette = ['pink', 'gold', 'violet', 'pink', 'gold', 'violet', 'pink'][(i * 5 + band) % 7];
    return {
      id: `demo-${i + 1}`,
      name: NAMES[i],
      palette,
      seed: i + 1,
      x: Math.round(80 + col * 176 + (hash(i + 11) - .5) * 80),
      y: Math.round(492 + band * 90 + (hash(i + 47) - .5) * 95),
      radius: Math.round(38 + hash(i + 101) * 26),
      petals: 7 + (i % 4),
      demo: true,
    };
  });
}

const canvas = document.querySelector('#gardenCanvas');
if (canvas) initGarden(canvas);

async function initGarden(canvasElement) {
  const c = canvasElement;
  const ctx = c.getContext('2d', { alpha: false });
  if (!ctx) return;
  const detail = document.querySelector('#flowerDetail');
  const art = document.querySelector('#flowerDetailArt');
  const title = document.querySelector('#flowerDetailTitle');
  const subtitle = document.querySelector('#flowerDetailSubtitle');
  const list = document.querySelector('#accessibleFlowerList');
  const statusLine = document.querySelector('#gardenStatusLine');
  const statusTag = document.querySelector('#dataStatus');
  const flowersCount = document.querySelector('#flowerCount');
  let all = createDemoFlowers();
  const localStoreKey='fioritura-demo-flower-v2';
  let personalDemo=null;
  try {const saved=JSON.parse(localStorage.getItem(localStoreKey)||'null');if(saved&&saved.id==='personal-demo'&&typeof saved.name==='string'&&saved.name.length>=2&&saved.name.length<=25&&['pink','gold','violet'].includes(saved.palette)&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)&&saved.x>=0&&saved.x<=1240&&saved.y>=0&&saved.y<=860&&Number.isInteger(saved.petals)&&saved.petals>=5&&saved.petals<=12){personalDemo={...saved,demo:true};all.push(personalDemo);}} catch {/* local storage may be blocked */}

  const featured = new Map([['demo-4','./assets/flower-featured-01.webp'],['demo-11','./assets/flower-featured-02.webp'],['demo-18','./assets/flower-featured-03.webp']]);
  const images = new Map();
  // The landscape is complex; rasterize it once per lighting mode for mobile performance.
  const landscapes=new Map();
  function landscape(day){const key=day?'day':'night';if(landscapes.has(key))return landscapes.get(key);const layer=document.createElement('canvas');layer.width=GARDEN_WIDTH;layer.height=GARDEN_HEIGHT;const painter=layer.getContext('2d',{alpha:false});paintWorld(painter,day,0);landscapes.set(key,layer);return layer;}

  function preloadImage(id,url){if(!url||images.has(id))return;const img=new Image();images.set(id,img);img.onload=()=>refresh();img.onerror=()=>images.delete(id);img.src=url;}
  for(const [id,url] of featured)preloadImage(id,url);
  let filtered = all;
  let currentFilter = 'all';
  let showAllFlowers = false;
  let selected = null;
  let isDay = false;
  let camera = { x: 0, y: 0, scale: 1 };
  let screen = { w: 1, h: 1, dpr: 1 };
  let fitted = false;
  let animationFrame = 0;
  let lastFrameAt = 0;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  const pointers = new Map();
  let pressed = null;
  let pinch = null;

  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  function worldToScreen(x, y) { return { x: x * camera.scale + camera.x, y: y * camera.scale + camera.y }; }
  function screenToWorld(x, y) { return { x: (x - camera.x) / camera.scale, y: (y - camera.y) / camera.scale }; }
  function fit() {
    const scale = Math.max(screen.w / GARDEN_WIDTH, screen.h / GARDEN_HEIGHT) * 1.025;
    camera.scale = scale;
    camera.x = (screen.w - GARDEN_WIDTH * scale) / 2;
    camera.y = (screen.h - GARDEN_HEIGHT * scale) / 2;
    fitted = true;
  }
  function size() {
    const rect = c.getBoundingClientRect();
    screen = { w: Math.max(1, rect.width), h: Math.max(1, rect.height), dpr: Math.min(2, window.devicePixelRatio || 1) };
    c.width = Math.round(screen.w * screen.dpr);
    c.height = Math.round(screen.h * screen.dpr);
    ctx.setTransform(screen.dpr, 0, 0, screen.dpr, 0, 0);
    if (!fitted) fit();
  }
  const resizeObserver = new ResizeObserver(size);
  resizeObserver.observe(c);
  size();

  function drawFlowerSvg(f) {
    const palette = PALETTES[f.palette] || PALETTES.pink;
    const petals = clamp(Number(f.petals) || 8, 5, 12);
    const count = Array.from({ length: petals }, (_, i) => {
      const ang = 360 * i / petals;
      return `<ellipse cx="50" cy="28" rx="15" ry="29" fill="${palette[i % palette.length]}" transform="rotate(${ang} 50 50)"/>`;
    }).join('');
    return `<svg viewBox="0 0 100 100" role="img" aria-label="Fiore ${safeText(f.name)}" xmlns="http://www.w3.org/2000/svg">${count}<circle cx="50" cy="50" r="19" fill="#fce3b4"/><circle cx="43" cy="47" r="2.1" fill="#483b32"/><circle cx="57" cy="47" r="2.1" fill="#483b32"/><path d="M43 56Q50 63 57 56" stroke="#483b32" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>`;
  }
  function safeText(v) { return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

  function drawBackground() {
    ctx.fillStyle=isDay?'#b9d6be':'#192f3c';ctx.fillRect(0,0,screen.w,screen.h);
  }
  function drawScene(t) {
    ctx.save(); ctx.translate(camera.x,camera.y);ctx.scale(camera.scale,camera.scale);
    ctx.drawImage(landscape(isDay),0,0);
    // A stylised planted world, not an image of a real Sanremo landscape.
    // Soft animated pollen in the air; all other scenery is cached.
    if(!reducedMotion&&!isDay){for(let i=0;i<27;i++){const x=hash(i+602)*GARDEN_WIDTH,y=270+hash(i+708)*570;const twinkle=.18+.5*(1+Math.sin(t/850+i*3))/2;ctx.globalAlpha=twinkle;ctx.fillStyle='#f7e3ac';ctx.beginPath();ctx.arc(x,y,1.3+hash(i+740)*2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
    for (const f of filtered) {
      const sway = reducedMotion ? 0 : Math.sin(t / 1650 + f.seed * .92) * 3;
      const p = PALETTES[f.palette] || PALETTES.pink;
      const r = f.radius;
      ctx.save();ctx.translate(f.x+sway,f.y);
      ctx.shadowColor=isDay?'#132f1938':'#0b151961';ctx.shadowBlur=17;ctx.shadowOffsetY=10;
      // stem and leaves
      ctx.strokeStyle=isDay?'#26674b':'#61bc87';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,r*.34);ctx.bezierCurveTo(-12,r*.85,19,r*1.6,0,r*2.2);ctx.stroke();
      for(const side of [-1,1]) {ctx.fillStyle=isDay?'#36845a':'#67ad82';ctx.beginPath();ctx.ellipse(side*15,r*1.15,22,9,side*.42,0,Math.PI*2);ctx.fill();}
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      const feature=images.get(f.id);
      if (feature?.complete && feature.naturalWidth) {
        ctx.shadowColor='#00000022';ctx.shadowBlur=16;ctx.drawImage(feature,-r*1.1,-r*1.18,r*2.2,r*2.2);ctx.shadowBlur=0;
      } else {
      // Layered petals with translucent veining and highlights for depth.
      for(let j=0;j<f.petals;j++){
        const angle=(Math.PI*2*j/f.petals)+sway*.005;
        const x=Math.cos(angle)*r*.50,y=Math.sin(angle)*r*.50;
        ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);
        const petal=ctx.createLinearGradient(-r*.34,-r*.72,r*.34,r*.38);
        petal.addColorStop(0,'#fff3dfa8');petal.addColorStop(.28,p[j%p.length]);petal.addColorStop(1,p[(j+1)%p.length]);
        ctx.fillStyle=petal;ctx.strokeStyle='#fff1e04d';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(0,r*.34);ctx.bezierCurveTo(-r*.66,r*.02,-r*.52,-r*.78,0,-r*.78);ctx.bezierCurveTo(r*.52,-r*.78,r*.66,r*.02,0,r*.34);ctx.fill();ctx.stroke();
        ctx.strokeStyle='#fff0ea47';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,r*.12);ctx.lineTo(0,-r*.6);ctx.stroke();
        ctx.restore();
      }
      const face=ctx.createRadialGradient(-r*.15,-r*.18,2,0,0,r*.48);
      face.addColorStop(0,'#fff1cf');face.addColorStop(.68,'#f6dab1');face.addColorStop(1,'#e2b692');
      ctx.fillStyle=face;ctx.beginPath();ctx.arc(0,0,r*.42,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e697908f';ctx.beginPath();ctx.ellipse(-r*.23,r*.10,r*.085,r*.045,0,0,Math.PI*2);ctx.ellipse(r*.23,r*.1,r*.085,r*.045,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#433b33';ctx.beginPath();ctx.ellipse(-r*.14,-r*.045,r*.037,r*.051,0,0,Math.PI*2);ctx.ellipse(r*.14,-r*.045,r*.037,r*.051,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#704744';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,r*.085,r*.16,.18,Math.PI-.18);ctx.stroke();
      ctx.fillStyle='#ffffffab';ctx.beginPath();ctx.arc(-r*.15,-r*.055,r*.015,0,Math.PI*2);ctx.arc(r*.13,-r*.055,r*.015,0,Math.PI*2);ctx.fill();
      }
      if(selected?.id===f.id){ctx.strokeStyle='#f7f4db';ctx.lineWidth=3;ctx.setLineDash([7,7]);ctx.beginPath();ctx.arc(0,0,r*1.28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      ctx.restore();
    }
    paintForeground(ctx,isDay);
    ctx.restore();
  }
  function frame(t) {
    if(!reducedMotion && t-lastFrameAt < 33){ if(visible)animationFrame=requestAnimationFrame(frame);return; }
    lastFrameAt=t;
    if(visible) {ctx.setTransform(screen.dpr,0,0,screen.dpr,0,0);drawBackground();drawScene(t);}
    if(!reducedMotion && visible) animationFrame=requestAnimationFrame(frame);
  }
  function refresh(){if(reducedMotion || !visible) {if(visible) frame(0);}}
  animationFrame=requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible)cancelAnimationFrame(animationFrame);else animationFrame=requestAnimationFrame(frame);});

  function focusFlower(f, scroll = false) {
    selected=f;
    title.textContent=f.name;
    subtitle.textContent=f.id==='personal-demo'?'Il tuo fiore di prova · visibile solo su questo dispositivo':f.demo ? 'Fiore dimostrativo · Nessuna persona reale' : 'Fiore approvato nel giardino collettivo';
    const src=featured.get(f.id)||f.artworkUrl;
    if(src){const image=document.createElement('img');image.src=src;image.alt='';image.loading='lazy';image.style.cssText='width:100%;height:100%;object-fit:cover';art.replaceChildren(image);}else{art.innerHTML=drawFlowerSvg(f);}
    detail.classList.add('is-open');
    if(scroll){const node=c.getBoundingClientRect();if(node.top < 0 || node.bottom>window.innerHeight){c.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});}}
    const p=worldToScreen(f.x,f.y);
    if(p.x<70 || p.x>screen.w-70 || p.y<60 || p.y>screen.h-60){camera.x=screen.w/2-f.x*camera.scale;camera.y=screen.h/2-f.y*camera.scale;}
    if(window.history?.replaceState) window.history.replaceState(null,'',`${window.location.pathname}?fiore=${encodeURIComponent(f.id)}`);
    refresh();
  }
  function closeFlower() {selected=null;detail.classList.remove('is-open');window.history?.replaceState(null,'',window.location.pathname);refresh();}
  document.querySelector('#closeDetail').addEventListener('click',closeFlower);
  function updateList() {
    list.replaceChildren();
    flowersCount.textContent=`${filtered.length} ${filtered.length===1?'fiore':'fiori'}`;
    const maxVisible=showAllFlowers?filtered.length:Math.min(filtered.length,10);
    for(const f of filtered.slice(0,maxVisible)) {
      const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Seleziona il fiore ${f.name}`);
      const ico=document.createElement('span');const src=featured.get(f.id)||f.artworkUrl;if(src){const image=document.createElement('img');image.src=src;image.loading='lazy';image.alt='';image.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:8px';ico.append(image);}else{ico.innerHTML=drawFlowerSvg(f);}
      const t=document.createElement('span');const strong=document.createElement('strong');strong.textContent=f.name;const sm=document.createElement('small');sm.textContent='Scopri il fiore';t.append(strong,sm);b.append(ico,t);
      b.addEventListener('click',()=>focusFlower(f,true));list.appendChild(b);
    }
    const more=document.querySelector('#toggleFlowerList');if(more){more.hidden=filtered.length<=10;more.textContent=showAllFlowers?'Mostra meno fiori':`Mostra tutti i ${filtered.length} fiori`;more.setAttribute('aria-expanded',String(showAllFlowers));}
  }
  document.querySelector('#toggleFlowerList')?.addEventListener('click',()=>{showAllFlowers=!showAllFlowers;updateList();});
  updateList();
  document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    currentFilter=btn.dataset.filter;
    filtered=currentFilter==='all'?all:all.filter(f=>f.palette===currentFilter);
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b===btn?'true':'false'));
    closeFlower();showAllFlowers=false;updateList();refresh();
  }));
  function zoom(factor, ax=screen.w/2,ay=screen.h/2){const old=camera.scale;const next=clamp(old*factor,.34,3.1);const w=screenToWorld(ax,ay);camera.scale=next;camera.x=ax-w.x*next;camera.y=ay-w.y*next;refresh();}
  document.querySelector('#zoomIn').addEventListener('click',()=>zoom(1.35));
  document.querySelector('#zoomOut').addEventListener('click',()=>zoom(1/1.35));
  document.querySelector('#resetView').addEventListener('click',()=>{fit();refresh();});
  const dayNight=document.querySelector('#dayNight');
  dayNight.addEventListener('click',()=>{isDay=!isDay;dayNight.setAttribute('aria-pressed',String(isDay));dayNight.setAttribute('aria-label',isDay?'Passa alla visione notturna':'Passa alla visione diurna');refresh();});
  const pt=(e)=>{const rect=c.getBoundingClientRect();return {x:e.clientX-rect.left,y:e.clientY-rect.top};};
  c.addEventListener('pointerdown',e=>{
    if(e.button !== 0 && e.pointerType==='mouse')return;
    c.setPointerCapture(e.pointerId); const p=pt(e);pointers.set(e.pointerId,p);
    pressed={at:Date.now(),p,moved:false};
    if(pointers.size===2){const[a,b]=[...pointers.values()];pinch={distance:Math.hypot(b.x-a.x,b.y-a.y),scale:camera.scale,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};pressed=null;}
  });
  c.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const p=pt(e);const last=pointers.get(e.pointerId);pointers.set(e.pointerId,p);
    if(pointers.size===1 && last){const dx=p.x-last.x,dy=p.y-last.y;camera.x+=dx;camera.y+=dy;if(pressed&&Math.hypot(p.x-pressed.p.x,p.y-pressed.p.y)>7)pressed.moved=true;}
    else if(pointers.size===2 && pinch){const [a,b]=[...pointers.values()];const dist=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};const w=screenToWorld(center.x,center.y);camera.scale=clamp(camera.scale*dist/Math.max(1,pinch.distance),.34,3.1);camera.x=center.x-w.x*camera.scale;camera.y=center.y-w.y*camera.scale;pinch.distance=dist;pinch.center=center;}
    refresh();
  });
  function endPointer(e){if(!pointers.has(e.pointerId))return;const p=pt(e);pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;if(pressed&&!pressed.moved&&Date.now()-pressed.at<500&&Math.hypot(p.x-pressed.p.x,p.y-pressed.p.y)<15){const w=screenToWorld(p.x,p.y);let best=null,dist=Infinity;for(const f of filtered){const d=Math.hypot(w.x-f.x,w.y-f.y);if(d<dist){dist=d;best=f;}}if(best&&dist<Math.max(best.radius*1.2,35/camera.scale))focusFlower(best);}pressed=null;}
  c.addEventListener('pointerup',endPointer);c.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pressed=null;pinch=null;});
  c.addEventListener('wheel',e=>{e.preventDefault();const p=pt(e);zoom(e.deltaY<0?1.12:.89,p.x,p.y);},{passive:false});
  c.addEventListener('keydown',e=>{let handled=true;switch(e.key){case'ArrowLeft':camera.x+=42;break;case'ArrowRight':camera.x-=42;break;case'ArrowUp':camera.y+=42;break;case'ArrowDown':camera.y-=42;break;case'+':case'=':zoom(1.2);break;case'-':zoom(.84);break;case'Escape':closeFlower();break;default:handled=false;}if(handled){e.preventDefault();refresh();}});

  // Preview-only planting: fully local, no selfies, identity or network writes.
  const planter=document.querySelector('#previewPlanter');
  const plantToggle=document.querySelector('#openPlanter');
  plantToggle?.addEventListener('click',()=>{const expanded=planter.hidden;planter.hidden=!expanded;plantToggle.setAttribute('aria-expanded',String(expanded));if(expanded)planter.querySelector('input')?.focus();});
  planter?.addEventListener('submit',e=>{
    e.preventDefault();const form=new FormData(planter);const name=String(form.get('flowerName')||'').trim().replace(/[<>]/g,'').slice(0,24);
    const palette=String(form.get('flowerColor')||'pink');
    if(name.length<2||!PALETTES[palette]){document.querySelector('#plantMessage').textContent='Scrivi un nome di almeno 2 caratteri.';return;}
    const seed=13+Math.floor(hash(name.length+Date.now()%913)*4444);
    const f={id:'personal-demo',name,palette,seed,petals:8+seed%3,x:425+(seed%5)*103,y:660+(seed%4)*40,radius:52,demo:true};
    all=all.filter(item=>item.id!=='personal-demo');all.push(f);
    try{localStorage.setItem(localStoreKey,JSON.stringify(f));}catch{/* private browsing */}
    filtered=currentFilter==='all'?all:all.filter(item=>item.palette===currentFilter);
    updateList();fit();focusFlower(f);refresh();
    document.querySelector('#plantMessage').textContent='Il tuo fiore di prova è sbocciato. Lo vedi solo tu, su questo dispositivo.';
    plantToggle.textContent='Cambia il mio fiore di prova';
    planter.hidden=true;plantToggle.setAttribute('aria-expanded','false');
    c.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});
  });
  try {
    if (window.FIORITURA_STATIC_DEMO === true) throw new Error('Local demo only');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),4500);
    const response=await fetch('/api/flowers',{signal:controller.signal,cache:'no-store'});clearTimeout(timer);
    if(response.ok){const data=await response.json();if(Array.isArray(data.items)&&data.items.length){
      all=data.items.map((f,i)=>({id:String(f.id),name:String(f.name||'Fiore'),palette:PALETTES[f.palette]?f.palette:'pink',x:Number.isFinite(f.x)?f.x:(130+(i%7)*150),y:Number.isFinite(f.y)?f.y:150+Math.floor(i/7)*150,radius:clamp(Number(f.radius)||50,35,75),petals:clamp(Number(f.petals)||8,5,12),seed:i+1,demo:false}));
      filtered=all;for(const f of all)if(f.artworkUrl)preloadImage(f.id,f.artworkUrl);updateList();statusTag.textContent='GIARDINO CONDIVISO';statusLine.textContent='Fiori approvati dai partecipanti';
      const deep=new URLSearchParams(location.search).get('fiore');if(deep){const match=all.find(f=>f.id===deep);if(match)focusFlower(match);}
    }}
  }catch{/* Static preview: remain in explicitly labelled demo mode. */}
  const deep=new URLSearchParams(location.search).get('fiore');if(deep&&!selected){const match=all.find(f=>f.id===deep);if(match)focusFlower(match);}
}
