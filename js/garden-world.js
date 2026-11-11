/** Authored deterministic Riviera landscape. Artistic scene, not a plan or exact photomontage. */
export const WORLD_W = 1240;
export const WORLD_H = 860;

const seeded = (value) => { const n = Math.sin(value * 157.29 + 48.32) * 43239.13; return n - Math.floor(n); };
const oval = (g, x, y, rx, ry, color, angle = 0) => { g.save(); g.translate(x, y); g.rotate(angle); g.fillStyle = color; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore(); };
const path = (g, points, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(0, WORLD_H); for (const [x, y] of points) g.lineTo(x, y); g.lineTo(WORLD_W, WORLD_H); g.closePath(); g.fill(); };

function cloud(g, x, y, scale, opacity) {
  g.save(); g.globalAlpha = opacity;
  for (const [dx, dy, rx, ry] of [[0, 0, 68, 14], [-42, 5, 42, 12], [38, 5, 49, 11], [7, -12, 38, 20]]) oval(g, x + dx * scale, y + dy * scale, rx * scale, ry * scale, '#fff9ee');
  g.restore();
}
function palm(g, x, y, scale, day, lean = 0) {
  g.save(); g.translate(x, y); g.rotate(lean); g.scale(scale, scale);
  const trunk = g.createLinearGradient(-7, 0, 10, 0); trunk.addColorStop(0, day ? '#875b43' : '#463f42'); trunk.addColorStop(.5, day ? '#bd8060' : '#705451'); trunk.addColorStop(1, day ? '#744c38' : '#3a3438');
  g.strokeStyle = trunk; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-8, -62, 3, -132); g.stroke();
  g.translate(3, -132); const leafColors = day ? ['#196b58', '#2c8068', '#438f73'] : ['#174e48', '#24665a', '#2f7664'];
  for (let i = 0; i < 11; i++) { const angle = -Math.PI + i * Math.PI * 2 / 11; g.save(); g.rotate(angle); g.fillStyle = leafColors[i % 3]; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(23, -15, 56, -14, 88, 2); g.bezierCurveTo(52, -2, 24, 7, 0, 0); g.fill(); g.restore(); }
  oval(g, 0, 0, 12, 8, day ? '#6f7a3f' : '#374f3f'); g.restore();
}
function cypress(g, x, y, scale, day) {
  g.save(); g.translate(x, y); g.scale(scale, scale); g.fillStyle = day ? '#196b58' : '#174a44'; g.beginPath(); g.moveTo(-13, 0); g.bezierCurveTo(-24, -42, -18, -99, -5, -146); g.quadraticCurveTo(0, -181, 8, -145); g.bezierCurveTo(24, -91, 22, -35, 13, 0); g.fill(); g.restore();
}
function town(g, day) {
  for (let i = 0; i < 34; i++) {
    const x = i * 39 - 10 + seeded(i + 12) * 16, baseline = 325 - Math.sin(i * .34) * 25, width = 24 + seeded(i + 4) * 27, height = 27 + seeded(i + 22) * 48;
    g.fillStyle = day ? ['#f2d1b9', '#f7dfc5', '#e6b6aa', '#fff0d4'][i % 4] : ['#745b70', '#8f6170', '#695c71', '#936f72'][i % 4]; g.fillRect(x, baseline - height, width, height);
    g.fillStyle = day ? '#9cbcc0' : '#f2bd73'; for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) if (seeded(i * 12 + row * 3 + col) > .25) g.fillRect(x + 6 + col * 10, baseline - height + 9 + row * 13, 4, 6);
    g.fillStyle = day ? '#c36d61' : '#584455'; g.beginPath(); g.moveTo(x - 3, baseline - height); g.lineTo(x + width / 2, baseline - height - 12); g.lineTo(x + width + 3, baseline - height); g.closePath(); g.fill();
  }
}
function sea(g, day) {
  const water = g.createLinearGradient(0, 190, 0, 430); water.addColorStop(0, day ? '#9bd5db' : '#334f70'); water.addColorStop(1, day ? '#397f9a' : '#123d5a'); g.fillStyle = water; g.fillRect(0, 190, WORLD_W, 250);
  g.save(); g.globalAlpha = day ? .38 : .22; for (let i = 0; i < 42; i++) { const y = 215 + i * 5.2, x = seeded(i + 88) * 1100, width = 35 + seeded(i + 20) * 160; g.strokeStyle = i % 4 ? '#dceef0' : '#fff0c6'; g.lineWidth = 1 + seeded(i + 8); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + width / 2, y + 3, x + width, y); g.stroke(); } g.restore();
  // Distant sail shapes are generic Riviera atmosphere, not event infrastructure.
  for (const [x, y, scale] of [[170, 260, .7], [1040, 235, .48]]) { g.fillStyle = day ? '#fff9ee' : '#c5d4d9'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 48 * scale); g.lineTo(x + 28 * scale, y - 5); g.closePath(); g.fill(); g.strokeStyle = day ? '#6a8a92' : '#8fa6b0'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 53 * scale); g.lineTo(x, y + 4); g.stroke(); }
}
function promenade(g, day) {
  g.fillStyle = day ? '#efe0c7' : '#806b6d'; g.fillRect(0, 397, WORLD_W, 74);
  g.fillStyle = day ? '#d6b997' : '#66565f'; g.fillRect(0, 397, WORLD_W, 10); g.fillRect(0, 458, WORLD_W, 13);
  g.strokeStyle = day ? '#9d836f' : '#3d4654'; g.lineWidth = 3; for (let x = 0; x < WORLD_W; x += 52) { g.beginPath(); g.moveTo(x, 397); g.lineTo(x, 365); g.stroke(); }
  g.beginPath(); g.moveTo(0, 367); g.lineTo(WORLD_W, 367); g.stroke(); g.beginPath(); g.moveTo(0, 378); g.lineTo(WORLD_W, 378); g.stroke();
  for (let i = 0; i < 12; i++) { const x = 25 + i * 107; oval(g, x, 447, 44, 8, day ? '#cbb08c' : '#5d505a'); }
}
function terrace(g, day) {
  const ground = g.createLinearGradient(0, 470, 0, WORLD_H); ground.addColorStop(0, day ? '#81a978' : '#315f54'); ground.addColorStop(1, day ? '#2d6f58' : '#173e3a'); g.fillStyle = ground; g.fillRect(0, 470, WORLD_W, 390);
  for (let band = 0; band < 3; band++) { const y = 520 + band * 116; g.fillStyle = day ? ['#a6bd7e', '#6f9c69', '#4c825f'][band] : ['#406e5c', '#2b5d50', '#204a43'][band]; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(250, y - 36, 385, y + 34, 620, y); g.bezierCurveTo(870, y - 28, 1040, y + 30, WORLD_W, y - 8); g.lineTo(WORLD_W, y + 104); g.lineTo(0, y + 104); g.closePath(); g.fill(); g.strokeStyle = day ? '#d2c29c' : '#6f6964'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(250, y - 36, 385, y + 34, 620, y); g.bezierCurveTo(870, y - 28, 1040, y + 30, WORLD_W, y - 8); g.stroke(); }
  // Central terracotta promenade recedes toward the sea.
  const walk = g.createLinearGradient(610, 465, 620, 860); walk.addColorStop(0, day ? '#e6c0a1' : '#916b71'); walk.addColorStop(1, day ? '#f0b28d' : '#bc7a79'); g.fillStyle = walk; g.beginPath(); g.moveTo(595, 462); g.bezierCurveTo(575, 560, 490, 690, 350, 860); g.lineTo(900, 860); g.bezierCurveTo(760, 690, 675, 560, 645, 462); g.closePath(); g.fill();
  g.strokeStyle = day ? '#b87f67' : '#76535c'; g.lineWidth = 3; g.beginPath(); g.moveTo(595, 462); g.bezierCurveTo(575, 560, 490, 690, 350, 860); g.moveTo(645, 462); g.bezierCurveTo(675, 560, 760, 690, 900, 860); g.stroke();
  for (let i = 0; i < 15; i++) { const y = 490 + i * i * 1.65, width = 22 + i * 23; g.strokeStyle = day ? '#bd806566' : '#4e405466'; g.lineWidth = 1 + i * .15; g.beginPath(); g.moveTo(620 - width, y); g.lineTo(620 + width, y + 3); g.stroke(); }
}
function flowerBed(g, x, y, scale, day, seed) {
  g.save(); g.translate(x, y); g.scale(scale, scale); const greens = day ? ['#196b58', '#347e64', '#528f69'] : ['#184a44', '#225e51', '#32705a'];
  for (let i = 0; i < 13; i++) { const xx = (seeded(i * 10 + seed) - .5) * 100, yy = (seeded(i * 11 + seed + 3) - .5) * 34; oval(g, xx, yy, 27, 12, greens[i % 3], seeded(i + 7) * .9); }
  const flowers = day ? ['#d84b55', '#e8bb52', '#8ca6cf', '#f2a18e'] : ['#ef7f86', '#f2cd73', '#9fa8df', '#eaa1b5']; for (let i = 0; i < 12; i++) { const angle = seeded(i * 5 + seed) * Math.PI * 2, radius = Math.sqrt(seeded(i * 9 + seed)) * 42; oval(g, Math.cos(angle) * radius, Math.sin(angle) * radius * .35, 4 + seeded(i + seed) * 3, 3, flowers[i % 4]); }
  g.restore();
}

export function paintWorld(g, day, time = 0) {
  const sky = g.createLinearGradient(0, 0, 0, 430); if (day) { sky.addColorStop(0, '#86cbd4'); sky.addColorStop(.55, '#dceef0'); sky.addColorStop(1, '#ffe2bd'); } else { sky.addColorStop(0, '#102b4a'); sky.addColorStop(.52, '#6e526d'); sky.addColorStop(1, '#e18b7f'); } g.fillStyle = sky; g.fillRect(0, 0, WORLD_W, 430);
  if (day) { oval(g, 1002, 115, 54, 54, '#f6d878'); cloud(g, 235, 110, 1.08, .32); cloud(g, 765, 92, .62, .25); }
  else { const glow = g.createRadialGradient(1000, 112, 2, 1000, 112, 100); glow.addColorStop(0, '#fff1bd88'); glow.addColorStop(1, '#fff1bd00'); g.fillStyle = glow; g.fillRect(900, 12, 200, 200); oval(g, 1000, 112, 27, 27, '#fff0c3'); for (let i = 0; i < 75; i++) { g.globalAlpha = .2 + seeded(i + 10) * .55; oval(g, seeded(i + 24) * WORLD_W, seeded(i + 48) * 190, 1.2, 1.2, '#fff9ee'); } g.globalAlpha = 1; cloud(g, 200, 125, .95, .12); }
  sea(g, day);
  path(g, [[0, 332], [145, 285], [306, 317], [480, 268], [665, 310], [820, 260], [1030, 305], [1240, 275]], day ? '#6d9a91' : '#4b586c');
  town(g, day); path(g, [[0, 355], [170, 332], [330, 366], [515, 337], [710, 372], [910, 337], [1090, 367], [1240, 340]], day ? '#4d806d' : '#294f52');
  promenade(g, day); terrace(g, day);
  palm(g, 92, 475, .78, day, -.05); palm(g, 1155, 468, .72, day, .05); palm(g, 245, 486, .48, day, -.02); palm(g, 1000, 485, .5, day, .02);
  for (let i = 0; i < 12; i++) cypress(g, 20 + i * 112, 520 + Math.sin(i) * 13, .34 + seeded(i + 7) * .2, day);
  for (let i = 0; i < 25; i++) { const left = i < 13, x = left ? seeded(i + 3) * 455 : 790 + seeded(i + 3) * 450, y = 545 + seeded(i + 55) * 270; flowerBed(g, x, y, .52 + y / 1050, day, i * 31); }
  if (!day) { for (let i = 0; i < 34; i++) { const alpha = .16 + .35 * (1 + Math.sin(time / 800 + i * 2)) / 2; g.globalAlpha = alpha; oval(g, seeded(i + 300) * WORLD_W, 500 + seeded(i + 800) * 330, 1.5 + seeded(i) * 1.8, 1.5, '#ffe6a5'); } g.globalAlpha = 1; }
}

export function paintForeground(g, day) {
  for (let i = 0; i < 10; i++) { const left = i < 5, x = left ? seeded(i + 201) * 340 : 900 + seeded(i + 210) * 340, y = 825 + seeded(i + 300) * 55; flowerBed(g, x, y, 1.2 + seeded(i + 33) * .55, day, i * 71); }
  g.save(); g.globalAlpha = .18; g.fillStyle = day ? '#123d5a' : '#dceef0'; for (let i = 0; i < 34; i++) { const x = seeded(i + 902) * WORLD_W, y = 675 + seeded(i + 1003) * 190; g.beginPath(); g.ellipse(x, y, 1.5, 10 + seeded(i + 10) * 8, seeded(i + 3) * .8, 0, Math.PI * 2); g.fill(); } g.restore();
}
