'use strict';
import { WORLD_W, WORLD_H, paintWorld, paintForeground } from './garden-world.js';
import { LOCAL_FLOWER_KEY, cleanFlowerName, filterFlowers, normalizeLocalFlower, parseLocalFlower } from './garden-data.js';

export const GARDEN_WIDTH = WORLD_W;
export const GARDEN_HEIGHT = WORLD_H;

const PALETTES = {
  pink: ['#f6a39d', '#d84b55', '#d97586'],
  gold: ['#f7dd8a', '#e8bb52', '#e99556'],
  violet: ['#92cad4', '#668ab7', '#a78ac6'],
};
const SHAPES = ['daisy', 'camellia', 'star'];
const NAMES = ['Alba', 'Marea', 'Sole', 'Gentile', 'Aurora', 'Petalo', 'Corallo', 'Luce', 'Nuvola', 'Sogno', 'Edera', 'Gioia', 'Viola', 'Brezza', 'Rugiada', 'Fiaba', 'Miraggio', 'Luna', 'Vento', 'Stella', 'Primula', 'Dalia', 'Anemone', 'Farfalla', 'Zefiro', 'Iris', 'Lilla', 'Gelsomino'];
const hash = (i) => { let x = (i + 1773) * 214013 + 2531011; x = ((x ^ (x >>> 11)) * 1103515245) >>> 0; return (x % 10000) / 10000; };
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function createDemoFlowers() {
  return Array.from({ length: 28 }, (_, i) => {
    const band = Math.floor(i / 7), col = i % 7;
    return {
      id: `demo-${i + 1}`, name: NAMES[i],
      palette: ['pink', 'gold', 'violet', 'pink', 'gold', 'violet', 'pink'][(i * 5 + band) % 7],
      shape: SHAPES[i % SHAPES.length], seed: i + 1,
      x: Math.round(82 + col * 176 + (hash(i + 11) - .5) * 76),
      y: Math.round(505 + band * 82 + (hash(i + 47) - .5) * 68),
      radius: Math.round(38 + hash(i + 101) * 24), petals: 7 + (i % 4), demo: true,
    };
  });
}

const canvas = document.querySelector('#gardenCanvas');
if (canvas) initGarden(canvas);

async function initGarden(c) {
  const ctx = c.getContext('2d', { alpha: false });
  if (!ctx) return;
  const $ = (selector) => document.querySelector(selector);
  const detail = $('#flowerDetail'), art = $('#flowerDetailArt'), title = $('#flowerDetailTitle');
  const subtitle = $('#flowerDetailSubtitle'), list = $('#accessibleFlowerList');
  const statusLine = $('#gardenStatusLine'), statusTag = $('#dataStatus'), flowerCount = $('#flowerCount');
  const empty = $('#emptyGarden'), search = $('#flowerSearch'), removeButton = $('#removePersonalFlower');
  const planter = $('#previewPlanter'), plantToggle = $('#openPlanter'), message = $('#plantMessage');
  let all = createDemoFlowers(), personalDemo = null, storageAvailable = true, removalPending = false;
  try { personalDemo = parseLocalFlower(localStorage.getItem(LOCAL_FLOWER_KEY)); } catch { storageAvailable = false; }
  if (personalDemo) all.push(personalDemo);

  const featured = new Map([['demo-4', './assets/flower-featured-01.webp'], ['demo-11', './assets/flower-featured-02.webp'], ['demo-18', './assets/flower-featured-03.webp']]);
  const images = new Map(), landscapes = new Map();
  function preloadImage(id, url) { if (!url || images.has(id)) return; const img = new Image(); images.set(id, img); img.onload = refresh; img.onerror = () => images.delete(id); img.src = url; }
  for (const [id, url] of featured) preloadImage(id, url);
  function landscape(day) { const key = day ? 'day' : 'night'; if (landscapes.has(key)) return landscapes.get(key); const layer = document.createElement('canvas'); layer.width = WORLD_W; layer.height = WORLD_H; paintWorld(layer.getContext('2d', { alpha: false }), day, 0); landscapes.set(key, layer); return layer; }

  let currentFilter = 'all', currentQuery = '', forceVisibleId = '', filtered = all;
  let showAllFlowers = false, selected = null, isDay = false, fitted = false;
  let camera = { x: 0, y: 0, scale: 1 }, screen = { w: 1, h: 1, dpr: 1 };
  let animationFrame = 0, lastFrameAt = 0, documentVisible = true, canvasVisible = true;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointers = new Map(); let pressed = null, pinch = null, previousFocus = null;

  const worldToScreen = (x, y) => ({ x: x * camera.scale + camera.x, y: y * camera.scale + camera.y });
  const screenToWorld = (x, y) => ({ x: (x - camera.x) / camera.scale, y: (y - camera.y) / camera.scale });
  function fit() { const scale = Math.max(screen.w / WORLD_W, screen.h / WORLD_H) * 1.02; camera = { scale, x: (screen.w - WORLD_W * scale) / 2, y: (screen.h - WORLD_H * scale) / 2 }; fitted = true; }
  function size() { const rect = c.getBoundingClientRect(); screen = { w: Math.max(1, rect.width), h: Math.max(1, rect.height), dpr: Math.min(2, window.devicePixelRatio || 1) }; c.width = Math.round(screen.w * screen.dpr); c.height = Math.round(screen.h * screen.dpr); ctx.setTransform(screen.dpr, 0, 0, screen.dpr, 0, 0); fit(); refresh(); }

  const safeText = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  function flowerSvg(f) {
    const palette = PALETTES[f.palette] || PALETTES.pink, petals = clamp(Number(f.petals) || 8, 5, 12);
    const width = f.shape === 'star' ? 10 : f.shape === 'camellia' ? 18 : 15;
    const height = f.shape === 'star' ? 34 : f.shape === 'camellia' ? 24 : 29;
    const ellipses = Array.from({ length: petals }, (_, i) => `<ellipse cx="50" cy="28" rx="${width}" ry="${height}" fill="${palette[i % 3]}" transform="rotate(${360 * i / petals} 50 50)"/>`).join('');
    return `<svg viewBox="0 0 100 100" role="img" aria-label="Fiore ${safeText(f.name)}" xmlns="http://www.w3.org/2000/svg">${ellipses}<circle cx="50" cy="50" r="19" fill="#ffe9bd"/><circle cx="43" cy="47" r="2" fill="#173448"/><circle cx="57" cy="47" r="2" fill="#173448"/><path d="M43 56Q50 63 57 56" stroke="#173448" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>`;
  }

  function drawFlower(f, time) {
    const sway = reducedMotion ? 0 : Math.sin(time / 1650 + f.seed * .92) * 3;
    const palette = PALETTES[f.palette] || PALETTES.pink, r = f.radius;
    ctx.save(); ctx.translate(f.x + sway, f.y);
    ctx.shadowColor = isDay ? '#0b2b4230' : '#071c2b70'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 9;
    ctx.strokeStyle = isDay ? '#196b58' : '#65b493'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, r * .34); ctx.bezierCurveTo(-12, r * .85, 18, r * 1.55, 0, r * 2.15); ctx.stroke();
    for (const side of [-1, 1]) { ctx.fillStyle = isDay ? '#2d8167' : '#62a889'; ctx.beginPath(); ctx.ellipse(side * 15, r * 1.14, 22, 9, side * .42, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    const feature = images.get(f.id);
    if (feature?.complete && feature.naturalWidth) { ctx.shadowColor = '#071c2b33'; ctx.shadowBlur = 14; ctx.drawImage(feature, -r * 1.08, -r * 1.14, r * 2.16, r * 2.16); }
    else {
      const petalWidth = f.shape === 'star' ? .40 : f.shape === 'camellia' ? .72 : .58;
      const petalLength = f.shape === 'star' ? .94 : f.shape === 'camellia' ? .64 : .78;
      for (let j = 0; j < f.petals; j++) {
        const angle = Math.PI * 2 * j / f.petals, x = Math.cos(angle) * r * .5, y = Math.sin(angle) * r * .5;
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
        const gradient = ctx.createLinearGradient(0, -r * petalLength, 0, r * .34); gradient.addColorStop(0, '#fff9eeaa'); gradient.addColorStop(.3, palette[j % 3]); gradient.addColorStop(1, palette[(j + 1) % 3]);
        ctx.fillStyle = gradient; ctx.strokeStyle = '#fff9ee55'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, r * .34); ctx.bezierCurveTo(-r * petalWidth, r * .02, -r * petalWidth, -r * petalLength, 0, -r * petalLength); ctx.bezierCurveTo(r * petalWidth, -r * petalLength, r * petalWidth, r * .02, 0, r * .34); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      const face = ctx.createRadialGradient(-r * .14, -r * .16, 2, 0, 0, r * .48); face.addColorStop(0, '#fff4d6'); face.addColorStop(.72, '#f3d3a8'); face.addColorStop(1, '#d7a77f'); ctx.fillStyle = face; ctx.beginPath(); ctx.arc(0, 0, r * .42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#173448'; ctx.beginPath(); ctx.ellipse(-r * .14, -r * .04, r * .036, r * .052, 0, 0, Math.PI * 2); ctx.ellipse(r * .14, -r * .04, r * .036, r * .052, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8f4a4c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, r * .08, r * .16, .18, Math.PI - .18); ctx.stroke();
    }
    if (selected?.id === f.id) { ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = 3; ctx.setLineDash([7, 7]); ctx.beginPath(); ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  function drawScene(time) { ctx.fillStyle = isDay ? '#dceef0' : '#0b2b42'; ctx.fillRect(0, 0, screen.w, screen.h); ctx.save(); ctx.translate(camera.x, camera.y); ctx.scale(camera.scale, camera.scale); ctx.drawImage(landscape(isDay), 0, 0); for (const f of filtered) drawFlower(f, time); paintForeground(ctx, isDay); ctx.restore(); }
  const isVisible = () => documentVisible && canvasVisible;
  function frame(time) { if (!reducedMotion && time - lastFrameAt < 33) { if (isVisible()) animationFrame = requestAnimationFrame(frame); return; } lastFrameAt = time; if (isVisible()) { ctx.setTransform(screen.dpr, 0, 0, screen.dpr, 0, 0); drawScene(time); } if (!reducedMotion && isVisible()) animationFrame = requestAnimationFrame(frame); }
  function refresh() { if (reducedMotion && isVisible()) frame(0); }
  animationFrame = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { documentVisible = !document.hidden; cancelAnimationFrame(animationFrame); if (isVisible()) animationFrame = requestAnimationFrame(frame); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { canvasVisible = entry.isIntersecting; cancelAnimationFrame(animationFrame); if (isVisible()) animationFrame = requestAnimationFrame(frame); }, { rootMargin: '120px' }).observe(c);

  function focusFlower(f, scroll = false) {
    selected = f; previousFocus = document.activeElement; title.textContent = f.name;
    subtitle.textContent = f.id === 'personal-demo' ? 'Il tuo fiore locale · solo su questo dispositivo' : f.demo ? 'Fiore sintetico dimostrativo · nessuna persona reale' : 'Fiore approvato nel giardino collettivo';
    const src = featured.get(f.id) || f.artworkUrl;
    if (src) { const image = document.createElement('img'); image.src = src; image.alt = ''; image.loading = 'lazy'; art.replaceChildren(image); }
    else art.innerHTML = flowerSvg(f);
    detail.hidden = false; detail.classList.add('is-open'); detail.focus({ preventScroll: true });
    if (scroll) { const rect = c.getBoundingClientRect(); if (rect.top < 0 || rect.bottom > innerHeight) c.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }); }
    const point = worldToScreen(f.x, f.y); if (point.x < 70 || point.x > screen.w - 70 || point.y < 60 || point.y > screen.h - 60) { camera.x = screen.w / 2 - f.x * camera.scale; camera.y = screen.h / 2 - f.y * camera.scale; }
    if (history?.replaceState) history.replaceState(null, '', `${location.pathname}?fiore=${encodeURIComponent(f.id)}`); refresh();
  }
  function closeFlower(restoreFocus = true) { selected = null; detail.classList.remove('is-open'); detail.hidden = true; history?.replaceState?.(null, '', location.pathname); if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); previousFocus = null; refresh(); }
  $('#closeDetail').addEventListener('click', closeFlower);

  function updateList() {
    list.replaceChildren(); flowerCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'fiore' : 'fiori'}`; empty.hidden = filtered.length !== 0;
    const max = showAllFlowers ? filtered.length : Math.min(filtered.length, 10);
    for (const f of filtered.slice(0, max)) {
      const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Seleziona il fiore ${f.name}`);
      const icon = document.createElement('span'), src = featured.get(f.id) || f.artworkUrl;
      if (src) { const image = document.createElement('img'); image.src = src; image.loading = 'lazy'; image.alt = ''; icon.append(image); } else icon.innerHTML = flowerSvg(f);
      const words = document.createElement('span'), strong = document.createElement('strong'), small = document.createElement('small'); strong.textContent = f.name; small.textContent = f.id === 'personal-demo' ? 'Il tuo fiore locale' : 'Scopri il fiore'; words.append(strong, small); button.append(icon, words); button.addEventListener('click', () => focusFlower(f, true)); list.append(button);
    }
    const more = $('#toggleFlowerList'); more.hidden = filtered.length <= 10; more.textContent = showAllFlowers ? 'Mostra meno fiori' : `Mostra tutti i ${filtered.length} fiori`; more.setAttribute('aria-expanded', String(showAllFlowers));
  }
  function applyFilters() { filtered = filterFlowers(all, { palette: currentFilter, query: currentQuery, forceVisibleId }); showAllFlowers = false; updateList(); refresh(); }
  $('#toggleFlowerList').addEventListener('click', () => { showAllFlowers = !showAllFlowers; updateList(); });
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { currentFilter = button.dataset.filter; forceVisibleId = ''; document.querySelectorAll('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button))); closeFlower(false); applyFilters(); }));
  search.addEventListener('input', () => { currentQuery = search.value; forceVisibleId = ''; closeFlower(false); applyFilters(); });
  updateList();

  function zoom(factor, ax = screen.w / 2, ay = screen.h / 2) { const old = camera.scale, next = clamp(old * factor, .34, 3.1), world = screenToWorld(ax, ay); camera.scale = next; camera.x = ax - world.x * next; camera.y = ay - world.y * next; refresh(); }
  $('#zoomIn').addEventListener('click', () => zoom(1.35)); $('#zoomOut').addEventListener('click', () => zoom(1 / 1.35)); $('#resetView').addEventListener('click', () => { fit(); refresh(); });
  $('#dayNight').addEventListener('click', (event) => { isDay = !isDay; event.currentTarget.setAttribute('aria-pressed', String(isDay)); event.currentTarget.setAttribute('aria-label', isDay ? 'Passa alla visione serale' : 'Passa alla visione diurna'); refresh(); });
  const point = (event) => { const rect = c.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  c.addEventListener('pointerdown', (event) => { if (event.button !== 0 && event.pointerType === 'mouse') return; c.setPointerCapture(event.pointerId); const p = point(event); pointers.set(event.pointerId, p); pressed = { at: Date.now(), p, moved: false }; if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { distance: Math.hypot(b.x - a.x, b.y - a.y) }; pressed = null; } });
  c.addEventListener('pointermove', (event) => { if (!pointers.has(event.pointerId)) return; const p = point(event), last = pointers.get(event.pointerId); pointers.set(event.pointerId, p); if (pointers.size === 1) { camera.x += p.x - last.x; camera.y += p.y - last.y; if (pressed && Math.hypot(p.x - pressed.p.x, p.y - pressed.p.y) > 7) pressed.moved = true; } else if (pinch) { const [a, b] = [...pointers.values()], distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; zoom(distance / pinch.distance, center.x, center.y); pinch.distance = distance; } refresh(); });
  function endPointer(event) { if (!pointers.has(event.pointerId)) return; const p = point(event); pointers.delete(event.pointerId); if (pointers.size < 2) pinch = null; if (pressed && !pressed.moved && Date.now() - pressed.at < 500 && Math.hypot(p.x - pressed.p.x, p.y - pressed.p.y) < 15) { const world = screenToWorld(p.x, p.y); let best = null, distance = Infinity; for (const f of filtered) { const d = Math.hypot(world.x - f.x, world.y - f.y); if (d < distance) { distance = d; best = f; } } if (best && distance < Math.max(best.radius * 1.2, 35 / camera.scale)) focusFlower(best); } pressed = null; }
  c.addEventListener('pointerup', endPointer); c.addEventListener('pointercancel', (event) => { pointers.delete(event.pointerId); pressed = null; pinch = null; });
  c.addEventListener('wheel', (event) => { event.preventDefault(); const p = point(event); zoom(event.deltaY < 0 ? 1.12 : .89, p.x, p.y); }, { passive: false });
  c.addEventListener('keydown', (event) => { let handled = true; switch (event.key) { case 'ArrowLeft': camera.x += 42; break; case 'ArrowRight': camera.x -= 42; break; case 'ArrowUp': camera.y += 42; break; case 'ArrowDown': camera.y -= 42; break; case '+': case '=': zoom(1.2); break; case '-': zoom(.84); break; case 'Escape': closeFlower(); break; default: handled = false; } if (handled) { event.preventDefault(); refresh(); } });

  function syncPersonalControls() { const present = all.some((item) => item.id === 'personal-demo'); removeButton.hidden = !present && !removalPending; removeButton.textContent = present ? 'Rimuovi il mio fiore' : 'Riprova a cancellare i dati locali'; plantToggle.childNodes[0].textContent = present ? 'Cambia il mio fiore locale ' : 'Crea un fiore locale '; }
  syncPersonalControls();
  plantToggle.addEventListener('click', () => { const expanded = planter.hidden; planter.hidden = !expanded; plantToggle.setAttribute('aria-expanded', String(expanded)); if (expanded) planter.querySelector('input').focus(); });
  planter.addEventListener('submit', (event) => {
    event.preventDefault(); const form = new FormData(planter), name = cleanFlowerName(form.get('flowerName')), palette = String(form.get('flowerColor') || 'pink'), shape = String(form.get('flowerShape') || 'daisy');
    if (name.length < 2) { message.textContent = 'Scrivi un nome di almeno 2 caratteri, senza simboli HTML.'; return; }
    const seed = 13 + Math.floor(hash(name.length + Date.now() % 913) * 4444);
    const flower = normalizeLocalFlower({ id: 'personal-demo', version: 1, name, palette, shape, seed, petals: 8 + seed % 3, x: 425 + (seed % 5) * 103, y: 650 + (seed % 4) * 38, radius: 52 });
    if (!flower) { message.textContent = 'Controlla nome, forma e colore del fiore.'; return; }
    all = all.filter((item) => item.id !== 'personal-demo'); all.push(flower); personalDemo = flower; forceVisibleId = flower.id;
    try { localStorage.setItem(LOCAL_FLOWER_KEY, JSON.stringify(flower)); storageAvailable = true; removalPending = false; } catch { storageAvailable = false; }
    applyFilters(); syncPersonalControls(); fit(); focusFlower(flower); message.textContent = storageAvailable ? 'Il fiore è sbocciato e resta solo su questo dispositivo.' : 'Il fiore è visibile ora, ma il browser non consente di conservarlo.';
    planter.hidden = true; plantToggle.setAttribute('aria-expanded', 'false'); c.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  });
  removeButton.addEventListener('click', () => {
    try { localStorage.removeItem(LOCAL_FLOWER_KEY); removalPending = false; }
    catch {
      storageAvailable = false;
      removalPending = true;
    }
    all = all.filter((item) => item.id !== 'personal-demo'); personalDemo = null; forceVisibleId = '';
    closeFlower(); applyFilters(); syncPersonalControls();
    message.textContent = removalPending
      ? 'Il fiore è stato tolto da questa sessione. Il browser non consente di cancellare eventuali dati già salvati: potrebbero ricomparire al prossimo accesso. Riprova oppure cancella i dati di questo sito dalle impostazioni del browser.'
      : 'Il fiore locale è stato rimosso da questo dispositivo.';
  });

  // Initialize the first frame only after visibility and event state are ready.
  // Reduced-motion mode paints synchronously rather than waiting for an animation frame.
  new ResizeObserver(size).observe(c); size();
  try {
    if (window.FIORITURA_STATIC_DEMO === true) throw new Error('Static demo');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 4500);
    const response = await fetch('/api/flowers', { signal: controller.signal, cache: 'no-store' }); clearTimeout(timer);
    if (response.ok) { const data = await response.json(); if (Array.isArray(data.items) && data.items.length) {
      const approved = data.items.map((f, i) => ({ id: String(f.id), name: cleanFlowerName(String(f.name || 'Fiore')) || 'Fiore', palette: PALETTES[f.palette] ? f.palette : 'pink', shape: SHAPES.includes(f.shape) ? f.shape : 'daisy', x: Number.isFinite(f.x) ? clamp(f.x, 0, WORLD_W) : 130 + (i % 7) * 150, y: Number.isFinite(f.y) ? clamp(f.y, 0, WORLD_H) : 520 + Math.floor(i / 7) * 100, radius: clamp(Number(f.radius) || 50, 35, 75), petals: Math.round(clamp(Number(f.petals) || 8, 5, 12)), seed: i + 1, demo: false, artworkUrl: typeof f.artworkUrl === 'string' && f.artworkUrl.startsWith('/api/media/') ? f.artworkUrl : '' }));
      all = personalDemo ? [...approved, personalDemo] : approved; applyFilters(); for (const f of all) if (f.artworkUrl) preloadImage(f.id, f.artworkUrl); syncPersonalControls(); statusTag.textContent = 'GIARDINO CONDIVISO · CONTENUTI APPROVATI'; statusLine.textContent = personalDemo ? 'Fiori approvati + il tuo fiore locale' : 'Fiori approvati';
    } }
  } catch { /* A static or unavailable API intentionally leaves the labeled demo intact. */ }
  const deep = new URLSearchParams(location.search).get('fiore'); if (deep) { const match = all.find((f) => f.id === deep); if (match) focusFlower(match); }
}
