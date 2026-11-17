const s={level:1,xp:0,hp:5,gold:20,shard:0,potion:1,bread:2,done:[],ach:[]};
try{const g=localStorage.getItem('rantau.desa.gold');if(g!==null)s.gold=Math.max(0,parseInt(g,10)||0)}catch(e){}
try{const v=JSON.parse(localStorage.getItem('rantau.desa.save')||'null');if(v){['level','xp','hp','shard','potion','bread'].forEach(k=>{if(Number.isFinite(v[k]))s[k]=v[k]});if(Array.isArray(v.done))s.done=v.done;if(Array.isArray(v.ach))s.ach=v.ach}}catch(e){}
s.level=Math.min(3,Math.max(1,s.level));s.xp=Math.max(0,Math.min(s.xp,[100,200,160][s.level-1]));
const snd=n=>{try{window.ZorrSound&&ZorrSound.play(n)}catch(e){}};
if(window.ZorrSound)ZorrSound.mount(document.getElementById('sndBox'));
const missions=[
{id:1,title:'Catatan yang Hilang',npc:'Zorr',icon:'📚',desc:'Zorr ingin menampilkan tulisan pada layar komputer perpustakaan.',story:'“Komputer tua ini masih bisa dipakai,” kata Zorr. “Tapi aku lupa perintah untuk menampilkan tulisan. Bisa bantu?”',
    question:'Lengkapi perintah JavaScript untuk menampilkan teks Halo Desa!\n\nconsole.log(____);',
    answer:'"Halo Desa!"',hint:'Teks atau string ditulis di antara tanda kutip.',exp:30,gold:10},
{id:2,title:'Daftar Buku',npc:'Mira',icon:'📖',desc:'Mira ingin menyimpan jumlah buku yang baru datang.',story:'Mira membawa setumpuk buku. Ia perlu menyimpan jumlahnya agar tidak lupa saat membuat daftar inventaris.',
    question:'Kata kunci untuk membuat variabel JavaScript yang nilainya bisa berubah adalah...',
    answer:'let',hint:'Contoh: let jumlahBuku = 12;',exp:40,gold:15},
{id:3,title:'Pintu Gudang',npc:'Pak Darsa',icon:'🚪',desc:'Pintu gudang hanya terbuka jika persediaan cukup.',story:'Pak Darsa memeriksa persediaan. Ia ingin komputer menjalankan perintah hanya ketika kondisinya terpenuhi.',
    question:'Struktur JavaScript untuk memeriksa kondisi adalah...',
    answer:'if',hint:'Bentuk dasarnya: if (kondisi) { ... }',exp:50,gold:20},
{id:4,title:'Lampu Kebun',npc:'Mira',icon:'🏮',desc:'Lampu kebun perlu diperiksa satu per satu.',story:'Mira menunjukkan lima lampu. Daripada menulis perintah yang sama berkali-kali, gunakan perulangan.',
    question:'Perulangan JavaScript yang sering dipakai saat jumlah pengulangan diketahui adalah...',
    answer:'for',hint:'Contoh: for (let i = 0; i < 5; i++) { ... }',exp:60,gold:25},
{id:5,title:'Rak Buku Baru',npc:'Zorr',icon:'🗄️',desc:'Zorr ingin menyimpan banyak judul buku dalam satu daftar.',story:'Rak perpustakaan penuh. Zorr ingin semua judul buku disimpan dalam satu daftar yang urutannya dimulai dari 0.',
    question:'Struktur data JavaScript yang menyimpan banyak nilai dalam satu daftar, misalnya ["a", "b", "c"], disebut...',
    answer:'array',hint:'Ditulis dengan tanda kurung siku [ ].',exp:60,gold:25},
{id:6,title:'Resep Roti',npc:'Mira',icon:'🍞',desc:'Mira ingin resep roti yang bisa dipakai berulang kali.',story:'Mira membuat roti setiap pagi. Ia ingin kumpulan langkah memasak diberi nama supaya bisa dipanggil kapan saja.',
    question:'Kata kunci JavaScript untuk membuat fungsi adalah...',
    answer:'function',hint:'Bahasa Inggris untuk "fungsi".',exp:70,gold:30},
{id:7,title:'Pasar Pagi',npc:'Pak Darsa',icon:'🧺',desc:'Pak Darsa menghitung total belanja di pasar.',story:'Pak Darsa membeli 3 apel seharga 4 koin dan 2 koin untuk ongkos. Perkalian dihitung lebih dulu daripada penjumlahan.',
    question:'Berapa angka yang tampil di layar?\n\nconsole.log(2 + 3 * 4);',
    answer:'14',hint:'Hitung 3 * 4 dulu, baru tambahkan 2.',exp:70,gold:30},
{id:8,title:'Gerbang Desa',npc:'Zorr',icon:'🚧',desc:'Penjaga gerbang membandingkan angka dan teks.',story:'Penjaga gerbang sangat teliti. Tanda === membandingkan nilai sekaligus jenis datanya.',
    question:'Apa yang tampil di layar? (true atau false)\n\nconsole.log(5 === "5");',
    answer:'false',hint:'Angka 5 dan teks "5" berbeda jenis.',exp:80,gold:35}
];
function addLog(t){document.getElementById('log').innerHTML='<div>'+t+'</div>'+document.getElementById('log').innerHTML}
function render(){try{localStorage.setItem('rantau.desa.gold',s.gold);localStorage.setItem('rantau.desa.save',JSON.stringify({level:s.level,xp:s.xp,hp:s.hp,shard:s.shard,potion:s.potion,bread:s.bread,done:s.done,ach:s.ach}))}catch(e){}document.getElementById('levelName').textContent='Level '+s.level+' · '+(s.level===1?'Villager':s.level===2?'Explorer':'Valley Guardian');document.getElementById('xpText').textContent=s.xp+'/'+need();document.getElementById('xpBar').style.width=Math.min(100,s.xp/need()*100)+'%';document.getElementById('hpText').textContent=s.hp+'/5';document.getElementById('hpBar').style.width=s.hp/5*100+'%';['goldTop','goldSide'].forEach(id=>document.getElementById(id).textContent=s.gold);document.getElementById('shardTop').textContent=s.shard;document.getElementById('potionCount').textContent=s.potion;document.getElementById('breadCount').textContent=s.bread;document.getElementById('questSummary').innerHTML=missions.map(m=>`<div class="cardline"><div class="emoji">${m.icon}</div><div><strong>${m.title}</strong><p>${s.done.includes(m.id)?'Completed':m.desc}</p><span class="tag">${s.done.includes(m.id)?'Done':'Reward: '+m.exp+' EXP · '+m.gold+' Gold'}</span></div></div>`).join('')}
function tab(which){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===which));let c=document.getElementById('content');if(which==='home'){c.innerHTML=`<div class="world"><div class="sun"></div><div class="cloud">☁️</div><div class="mountain"></div><div class="ground"></div><div class="path"></div><div class="tree one">🌳</div><div class="tree two">🌲</div><div class="house">🏡</div><div class="hero">🧑🏻‍🌾</div><div class="location">Valley Village · Morning</div><div class="world-caption">The houses are getting busy</div></div><div class="intro"><h2>Valley Village</h2><p>Warga desa punya banyak pekerjaan kecil. Bicaralah dengan mereka dan bantu selesaikan masalah sehari-hari.</p><div class="actions"><button class="primary" onclick="startNext()">Find work</button><button onclick="tab('learn')">Open notes</button></div></div>`}else if(which==='quests'){c.innerHTML='<h2>Quest List</h2><p class="side-note">Each quest teaches one programming concept.</p>'+missions.map(m=>`<div class="questrow"><div class="emoji">${m.icon}</div><div class="grow"><strong>${m.title}</strong><small>${s.done.includes(m.id)?'Completed':m.desc}</small></div><button onclick="openMission(${m.id})" ${s.done.includes(m.id)?'disabled':''}>${s.done.includes(m.id)?'Done':'Meet'}</button></div>`).join('')+achHTML()+'<button class="danger" style="width:100%;margin-top:14px" onclick="resetQuests()">Reset semua progres</button>'}else if(which==='shop'){c.innerHTML=shopHTML()}else{c.innerHTML=`<h2>Study Notes</h2><p>A few things you have learned while helping the villagers.</p><div class="cardline"><div class="emoji">🖨️</div><div><strong>Output</strong><p><code>console.log()</code> digunakan untuk menampilkan informasi.</p></div></div><div class="cardline"><div class="emoji">📦</div><div><strong>Variabel</strong><p><code>let</code> digunakan untuk membuat variabel yang nilainya dapat berubah.</p></div></div><div class="cardline"><div class="emoji">🔀</div><div><strong>Kondisi</strong><p><code>if</code> menjalankan perintah ketika kondisi terpenuhi.</p></div></div><div class="cardline"><div class="emoji">🔁</div><div><strong>Perulangan</strong><p><code>for</code> mengulang instruksi sesuai jumlah atau kondisi tertentu.</p></div></div>`}}
function startNext(){let m=missions.find(x=>!s.done.includes(x.id));if(m)openMission(m.id);else{document.getElementById('content').innerHTML='<h2>Terima Kasih, Pengelana</h2><p>Semua pekerjaan warga sudah selesai. Desa Lembah kembali tenang. Petualangan berikutnya akan menunggu di luar desa.</p><div style="font-size:60px;text-align:center;padding:25px">🌄</div>'}}
function openMission(id){let m=missions.find(x=>x.id===id);document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));document.getElementById('content').innerHTML=`<h2>${m.icon} ${m.title}</h2><p><b>${m.npc} says:</b> ${m.story}</p><div class="challenge"><div style="font:20px VT323;color:#76533b">PROGRAMMING CHALLENGE</div><div class="code">${m.question.replaceAll('<','&lt;')}</div><label for="answer" class="side-note">Write your answer:</label><input id="answer" placeholder="Answer..." onkeydown="if(event.key==='Enter')check(${id})"><div class="actions" style="margin-top:12px"><button class="primary" onclick="check(${id})">Submit answer</button><button onclick="hint(${id})">Ask for a hint</button><button onclick="tab('quests')">Back</button></div><div class="feedback" id="feedback"></div></div>`;document.getElementById('answer').focus()}
function hint(id){snd('hint');let m=missions.find(x=>x.id===id);document.getElementById('feedback').textContent='Hint: '+m.hint}
function check(id){let m=missions.find(x=>x.id===id);let val=document.getElementById('answer').value.trim().toLowerCase().replace(/\s+/g,' ');if(val===m.answer.toLowerCase()){s.done.push(id);snd('correct');s.xp+=m.exp;s.gold+=m.gold;s.hp=Math.min(5,s.hp+1);while(s.level<MAXLV&&s.xp>=need()){s.xp-=need();s.level++;s.shard++;addLog('Level up! The villagers gave you a keepsake shard.');setTimeout(()=>snd('levelup'),450)}if(s.level>=MAXLV)s.xp=Math.min(s.xp,need());addLog('Quest complete: '+m.title);checkAch();render();document.getElementById('content').innerHTML=`<div style="text-align:center;padding:25px 8px"><div style="font-size:64px">🎉</div><h2>Thank you!</h2><p>${m.npc} is happy the work got done.</p><p class="tag">+${m.exp} EXP · +${m.gold} Gold</p><button class="primary" onclick="startNext()">Continue the journey</button></div>`}else{ snd('wrong');s.hp=Math.max(0,s.hp-1);render();document.getElementById('feedback').textContent=s.hp===0?'You are exhausted. Use a small potion to restore your health.':'Not quite right. Think again, or ask for a hint.'}}
function heal(){snd('buy');if(s.potion<=0){alert('You are out of small potions.');return}if(s.hp===5){alert('Your health is already full.');return}s.potion--;s.hp=Math.min(5,s.hp+2);addLog('Used a small potion.');render()}
const MAXLV=3;
const XPNEED=[100,200,160];/* total 460 = jumlah EXP semua misi, jadi bar penuh tepat saat misi terakhir selesai */
const need=()=>XPNEED[Math.min(s.level,MAXLV)-1];
const items={potion:{name:'Small potion',icon:'🧴',price:15,desc:'Memulihkan 2 HP.'},bread:{name:'Bread',icon:'🍞',price:5,desc:'Memulihkan 1 HP.'}};
const achs=[
{id:'first',icon:'🌱',title:'Langkah Pertama',desc:'Selesaikan 1 quest.',ok:()=>s.done.length>=1},
{id:'half',icon:'🤝',title:'Penolong Desa',desc:'Selesaikan 4 quest.',ok:()=>s.done.length>=4},
{id:'all',icon:'🏆',title:'Pahlawan Lembah',desc:'Selesaikan semua quest.',ok:()=>s.done.length>=missions.length},
{id:'lv3',icon:'🛡️',title:'Valley Guardian',desc:'Capai Level 3.',ok:()=>s.level>=3},
{id:'rich',icon:'🪙',title:'Saudagar Kecil',desc:'Kumpulkan 100 Gold.',ok:()=>s.gold>=100},
{id:'shop',icon:'🛒',title:'Pelanggan Pertama',desc:'Beli barang di toko.'}
];
function grant(id){if(s.ach.includes(id))return;const a=achs.find(x=>x.id===id);if(!a)return;s.ach.push(id);addLog('Achievement: '+a.icon+' '+a.title);setTimeout(()=>snd('levelup'),300)}
function checkAch(){achs.forEach(a=>{if(a.ok&&a.ok())grant(a.id)})}
function achHTML(){return '<h2 style="margin-top:22px">Achievements ('+s.ach.length+'/'+achs.length+')</h2>'+achs.map(a=>{const on=s.ach.includes(a.id);return `<div class="cardline" style="${on?'':'opacity:.45;filter:grayscale(1)'}"><div class="emoji">${on?a.icon:'🔒'}</div><div><strong>${a.title}</strong><p>${a.desc}</p></div></div>`}).join('')}
function shopHTML(){return '<h2>Village Shop</h2><p class="side-note">Tukar koinmu dengan perbekalan. Koin kamu: 🪙 <b>'+s.gold+'</b></p>'+Object.keys(items).map(k=>{const i=items[k];return `<div class="questrow"><div class="emoji">${i.icon}</div><div class="grow"><strong>${i.name}</strong><small>${i.desc} · Dimiliki: ${s[k]}</small></div><button onclick="buy('${k}')" ${s.gold<i.price?'disabled':''}>🪙 ${i.price}</button></div>`}).join('')+'<div class="feedback" id="shopMsg"></div>'}
function buy(k){const i=items[k];if(!i||s.gold<i.price){snd('wrong');return}s.gold-=i.price;s[k]++;snd('buy');addLog('Membeli '+i.name+' (-'+i.price+' Gold).');grant('shop');checkAch();render();tab('shop');document.getElementById('shopMsg').textContent=i.name+' berhasil dibeli!'}
function eat(){if(s.bread<=0){alert('Kamu kehabisan roti. Beli di toko!');return}if(s.hp===5){alert('Health kamu sudah penuh.');return}snd('buy');s.bread--;s.hp=Math.min(5,s.hp+1);addLog('Makan roti. +1 HP.');render()}
function resetQuests(){
  if(!confirm('Reset semua progres termasuk quest, achievement, level, XP, koin, dan item ke awal?'))return;
  try{
    localStorage.removeItem('rantau.desa.gold');
    localStorage.removeItem('rantau.desa.save');
  }catch(e){}
  s.level=1;
  s.xp=0;
  s.hp=5;
  s.gold=20;
  s.shard=0;
  s.potion=1;
  s.bread=2;
  s.done=[];
  s.ach=[];
  document.getElementById('log').innerHTML='<div>Petualangan dimulai kembali dari awal di Desa Lembah.</div>';
  snd('click');
  render();
  tab('quests');
}
let secretClicks=0,secretTimer;
document.getElementById('secretLogo').addEventListener('click',()=>{
 secretClicks++;
 clearTimeout(secretTimer);
 secretTimer=setTimeout(()=>secretClicks=0,1800);
 if(secretClicks>=7){
  const panel=document.getElementById('secretPanel');
  panel.classList.toggle('open');
  secretClicks=0;
  if(panel.classList.contains('open')){panel.scrollIntoView({behavior:'smooth',block:'center'});snd('secret')}
 }
});
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{snd('click');tab(b.dataset.tab)}));
function buildSecret(){const box=document.getElementById('secretList');box.innerHTML='';missions.forEach(m=>{const r=document.createElement('div');r.className='answer-row';r.append(m.id+'. '+m.title+' — ');const b=document.createElement('b');b.textContent=m.answer;r.appendChild(b);const sm=document.createElement('small');sm.style.cssText='display:block;opacity:.75';sm.textContent=m.hint;r.appendChild(sm);box.appendChild(r)})}
buildSecret();render();

(function devRotator() {
  const el = document.getElementById('devName'); if (!el) return;
  const names = ['King Rafa Rizquna',  'Mr.Zaky Al-Jawi', 'Dixsya Egha' ];
  let i = 0;
  setInterval(() => {
    el.classList.add('out');
    setTimeout(() => { i = (i + 1) % names.length; el.textContent = names[i]; el.classList.remove('out'); }, 350);
  }, 2200);
})();