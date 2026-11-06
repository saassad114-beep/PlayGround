(() => {
  'use strict';
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const outfits = [
    {name:'Neon Runner',emoji:'🦾',level:1,buff:'Overclock',damage:1,mana:0,color:'#00f5d4',cape:'#ff3eb5'},
    {name:'Chrome Samurai',emoji:'🥷',level:2,buff:'Chrome Guard',damage:1.18,mana:0,color:'#dce8f3',cape:'#8b5cff'},
    {name:'Street Phantom',emoji:'🕶️',level:3,buff:'Ghost Protocol',damage:1.35,mana:2,color:'#fa3e9b',cape:'#321b52'},
    {name:'Circuit Witch',emoji:'🧙‍♀️',level:4,buff:'Arc Surge',damage:1.5,mana:8,color:'#8b5cff',cape:'#04d9ff'},
    {name:'Mech Pilot',emoji:'🤖',level:6,buff:'Heavy Metal',damage:1.75,mana:12,color:'#f9a826',cape:'#ff3e7f'},
    {name:'Starforged',emoji:'🌌',level:8,buff:'Starlight',damage:2,mana:20,color:'#00d9ff',cape:'#ff38ba'}
  ];
  const labels = ['ROGUE DRONES','SLIME HACKERS','THE ORCISH RAID','SHADOW MECHS','TITAN UPRISING'];
  const weapons = [
    {name:'PULSE RIFLE',icon:'🔫',damage:1,speed:560,rate:1.15,color:'#00f5d4',trail:'#00f5d4'},
    {name:'PLASMA CANNON',icon:'🟣',damage:2.1,speed:390,rate:1.55,color:'#ff4fd8',trail:'#ff4fd8'},
    {name:'RAILGUN',icon:'⚡',damage:1.45,speed:900,rate:1.45,color:'#ffe45e',trail:'#fff4a8'},
    {name:'BURST SMG',icon:'💥',damage:.72,speed:650,rate:.38,color:'#ff7a45',trail:'#ffb347'}
  ];
  const saved = (() => { try { return JSON.parse(localStorage.getItem('neonKeepSave') || localStorage.getItem('enchantedKeepSave') || '{}'); } catch { return {}; } })();
  const state = {
    gold: Math.max(0, saved.gold || 0), level: Math.max(1, saved.level || 1), xp: Math.max(0, saved.xp || 0),
    castle: 100, mana: 100, wave: 1, killed: 0, total: 0, spawned: 0, waveWait: 0,
    enemies: [], arrows: [], effects: [], particles: [], helpers: 0, helperTime: 0, target: null, targetTime: 0, shotClock: 0,
    spawnClock: 1.8, running: true, dead: false, sound: false, outfit: saved.outfit || 0, weapon: saved.weapon || 0,
    damageLevel: Math.max(0, saved.damageLevel || 0), coolFrost: 0, coolStorm: 0, coolHelper: 0, helperShot: 0, elapsed: 0
  };
  let W = 900, H = 610, last = performance.now(), audio;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const currentOutfit = () => outfits[clamp(state.outfit, 0, outfits.length - 1)];
  const save = () => { try { localStorage.setItem('neonKeepSave', JSON.stringify({gold:state.gold, level:state.level, xp:state.xp, outfit:state.outfit, weapon:state.weapon, damageLevel:state.damageLevel})); } catch {} };
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
    const night=(Math.floor(state.elapsed/38)%2)===1,cycle=state.elapsed%38, glow=night?'#00c8ff':'#ffb347';
    const sky=ctx.createLinearGradient(0,0,0,H);
    if(night){sky.addColorStop(0,'#10142f');sky.addColorStop(.55,'#252451');sky.addColorStop(1,'#44306a')}
    else{sky.addColorStop(0,'#237da0');sky.addColorStop(.55,'#60a9a4');sky.addColorStop(1,'#739b69')}
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    if(night){for(let i=0;i<52;i++){let x=(i*173+31)%W,y=(i*71+18)%260;circle(x,y,1+(i%3)*.35,'#c7f7ff')}circle(752,91,27,'#c9eeff');circle(765,82,26,'#171a3c')}
    else{circle(752,91,35,'#ffe57b');circle(752,91,48,'#ffe57b22')}
    for(let i=0;i<3;i++){let x=((i*370+110-t*5)%(W+200))-80,y=70+i*48;circle(x,y,18,night?'#aab2ff22':'#f8ffed88');circle(x+20,y-8,23,night?'#aab2ff22':'#f8ffed88');circle(x+44,y+2,17,night?'#aab2ff22':'#f8ffed88')}
    ctx.fillStyle=night?'#242c56':'#557e77';ctx.beginPath();ctx.moveTo(0,300);ctx.quadraticCurveTo(150,185,305,284);ctx.quadraticCurveTo(490,177,684,279);ctx.quadraticCurveTo(802,206,900,258);ctx.lineTo(900,444);ctx.lineTo(0,444);ctx.fill();
    ctx.fillStyle=night?'#343460':'#709780';ctx.beginPath();ctx.moveTo(0,360);ctx.quadraticCurveTo(210,260,395,349);ctx.quadraticCurveTo(590,249,900,340);ctx.lineTo(900,465);ctx.lineTo(0,465);ctx.fill();
    const ground=ctx.createLinearGradient(0,375,0,H);ground.addColorStop(0,night?'#253f54':'#527c5b');ground.addColorStop(1,night?'#162b42':'#385f52');ctx.fillStyle=ground;ctx.fillRect(0,375,W,H-375);
    ctx.fillStyle=night?'#37475c':'#86906a';ctx.beginPath();ctx.ellipse(510,505,500,91,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(155,610);ctx.bezierCurveTo(280,498,315,553,430,480);ctx.bezierCurveTo(545,405,645,463,900,390);ctx.lineTo(900,480);ctx.bezierCurveTo(700,539,580,476,482,540);ctx.bezierCurveTo(366,615,280,566,242,610);ctx.closePath();ctx.fillStyle=night?'#4c465d':'#b09a70';ctx.fill();
    for(let i=0;i<9;i++){let x=295+i*78,y=332+(i%3)*15;circle(x,y-25,17,night?'#29395b':'#426e60');circle(x-12,y-11,13,night?'#263553':'#3e6659');circle(x+12,y-10,15,night?'#314365':'#4c7862');rounded(x-3,y-2,7,23,3,'#674d47')}
    // Keep-side firepit: warm light and flickering pixel flame
    const flick=Math.sin(t*13)*3;circle(265,458,28,'#ff7b281c');circle(265,458,18,'#ff9b3433');
    ctx.fillStyle='#65717b';ctx.beginPath();ctx.ellipse(265,466,18,7,0,0,Math.PI*2);ctx.fill();
    line(251,462,279,470,'#7b6254',4);line(253,470,277,461,'#7b6254',4);
    ctx.fillStyle='#ff6b35';ctx.beginPath();ctx.moveTo(255,462);ctx.quadraticCurveTo(250,447,265,437-flick);ctx.quadraticCurveTo(282,449,275,463);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffe66d';ctx.beginPath();ctx.moveTo(261,461);ctx.quadraticCurveTo(258,451,267,447-flick*.5);ctx.quadraticCurveTo(274,457,270,462);ctx.closePath();ctx.fill();
    if(night){ctx.fillStyle='#00eaff18';ctx.fillRect(0,0,W,H)}
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
    // Neon retrofit: glowing battlements, windows, and gate circuitry
    line(18,261,69,261,'#00efff',2);line(124,246,177,246,'#ff38bf',2);line(30,285,163,285,'#48dcff88',1);
    for(let [x,y] of [[37,306],[137,292],[37,363],[137,350],[78,311],[111,311]]){circle(x+6,y+9,8,'#00eaff35');line(x+6,y+3,x+6,y+15,'#58efff',1)}
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
    // compact neon pulse sidearm
    rounded(x+16,y-12,22,10,3,'#263448','#00f5d4');rounded(x+31,y-10,8,4,1,'#00f5d4');line(x+21,y-7,x+34,y-7,'#d7ffff',1);
    // cyber helmet and luminous visor
    circle(x,y-39+bob,15,'#e6ad82');ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(x,y-42+bob,16,Math.PI,Math.PI*2);ctx.lineTo(x+15,y-33+bob);ctx.lineTo(x-15,y-33+bob);ctx.closePath();ctx.fill();
    rounded(x-13,y-43+bob,27,8,3,'#172337','#ff4fd8');line(x-8,y-39+bob,x+8,y-39+bob,'#b9ffff',2);
    // antenna and little circuit glints
    line(x-10,y-53+bob,x-14,y-61+bob,'#00f5d4',2);circle(x-14,y-62+bob,2,'#ff4fd8');
    line(x-8,y-22,x-3,y-17,'#ff51c8',1);circle(x+11,y-22,2,'#00f5d4');
    // level sparkles
    if(state.level>1){circle(x-17,y-57+bob,2,'#ffe48a');circle(x+20,y-46+bob,1.8,'#fff0a1')}
  }
  function drawEnemy(e,t) {
    const bob=Math.sin(t*7+e.seed)*2, x=e.x,y=e.y+bob, size=e.kind==='boss'?1.9:e.kind==='brute'?1.35:1;
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.translate(-x,-y);
    ctx.fillStyle='#40554842';ctx.beginPath();ctx.ellipse(x,y+20,e.kind==='brute'?22:16,5,0,0,7);ctx.fill();
    if(e.frozen>0){circle(x,y-3,27,'#9fe7f3aa');circle(x,y-3,31,'#d9fbff33')}
    if(e.kind==='slime'){
      ctx.fillStyle='#88bf62';ctx.beginPath();ctx.moveTo(x-18,y+14);ctx.quadraticCurveTo(x-22,y-8,x-7,y-14);ctx.quadraticCurveTo(x+11,y-22,x+18,y+4);ctx.quadraticCurveTo(x+20,y+16,x+12,y+15);ctx.closePath();ctx.fill();
      circle(x-5,y,2,'#344538');circle(x+7,y,2,'#344538');ctx.beginPath();ctx.arc(x+1,y+5,4,0.2,2.8);ctx.strokeStyle='#4b6847';ctx.lineWidth=1.5;ctx.stroke();
    } else {
      let body=e.kind==='boss'?'#762b85':e.kind==='brute'?'#9c745a':e.kind==='wolf'?'#626c83':'#8cba6b';let s=e.kind==='brute'?1.25:1;
      ctx.save();ctx.translate(x,y);ctx.scale(s,1);
      // ears
      ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-12,-19);ctx.lineTo(-19,-34);ctx.lineTo(-4,-26);ctx.moveTo(10,-19);ctx.lineTo(20,-32);ctx.lineTo(15,-13);ctx.fill();
      circle(0,-12,16,body);
      // eye patch
      circle(-6,-14,2.5,'#fff2cb');circle(5,-14,2.5,'#fff2cb');circle(-5,-14,1,'#3b3d34');circle(6,-14,1,'#3b3d34');
      line(-4,-5,4,-5,'#563f38',2);line(-10,6,-14,17,'#4e5944',4);line(10,6,14,17,'#4e5944',4);
      if(e.kind==='brute'){rounded(-8,-32,16,8,3,'#c7a053');line(-13,-34,-19,-41,'#eee4c6',3);line(13,-34,19,-41,'#eee4c6',3)}
      if(e.kind==='boss'){line(-10,-24,-23,-43,'#ff4fd8',6);line(10,-24,24,-43,'#ff4fd8',6);circle(0,-12,21,null,'#ff4fd8');line(-7,-14,7,-14,'#00f5d4',3)}
      if(e.kind==='wolf'){ctx.fillStyle='#777b77';ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(-27,-15);ctx.lineTo(-20,0);ctx.fill()}
      ctx.restore();
    }
    if(e.hp<e.maxHp){rounded(x-17,y-36,34,4,2,'#594e4b');rounded(x-16,y-35,32*e.hp/e.maxHp,2,1,'#f28875')}
    if(state.target===e){circle(x,y-7,29,null,'#fff2a1');line(x-4,y-42,x+4,y-42,'#fff2a1',2)}
    ctx.restore();
  }
  function drawArrow(a) {const ang=Math.atan2(a.ty-a.y,a.tx-a.x),w=weapons[a.weapon||0];ctx.save();ctx.translate(a.x,a.y);ctx.rotate(ang);if(w.name==='RAILGUN'){line(-17,0,12,0,w.color,4);line(-8,-3,12,-3,'#fff',1)}else if(w.name==='PLASMA CANNON'){circle(0,0,7,w.color);circle(0,0,3,'#fff')}else{line(-9,0,8,0,w.color,w.name==='BURST SMG'?2:3);ctx.fillStyle=w.color;ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(4,-4);ctx.lineTo(4,4);ctx.fill()}ctx.restore();circle(a.x,a.y,8,`${w.trail}22`) }
  function drawEffects(dt) {
    for(const e of state.effects){e.life-=dt;if(e.type==='ring'){ctx.beginPath();ctx.arc(e.x,e.y,32+(1-e.life/e.max)*65,0,7);ctx.strokeStyle=`rgba(186,239,250,${e.life/e.max})`;ctx.lineWidth=8*e.life/e.max;ctx.stroke()}else if(e.type==='zap'){line(e.x-32,e.y-100,e.x,e.y-7,`rgba(255,79,216,${e.life/e.max})`,12);line(e.x-32,e.y-100,e.x-7,e.y-60,'#f4fcff',4);line(e.x-45,e.y-80,e.x+4,e.y-15,'#72faff',2)}else if(e.type==='hit'){circle(e.x,e.y,18*(1-e.life/e.max),'#fff3a5aa')}}
    state.effects=state.effects.filter(e=>e.life>0);
    for(const p of state.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;circle(p.x,p.y,Math.max(1,p.size*p.life/p.max),p.color)}state.particles=state.particles.filter(p=>p.life>0);
  }
  function drawHelpers(t){if(!state.helpers)return;for(let i=0;i<2;i++){const x=164+Math.sin(t*2+i)*3,y=362+i*39+Math.cos(t*3+i)*4;line(148,384,x,y,'#00f5d477',2);circle(x,y,11,'#17233b','#00f5d4');circle(x,y,4,'#ff4fd8');line(x-6,y+9,x-10,y+13,'#6af9ef',2);line(x+6,y+9,x+10,y+13,'#6af9ef',2)}}
  function render(t,dt) {
    ctx.clearRect(0,0,W,H);drawBackground(t);drawCastle(t);
    drawHelpers(t);drawHero(t);state.enemies.forEach(e=>drawEnemy(e,t));state.arrows.forEach(drawArrow);drawEffects(dt);
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
    const weapon=weapons[state.weapon];$('weaponIcon').textContent=weapon.icon;$('weaponName').textContent=weapon.name;
    const night=Math.floor(state.elapsed/38)%2===1;$('timeLabel').textContent=night?'NIGHT SHIFT':'DAY SHIFT';$('dayDot').style.background=night?'#8f79ff':'#00e7d4';
    $('upgradeCost').textContent=`${upgradeCost()} gold`;
    skillStatus('frostBtn','frostCost',35,state.coolFrost);skillStatus('stormBtn','stormCost',50,state.coolStorm);skillStatus('helperBtn','helperCost',40,state.coolHelper);updateUpcoming();
  }
  function skillStatus(button,costId,cost,cool){
    $(costId).textContent=`⚡ ${cost}`;const btn=$(button),shade=btn.querySelector('.cooldown-shade');
    const max=button==='frostBtn'?5:button==='stormBtn'?7:18;shade.style.transform=`scaleY(${clamp(cool/max,0,1)})`;
    btn.classList.toggle('unavailable',state.mana<cost||cool>0||(button!=='helperBtn'&&!state.enemies.length));
  }
  function updateUpcoming(){
    const queue=$('upcoming');if(!queue)return;let icons=[];
    for(let i=0;i<3;i++){const n=state.spawned+i;if(n>=state.total)break;const boss=n===state.total-1&&state.wave%3===0;const kind=boss?'boss':state.wave>=4&&n%4===2?'wolf':state.wave>=3&&n%3===1?'brute':state.wave>=2&&n%2===1?'slime':'goblin';icons.push(`<span title="Incoming ${kind}">${kind==='boss'?'👹':kind==='brute'?'🧌':kind==='wolf'?'🐺':kind==='slime'?'🟢':'🤖'}</span>`)}
    queue.innerHTML=`<small>INBOUND</small>${icons.length?icons.join(''):'<span>✓</span>'}`;
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
    const r=Math.random(),boss=state.spawned===state.total-1&&state.wave%3===0,kind=boss?'boss':state.wave>=4&&r<.2?'wolf':state.wave>=3&&r<.28?'brute':state.wave>=2&&r<.53?'slime':'goblin';
    const base=kind==='boss'?19+state.wave*3:kind==='brute'?8:kind==='slime'?3:kind==='wolf'?4:4;
    const hp=base+Math.floor(state.wave*.9);
    state.enemies.push({x:930+Math.random()*38,y:430,kind,hp,maxHp:hp,speed:(kind==='boss'?13:kind==='wolf'?47:kind==='brute'?21:kind==='slime'?28:34)+Math.min(state.wave*.8,12),attack:0,seed:Math.random()*9,frozen:0});
    state.spawned++;
  }
  function beginWave(){state.wave++;state.total=5+state.wave*2;state.spawned=0;state.killed=0;state.spawnClock=1.2;state.waveWait=0;showBanner(`WAVE ${state.wave} INCOMING!`);$('weatherText').textContent=state.wave>4?'The shadows are gathering…':'Little feet on the garden path…';soundFx(420,.18)}
  function killEnemy(e){
    if(e.dead)return;e.dead=true;state.killed++;state.gold+=5+Math.floor(state.wave/2);state.mana=clamp(state.mana+5,0,100);awardXP(9+Math.floor(state.wave/3));
    state.effects.push({type:'hit',x:e.x,y:e.y-4,life:.25,max:.25});makeSparkles(e.x,e.y,5);soundFx(270,.06);save();
  }
  function update(dt){
    state.elapsed+=dt;state.mana=clamp(state.mana+(6+currentOutfit().mana*.12)*dt,0,100);state.coolFrost=Math.max(0,state.coolFrost-dt);state.coolStorm=Math.max(0,state.coolStorm-dt);state.coolHelper=Math.max(0,state.coolHelper-dt);
    if(state.helperTime>0){state.helperTime=Math.max(0,state.helperTime-dt);state.helperShot-=dt;if(state.helperShot<=0&&state.enemies.length){const foe=state.enemies.reduce((a,b)=>a.x<b.x?a:b);for(let i=0;i<2;i++)state.arrows.push({x:171,y:370+i*24,tx:foe.x,ty:foe.y-8,target:foe,speed:650,damage:.72*currentOutfit().damage,weapon:2});state.helperShot=.85}if(!state.helperTime)state.helpers=0}
    if(state.targetTime>0){state.targetTime-=dt;if(state.targetTime<=0)state.target=null}
    if(state.spawned<state.total){state.spawnClock-=dt;if(state.spawnClock<=0){spawnEnemy();state.spawnClock=Math.max(.65,1.8-state.wave*.035)+(Math.random()*.25)}}
    state.shotClock-=dt;
    if(state.shotClock<=0&&state.enemies.length){let target=state.target&&!state.target.dead?state.target:state.enemies.reduce((a,b)=>a.x<b.x?a:b),weapon=weapons[state.weapon];state.arrows.push({x:247,y:393,tx:target.x,ty:target.y-8,target,speed:weapon.speed,damage:(weapon.damage+state.damageLevel*.42)*currentOutfit().damage,weapon:state.weapon});state.shotClock=Math.max(.23,weapon.rate-state.damageLevel*.025);soundFx(state.weapon===2?780:520,.035)}
    for(const a of state.arrows){if(!a.target||a.target.dead){a.done=true;continue}a.tx=a.target.x;a.ty=a.target.y-8;const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy),step=a.speed*dt;if(d<step+8){a.target.hp-=a.damage;a.done=true;state.effects.push({type:'hit',x:a.tx,y:a.ty,life:.22,max:.22});if(a.target.hp<=0)killEnemy(a.target)}else{a.x+=dx/d*step;a.y+=dy/d*step}}
    state.arrows=state.arrows.filter(a=>!a.done);
    for(const e of state.enemies){
      if(e.dead)continue;if(e.frozen>0){e.frozen=Math.max(0,e.frozen-dt);continue}
      if(e.x>151)e.x-=e.speed*dt;else{e.attack-=dt;if(e.attack<=0){state.castle=clamp(state.castle-(e.kind==='boss'?14:e.kind==='brute'?8:4),0,100);e.attack=e.kind==='boss'?1.5:1.1;state.effects.push({type:'hit',x:155,y:395,life:.3,max:.3});soundFx(120,.08)}}
    }
    state.enemies=state.enemies.filter(e=>!e.dead);
    if(state.spawned>=state.total&&!state.enemies.length){state.waveWait+=dt;if(state.waveWait>2.2)beginWave()}
    if(state.castle<=0&&!state.dead){state.dead=true;state.running=false;$('finalGold').textContent=state.gold;$('gameOver').classList.add('show')}
  }
  function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(state.running&&!state.dead)update(dt);render(now/1000,dt);updateHud();requestAnimationFrame(frame)}
  function togglePause(force){if(state.dead)return;state.running=force!==undefined?force:!state.running;$('modalBackdrop').classList.toggle('open',!state.running);$('pauseModal').style.display=state.running?'none':'block';$('outfitModal').style.display='none'}
  function castFrost(){if(state.coolFrost>0||state.mana<35||!state.enemies.length||!state.running)return;state.mana-=35;state.coolFrost=5;showBanner('FROST NOVA!');soundFx(880,.3);for(const e of state.enemies){e.frozen=3.1;e.hp-=1.5*currentOutfit().damage;if(e.hp<=0)killEnemy(e);state.effects.push({type:'ring',x:e.x,y:e.y,life:.55,max:.55})}makeSparkles(470,380,14)}
  function castStorm(){if(state.coolStorm>0||state.mana<50||!state.enemies.length||!state.running)return;state.mana-=50;state.coolStorm=7;let e=state.target&&!state.target.dead?state.target:state.enemies.reduce((a,b)=>a.x<b.x?a:b);state.effects.push({type:'zap',x:e.x,y:e.y,life:.55,max:.55});showBanner('STARFALL // IMPACT!');soundFx(980,.25);for(const foe of [...state.enemies])if(Math.abs(foe.x-e.x)<90){foe.hp-=(foe===e?9:4)*currentOutfit().damage;if(foe.hp<=0)killEnemy(foe)}makeSparkles(e.x,e.y,22)}
  function callHelpers(){if(state.coolHelper>0||state.mana<40||!state.running)return;state.mana-=40;state.coolHelper=18;state.helpers=2;state.helperTime=14;state.helperShot=0;showBanner('CASTLE HELPERS DEPLOYED!');soundFx(720,.2);makeSparkles(166,378,12)}
  function cycleWeapon(){state.weapon=(state.weapon+1)%weapons.length;save();updateHud();showBanner(`${weapons[state.weapon].name} ONLINE`);soundFx(680,.08)}
  function showWardrobe(){renderOutfits();$('pauseModal').style.display='none';$('modalBackdrop').classList.add('open');$('outfitModal').style.display='block'}
  function renderOutfits(){const list=$('outfitList');list.innerHTML='';outfits.forEach((o,i)=>{const unlocked=state.level>=o.level,selected=state.outfit===i;const row=document.createElement('div');row.className='outfit-option'+(selected?' selected':'');row.innerHTML=`<span class="outfit-art">${o.emoji}</span><div class="outfit-detail"><b>${o.name}</b><small>${o.buff} · ${unlocked?'Ready to wear':`Unlock at level ${o.level}`}</small></div><button class="outfit-state ${unlocked?'':'locked'}">${selected?'WORN':unlocked?'WEAR':'🔒'}</button>`;const btn=row.querySelector('button');if(unlocked)btn.addEventListener('click',()=>{state.outfit=i;save();renderOutfits();updateHud();showBanner(`${o.name.toUpperCase()} EQUIPPED`)});list.appendChild(row)})}
  function upgrade(){const cost=upgradeCost();if(state.gold<cost||!state.running)return;state.gold-=cost;state.damageLevel++;state.mana=clamp(state.mana+12,0,100);showBanner('ARROWS UPGRADED!');soundFx(720,.13);save();updateHud()}
  canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;let hit=null,dist=48;for(const foe of state.enemies){const d=Math.hypot(foe.x-x,foe.y-y);if(d<dist){dist=d;hit=foe}}if(hit){state.target=hit;state.targetTime=5;$('hint').classList.add('hidden');if(state.running)showBanner('TARGET MARKED!')}else if(state.target){state.target=null;state.targetTime=0}});
  $('frostBtn').addEventListener('click',castFrost);$('stormBtn').addEventListener('click',castStorm);$('helperBtn').addEventListener('click',callHelpers);$('weaponBtn').addEventListener('click',cycleWeapon);$('upgradeBtn').addEventListener('click',upgrade);$('wardrobeBtn').addEventListener('click',showWardrobe);
  $('pauseBtn').addEventListener('click',()=>togglePause());$('resumeBtn').addEventListener('click',()=>togglePause(true));
  $('closeModal').addEventListener('click',()=>{$('modalBackdrop').classList.remove('open');$('outfitModal').style.display='none'});
  $('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop')&&state.running){$('modalBackdrop').classList.remove('open');$('outfitModal').style.display='none'}});
  $('soundBtn').addEventListener('click',()=>{state.sound=!state.sound;$('soundBtn').classList.toggle('sound-on',state.sound);$('soundBtn').textContent=state.sound?'♫':'♩';if(state.sound)soundFx(660,.1)});
  $('retryBtn').addEventListener('click',()=>{state.castle=100;state.mana=100;state.wave=1;state.killed=0;state.spawned=0;state.total=7;state.spawnClock=1;state.waveWait=0;state.enemies=[];state.arrows=[];state.effects=[];state.dead=false;state.running=true;$('gameOver').classList.remove('show');showBanner('THE KEEP NEEDS YOU!');save()});
  state.total=7;resize();updateHud();requestAnimationFrame(frame);
})();
