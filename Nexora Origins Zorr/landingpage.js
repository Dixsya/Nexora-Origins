'use strict';
(() => {
const $ = id => document.getElementById(id);
const snd = n => { try { window.ZorrSound && ZorrSound.play(n); } catch (e) {} };
if (window.ZorrSound) ZorrSound.mount($('sndBox'));
const PKEY = 'rantau.dunia.player', TOTAL_QUESTS = 16;
const SHIRTS = ['#c0563f', '#3f6fb0', '#607c4b', '#8a5aa8', '#d9a23a', '#2f2f2f'];
const cleanName = s => (s || '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
let save = null, shirt = SHIRTS[0];
try { save = JSON.parse(localStorage.getItem(PKEY)); } catch (e) {}
const hasSave = !!(save && typeof save === 'object');
if (hasSave && SHIRTS.includes(save.shirt)) shirt = save.shirt;

function drawAvatar() {
  const c = $('avatar'), g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  const cx = 48, top = 26, w = 52, h = 72;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(cx, top + h + 2, w * 0.5, 4, 0, 0, 7); g.fill();
  g.fillStyle = '#3f5638';
  g.fillRect(cx - w * 0.4, top + h * 0.72, w * 0.34, h * 0.28); g.fillRect(cx + w * 0.06, top + h * 0.72, w * 0.34, h * 0.28);
  g.fillStyle = shirt; g.fillRect(cx - w * 0.5, top + h * 0.4, w, h * 0.34);
  g.fillStyle = '#f0c9a0'; g.fillRect(cx - w * 0.42, top + h * 0.12, w * 0.84, h * 0.3);
  g.fillStyle = '#302b25'; g.fillRect(cx + w * 0.08 - 1, top + h * 0.24, 3, 4); g.fillRect(cx + w * 0.28 - 1, top + h * 0.24, 3, 4);
  g.fillStyle = '#d9b45a'; g.fillRect(cx - w * 0.7, top + h * 0.1, w * 1.4, 4); g.fillRect(cx - w * 0.4, top - 2, w * 0.8, h * 0.13);
}
function buildSwatches() {
  const box = $('swatches'); box.textContent = '';
  SHIRTS.forEach(col => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch' + (col === shirt ? ' sel' : '');
    b.style.background = col; b.setAttribute('aria-label', 'Shirt color ' + col);
    b.addEventListener('click', () => { if (window.ZorrSound) ZorrSound.play('select'); shirt = col; buildSwatches(); drawAvatar(); });
    box.appendChild(b);
  });
}
if (hasSave) {
  const n = cleanName(save.name);
  $('nameInput').value = n || '';
  $('startBtn').textContent = 'Continue Adventure';
  const done = Object.keys(save.qd || {}).filter(k => k !== 'bonus' && save.qd[k]).length;
  $('lStat').textContent = 'Quests ' + done + '/' + TOTAL_QUESTS + ' · 💎 ' + ((save.gems | 0));
}
drawAvatar(); buildSwatches();

$('startForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = hasSave ? save : {inv: {1: 10, 3: 0, 4: 5, 5: 0, 6: 0, 9: 3}, gems: 0, qd: {}};
  data.name = cleanName($('nameInput').value) || 'Traveler';
  data.shirt = shirt;
  try { localStorage.setItem(PKEY, JSON.stringify(data)); } catch (err) {}
  snd('enter'); setTimeout(() => { location.href = 'Index.html'; }, 120);
});
})();

(function devRotator() {
  const el = document.getElementById('devName'); if (!el) return;
  const names = ['King Rafa Rizquna',  'Mr.Zaky Al-Jawi', 'Dixsya Egha' ];
  let i = 0;
  setInterval(() => {
    el.classList.add('out');
    setTimeout(() => { i = (i + 1) % names.length; el.textContent = names[i]; el.classList.remove('out'); }, 350);
  }, 2200);
})();