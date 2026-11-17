'use strict';
(() => {
const W = 100, H = 60, GROW_MS = 30000, REACH = 5.6;
const $ = id => document.getElementById(id);
const snd = n => { try { window.ZorrSound && ZorrSound.play(n); } catch (e) {} };
const cv = $('cv'), ctx = cv.getContext('2d'), stage = $('stage');

const SOLID = new Set([1, 3, 4, 5, 6, 7, 11, 14, 16]);
const HITS = {1: 3, 3: 6, 4: 4, 5: 6, 6: 2, 11: 2, 12: 1, 13: 1, 14: 8, 15: 2, 16: 4, 17: 4, 18: 3};
const TILE_COL = {1: '#8a6a45', 3: '#8a8a86', 4: '#b07a45', 5: '#a84c3e', 6: '#bfe3ea', 9: '#79975c', 10: '#4f7a3c', 11: '#e0cc8f', 12: '#e8a33a', 13: '#e86a8a', 14: '#e0b43a', 15: '#9a6a3a', 16: '#1c1c20', 17: '#1c1c20', 18: '#b5483a'};
const BED = 18; // kasur: bisa dilewati, klik/F untuk tidur (hanya malam) & menyimpan titik lahir
const LADDER = 15, BDOOR = 16, BDOOR_OPEN = 17; // pintu hitam: 16 tertutup (padat), 17 terbuka (bisa dilewati)
const ITEMS = [
  {id: 'fist', name: 'Fist', icon: '👊', tool: true},
  {id: 'pick', name: 'Pickaxe', icon: '⛏️', tool: true},
  {id: 1, name: 'Dirt', color: '#8a6a45'},
  {id: 3, name: 'Stone', color: '#8a8a86'},
  {id: 4, name: 'Wood', color: '#b07a45'},
  {id: 5, name: 'Brick', color: '#a84c3e'},
  {id: 6, name: 'Glass', color: '#bfe3ea'},
  {id: 9, name: 'Seed', icon: '🌱'},
  {id: 11, name: 'Sand', color: '#e0cc8f'},
  {id: 12, name: 'Torch', icon: '🔥'},
  {id: 13, name: 'Flower', icon: '🌼'},
  {id: 14, name: 'Gold Block', color: '#e0b43a'},
  {id: 15, name: 'Ladder', icon: '🪜'},
  {id: 16, name: 'Black Door', color: '#1c1c20'},
  {id: 18, name: 'Bed', icon: '🛏️'}
];
const OFFERS = [
  {name: 'Pickaxe (breaks blocks 2× faster)', id: 'pick', qty: 1, cost: 15, once: true},
  {name: 'Seed ×3', id: 9, qty: 3, cost: 6},
  {name: 'Stone ×10', id: 3, qty: 10, cost: 8},
  {name: 'Wood ×10', id: 4, qty: 10, cost: 10},
  {name: 'Brick ×5', id: 5, qty: 5, cost: 12},
  {name: 'Glass ×5', id: 6, qty: 5, cost: 15},
  {name: 'Sand ×10', id: 11, qty: 10, cost: 7},
  {name: 'Torch ×5 (glows, can be placed anywhere)', id: 12, qty: 5, cost: 9},
  {name: 'Flower ×3 (grows on dirt)', id: 13, qty: 3, cost: 6},
  {name: 'Ladder ×6 (hold Jump to climb)', id: 15, qty: 6, cost: 10},
  {name: 'Black Door ×2 (click it with a block selected to open/close)', id: 16, qty: 2, cost: 12},
  {name: 'Bed ×1 (sleep at night to skip to morning, and set your respawn point)', id: 18, qty: 1, cost: 20},
  {name: 'Gold Block ×1', id: 14, qty: 1, cost: 40}
];
const TIPS = [
  'Plant a seed on dirt, wait 30 seconds, then harvest it for gems.',
  'Tips kode: console.log() menampilkan tulisan di layar.',
  'Tips kode: let membuat variabel yang nilainya bisa berubah.',
  'Tips kode: if menjalankan perintah hanya jika kondisinya terpenuhi.',
  'Tips kode: for mengulang perintah sebanyak yang kamu mau.',
  'Dig down to find the stone layer. Bedrock cannot be destroyed.',
  'Gold ore glitters deep inside the stone layer. Mine it with a pickaxe!',
  'Place a Ladder and hold Jump to climb. Release to slide down slowly.',
  'Torches light up caves. Flowers only grow on top of dirt.',
  'Tips kode: while mengulang selama kondisinya masih benar.',
  'Tips kode: array.push() menambah isi daftar di bagian belakang.',
  'Zorr World dibuat oleh: King Rafa Rizquna, Mr.Zaky dan, Dixsya Egha. ',
  'Developer Zorr World: King Rafa Rizquna · Mr.Zaky Al-Jawi· Dixsya Egha.  · Terima kasih sudah bermain!'
];

let night = false;
try { night = localStorage.getItem('rantau.dunia.night') === '1'; } catch (e) {}
let world = null, inv = {1: 10, 3: 0, 4: 5, 5: 0, 6: 0, 9: 3, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 18: 0}, gems = 0, sel = 0, qd = {};
let pname = 'Traveler', shirt = '#c0563f', hasSave = false, started = true;
const SHIRTS = ['#c0563f', '#3f6fb0', '#607c4b', '#8a5aa8', '#d9a23a', '#2f2f2f'];
const cleanName = s => (s || '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
let cw = 800, ch = 500, dpr = 1, TS = 32, camX = 0, camY = 0;
const P = {x: 6.5, y: 30, vx: 0, vy: 0, on: false, face: 1, pw: 0.62, ph: 0.88, walk: 0};
const keys = {left: false, right: false, jump: false};
let hits = {}, particles = [], floaters = [], bubble = null, hover = null;
let ptrDown = false, lastAct = 0, dirty = false, tipIdx = 0;
let dev = false; // develop mode: item & gem tak terbatas

/* ---------- util ---------- */
const idx = (x, y) => y * W + x;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function tile(x, y) { if (y < 0) return 0; if (x < 0 || x >= W || y >= H) return 7; return world.tiles[idx(x, y)]; }
function setTile(x, y, v) { world.tiles[idx(x, y)] = v; dirty = true; }
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hh(x, y, k) { let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const norm = n => (n || '').trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').slice(0, 16) || 'valley';
const wkey = n => 'rantau.dunia.w.' + n;
const PKEY = 'rantau.dunia.player', LAST = 'rantau.dunia.last', DEVKEY = 'rantau.dunia.dev';

/* ---------- penyimpanan ---------- */
function loadPlayer() {
  try { const d = JSON.parse(localStorage.getItem(PKEY)); if (d) { inv = Object.assign(inv, d.inv); gems = d.gems | 0; qd = d.qd || {}; hasSave = true;
    pname = cleanName(d.name) || 'Traveler'; if (SHIRTS.includes(d.shirt)) shirt = d.shirt; } } catch (e) {}
}
function loadDev() { try { dev = localStorage.getItem(DEVKEY) === '1'; } catch (e) {} }
function savePlayer() { try { localStorage.setItem(PKEY, JSON.stringify({inv, gems, qd, name: pname, shirt})); } catch (e) {} }
function saveWorld() {
  if (!world) return;
  try {
    let s = '';
    for (let i = 0; i < W * H; i++) s += world.tiles[i].toString(16).padStart(2, '0');
    localStorage.setItem(wkey(world.name), JSON.stringify({t: s, p: world.plants, b: world.bed || null}));
    localStorage.setItem(LAST, world.name);
  } catch (e) {}
  savePlayer();
  dirty = false;
}

/* ---------- pembuatan dunia ---------- */
function generate(name) {
  const r = rng(hashStr(name));
  const a = r() * 6, b = r() * 6, c = r() * 6;
  const tiles = new Uint8Array(W * H), surf = [];
  for (let x = 0; x < W; x++) {
    let h = 30 + Math.round(2.2 * Math.sin(x * 0.13 + a) + 1.6 * Math.sin(x * 0.31 + b) + 1.0 * Math.sin(x * 0.05 + c));
    const d = Math.abs(x - 6);
    if (d <= 5) h = 30; else if (d < 9) h = Math.round(30 + (h - 30) * ((d - 5) / 4));
    surf.push(h);
  }
  for (let x = 0; x < W; x++) {
    const st = surf[x] + 8 + Math.floor(r() * 4);
    for (let y = surf[x]; y < H; y++) {
      let t = y >= st ? (r() < 0.12 ? 1 : 3) : 1;
      if (t === 3 && y > st + 3 && hh(x, y, 77) < 0.035) t = 14;           // bijih emas
      if (x > 14 && y - surf[x] < 3 && hh(Math.floor(x / 9), 3, 5) < 0.3) t = 11; // pasir
      if (y === H - 1 || (y === H - 2 && r() < 0.5)) t = 7;
      tiles[idx(x, y)] = t;
    }
  }
  tiles[idx(6, 29)] = 8;
  for (let x = 15; x < W; x++) { // bunga liar di rumput
    const y = surf[x] - 1;
    if (tiles[idx(x, y)] === 0 && tiles[idx(x, y + 1)] === 1 && hh(x, 0, 9) < 0.09) tiles[idx(x, y)] = 13;
  }
  for (let k = 0; k < 5; k++) {
    const x = 14 + Math.floor(r() * (W - 20)), y = surf[x] - 1;
    if (tiles[idx(x, y)] === 0 && tiles[idx(x, y + 1)] === 1) tiles[idx(x, y)] = 10;
  }
  return {tiles, surf};
}

function enterWorld(raw) {
  if (world) { saveWorld(); snd('enter'); }
  const name = norm(raw);
  const gen = generate(name);
  let data = null;
  try { data = JSON.parse(localStorage.getItem(wkey(name))); } catch (e) {}
  world = {name, tiles: gen.tiles, surf: gen.surf, plants: {}, bed: null};
  if (data && data.t && (data.t.length === W * H || data.t.length === W * H * 2)) {
    const two = data.t.length === W * H * 2; // format baru: 2 hex per tile; format lama: 1 hex per tile
    for (let i = 0; i < W * H; i++) world.tiles[i] = parseInt(two ? data.t.substr(i * 2, 2) : data.t[i], 16) || 0;
    world.plants = data.p || {};
  }
  if (data && data.b && Number.isInteger(data.b.x) && Number.isInteger(data.b.y)) world.bed = {x: data.b.x, y: data.b.y};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (world.tiles[idx(x, y)] === 9 && !world.plants[x + ',' + y]) world.plants[x + ',' + y] = Date.now();
  }
  hits = {}; particles = []; floaters = []; bubble = null;
  spawn();
  $('worldInput').value = name;
  $('worldChip').textContent = 'WORLD: ' + name.toUpperCase() + (dev ? ' · DEV' : '');
  say('', 'You entered world ' + name.toUpperCase() + '.', 'sys');
  saveWorld();
}
/* ---------- pintu: buka lalu masuk ke Valley Village ---------- */
let doorOpenAt = 0, doorBusy = false;
function nearDoor() { return Math.abs(P.x - 6.5) < 3 && Math.abs(P.y - 30) < 2.5; }
function useDoor() {
  if (doorBusy) return;
  doorBusy = true; doorOpenAt = performance.now(); snd('enter');
  toast('The door opens… heading to Valley Village'); say('', 'You open the door and step into Valley Village.', 'sys');
  try { saveWorld(); savePlayer(); } catch (e) {}
  setTimeout(() => { location.href = 'Old.html'; }, 750);
  setTimeout(() => { doorBusy = false; }, 2500); // jaga-jaga kalau navigasi dibatalkan
}
function spawn() {
  const b = world && world.bed;
  if (b && tile(b.x, b.y) === BED) { P.x = b.x + 0.5; P.y = b.y + 1 - 1e-3; } // respawn di kasur
  else { P.x = 8.5; P.y = 30; }
  P.vx = 0; P.vy = 0; P.on = false;
}
/* ---------- tidur ---------- */
let sleepAt = 0;
const sleeping = () => sleepAt > 0 && performance.now() - sleepAt < 2600;
function bedNear() {
  const cx = Math.floor(P.x), cy = Math.floor(P.y - 0.5);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (tile(cx + dx, cy + dy) === BED) return {x: cx + dx, y: cy + dy};
  return null;
}
function sleepInBed(tx, ty) {
  if (sleeping()) return;
  world.bed = {x: tx, y: ty}; dirty = true; // titik lahir disimpan per dunia
  if (!night) { toast('Spawn point set. You can only sleep at night 🌙'); say('', 'Spawn point set to this bed. You can only sleep at night (use the 🌙 button or /night).', 'sys'); snd('select'); saveWorld(); return; }
  sleepAt = performance.now(); P.vx = 0; keys.left = keys.right = keys.jump = false; snd('enter');
  say('', 'You go to sleep… 💤', 'sys');
  setTimeout(() => { setNight(false); say('', 'Good morning! You slept through the night. Your spawn point is set to this bed.', 'sys'); saveWorld(); }, 1300);
}

/* ---------- UI ---------- */
let toastT;
function toast(m) {
  const t = $('toast'); t.textContent = m; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1400);
}
function say(name, text, cls) {
  const log = $('log'), d = document.createElement('div');
  d.className = 'msg ' + (cls || '');
  if (name) { const b = document.createElement('b'); b.textContent = name + ': '; d.appendChild(b); }
  d.appendChild(document.createTextNode(text));
  log.appendChild(d);
  while (log.children.length > 80) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}
function buildHotbar() {
  const hb = $('hotbar'); hb.textContent = '';
  ITEMS.forEach((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.setAttribute('aria-label', it.name);
    const ico = document.createElement('span'); ico.className = 'ico';
    if (it.icon) ico.textContent = it.icon; else ico.style.background = it.color;
    const n = document.createElement('i'); n.textContent = i < 9 ? i + 1 : i === 9 ? 0 : '';
    const c = document.createElement('b'); c.className = 'cnt';
    b.append(ico, n, c);
    b.addEventListener('click', () => select(i));
    hb.appendChild(b);
  });
}
function hud() {
  $('gems').textContent = dev ? '∞' : gems;
  [...$('hotbar').children].forEach((b, i) => {
    const it = ITEMS[i], n = inv[it.id] || 0;
    b.querySelector('.cnt').textContent = it.tool ? '' : (dev ? '∞' : n);
    b.classList.toggle('sel', i === sel);
    b.classList.toggle('empty', !dev && (it.tool ? (it.id === 'pick' && n <= 0) : n <= 0));
  });
  const it = ITEMS[sel];
  $('selName').textContent = 'Selected: ' + it.name + (it.id === 'fist' ? ' — break blocks, harvest trees' : it.id === 'pick' ? ' — breaks blocks 2× faster, always drops the block' : it.id === 9 ? ' — plant on top of dirt' : it.id === 13 ? ' — plant on top of dirt, pure decoration' : it.id === 12 ? ' — glows, place anywhere' : it.id === 15 ? ' — place it, then hold Jump to climb' : it.id === 18 ? ' — place on a solid block, then click it (or press F) at night to sleep' : it.id === 16 ? ' — place it, then click it with a block selected to open/close' : ' — place on an empty tile');
}
function select(i) {
  if (!dev && ITEMS[i].id === 'pick' && !(inv.pick > 0)) { toast('Buy the Pickaxe in the Shop first'); snd('error'); return; }
  sel = i; hud(); snd('select');
}
function buildShop() {
  const box = $('shopList'); box.textContent = '';
  OFFERS.forEach(o => {
    const m = o.name.match(/^(.*?)\s*\((.*)\)$/);
    const title = m ? m[1] : o.name, desc = m ? m[2] : '';
    const row = document.createElement('div'); row.className = 'offer';
    const l = document.createElement('div'); l.className = 'o-info';
    const t = document.createElement('b'); t.className = 'o-name'; t.textContent = title; l.appendChild(t);
    if (desc) { const d = document.createElement('small'); d.textContent = desc; l.appendChild(d); }
    const b = document.createElement('button'); b.className = 'o-buy'; b.type = 'button';
    b.innerHTML = dev ? 'DEV' : '<span class="gem">💎</span><span>' + o.cost + '</span>';
    if (!dev && o.once && inv[o.id] > 0) { b.textContent = 'Owned'; b.disabled = true; }
    b.addEventListener('click', () => {
      if (dev) { toast('Develop mode: everything is already unlimited'); return; }
      if (o.once && inv[o.id] > 0) { toast('You already own this'); snd('error'); return; }
      if (gems < o.cost) { toast('Not enough gems'); snd('error'); return; }
      gems -= o.cost; inv[o.id] = (inv[o.id] || 0) + o.qty; hud(); savePlayer(); toast('Bought: ' + o.name); snd('buy');
      if (o.once) { buildShop(); if (o.id === 'pick') select(ITEMS.findIndex(i => i.id === 'pick')); }
    });
    row.append(l, b); box.appendChild(row);
  });
}

/* ---------- aksi pemain ---------- */
function burst(tx, ty, color, n) {
  for (let i = 0; i < n; i++) particles.push({x: tx + 0.5, y: ty + 0.5, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6, life: 0.5, c: color});
}
function floater(tx, ty, text) { floaters.push({x: tx + 0.5, y: ty, text, life: 1}); }
function inRange(tx, ty) {
  const dx = tx + 0.5 - P.x, dy = ty + 0.5 - (P.y - P.ph / 2);
  return dx * dx + dy * dy <= REACH * REACH;
}
function overlapsPlayer(tx, ty) {
  const hw = P.pw / 2;
  return P.x + hw > tx && P.x - hw < tx + 1 && P.y > ty && P.y - P.ph < ty + 1;
}
let bdoorT = 0;
function toggleBDoor(tx, ty, t) {
  const now = performance.now();
  if (now - bdoorT < 350) return; // tahan klik tidak membuat pintu berkedip
  if (!inRange(tx, ty)) { toast('Too far away'); snd('error'); return; }
  if (t === BDOOR_OPEN && overlapsPlayer(tx, ty)) { toast('You are in the way!'); snd('error'); return; }
  bdoorT = now;
  setTile(tx, ty, t === BDOOR ? BDOOR_OPEN : BDOOR);
  snd(t === BDOOR ? 'enter' : 'place'); savePlayer();
}
function act(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return;
  if (!inRange(tx, ty)) { toast('Too far away'); snd('error'); return; }
  const it = ITEMS[sel], t = tile(tx, ty), key = tx + ',' + ty;
  if (t === 8) { useDoor(); return; }
  if (sleeping()) return;
  if (t === BED && !it.tool) { sleepInBed(tx, ty); return; } // alat (Fist/Pickaxe) = bongkar kasur
  if ((t === BDOOR || t === BDOOR_OPEN) && !it.tool) { toggleBDoor(tx, ty, t); return; } // alat (Fist/Pickaxe) = bongkar pintu
  if (it.tool) {
    const pick = it.id === 'pick';
    if (t === 0) return;
    if (t === 7) { toast('Bedrock cannot be destroyed'); snd('error'); return; }
    
    if (t === 10) {
      setTile(tx, ty, 0); delete world.plants[key];
      const g = rnd(2, 6); gems += g; inv[9] = (inv[9] || 0) + 1;
      let extra = '';
      if (Math.random() < 0.5) { const k = rnd(1, 3); inv[4] = (inv[4] || 0) + k; extra = ' +' + k + ' Wood'; }
      burst(tx, ty, '#4f7a3c', 8); burst(tx, ty, '#e0b43a', 5);
      floater(tx, ty, '+' + g + '💎 +1🌱' + extra);
      snd('harvest'); hud(); savePlayer(); return;
    }
    if (t === 9) {
      setTile(tx, ty, 0); delete world.plants[key]; inv[9] = (inv[9] || 0) + 1;
      floater(tx, ty, '+1🌱'); snd('hit'); hud(); return;
    }
    const now = performance.now();
    let e = hits[key], msg0 = '';
    const need = pick ? Math.max(1, Math.ceil(HITS[t] / 2)) : HITS[t];
    if (!e || now - e.t > 2000) e = {h: 0, t: now};
    e.h++; e.t = now; e.need = need; hits[key] = e;
    burst(tx, ty, TILE_COL[t], 2);
    if (e.h < need) snd('hit');
    if (e.h >= need) {
      snd('break');
      delete hits[key]; setTile(tx, ty, 0);
      burst(tx, ty, TILE_COL[t], 8);
      const up = tile(tx, ty - 1);
      if (t === 1 && (up === 9 || up === 10)) {
        setTile(tx, ty - 1, 0); delete world.plants[tx + ',' + (ty - 1)]; inv[9] = (inv[9] || 0) + 1;
      } else if (up === 13 && (t === 1 || t === 11)) { setTile(tx, ty - 1, 0); inv[13] = (inv[13] || 0) + 1; }
      if (t === 14) { const g = rnd(4, 9); gems += g; msg0 = ' +' + g + '💎'; burst(tx, ty, '#fff3b0', 10); snd('gem'); }
      let msg = msg0; msg0 = '';
      const drop = t === BDOOR_OPEN ? BDOOR : t;
      if (pick || Math.random() < 0.7) { inv[drop] = (inv[drop] || 0) + 1; msg = '+1 ' + ITEMS.find(i => i.id === drop).name; }
      if (Math.random() < 0.2) { inv[9] = (inv[9] || 0) + 1; msg += ' +1🌱'; }
      if (Math.random() < 0.3) { const g = rnd(1, 2); gems += g; msg += ' +' + g + '💎'; }
      if (msg) floater(tx, ty, msg.trim());
      hud(); savePlayer();
    }
    return;
  }
  if (t !== 0) { toast('Tile is already occupied'); snd('error'); return; }
  if (!dev && (inv[it.id] || 0) <= 0) { toast('Out of ' + it.name); snd('error'); return; }
  if (it.id === 9) {
    if (tile(tx, ty + 1) !== 1) { toast('Seeds only grow on top of dirt'); snd('error'); return; }
    setTile(tx, ty, 9); world.plants[key] = Date.now(); if (!dev) inv[9]--;
    floater(tx, ty, '🌱'); snd('plant');
  } else if (it.id === 13) {
    if (tile(tx, ty + 1) !== 1) { toast('Flowers only grow on top of dirt'); snd('error'); return; }
    setTile(tx, ty, 13); if (!dev) inv[13]--;
    floater(tx, ty, '🌼'); snd('plant');
  } else if (it.id === BED) {
    if (!SOLID.has(tile(tx, ty + 1))) { toast('Beds must rest on a solid block'); snd('error'); return; }
    setTile(tx, ty, BED); if (!dev) inv[BED]--;
    toast('Click the bed with a block selected (or press F) to sleep'); snd('place');
  } else {
    if (SOLID.has(it.id) && overlapsPlayer(tx, ty)) { toast('You are in the way!'); snd('error'); return; }
    setTile(tx, ty, it.id); if (!dev) inv[it.id]--;
    if (it.id === BDOOR) toast('Click the door with a block selected to open it');
    snd(it.id === 12 ? 'torch' : it.id === LADDER ? 'ladder' : 'place');
  }
  hud(); savePlayer();
}

/* ---------- fisika ---------- */
function onLadder() {
  const cx = Math.floor(P.x);
  return tile(cx, Math.floor(P.y - P.ph / 2)) === LADDER || tile(cx, Math.floor(P.y - 0.1)) === LADDER;
}
function update(dt) {
  if (sleeping()) keys.left = keys.right = keys.jump = false;
  const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), hw = P.pw / 2;
  P.vx = ax * 5.8;
  if (ax) P.face = ax;
  if (dev && keys.jump) { P.vy = -9; P.on = false; } // develop mode: tahan Jump untuk terbang
  else if (keys.jump && P.on && !onLadder()) { P.vy = -17.2; P.on = false; snd('jump'); }
  const pvy = P.vy, wasOn = P.on;
  P.vy = Math.min(P.vy + 55 * dt, 26);
  if (onLadder()) { // tangga: tahan Jump untuk naik, lepas untuk meluncur pelan
    P.vy = keys.jump ? -4.6 : 2.4; P.on = false;
    if (keys.jump && (P.climbT = (P.climbT || 0) + dt) > 0.22) { P.climbT = 0; snd('climb'); }
  }

  let nx = P.x + P.vx * dt;
  if (P.vx !== 0) {
    const tx = Math.floor(P.vx > 0 ? nx + hw : nx - hw);
    const top = P.y - P.ph, bot = P.y - 1e-4;
    let hit = false;
    for (let ty = Math.floor(top); ty <= Math.floor(bot); ty++) if (SOLID.has(tile(tx, ty))) { hit = true; break; }
    if (hit) nx = P.vx > 0 ? tx - hw - 1e-3 : tx + 1 + hw + 1e-3;
  }
  P.x = Math.max(hw, Math.min(W - hw, nx));

  let ny = P.y + P.vy * dt; P.on = false;
  const l = Math.floor(P.x - hw), r = Math.floor(P.x + hw);
  if (P.vy > 0) {
    const ty = Math.floor(ny);
    let hit = false;
    for (let tx = l; tx <= r; tx++) if (SOLID.has(tile(tx, ty))) { hit = true; break; }
    if (hit) { ny = ty - 1e-4; P.vy = 0; P.on = true; }
  } else if (P.vy < 0) {
    const ty = Math.floor(ny - P.ph);
    let hit = false;
    for (let tx = l; tx <= r; tx++) if (SOLID.has(tile(tx, ty))) { hit = true; break; }
    if (hit) { ny = ty + 1 + P.ph + 1e-3; P.vy = 0; }
  }
  P.y = ny;
  if (dev && P.y < 2) { P.y = 2; if (P.vy < 0) P.vy = 0; }
  if (P.y > H + 3) { spawn(); toast('Back at the door'); }
  if (P.on && !wasOn && pvy > 9) snd('land');
  if (ax && P.on) { const w0 = Math.floor(P.walk / Math.PI); P.walk += dt * 12; if (Math.floor(P.walk / Math.PI) !== w0) snd('step'); } else if (!ax) P.walk = 0;

  particles.forEach(p => { p.vy += 22 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  particles = particles.filter(p => p.life > 0);
  floaters.forEach(f => { f.y -= 1.1 * dt; f.life -= dt * 0.7; });
  floaters = floaters.filter(f => f.life > 0);
  const now = performance.now();
  for (const k in hits) if (now - hits[k].t > 2000) delete hits[k];
}
let growT = 0;
function growPlants(dt) {
  growT += dt; if (growT < 0.5) return; growT = 0;
  const now = Date.now();
  for (const k in world.plants) {
    const [x, y] = k.split(',').map(Number), t = world.tiles[idx(x, y)];
    if (t === 9 && now - world.plants[k] >= GROW_MS) { setTile(x, y, 10); }
    else if (t !== 9 && t !== 10) delete world.plants[k];
  }
}

/* ---------- gambar ---------- */
function drawTile(t, x, y, sx, sy, now) {
  const S = TS;
  switch (t) {
    case 1: {
      ctx.fillStyle = '#8a6a45'; ctx.fillRect(sx, sy, S, S);
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = k % 2 ? '#6f5436' : '#9c7a52';
        ctx.fillRect(sx + (hh(x, y, k) * (S - 4) | 0), sy + (hh(x, y, k + 9) * (S - 4) | 0), 3, 3);
      }
      if (y <= world.surf[x] && !SOLID.has(tile(x, y - 1))) {
        ctx.fillStyle = '#607c4b'; ctx.fillRect(sx, sy, S, Math.round(S * 0.24));
        ctx.fillStyle = '#79975c'; ctx.fillRect(sx, sy, S, 3);
      }
      break;
    }
    case 3:
      ctx.fillStyle = '#8a8a86'; ctx.fillRect(sx, sy, S, S);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 ? '#74746f' : '#a0a09a';
        ctx.fillRect(sx + (hh(x, y, k) * (S - 8) | 0), sy + (hh(x, y, k + 7) * (S - 8) | 0), 7, 5);
      }
      break;
    case 4:
      ctx.fillStyle = '#b07a45'; ctx.fillRect(sx, sy, S, S);
      ctx.fillStyle = '#8c5e33';
      for (let k = 1; k < 3; k++) ctx.fillRect(sx, sy + k * S / 3 | 0, S, 2);
      ctx.fillRect(sx, sy, S, 2); ctx.fillRect(sx, sy + S - 2, S, 2);
      break;
    case 5: {
      ctx.fillStyle = '#a84c3e'; ctx.fillRect(sx, sy, S, S);
      ctx.fillStyle = '#d9c3a0';
      const rh = S / 4;
      for (let r = 0; r < 4; r++) {
        const yy = sy + r * rh | 0;
        ctx.fillRect(sx, yy, S, 2);
        ctx.fillRect(sx + (r % 2 ? S * 0.25 : S * 0.6) | 0, yy, 2, rh);
      }
      break;
    }
    case 6:
      ctx.fillStyle = 'rgba(190,230,240,.5)'; ctx.fillRect(sx, sy, S, S);
      ctx.strokeStyle = '#7fb4c2'; ctx.lineWidth = 2; ctx.strokeRect(sx + 1, sy + 1, S - 2, S - 2);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillRect(sx + 5, sy + 5, 3, S * 0.45); ctx.fillRect(sx + 11, sy + 5, 2, S * 0.2);
      break;
    case 7:
      ctx.fillStyle = '#3a3632'; ctx.fillRect(sx, sy, S, S);
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = k % 2 ? '#25221f' : '#4d4741';
        ctx.fillRect(sx + (hh(x, y, k) * (S - 7) | 0), sy + (hh(x, y, k + 5) * (S - 7) | 0), 6, 5);
      }
      break;
    case 8: {
      const open = doorBusy && now - doorOpenAt < 2500;
      ctx.fillStyle = '#5a3d2a'; ctx.fillRect(sx + 3, sy + 2, S - 6, S - 2);        // kusen
      if (open) {
        ctx.fillStyle = night ? '#e8b25a' : '#ffe9a8'; ctx.fillRect(sx + 6, sy + 5, S - 12, S - 5); // cahaya dari dalam
        ctx.fillStyle = '#8a6a45'; ctx.fillRect(sx + 6, sy + 5, 6, S - 5);          // daun pintu terbuka
        ctx.fillStyle = '#b88a36'; ctx.fillRect(sx + 9, sy + S * 0.55, 2, 3);
      } else {
        ctx.fillStyle = '#c4a477'; ctx.fillRect(sx + 6, sy + 5, S - 12, S - 5);
        ctx.fillStyle = '#a88858'; ctx.fillRect(sx + S / 2 - 1, sy + 5, 2, S - 5);
        ctx.fillStyle = '#b88a36'; ctx.fillRect(sx + S - 12, sy + S * 0.55, 3, 3);
      }
      if (nearDoor() && !open) { ctx.fillStyle = '#fff3b0'; ctx.font = '14px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillText('F / tap', sx + S / 2, sy - 22); }
      break;
    }
    case 11:
      ctx.fillStyle = '#e0cc8f'; ctx.fillRect(sx, sy, S, S);
      for (let k = 0; k < 7; k++) {
        ctx.fillStyle = k % 2 ? '#cbb577' : '#efe0a8';
        ctx.fillRect(sx + (hh(x, y, k) * (S - 3) | 0), sy + (hh(x, y, k + 11) * (S - 3) | 0), 3, 2);
      }
      break;
    case 12: { // obor
      ctx.fillStyle = '#76533b'; ctx.fillRect(sx + S / 2 - 2, sy + S * 0.4, 4, S * 0.55);
      const fl = Math.sin(now / 90 + x * 3) * 1.5;
      ctx.fillStyle = '#e8741f'; ctx.beginPath(); ctx.ellipse(sx + S / 2, sy + S * 0.3, 5, 8 + fl, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd25a'; ctx.beginPath(); ctx.ellipse(sx + S / 2, sy + S * 0.34, 2.6, 4.5 + fl / 2, 0, 0, 7); ctx.fill();
      break;
    }
    case 13: { // bunga
      const col = ['#e86a8a', '#f2c94c', '#b58be0', '#ffffff'][Math.floor(hh(x, y, 4) * 4)];
      ctx.fillStyle = '#4f7a3c'; ctx.fillRect(sx + S / 2 - 1, sy + S * 0.45, 3, S * 0.55);
      ctx.fillRect(sx + S / 2 + 1, sy + S * 0.7, 5, 3);
      ctx.fillStyle = col;
      [[-5, 0], [5, 0], [0, -5], [0, 5]].forEach(([a, b]) => ctx.fillRect(sx + S / 2 - 2 + a, sy + S * 0.4 - 2 + b, 5, 5));
      ctx.fillStyle = '#f2c94c'; ctx.fillRect(sx + S / 2 - 2, sy + S * 0.4 - 2, 5, 5);
      break;
    }
    case 14: { // bijih / balok emas
      ctx.fillStyle = '#c99a2b'; ctx.fillRect(sx, sy, S, S);
      ctx.fillStyle = '#e0b43a'; ctx.fillRect(sx + 2, sy + 2, S - 4, S - 4);
      ctx.fillStyle = '#f6dc7a'; ctx.fillRect(sx + 4, sy + 4, S - 12, 4); ctx.fillRect(sx + 4, sy + 4, 4, S - 12);
      ctx.fillStyle = '#a77a1e'; ctx.fillRect(sx + S - 6, sy + 4, 2, S - 8); ctx.fillRect(sx + 4, sy + S - 6, S - 8, 2);
      const tw = (Math.sin(now / 300 + x * 5 + y) + 1) / 2;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.6 * tw) + ')'; ctx.fillRect(sx + S * 0.62, sy + S * 0.3, 3, 3);
      break;
    }
    case 18: { // kasur
      ctx.fillStyle = '#5a3d2a'; ctx.fillRect(sx + 1, sy + S * 0.3, 4, S * 0.7);                 // papan kepala
      ctx.fillRect(sx + S - 5, sy + S * 0.62, 4, S * 0.38);                                      // papan kaki
      ctx.fillStyle = '#7a5538'; ctx.fillRect(sx + 1, sy + S * 0.78, S - 2, S * 0.22);           // rangka
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(sx + 5, sy + S * 0.5, S * 0.3, S * 0.2);           // bantal
      ctx.fillStyle = '#b5483a'; ctx.fillRect(sx + 5 + S * 0.3, sy + S * 0.5, S - 10 - S * 0.3, S * 0.28); // selimut
      ctx.fillStyle = '#d06a5a'; ctx.fillRect(sx + 5 + S * 0.3, sy + S * 0.5, S - 10 - S * 0.3, 3);
      const bn = bedNear();
      if (bn && bn.x === x && bn.y === y && !sleeping()) { ctx.fillStyle = '#fff3b0'; ctx.font = '14px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillText(night ? 'F / tap: sleep' : 'F / tap', sx + S / 2, sy - 8); }
      break;
    }
    case 16: // pintu hitam (tertutup)
      ctx.fillStyle = '#0d0d10'; ctx.fillRect(sx + 3, sy, S - 6, S);               // kusen
      ctx.fillStyle = '#26262b'; ctx.fillRect(sx + 5, sy + 2, S - 10, S - 2);      // daun pintu
      ctx.fillStyle = '#34343b'; ctx.fillRect(sx + 8, sy + 5, S - 16, S * 0.32); ctx.fillRect(sx + 8, sy + S * 0.5, S - 16, S * 0.38); // panel
      ctx.fillStyle = '#d9b44a'; ctx.fillRect(sx + S - 12, sy + S * 0.55, 3, 3);   // gagang
      break;
    case 17: // pintu hitam (terbuka)
      ctx.fillStyle = '#0d0d10'; ctx.fillRect(sx + 3, sy, S - 6, S);
      ctx.fillStyle = night ? '#e8b25a' : '#ffe9a8'; ctx.fillRect(sx + 5, sy + 2, S - 10, S - 2); // cahaya dari dalam
      ctx.fillStyle = '#26262b'; ctx.fillRect(sx + 5, sy + 2, 5, S - 2);                          // daun pintu terbuka
      ctx.fillStyle = '#d9b44a'; ctx.fillRect(sx + 8, sy + S * 0.55, 2, 3);
      break;
    case 15: // tangga
      ctx.fillStyle = '#9a6a3a'; ctx.fillRect(sx + 5, sy, 4, S); ctx.fillRect(sx + S - 9, sy, 4, S);
      ctx.fillStyle = '#b88550';
      for (let k = 0; k < 4; k++) ctx.fillRect(sx + 5, sy + 3 + k * (S / 4) | 0, S - 10, 3);
      break;
    case 9: {
      const born = world.plants[x + ',' + y] || now;
      const p = Math.min(1, (Date.now() - born) / GROW_MS), h = S * (0.25 + 0.55 * p);
      ctx.fillStyle = '#405b38'; ctx.fillRect(sx + S / 2 - 1, sy + S - h, 3, h);
      ctx.fillStyle = '#79975c';
      ctx.fillRect(sx + S / 2 - 6, sy + S - h + 2, 6, 4); ctx.fillRect(sx + S / 2 + 2, sy + S - h - 2, 6, 4);
      break;
    }
  }
}
function drawTree(sx, sy) {
  const S = TS;
  ctx.fillStyle = '#76533b'; ctx.fillRect(sx + S * 0.4, sy + S * 0.25, S * 0.2, S * 0.75);
  ctx.fillStyle = '#4f7a3c';
  ctx.beginPath(); ctx.arc(sx + S / 2, sy - S * 0.05, S * 0.75, 0, 7); ctx.fill();
  ctx.fillStyle = '#6a9a4f';
  ctx.beginPath(); ctx.arc(sx + S * 0.4, sy - S * 0.2, S * 0.45, 0, 7); ctx.fill();
  ctx.fillStyle = '#e0b43a';
  [[0.25, 0.05], [0.7, -0.1], [0.5, 0.25]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(sx + S * a + S * 0.1, sy + S * b, 3, 0, 7); ctx.fill(); });
}
function drawPlayer(now) {
  const w = P.pw * TS, h = P.ph * TS, cx = Math.round(P.x * TS - camX), by = Math.round(P.y * TS - camY);
  const sw = P.on ? Math.sin(P.walk) * w * 0.16 : 0;
  const bob = P.on && P.vx !== 0 ? Math.abs(Math.sin(P.walk)) * 1.5 : 0;
  const ty = by - h - bob;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, by, w * 0.5, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3f5638';
  ctx.fillRect(cx - w * 0.4 + sw, ty + h * 0.72, w * 0.34, h * 0.28);
  ctx.fillRect(cx + w * 0.06 - sw, ty + h * 0.72, w * 0.34, h * 0.28);
  ctx.fillStyle = shirt; ctx.fillRect(cx - w * 0.5, ty + h * 0.4, w, h * 0.34);
  ctx.fillStyle = '#f0c9a0'; ctx.fillRect(cx - w * 0.42, ty + h * 0.12, w * 0.84, h * 0.3);
  ctx.fillStyle = '#302b25';
  ctx.fillRect(cx + P.face * w * 0.08 - 1, ty + h * 0.24, 2, 3);
  ctx.fillRect(cx + P.face * w * 0.28 - 1, ty + h * 0.24, 2, 3);
  ctx.fillStyle = '#d9b45a';
  ctx.fillRect(cx - w * 0.7, ty + h * 0.1, w * 1.4, 3);
  ctx.fillRect(cx - w * 0.4, ty - 1, w * 0.8, h * 0.13);
  if (ITEMS[sel].id === 'pick') { // pickaxe in hand
    const hx = cx + P.face * w * 0.5, hy = ty + h * 0.58, f = P.face;
    const sw2 = (performance.now() - lastAct < 160) ? 0.9 : 0, ang = f * (0.5 + sw2);
    const dx = Math.sin(ang) * 14, dy = -Math.cos(ang) * 14;
    ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#76533b';
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + dx, hy + dy); ctx.stroke();
    const px = -dy / 14, py = dx / 14; // perpendicular
    ctx.lineWidth = 3; ctx.strokeStyle = '#a0a09a';
    ctx.beginPath(); ctx.moveTo(hx + dx - px * 7, hy + dy - py * 7); ctx.lineTo(hx + dx + px * 7, hy + dy + py * 7); ctx.stroke();
    ctx.lineCap = 'butt';
  }
  ctx.textAlign = 'center';
  ctx.font = '16px VT323, monospace';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.fillStyle = '#fff';
  ctx.strokeText(pname, cx, ty - 6); ctx.fillText(pname, cx, ty - 6);
  if (bubble && now < bubble.until) {
    ctx.font = '18px VT323, monospace';
    const tw = ctx.measureText(bubble.text).width + 14, bx = Math.round(cx - tw / 2), byy = ty - 40;
    ctx.fillStyle = '#fff7e3'; ctx.fillRect(bx, byy, tw, 22);
    ctx.strokeStyle = '#302b25'; ctx.lineWidth = 2; ctx.strokeRect(bx, byy, tw, 22);
    ctx.fillStyle = '#302b25'; ctx.fillText(bubble.text, cx, byy + 16);
  }
}
function draw(now) {
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  if (night) { g.addColorStop(0, '#0b1230'); g.addColorStop(1, '#27345f'); } else { g.addColorStop(0, '#86bfe4'); g.addColorStop(1, '#d8ecd2'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  camX = Math.round(Math.max(0, Math.min(W * TS - cw, P.x * TS - cw / 2)));
  camY = Math.round(Math.max(0, Math.min(H * TS - ch, P.y * TS - ch * 0.62)));

  if (night) {
    for (let i = 0; i < 70; i++) { // bintang berkelip
      const sx = (hh(i, 1, 3) * cw), sy = hh(i, 2, 4) * ch * 0.7, tw = 0.5 + 0.5 * Math.sin(now / 500 + i * 2.1);
      ctx.fillStyle = 'rgba(255,255,230,' + (0.35 + 0.55 * tw).toFixed(2) + ')'; ctx.fillRect(sx | 0, sy | 0, i % 7 ? 2 : 3, i % 7 ? 2 : 3);
    }
    ctx.fillStyle = '#eef1ff'; ctx.beginPath(); ctx.arc(cw - 70, 60, 24, 0, 7); ctx.fill();   // bulan sabit
    ctx.fillStyle = '#16204a'; ctx.beginPath(); ctx.arc(cw - 60, 54, 21, 0, 7); ctx.fill();
  } else { ctx.fillStyle = '#f2d77f'; ctx.beginPath(); ctx.arc(cw - 70, 60, 26, 0, 7); ctx.fill(); }
  ctx.fillStyle = night ? 'rgba(180,195,235,.22)' : 'rgba(255,255,255,.8)';
  const per = cw + 300;
  for (let i = 0; i < 5; i++) {
    const x = (((i * 340 + 60 - camX * 0.25) % per) + per) % per - 150, y = 50 + (i % 2) * 40 - camY * 0.1;
    ctx.beginPath(); ctx.ellipse(x, y, 40, 14, 0, 0, 7); ctx.ellipse(x + 22, y - 8, 26, 12, 0, 0, 7); ctx.fill();
  }

  const x0 = Math.max(0, Math.floor(camX / TS)), x1 = Math.min(W - 1, Math.floor((camX + cw) / TS));
  const y0 = Math.max(0, Math.floor(camY / TS)), y1 = Math.min(H - 1, Math.floor((camY + ch) / TS));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = world.tiles[idx(x, y)], sx = x * TS - camX, sy = y * TS - camY;
    /* tile kosong (blok yang dihancurkan) langsung tampil sebagai langit, tanpa latar gua */
    if (t && t !== 10) drawTile(t, x, y, sx, sy, now);
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const tt = world.tiles[idx(x, y)];
    if (tt === 10) drawTree(x * TS - camX, y * TS - camY);
    else if (tt === 12) {
      const gx = x * TS - camX + TS / 2, gy = y * TS - camY + TS * 0.35, gr = TS * (3.4 + Math.sin(now / 140 + x) * 0.15);
      const gg = ctx.createRadialGradient(gx, gy, 2, gx, gy, gr);
      gg.addColorStop(0, 'rgba(255,190,80,.38)'); gg.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = gg; ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }
  }

  for (const k in hits) {
    const [x, y] = k.split(',').map(Number), t = tile(x, y);
    if (!HITS[t]) continue;
    const r = hits[k].h / (hits[k].need || HITS[t]), sx = x * TS - camX, sy = y * TS - camY;
    ctx.strokeStyle = 'rgba(30,20,10,.8)'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(sx + TS * 0.5, sy + 2); ctx.lineTo(sx + TS * 0.4, sy + TS * 0.5 * Math.min(1, r * 2));
    if (r > 0.4) { ctx.moveTo(sx + 3, sy + TS * 0.6); ctx.lineTo(sx + TS * 0.5, sy + TS * 0.5); ctx.lineTo(sx + TS - 3, sy + TS * 0.7); }
    if (r > 0.7) { ctx.moveTo(sx + TS * 0.7, sy + TS * 0.2); ctx.lineTo(sx + TS * 0.55, sy + TS * 0.5); ctx.lineTo(sx + TS * 0.6, sy + TS - 3); }
    ctx.stroke();
  }
  if (hover) {
    const sx = hover.x * TS - camX, sy = hover.y * TS - camY;
    ctx.strokeStyle = inRange(hover.x, hover.y) ? 'rgba(255,255,255,.95)' : 'rgba(168,76,62,.95)';
    ctx.lineWidth = 2; ctx.strokeRect(sx + 1, sy + 1, TS - 2, TS - 2);
  }
  drawPlayer(now);
  if (night) { // gelap + cahaya obor / senter pemain
    ctx.fillStyle = 'rgba(6,10,38,.52)'; ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';
    const lights = [[P.x * TS - camX, (P.y - P.ph / 2) * TS - camY, TS * 3.2, 0.22]];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const tt = world.tiles[idx(x, y)];
      if (tt === 12) lights.push([x * TS - camX + TS / 2, y * TS - camY + TS * 0.4, TS * (5 + Math.sin(now / 140 + x) * 0.25), 0.5]);
      else if (tt === 8) lights.push([x * TS - camX + TS / 2, y * TS - camY + TS * 0.5, TS * 2.6, 0.32]);
    }
    for (const [lx, ly, lr, a] of lights) {
      const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, lr);
      lg.addColorStop(0, 'rgba(255,190,90,' + a + ')'); lg.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = lg; ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  particles.forEach(p => { ctx.fillStyle = p.c; ctx.fillRect(p.x * TS - camX, p.y * TS - camY, 4, 4); });
  ctx.font = 'bold 14px Nunito, sans-serif'; ctx.textAlign = 'center';
  floaters.forEach(f => {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#fff3b0';
    ctx.strokeText(f.text, f.x * TS - camX, f.y * TS - camY); ctx.fillText(f.text, f.x * TS - camX, f.y * TS - camY);
    ctx.globalAlpha = 1;
  });
  if (sleeping()) { // layar memudar gelap lalu kembali terang
    const k = (performance.now() - sleepAt) / 2600, a = Math.min(1, Math.sin(Math.PI * k) * 1.6);
    ctx.fillStyle = 'rgba(4,6,24,' + a + ')'; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.font = 'bold 28px Nunito, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('💤 Zzz…', cw / 2, ch / 2);
  }
}

/* ---------- loop & ukuran ---------- */
let last = performance.now();
function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000); last = t;
  if (stage.clientWidth !== lastSW || stage.clientHeight !== lastSH || (window.devicePixelRatio || 1) !== dpr) resize();
  update(dt); growPlants(dt);
  if (ptrDown && hover && t - lastAct > 180) { lastAct = t; act(hover.x, hover.y); }
  draw(t);
  requestAnimationFrame(loop);
}
let lastSW = 0, lastSH = 0;
function resize() {
  lastSW = stage.clientWidth; lastSH = stage.clientHeight;
  const ncw = Math.max(200, lastSW), nch = Math.max(200, lastSH), ndpr = window.devicePixelRatio || 1;
  if (ncw !== cw || nch !== ch || ndpr !== dpr || cv.width !== ncw * ndpr) { // jangan sentuh kanvas kalau ukuran sama (mencegah kedip)
    cw = ncw; ch = nch; dpr = ndpr;
    cv.width = cw * dpr; cv.height = ch * dpr;
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  TS = cw < 520 ? 28 : 32;
}

/* ---------- input ---------- */
function setHover(e) {
  const r = cv.getBoundingClientRect();
  hover = {x: Math.floor((e.clientX - r.left + camX) / TS), y: Math.floor((e.clientY - r.top + camY) / TS)};
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  ptrDown = true; setHover(e); lastAct = performance.now(); act(hover.x, hover.y);
});
cv.addEventListener('pointermove', setHover);
const endPtr = e => { ptrDown = false; if (e.pointerType === 'touch') hover = null; };
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = null; });
cv.addEventListener('contextmenu', e => e.preventDefault());

const typing = () => document.activeElement && document.activeElement.tagName === 'INPUT';
const KMAP = {KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', Space: 'jump'};
addEventListener('keydown', e => {
  if (typing() || !started) return;
  if (KMAP[e.code]) { keys[KMAP[e.code]] = true; e.preventDefault(); return; }
  const m = /^Digit([0-9])$/.exec(e.code);
  if (m) { const n = +m[1] === 0 ? 9 : +m[1] - 1; if (n < ITEMS.length) select(n); return; }
  if (e.code === 'KeyQ') { select((sel + ITEMS.length - 1) % ITEMS.length); return; }
  if (e.code === 'KeyF' && nearDoor()) { useDoor(); return; }
  if (e.code === 'KeyF') { const b = bedNear(); if (b) { sleepInBed(b.x, b.y); return; } }
  if (e.code === 'KeyE') { select((sel + 1) % ITEMS.length); return; }
  if (e.code === 'Enter') { e.preventDefault(); $('chatInput').focus(); }
});
addEventListener('keyup', e => { if (KMAP[e.code]) { keys[KMAP[e.code]] = false; if (!typing()) e.preventDefault(); } });
/* tombol hotbar/tab/dll. tidak menahan fokus, jadi Spasi (lompat) tidak memicu klik ganda */
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (b && b.type !== 'submit') b.blur(); });
const releaseAll = () => { keys.left = keys.right = keys.jump = false; ptrDown = false; ['btnL','btnR','btnJ'].forEach(id => $(id).classList.remove('on')); };
addEventListener('blur', releaseAll);
addEventListener('pagehide', releaseAll);
addEventListener('orientationchange', () => { releaseAll(); void 0; });
$('chatInput').addEventListener('focus', releaseAll);

function bindHold(id, name) {
  const el = $(id);
  const on = e => {
    e.preventDefault(); keys[name] = true; el.classList.add('on');
    try { el.setPointerCapture(e.pointerId); } catch (_) {}   /* jari geser keluar tombol tidak melepas gerakan */
  };
  const off = () => { keys[name] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, off));
  el.addEventListener('mousedown', e => e.preventDefault());  /* jangan ambil fokus, supaya Spasi/Enter tidak menekan tombol lagi */
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindHold('btnL', 'left'); bindHold('btnR', 'right'); bindHold('btnJ', 'jump');

document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
  snd('click');
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + b.dataset.p));
}));

$('worldForm').addEventListener('submit', e => { e.preventDefault(); enterWorld($('worldInput').value); $('worldInput').blur(); });
$('chatInput').addEventListener('keydown', e => { if (e.key === 'Escape') e.target.blur(); });
$('chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('chatInput'), text = inp.value.trim().slice(0, 80);
  inp.value = '';
  if (!text) return;
  if (text[0] === '/') { command(text); return; }
  bubble = {text, until: performance.now() + 4500};
  say(pname, text); snd('click');
  if (/\b(halo|hai|hi|hey|hello)\b/i.test(text)) setTimeout(() => say('Zorr', 'Hi, ' + pname + '! Have you planted any seeds today?', 'npc'), 800);
});
function command(text) {
  let [c, ...rest] = text.slice(1).split(' ');
  c = ({bantuan: 'help', misi: 'quests', pulang: 'home', dunia: 'world', resetmisi: 'resetquests'})[c] || c;
  if (c === 'help') say('', 'Commands: /quests, /home, /sleep, /night, /day, /reset, /world name', 'sys');
  else if (c === 'resetquests') resetQuests();
  else if (c === 'night' || c === 'malam') setNight(rest[0] ? rest[0].toLowerCase() !== 'off' : !night);
  else if (c === 'day' || c === 'siang') setNight(false);
  else if (c === 'door' || c === 'pintu') { if (nearDoor()) useDoor(); else say('', 'Walk to the door first (or type /home).', 'sys'); }
  else if (c === 'quests') document.querySelector('.tab[data-p="quest"]').click();
  else if (c === 'sleep' || c === 'tidur') { const b = bedNear(); if (b) sleepInBed(b.x, b.y); else say('', 'Stand next to a bed first (buy one in the Shop).', 'sys'); }
  else if (c === 'home') { spawn(); say('', 'You are back at the door.', 'sys'); }
  else if (c === 'world') enterWorld(rest.join(' '));
  else if (c === 'dev' || c === 'develop') setDev(rest[0] ? rest[0].toLowerCase() !== 'off' : !dev);
  else if (c === 'reset') {
    if (confirm('Reset world ' + world.name.toUpperCase() + '? All your builds in this world will be lost.')) {
      const n = world.name; try { localStorage.removeItem(wkey(n)); } catch (_) {}
      world = null; enterWorld(n);
    }
  } else say('', 'Unknown command. Type /help.', 'sys');
}

/* ---------- misi pemrograman ---------- */
const QUESTS = [
  {id: 1, icon: '🖨️', title: 'Papan Pengumuman', gems: 10, items: {1: 5},
   story: 'Papan pengumuman desa butuh tulisan. Di JavaScript, teks ditampilkan dengan console.log().',
   task: 'Lengkapi kode agar layar menampilkan: Hello World!',
   code: 'console.log(____);', type: 'fill', answers: ['"Hello World!"', "'Hello World!'"], show: '"Hello World!"',
   hint: 'Teks (string) ditulis di antara tanda kutip, misalnya "Halo".',
   explain: 'Teks ditulis di antara tanda kutip, lalu console.log() menampilkannya di layar.'},
  {id: 2, icon: '📦', title: 'Gudang Balok', gems: 10, items: {9: 2},
   story: 'Zorr mencatat jumlah balok di gudang. Angkanya bisa bertambah dan berkurang, jadi ia butuh variabel.',
   task: 'Kata kunci apa yang melengkapi kode ini untuk membuat variabel yang nilainya bisa diubah?',
   code: '____ jumlahBlok = 10;\njumlahBlok = 15;', type: 'fill', answers: ['let'],
   hint: 'Tiga huruf. Dipakai juga di for (___ i = 0; ...).',
   explain: 'let membuat variabel yang nilainya boleh diubah nanti.'},
  {id: 3, icon: '🔀', title: 'Pintu Kas', gems: 15, items: {4: 5},
   story: 'Pintu kas hanya terbuka kalau gem cukup. Komputer memeriksanya dengan if dan else.',
   task: 'Apa yang tampil di layar?',
   code: 'let gem = 12;\nif (gem >= 10) {\n  console.log("Cukup!");\n} else {\n  console.log("Kurang!");\n}',
   type: 'choice', options: ['Cukup!', 'Kurang!', 'Tidak ada yang tampil', 'Terjadi error'], correct: 0,
   hint: 'Apakah 12 lebih besar atau sama dengan 10?',
   explain: 'Kondisi gem >= 10 bernilai benar, jadi bagian if dijalankan dan bagian else dilewati.'},
  {id: 4, icon: '🔁', title: 'Lampu Kebun', gems: 15, items: {5: 3},
   story: 'Mira ingin memasang lampu satu per satu. Daripada menulis perintah berulang, pakai perulangan for.',
   task: 'Berapa kali pasangLampu() dijalankan?',
   code: 'for (let i = 0; i < 3; i++) {\n  pasangLampu();\n}', type: 'fill', answers: ['3', '3 kali', 'tiga'],
   hint: 'i mulai dari 0 dan berhenti sebelum mencapai 3: 0, 1, 2.',
   explain: 'i bernilai 0, 1, dan 2, jadi tiga putaran. Saat i = 3 kondisinya salah dan perulangan berhenti.'},
  {id: 5, icon: '⚙️', title: 'Mesin Pemasang', gems: 20, items: {6: 3},
   story: 'Pak Darsa ingin membuat mesin yang bisa dipakai berkali-kali. Kumpulan perintah yang diberi nama disebut fungsi.',
   task: 'Kata kunci apa yang melengkapi kode ini untuk membuat fungsi?',
   code: '____ pasangBlok(jumlah) {\n  console.log("Pasang " + jumlah + " blok");\n}\n\npasangBlok(4);', type: 'fill', answers: ['function'],
   hint: 'Bahasa Inggris untuk "fungsi".',
   explain: 'function membuat fungsi. Setelah itu kamu bisa memanggilnya sesering yang diperlukan, seperti pasangBlok(4).'},
  {id: 6, icon: '🎒', title: 'Isi Tas', gems: 20, items: {3: 10},
   story: 'Isi tas disimpan dalam array, yaitu daftar yang urutannya dimulai dari nomor 0.',
   task: 'Apa yang tampil di layar?',
   code: 'let barang = ["tanah", "batu", "kayu"];\nconsole.log(barang[1]);',
   type: 'choice', options: ['tanah', 'batu', 'kayu', '1'], correct: 1,
   hint: 'Hitungan indeks array dimulai dari 0, bukan 1.',
   explain: 'barang[0] adalah "tanah", barang[1] adalah "batu". Indeks array selalu dimulai dari 0.'},
  {id: 7, icon: '🧮', title: 'Hitung Upah', gems: 25, items: {4: 8},
   story: 'Zorr menghitung upah panen. Operator matematika di JavaScript mengikuti urutan seperti di pelajaran matematika.',
   task: 'Berapa nilai total yang tampil?',
   code: 'let total = 3 * 4 + 2;\nconsole.log(total);', type: 'fill', answers: ['14'],
   hint: 'Perkalian dihitung lebih dulu daripada penjumlahan.',
   explain: '3 * 4 = 12, lalu 12 + 2 = 14.'},
  {id: 8, icon: '⚖️', title: 'Timbangan Jujur', gems: 30, items: {5: 5, 6: 5},
   story: 'Pedagang menimbang barang dengan hati-hati. Tanda === membandingkan nilai sekaligus jenis datanya.',
   task: 'Apa yang tampil di layar?',
   code: 'console.log(5 === "5");', type: 'choice', options: ['true', 'false', '5', 'Terjadi error'], correct: 1,
   hint: 'Angka 5 dan teks "5" memiliki jenis data yang berbeda.',
   explain: '=== memeriksa nilai dan tipe. 5 adalah angka, "5" adalah teks, jadi hasilnya false.'},
  {id: 9, icon: '🧵', title: 'Rangkai Kata', gems: 20, items: {12: 3},
   story: 'Zorr menempel dua potongan tulisan menjadi satu papan nama. Di JavaScript, tanda + juga bisa menyambung teks.',
   task: 'Apa yang tampil di layar?',
   code: 'let a = "Zorr";\nlet b = "World";\nconsole.log(a + " " + b);', type: 'choice',
   options: ['Zorr World', 'ZorrWorld', 'a + b', 'Terjadi error'], correct: 0,
   hint: 'Ada spasi " " di tengah-tengah yang ikut disambung.',
   explain: 'Operator + pada teks menyambungnya. "Zorr" + " " + "World" menghasilkan Zorr World.'},
  {id: 10, icon: '📏', title: 'Panjang Papan', gems: 20, items: {11: 10},
   story: 'Pak Darsa ingin tahu berapa huruf yang muat di papan kayu. Teks punya properti .length untuk menghitungnya.',
   task: 'Berapa angka yang tampil di layar?',
   code: 'let kata = "kayu";\nconsole.log(kata.length);', type: 'fill', answers: ['4', 'empat'],
   hint: 'Hitung semua huruf: k-a-y-u.',
   explain: '.length menghitung jumlah karakter dalam teks. "kayu" punya 4 huruf.'},
  {id: 11, icon: '➕', title: 'Catatan Panen', gems: 25, items: {13: 3},
   story: 'Setiap selesai panen, jumlah buah ditambah ke catatan. Operator += menambah nilai ke variabel yang sudah ada.',
   task: 'Berapa nilai panen yang tampil?',
   code: 'let panen = 5;\npanen += 3;\nconsole.log(panen);', type: 'fill', answers: ['8', 'delapan'],
   hint: 'panen += 3 sama artinya dengan panen = panen + 3.',
   explain: 'panen mula-mula 5, lalu += 3 menambahnya menjadi 8.'},
  {id: 12, icon: '🚶', title: 'Antrean Pembeli', gems: 25, items: {15: 5},
   story: 'Pembeli datang satu per satu. Perulangan while berjalan terus selama kondisinya masih benar.',
   task: 'Berapa nilai i yang tampil di layar?',
   code: 'let i = 0;\nwhile (i < 4) {\n  i++;\n}\nconsole.log(i);', type: 'fill', answers: ['4', 'empat'],
   hint: 'Perulangan berhenti saat i < 4 sudah tidak benar lagi.',
   explain: 'i naik 0 → 1 → 2 → 3 → 4. Saat i = 4 kondisi i < 4 salah, jadi perulangan berhenti dan i bernilai 4.'},
  {id: 13, icon: '🧰', title: 'Kotak Peralatan', gems: 30, items: {14: 1},
   story: 'Zorr menyimpan data beliung dalam sebuah objek, yaitu kumpulan pasangan nama dan nilai.',
   task: 'Berapa angka yang tampil di layar?',
   code: 'let alat = {nama: "beliung", daya: 7};\nconsole.log(alat.daya);', type: 'fill', answers: ['7', 'tujuh'],
   hint: 'Ambil nilai di properti daya dengan tanda titik.',
   explain: 'alat.daya mengambil nilai properti daya dari objek alat, yaitu 7.'},
  {id: 14, icon: '🧩', title: 'Fungsi Pengali', gems: 30, items: {12: 5, 15: 3},
   story: 'Fungsi tidak hanya menjalankan perintah, tetapi juga bisa mengembalikan hasil dengan kata kunci return.',
   task: 'Berapa angka yang tampil di layar?',
   code: 'function kali(a, b) {\n  return a * b;\n}\nconsole.log(kali(3, 4));', type: 'fill', answers: ['12', 'dua belas'],
   hint: 'kali(3, 4) menghitung 3 × 4 lalu mengembalikan hasilnya.',
   explain: 'return mengirim hasil a * b kembali ke pemanggil. 3 * 4 = 12, lalu console.log menampilkannya.'},
  {id: 15, icon: '🎒', title: 'Tas yang Bertambah', gems: 35, items: {14: 1, 13: 2},
   story: 'Tas Zorr bisa diisi lagi. Method push() menambahkan satu elemen baru ke ujung array.',
   task: 'Berapa angka yang tampil di layar?',
   code: 'let tas = ["tanah", "batu"];\ntas.push("kayu");\nconsole.log(tas.length);', type: 'choice',
   options: ['2', '3', '4', 'kayu'], correct: 1,
   hint: 'Tas awalnya berisi 2 barang, lalu ditambah 1.',
   explain: 'push("kayu") menambah satu elemen, sehingga tas berisi tiga barang dan tas.length bernilai 3.'},
  {id: 16, icon: '🏁', title: 'Gerbang Logika', gems: 40, items: {14: 2, 12: 5},
   story: 'Gerbang terakhir memakai operator logika. && berarti DAN (keduanya harus benar), sedangkan || berarti ATAU (salah satu cukup).',
   task: 'Apa yang tampil di layar?',
   code: 'console.log(true || false);', type: 'choice', options: ['true', 'false', 'undefined', 'Terjadi error'], correct: 0,
   hint: '|| bernilai true jika salah satu sisinya true.',
   explain: '|| (ATAU) menghasilkan true jika minimal satu sisi bernilai true. Di sini sisi kiri true, jadi hasilnya true.'}
];
const qNorm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/;$/, '');
function qel(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function qCount() { return QUESTS.filter(q => qd[q.id]).length; }
function itemName(id) { const it = ITEMS.find(i => String(i.id) === String(id)); return it ? it.name : id; }
function rewardText(q) {
  return '+' + q.gems + '💎 ' + Object.keys(q.items).map(id => '+' + q.items[id] + ' ' + itemName(id)).join(' ');
}
function renderQuests() {
  $('questTab').textContent = 'Quests ' + qCount() + '/' + QUESTS.length;
  const box = $('questBox'); box.textContent = '';
  box.appendChild(qel('p', 'side-note', 'Complete coding challenges from Zorr to earn gems and building materials.'));
  QUESTS.forEach(q => {
    const row = qel('div', 'qrow');
    const t = qel('div', 'qt');
    t.append(qel('strong', '', q.title), qel('small', '', qd[q.id] ? 'Done ✓' : rewardText(q)));
    const b = qel('button', '', qd[q.id] ? 'Review' : 'Start');
    if (!qd[q.id]) b.classList.add('primary');
    b.addEventListener('click', () => openQuest(q));
    row.append(qel('span', 'qi', q.icon), t, b);
    box.appendChild(row);
  });
  if (qCount() === QUESTS.length) box.appendChild(qel('p', 'side-note', 'All quests complete. You have mastered the JavaScript basics!'));
  const rb = qel('button', 'qreset', 'Reset quests');
  rb.disabled = qCount() === 0 && !qd.bonus;
  rb.addEventListener('click', resetQuests);
  box.appendChild(rb);
}
function resetQuests() {
  snd('click');
  if (!confirm('Reset all quests? Quest progress will start over. Gems and items you already earned are kept.')) return;
  qd = {};
  savePlayer(); renderQuests();
  say('', 'All quests were reset. You can replay them from the start.', 'sys');
  toast('Quests reset');
}
function openQuest(q) {
  const box = $('questBox'); box.textContent = '';
  const done = !!qd[q.id];
  const back = qel('button', 'qback', '← Quest list'); back.addEventListener('click', renderQuests);
  box.append(back, qel('h3', 'qtitle', q.icon + ' ' + q.title));
  const story = qel('p', 'qstory'); const nb = qel('b', '', q.npc || 'Zorr'); nb.textContent += ': ';
  story.append(nb, document.createTextNode(q.story)); box.appendChild(story);
  box.append(qel('div', 'qtask', q.task), qel('pre', 'qcode', q.code));
  const fb = qel('div', 'qfb');
  const answer = val => {
    if (qd[q.id]) return;
    const ok = q.type === 'choice' ? val === q.correct : q.answers.map(qNorm).includes(qNorm(val));
    if (!ok) { fb.className = 'qfb bad'; fb.textContent = 'Not quite. Try again or ask for a hint.'; snd('wrong'); return; }
    finishQuest(q, fb);
  };
  let acts = null;
  if (done) {
    fb.className = 'qfb ok'; fb.textContent = 'Already completed. ' + q.explain;
  } else {
    if (q.type === 'choice') {
      const opts = qel('div', 'qopts');
      q.options.forEach((o, i) => { const b = qel('button', '', o); b.addEventListener('click', () => answer(i)); opts.appendChild(b); });
      box.appendChild(opts);
    } else {
      const form = qel('form', 'qform'); const inp = qel('input'); inp.placeholder = 'Your answer…'; inp.autocomplete = 'off'; inp.maxLength = 40;
      const go = qel('button', 'primary', 'Answer'); go.type = 'submit';
      form.append(inp, go); form.addEventListener('submit', e => { e.preventDefault(); answer(inp.value); });
      box.appendChild(form);
    }
    acts = qel('div', 'qacts');
    const hb = qel('button', '', 'Hint'); hb.addEventListener('click', () => { fb.className = 'qfb'; fb.textContent = 'Hint: ' + q.hint; snd('hint'); });
    acts.appendChild(hb);
  }
  if (acts) box.appendChild(acts);
  box.appendChild(fb);
}
function finishQuest(q, fb) {
  qd[q.id] = true; snd('correct');
  gems += q.gems;
  Object.keys(q.items).forEach(id => { inv[id] = (inv[id] || 0) + q.items[id]; });
  say('Zorr', 'Quest "' + q.title + '" complete! ' + rewardText(q), 'npc');
  floater(P.x - 0.5, P.y - P.ph - 1, rewardText(q));
  toast('Quest complete: ' + q.title);
  let bonus = false;
  if (qCount() === QUESTS.length && !qd.bonus) {
    qd.bonus = true; gems += 50; bonus = true; setTimeout(() => snd('fanfare'), 500);
    say('Zorr', 'Amazing! All quests complete. Here is a 50 gem bonus for you.', 'npc');
  }
  hud(); savePlayer();
  $('questTab').textContent = 'Quests ' + qCount() + '/' + QUESTS.length;
  const box = $('questBox');
  box.querySelectorAll('.qform,.qopts,.qacts').forEach(e => e.remove());
  fb.className = 'qfb ok'; fb.textContent = 'Correct! ' + q.explain + ' ' + rewardText(q) + (bonus ? ' +50💎 bonus' : '');
  const next = QUESTS.find(x => !qd[x.id]);
  const acts = qel('div', 'qacts');
  if (next) { const nb = qel('button', 'primary', 'Next quest'); nb.addEventListener('click', () => openQuest(next)); acts.appendChild(nb); }
  const lb = qel('button', '', 'Quest list'); lb.addEventListener('click', renderQuests); acts.appendChild(lb);
  box.appendChild(acts);
}

/* ---------- easter egg: catatan rahasia ---------- */
function setupSecret() {
  const list = $('secretList'); list.textContent = '';
  QUESTS.forEach(q => {
    const ans = q.type === 'choice' ? q.options[q.correct] : (q.show || q.answers[0]);
    const row = qel('div', 'secret-row', q.id + '. ' + q.title + ' — ');
    row.appendChild(qel('b', '', ans));
    row.appendChild(qel('small', '', 'Reward: ' + rewardText(q) + ' · ' + q.explain));
    list.appendChild(row);
  });
  let clicks = 0, timer;
  $('secretLogo').addEventListener('click', () => {
    clicks++; if (clicks < 12) snd('click'); clearTimeout(timer); timer = setTimeout(() => { clicks = 0; }, 1800);
    if (clicks >= 12) {
      clicks = 0;
      const p = $('secretPanel'); p.classList.toggle('open');
      if (p.classList.contains('open')) { p.scrollIntoView({behavior: 'smooth', block: 'center'}); toast('You found the secret notes!'); snd('secret'); }
    }
  });
}

/* ---------- reset data (toggle) ---------- */
const GOLD_KEY = 'rantau.desa.gold', GOLD_START = 20, BAG_START = {1: 10, 3: 0, 4: 5, 5: 0, 6: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 18: 0};
function readGold() { try { const g = localStorage.getItem(GOLD_KEY); return g === null ? GOLD_START : Math.max(0, parseInt(g, 10) || 0); } catch (e) { return GOLD_START; } }
function resetInfo() {
  $('rsGemsInfo').textContent = 'now ' + gems + ' → 0';
  $('rsGoldInfo').textContent = 'now ' + readGold() + ' → ' + GOLD_START + ' (starting amount)';
  $('rsBtn').disabled = !['rsBag', 'rsWorld', 'rsGems', 'rsGold'].some(id => $(id).checked);
}
function doReset() {
  const bag = $('rsBag').checked, wld = $('rsWorld').checked, gm = $('rsGems').checked, gd = $('rsGold').checked;
  const what = [bag && 'bag blocks', wld && 'blocks in all worlds', gm && 'diamonds', gd && 'gold'].filter(Boolean);
  if (!what.length) return;
  if (!confirm('Reset ' + what.join(', ') + '? This cannot be undone.')) return;
  if (bag) Object.keys(BAG_START).forEach(id => { inv[id] = BAG_START[id]; });
  if (gm) gems = 0;
  if (gd) { try { localStorage.setItem(GOLD_KEY, String(GOLD_START)); } catch (e) {} }
  if (wld) {
    const name = world.name;
    try { Object.keys(localStorage).filter(k => k.indexOf('rantau.dunia.w.') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    world = null; enterWorld(name);
  }
  savePlayer(); hud(); resetInfo();
  say('', 'Reset complete: ' + what.join(', ') + '.', 'sys');
  toast('Reset complete');
}
function setupReset() {
  ['rsBag', 'rsWorld', 'rsGems', 'rsGold'].forEach(id => $(id).addEventListener('change', resetInfo));
  $('rsBtn').addEventListener('click', doReset);
  document.querySelector('.tab[data-p="help"]').addEventListener('click', resetInfo);
  resetInfo();
}

/* ---------- develop mode (tersembunyi: hanya lewat perintah /dev) ---------- */
function setDev(on) {
  dev = !!on;
  try { localStorage.setItem(DEVKEY, dev ? '1' : '0'); } catch (e) {}
  if (!dev && ITEMS[sel].id === 'pick' && !(inv.pick > 0)) sel = 0;
  if (world) $('worldChip').textContent = 'WORLD: ' + world.name.toUpperCase() + (dev ? ' · DEV' : '');
  buildShop(); hud();
  say('', dev ? 'Develop mode ON: unlimited items & gems, Pickaxe unlocked, hold Jump to fly.' : 'Develop mode OFF.', 'sys');
  toast(dev ? 'Develop mode ON' : 'Develop mode OFF');
}

/* ---------- mulai ---------- */
loadPlayer(); loadDev();
if (!hasSave) { location.replace('landingpage.html'); return; }
if (window.ZorrSound) ZorrSound.mount($('sndBox'));
function applyNight() {
  document.body.classList.toggle('night', night);
  const b = $('nightBtn'); if (b) { b.textContent = night ? '☀️' : '🌙'; b.title = night ? 'Switch to day mode' : 'Switch to night mode'; b.setAttribute('aria-pressed', night); }
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = night ? '#1b2540' : '#3f5638';
}
function setNight(on) {
  night = !!on; try { localStorage.setItem('rantau.dunia.night', night ? '1' : '0'); } catch (e) {}
  applyNight(); toast(night ? 'Night mode ON 🌙' : 'Day mode ☀️'); snd('select');
}
$('nightBtn').addEventListener('click', () => setNight(!night));
applyNight();
buildHotbar(); buildShop(); renderQuests(); setupSecret(); setupReset(); hud();
resize();
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
let startName = 'valley'; try { startName = localStorage.getItem(LAST) || 'valley'; } catch (_) {}
enterWorld(startName);
say('Zorr', 'Welcome, ' + pname + '! Choose Fist to break blocks and Seed to plant. Open the Quests tab for your first coding challenge.', 'npc');
const TIP_SPEAKERS = ['Dixsya Egha', 'King Rafa Rizquna', 'Mr.Zaky Al-Jawi'];
setInterval(() => { if (started) { const n = tipIdx++; say(TIP_SPEAKERS[n % TIP_SPEAKERS.length], TIPS[n % TIPS.length], 'npc'); } }, 50000);
setInterval(() => { if (dirty) saveWorld(); }, 4000);
addEventListener('beforeunload', saveWorld);
document.addEventListener('visibilitychange', () => { if (document.hidden) { saveWorld(); releaseAll(); } });
requestAnimationFrame(loop);
})();


/* ---------- nama developer berganti-ganti ---------- */
(function devRotator() {
  const el = document.getElementById('devName'); if (!el) return;
  const names = ['King Rafa Rizquna',  'Mr.Zaky Al-Jawi', 'Dixsya Egha' ];
  let i = 0;
  setInterval(() => {
    el.classList.add('out');
    setTimeout(() => { i = (i + 1) % names.length; el.textContent = names[i]; el.classList.remove('out'); }, 350);
  }, 2200);
})();
