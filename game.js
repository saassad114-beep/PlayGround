(() => {
  'use strict';
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const outfits = [
    {name:'Meadow Scout', emoji:'🌿', level:1, buff:'Swift Arrows', damage:1, mana:0, color:'#70a85e', cape:'#d6e8aa'},
    {name:'Moonlit Knight', emoji:'🌙', level:2, buff:'Moon Guard', damage:1.2, mana:0, color:'#6689bd', cape:'#c6d6f1'},
    {name:'Ruby Ranger', emoji:'🌹', level:4, buff:'Ruby Volley', damage:1.5, mana:0, color:'#c5666a', cape:'#f0b5a7'},
    {name:'Frost Guardian', emoji:'❄️', level:6, buff:'Frostheart', damage:1.7, mana:12, color:'#55a6b0', cape:'#b8e3e5'},
    {name:'Star Champion', emoji:'🌟', level:8, buff:'Starlight', damage:2, mana:20, color:'#9c72bd', cape:'#e3c9f0'}
  ];
  const labels = ['THE GOBLIN SCOUTS','SNEAKY SLIME SQUAD','THE ORCISH RAID','SHADOW WOLVES','THE BIG BAD BUNCH'];
  const saved = (() => { try { return JSON.parse(localStorage.getItem('enchantedKeepSave') || '{}'); } catch { return {}; } })();
  const state = {
    gold: Math.max(0, saved.gold || 0), level: Math.max(1, saved.level || 1), xp: Math.max(0, saved.xp || 0),
    castle: 100, mana: 100, wave: 1, killed: 0, total: 0, spawned: 0, waveWait: 0,
    enemies: [], arrows: [], effects: [], particles: [], target: null, targetTime: 0, shotClock: 0,
    spawnClock: 1.8, running: true, dead: false, sound: false, outfit: saved.outfit || 0,
    damageLevel: Math.max(0, saved.damageLevel || 0), coolFrost: 0, coolStorm: 0, elapsed: 0
  };
  let W = 900, H = 610, last = performance.now(), audio;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const currentOutfit = () => outfits[clamp(state.outfit, 0, outfits.length - 1)];
  const save = () => { try { localStorage.setItem('enchantedKeepSave', JSON.stringify({gold:state.gold, level:state.level, xp:state.xp, outfit:state.outfit, damageLevel:state.damageLevel})); } catch {} };
  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    canvas.width = Math.round(r.width*dpr); canvas.height = Math.round(r.height*dpr);
    ctx.setTransform(canvas.width/W, 0, 0, canvas.height/H, 0, 0);
  }
  window.addEventListener('resize', resize); new ResizeObserver(resize).observe(canvas);
  function rounded(x,y,w,h,r,fill,stroke) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); if(fill){ctx.fillStyle=fill;ctx.fill()} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()} }
  function circle(x,y,r,fill,stroke) { ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()} }
  function line(x1,y1,x2,y2,color,width=2) {ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}
  function drawBackground(t) {
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#9bd8e0');sky.addColorStop(.58,'#d7edce');sky.addColorStop(1,'#93c77c');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    circle(752,91,39,'#ffe7a0');circle(752,91,50,'#ffe7a022');
    // fluffy clouds
    for(let i=0;i<3;i++){let x=((i*370+110-t*5)%(W+200))-80,y=70+i*48;circle(x,y,18,'#f8ffedaa');circle(x+20,y-8,23,'#f8ffedaa');circle(x+44,y+2,17,'#f8ffedaa');rounded(x-2,y,47,15,7,'#f8ffedaa')}
    // distant rolling hills
    ctx.fillStyle='#9dccaa';ctx.beginPath();ctx.moveTo(0,300);ctx.quadraticCurveTo(150,185,305,284);ctx.quadraticCurveTo(490,177,684,279);ctx.quadraticCurveTo(802,206,900,258);ctx.lineTo(900,444);ctx.lineTo(0,444);ctx.fill();
    ctx.fillStyle='#b8dba9';ctx.beginPath();ctx.moveTo(0,360);ctx.quadraticCurveTo(210,260,395,349);ctx.quadraticCurveTo(590,249,900,340);ctx.lineTo(900,465);ctx.lineTo(0,465);ctx.fill();
    // meadow
    const ground=ctx.createLinearGradient(0,375,0,H);ground.addColorStop(0,'#8dc77a');ground.addColorStop(1,'#70b36f');ctx.fillStyle=ground;ctx.fillRect(0,375,W,H-375);
    ctx.fillStyle='#c9d98a';ctx.beginPath();ctx.ellipse(510,505,500,91,0,0,Math.PI*2);ctx.fill();
    // winding path
    ctx.beginPath();ctx.moveTo(155,610);ctx.bezierCurveTo(280,498,315,553,430,480);ctx.bezierCurveTo(545,405,645,463,900,390);ctx.lineTo(900,480);ctx.bezierCurveTo(700,539,580,476,482,540);ctx.bezierCurveTo(366,615,280,566,242,610);ctx.closePath();ctx.fillStyle='#e6d49d';ctx.fill();
    // little wildflowers
    for(let i=0;i<35;i++){let x=(i*83+21)%W,y=420+(i*47)%180;circle(x,y,2.4,i%3===0?'#fff0bd':i%3===1?'#f2a59a':'#fff8dd');line(x,y+2,x-1,y+8,'#60965b',1)}
    // distant trees
    for(let i=0;i<9;i++){let x=295+i*78,y=332+(i%3)*15;circle(x,y-25,17,'#78b67a');circle(x-12,y-11,13,'#6baa70');circle(x+12,y-10,15,'#88c17c');rounded(x-3,y-2,7,23,3,'#997c59')}
  }
  function drawCastle(t) {
    // shadow
    ctx.fillStyle='#47665330';ctx.beginPath();ctx.ellipse(99,477,109,17,0,0,7);ctx.fill();
    // stone body and towers
    rounded(29,286,136,188,5,'#e6d6b3','#9d8b6a');
    rounded(16,261,53,218,5,'#d2c49f','#928262');rounded(124,246,53,233,5,'#d8c8a4','#928262');
    rounded(23,244,39,13,2,'#e9dcbf');rounded(131,229,39,13,2,'#eee0bd');
    // crenellations
    for(let i=0;i<4;i++){rounded(18+i*13,250,10,15,2,'#e4d5b3','#a28f6d');rounded(126+i*13,235,10,15,2,'#e7d8b6','#a28f6d')}
    // central roof
    ctx.fillStyle='#668f82';ctx.beginPath();ctx.moveTo(72,291);ctx.lineTo(95,249);ctx.lineTo(120,291);ctx.closePath();ctx.fill();
    // stone stripes
    for(let y=310;y<470;y+=29){line(33,y,160,y,'#bdae8e',1)}
    // windows
    for(let [x,y] of [[37,306],[137,292],[37,363],[137,350],[78,311],[111,311]]){rounded(x,y,12,22,6,'#374f5d');rounded(x+2,y+2,8,12,4,'#f3d982')}
    // gate
    ctx.beginPath();ctx.moveTo(75,474);ctx.lineTo(75,426);ctx.arc(96,426,21,Math.PI,0);ctx.lineTo(117,474);ctx.closePath();ctx.fillStyle='#735f4a';ctx.fill();
    rounded(80,445,31,29,2,'#574b40');for(let y=450;y<474;y+=8)line(81,y,110,y,'#a18c65',1);
    // pennants sway
    const sway=Math.sin(t*2)*4;line(149,231,149,175,'#765c45',3);ctx.fillStyle='#e88872';ctx.beginPath();ctx.moveTo(150,177);ctx.lineTo(188+sway,184);ctx.lineTo(150,198);ctx.closePath();ctx.fill();circle(149,174,3,'#edc66d');
    line(37,247,37,220,'#826647',2);ctx.fillStyle='#7fae6e';ctx.beginPath();ctx.moveTo(38,221);ctx.lineTo(60,225);ctx.lineTo(38,235);ctx.fill();
    // ivy
    for(let y=338;y<430;y+=12){circle(26+Math.sin(y)*3,y,4,'#75a76b');circle(31+Math.sin(y+2)*3,y+5,3,'#91bd74')}
  }
  function drawHero(t) {
    const o=currentOutfit(), x=210,y=426, bob=Math.sin(t*5)*2;
    // shadow and cape
    ctx.fillStyle='#44664740';ctx.beginPath();ctx.ellipse(x,y+45,25,7,0,0,7);ctx.fill();
    ctx.fillStyle=o.cape;ctx.beginPath();ctx.moveTo(x-9,y-30+bob);ctx.quadraticCurveTo(x-36,y-14,x-25,y+27);ctx.lineTo(x-5,y+16);ctx.lineTo(x+7,y-23);ctx.fill();
    // legs
    line(x-7,y+20,x-10,y+39,'#584d4a',6);line(x+7,y+20,x+9,y+39,'#584d4a',6);rounded(x-19,y+36,16,7,3,'#67584a');rounded(x+3,y+36,17,7,3,'#67584a');
    // tunic
    ctx.fillStyle=o.color;ctx.beginPath();ctx.moveTo(x-14,y-25+bob);ctx.lineTo(x+14,y-25+bob);ctx.lineTo(x+20,y+21);ctx.quadraticCurveTo(x,y+28,x-20,y+21);ctx.closePath();ctx.fill();
    // belt
    rounded(x-17,y+3,34,5,2,'#e6c46e');rounded(x-3,y+2,7,7,2,'#f7df92');
    // arms
    line(x-12,y-15,x-24,y-1,'#f1bc8b',6);line(x+12,y-14,x+23,y-5,'#f1bc8b',6);
    // bow and arrow
    line(x+23,y-11,x+23,y+17,'#9b6946',3);ctx.beginPath();ctx.arc(x+19,y+3,14,-1.15,1.15);ctx.strokeStyle='#d9b677';ctx.lineWidth=2;ctx.stroke();
    // head and hair
    circle(x,y-39+bob,15,'#f4c394');ctx.fillStyle='#6b513d';ctx.beginPath();ctx.arc(x,y-43+bob,15,Math.PI,Math.PI*2);ctx.lineTo(x+13,y-37+bob);ctx.quadraticCurveTo(x+5,y-48+bob,x-12,y-37+bob);ctx.closePath();ctx.fill();
    // eyes + smile
    circle(x-5,y-38+bob,1.5,'#34434a');circle(x+5,y-38+bob,1.5,'#34434a');ctx.beginPath();ctx.arc(x,y-33+bob,4,.2,2.8);ctx.strokeStyle='#a96857';ctx.lineWidth=1.5;ctx.stroke();
    // leaf cap
    ctx.fillStyle=o.color;ctx.beginPath();ctx.ellipse(x-1,y-55+bob,12,5,-.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+7,y-57+bob,7,3,-.6,0,Math.PI*2);ctx.fill();
    // level sparkles
    if(state.level>1){circle(x-17,y-57+bob,2,'#ffe48a');circle(x+20,y-46+bob,1.8,'#fff0a1')}
  }
  function drawEnemy(e,t) {
    const bob=Math.sin(t*7+e.seed)*2, x=e.x,y=e.y+bob;
    ctx.fillStyle='#40554842';ctx.beginPath();ctx.ellipse(x,y+20,e.kind==='brute'?22:16,5,0,0,7);ctx.fill();
    if(e.frozen>0){circle(x,y-3,27,'#9fe7f3aa');circle(x,y-3,31,'#d9fbff33')}
    if(e.kind==='slime'){
      ctx.fillStyle='#88bf62';ctx.beginPath();ctx.moveTo(x-18,y+14);ctx.quadraticCurveTo(x-22,y-8,x-7,y-14);ctx.quadraticCurveTo(x+11,y-22,x+18,y+4);ctx.quadraticCurveTo(x+20,y+16,x+12,y+15);ctx.closePath();ctx.fill();
      circle(x-5,y,2,'#344538');circle(x+7,y,2,'#344538');ctx.beginPath();ctx.arc(x+1,y+5,4,0.2,2.8);ctx.strokeStyle='#4b6847';ctx.lineWidth=1.5;ctx.stroke();
    } else {
      let body=e.kind==='brute'?'#9c745a':e.kind==='wolf'?'#8b8b83':'#8cba6b';let s=e.kind==='brute'?1.25:1;
      ctx.save();ctx.translate(x,y);ctx.scale(s,1);
      // ears
      ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-12,-19);ctx.lineTo(-19,-34);ctx.lineTo(-4,-26);ctx.moveTo(10,-19);ctx.lineTo(20,-32);ctx.lineTo(15,-13);ctx.fill();
      circle(0,-12,16,body);
      // eye patch
      circle(-6,-14,2.5,'#fff2cb');circle(5,-14,2.5,'#fff2cb');circle(-5,-14,1,'#3b3d34');circle(6,-14,1,'#3b3d34');
      line(-4,-5,4,-5,'#563f38',2);line(-10,6,-14,17,'#4e5944',4);line(10,6,14,17,'#4e5944',4);
      if(e.kind==='brute'){rounded(-8,-32,16,8,3,'#c7a053');line(-13,-34,-19,-41,'#eee4c6',3);line(13,-34,19,-41,'#eee4c6',3)}
      if(e.kind==='wolf'){ctx.fillStyle='#777b77';ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(-27,-15);ctx.lineTo(-20,0);ctx.fill()}
      ctx.restore();
    }
    if(e.hp<e.maxHp){rounded(x-17,y-36,34,4,2,'#594e4b');rounded(x-16,y-35,32*e.hp/e.maxHp,2,1,'#f28875')}
    if(state.target===e){circle(x,y-7,29,null,'#fff2a1');line(x-4,y-42,x+4,y-42,'#fff2a1',2)}
  }
  function drawArrow(a) {const ang=Math.atan2(a.ty-a.y,a.tx-a.x);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(ang);line(-10,0,8,0,'#e9c873',3);ctx.fillStyle='#fff0bb';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(4,-4);ctx.lineTo(4,4);ctx.fill();ctx.restore();circle(a.x,a.y,5,'#ffec9c33')}
  function drawEffects(dt) {
    for(const e of state.effects){e.life-=dt;if(e.type==='ring'){ctx.beginPath();ctx.arc(e.x,e.y,32+(1-e.life/e.max)*65,0,7);ctx.strokeStyle=`rgba(186,239,250,${e.life/e.max})`;ctx.lineWidth=8*e.life/e.max;ctx.stroke()}else if(e.type==='zap'){line(e.x,e.y-100,e.x,e.y-7,`rgba(255,239,156,${e.life/e.max})`,9);line(e.x,e.y-100,e.x-7,e.y-60,'#fff9c5',3)}else if(e.type==='hit'){circle(e.x,e.y,18*(1-e.life/e.max),'#fff3a5aa')}}
    state.effects=state.effects.filter(e=>e.life>0);
    for(const p of state.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;circle(p.x,p.y,Math.max(1,p.size*p.life/p.max),p.color)}state.particles=state.particles.filter(p=>p.life>0);
  }
  function render(t,dt) {
    ctx.clearRect(0,0,W,H);drawBackground(t);drawCastle(t);
    // keep flowers and path retain foreground
    drawHero(t);state.enemies.forEach(e=>drawEnemy(e,t));state.arrows.forEach(drawArrow);drawEffects(dt);
  }

  function updateHud() {
    $('castleHp').textContent = `${Math.ceil(state.castle)}%`; $('castleBar').style.width = `${state.castle}%`;
    $('castleBar').style.background = state.castle < 35 ? '#e88770' : '#80bd78';
    $('goldCount').textContent = state.gold; $('levelCount').textContent = state.level; $('heroLevel').textContent = state.level;
    const needed = xpNeeded(); $('xpBar').style.width = `${100*state.xp/needed}%`; $('xpText').textContent = `${state.xp} / ${needed}`;
    $('waveCount').textContent = state.wave; $('waveLabel').textContent = labels[(state.wave-1)%labels.length];
    $('enemyCount').textContent = `${Math.max(0,state.total-state.killed)} LEFT`;
    $('waveBar').style.width = `${state.total ? 100*state.killed/state.total : 0}%`;
    $('manaBar').style.width = `${state.mana}%`; $('manaText').textContent = `${Math.floor(state.mana)} / 100`;
    $('heroTitle').textContent = state.level >= 8 ? 'Willow the Starborn' : state.level >= 4 ? 'Willow the Bold' : 'Willow';
    const o=currentOutfit();$('outfitEmoji').textContent=o.emoji;$('outfitName').textContent=o.name;$('buffName').textContent=o.buff;
    $('upgradeCost').textContent=`${upgradeCost()} gold`;
    skillStatus('frostBtn','frostCost',35,state.coolFrost);skillStatus('stormBtn','stormCost',50,state.coolStorm);
  }
  function skillStatus(button,costId,cost,cool){
    $(costId).textContent=`⚡ ${cost}`;const btn=$(button),shade=btn.querySelector('.cooldown-shade');
    const max=button==='frostBtn'?5:7;shade.style.transform=`scaleY(${clamp(cool/max,0,1)})`;
    btn.classList.toggle('unavailable',state.mana<cost||cool>0||!state.enemies.length);
  }
  function xpNeeded(){return 30+(state.level-1)*18}
  function upgradeCost(){return 20+state.damageLevel*16}
  function awardXP(amount){
    state.xp+=amount;let leveled=false;
    while(state.xp>=xpNeeded()){state.xp-=xpNeeded();state.level++;state.gold+=15;state.mana=100;leveled=true;}
    if(leveled){showBanner(`LEVEL ${state.level}! +15 GOLD`);soundFx(660,.12);makeSparkles(210,390,18)}
  }
  function makeSparkles(x,y,n){for(let i=0;i<n;i++)state.particles.push({x,y,vx:(Math.random()-.5)*140,vy:-30-Math.random()*130,life:.5+Math.random()*.7,max:1.2,size:2+Math.random()*3,color:['#fff0a8','#f8cb68','#fff9de','#b6dd91'][i%4]})}
  function showBanner(text){const b=$('banner');b.textContent=text;b.classList.add('show');clearTimeout(showBanner.timer);showBanner.timer=setTimeout(()=>b.classList.remove('show'),1350)}
  function soundFx(freq,duration){if(!state.sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
  function spawnEnemy(){
    const r=Math.random(),kind=state.wave>=4&&r<.2?'wolf':state.wave>=3&&r<.28?'brute':state.wave>=2&&r<.53?'slime':'goblin';
    const base=kind==='brute'?5:kind==='slime'?2:kind==='wolf'?2:3;
    state.enemies.push({x:930+Math.random()*38,y:430,kind,hp:base+Math.floor(state.wave*.7),maxHp:base+Math.floor(state.wave*.7),speed:(kind==='wolf'?47:kind==='brute'?22:kind==='slime'?29:34)+Math.min(state.wave*1.1,14),attack:0,seed:Math.random()*9,frozen:0});
    state.spawned++;
  }
  function beginWave(){state.wave++;state.total=5+state.wave*2;state.spawned=0;state.killed=0;state.spawnClock=1.2;state.waveWait=0;showBanner(`WAVE ${state.wave} INCOMING!`);$('weatherText').textContent=state.wave>4?'The shadows are gathering…':'Little feet on the garden path…';soundFx(420,.18)}
  function killEnemy(e){
    if(e.dead)return;e.dead=true;state.killed++;state.gold+=5+Math.floor(state.wave/2);state.mana=clamp(state.mana+5,0,100);awardXP(9+Math.floor(state.wave/3));
    state.effects.push({type:'hit',x:e.x,y:e.y-4,life:.25,max:.25});makeSparkles(e.x,e.y,5);soundFx(270,.06);save();
  }
  function update(dt){
    state.elapsed+=dt;state.mana=clamp(state.mana+(6+currentOutfit().mana*.12)*dt,0,100);state.coolFrost=Math.max(0,state.coolFrost-dt);state.coolStorm=Math.max(0,state.coolStorm-dt);
    if(state.targetTime>0){state.targetTime-=dt;if(state.targetTime<=0)state.target=null}
    if(state.spawned<state.total){state.spawnClock-=dt;if(state.spawnClock<=0){spawnEnemy();state.spawnClock=Math.max(.65,1.8-state.wave*.035)+(Math.random()*.25)}}
    state.shotClock-=dt;
    if(state.shotClock<=0&&state.enemies.length){let target=state.target&&!state.target.dead?state.target:state.enemies.reduce((a,b)=>a.x<b.x?a:b);state.arrows.push({x:235,y:397,tx:target.x,ty:target.y-8,target,speed:560,damage:(1+state.damageLevel*.65)*currentOutfit().damage});state.shotClock=Math.max(.5,1.15-state.damageLevel*.025);soundFx(520,.035)}
    for(const a of state.arrows){if(!a.target||a.target.dead){a.done=true;continue}a.tx=a.target.x;a.ty=a.target.y-8;const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy),step=a.speed*dt;if(d<step+8){a.target.hp-=a.damage;a.done=true;state.effects.push({type:'hit',x:a.tx,y:a.ty,life:.22,max:.22});if(a.target.hp<=0)killEnemy(a.target)}else{a.x+=dx/d*step;a.y+=dy/d*step}}
    state.arrows=state.arrows.filter(a=>!a.done);
    for(const e of state.enemies){
      if(e.dead)continue;if(e.frozen>0){e.frozen=Math.max(0,e.frozen-dt);continue}
      if(e.x>151)e.x-=e.speed*dt;else{e.attack-=dt;if(e.attack<=0){state.castle=clamp(state.castle-(e.kind==='brute'?7:4),0,100);e.attack=1.1;state.effects.push({type:'hit',x:155,y:395,life:.3,max:.3});soundFx(120,.08)}}
    }
    state.enemies=state.enemies.filter(e=>!e.dead);
    if(state.spawned>=state.total&&!state.enemies.length){state.waveWait+=dt;if(state.waveWait>2.2)beginWave()}
    if(state.castle<=0&&!state.dead){state.dead=true;state.running=false;$('finalGold').textContent=state.gold;$('gameOver').classList.add('show')}
  }
  function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(state.running&&!state.dead)update(dt);render(now/1000,dt);updateHud();requestAnimationFrame(frame)}
  function togglePause(force){if(state.dead)return;state.running=force!==undefined?force:!state.running;$('modalBackdrop').classList.toggle('open',!state.running);$('pauseModal').style.display=state.running?'none':'block';$('outfitModal').style.display='none'}
  function castFrost(){if(state.coolFrost>0||state.mana<35||!state.enemies.length||!state.running)return;state.mana-=35;state.coolFrost=5;showBanner('FROST NOVA!');soundFx(880,.3);for(const e of state.enemies){e.frozen=3.1;e.hp-=1.5*currentOutfit().damage;if(e.hp<=0)killEnemy(e);state.effects.push({type:'ring',x:e.x,y:e.y,life:.55,max:.55})}makeSparkles(470,380,14)}
  function castStorm(){if(state.coolStorm>0||state.mana<50||!state.enemies.length||!state.running)return;state.mana-=50;state.coolStorm=7;let e=state.target&&!state.target.dead?state.target:state.enemies.reduce((a,b)=>a.x<b.x?a:b);state.effects.push({type:'zap',x:e.x,y:e.y,life:.42,max:.42});showBanner('STARFALL!');soundFx(980,.25);e.hp-=4*currentOutfit().damage;if(e.hp<=0)killEnemy(e);makeSparkles(e.x,e.y,12)}
  function showWardrobe(){renderOutfits();$('pauseModal').style.display='none';$('modalBackdrop').classList.add('open');$('outfitModal').style.display='block'}
  function renderOutfits(){const list=$('outfitList');list.innerHTML='';outfits.forEach((o,i)=>{const unlocked=state.level>=o.level,selected=state.outfit===i;const row=document.createElement('div');row.className='outfit-option'+(selected?' selected':'');row.innerHTML=`<span class="outfit-art">${o.emoji}</span><div class="outfit-detail"><b>${o.name}</b><small>${o.buff} · ${unlocked?'Ready to wear':`Unlock at level ${o.level}`}</small></div><button class="outfit-state ${unlocked?'':'locked'}">${selected?'WORN':unlocked?'WEAR':'🔒'}</button>`;const btn=row.querySelector('button');if(unlocked)btn.addEventListener('click',()=>{state.outfit=i;save();renderOutfits();updateHud();showBanner(`${o.name.toUpperCase()} EQUIPPED`)});list.appendChild(row)})}
  function upgrade(){const cost=upgradeCost();if(state.gold<cost||!state.running)return;state.gold-=cost;state.damageLevel++;state.mana=clamp(state.mana+12,0,100);showBanner('ARROWS UPGRADED!');soundFx(720,.13);save();updateHud()}
  canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;let hit=null,dist=48;for(const foe of state.enemies){const d=Math.hypot(foe.x-x,foe.y-y);if(d<dist){dist=d;hit=foe}}if(hit){state.target=hit;state.targetTime=5;$('hint').classList.add('hidden');if(state.running)showBanner('TARGET MARKED!')}else if(state.target){state.target=null;state.targetTime=0}});
  $('frostBtn').addEventListener('click',castFrost);$('stormBtn').addEventListener('click',castStorm);$('upgradeBtn').addEventListener('click',upgrade);$('wardrobeBtn').addEventListener('click',showWardrobe);
  $('pauseBtn').addEventListener('click',()=>togglePause());$('resumeBtn').addEventListener('click',()=>togglePause(true));
  $('closeModal').addEventListener('click',()=>{$('modalBackdrop').classList.remove('open');$('outfitModal').style.display='none'});
  $('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop')&&state.running){$('modalBackdrop').classList.remove('open');$('outfitModal').style.display='none'}});
  $('soundBtn').addEventListener('click',()=>{state.sound=!state.sound;$('soundBtn').classList.toggle('sound-on',state.sound);$('soundBtn').textContent=state.sound?'♫':'♩';if(state.sound)soundFx(660,.1)});
  $('retryBtn').addEventListener('click',()=>{state.castle=100;state.mana=100;state.wave=1;state.killed=0;state.spawned=0;state.total=7;state.spawnClock=1;state.waveWait=0;state.enemies=[];state.arrows=[];state.effects=[];state.dead=false;state.running=true;$('gameOver').classList.remove('show');showBanner('THE KEEP NEEDS YOU!');save()});
  state.total=7;resize();updateHud();requestAnimationFrame(frame);
})();
