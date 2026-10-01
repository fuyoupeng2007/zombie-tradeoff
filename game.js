/* Zombie Tradeoff: Dead Air — original Canvas artwork, offline, no dependencies. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const zh = document.documentElement.lang.startsWith('zh');
  const tr = (cn, en) => zh ? cn : en;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const rand = (a,b) => a+Math.random()*(b-a);
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const TAU = Math.PI*2, STEP = 1/120, WORLD_H = 810, FLOOR = 667;
  const canvas = $('game'), ctx = canvas.getContext('2d',{alpha:false});
  const store = {get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
  const settings = store.get('zombieDeadAirSettings',{muted:false,quality:'high',difficulty:'normal'});
  const DIFFICULTIES = {
    assist:{hp:8,hpMul:.76,speed:.85,spawn:1.2,damage:.8,rescue:true},
    normal:{hp:6,hpMul:1,speed:1,spawn:1,damage:1,rescue:false},
    hard:{hp:5,hpMul:1.4,speed:1.18,spawn:.76,damage:1.25,rescue:false}
  };
  const WEAPONS = [
    {id:'rifle',name:tr('步枪','RIFLE'),rate:.23,damage:2.7,speed:1160,pellets:1,spread:.02,pierce:1,color:'#ffce8c',range:1450},
    {id:'shotgun',name:tr('霰弹枪','SHOTGUN'),rate:.79,damage:1.7,speed:1050,pellets:7,spread:.10,pierce:1,color:'#f3b575',range:590},
    {id:'rail',name:tr('穿甲枪','PIERCER'),rate:.73,damage:9,speed:1750,pellets:1,spread:0,pierce:4,color:'#8ed8dc',range:1600},
    {id:'arc',name:tr('电弧枪','ARC'),rate:.52,damage:4.8,speed:0,pellets:1,spread:0,pierce:1,color:'#b8dc9b',range:550}
  ];
  const TYPES = {
    normal:{name:tr('游荡者','WALKER'),hp:13,speed:68,size:1,score:10,damage:1,skin:'#8fa77a',cloth:'#65756a'},
    fast:{name:tr('疾跑者','RUNNER'),hp:13,speed:130,size:.94,score:18,damage:2,skin:'#bac186',cloth:'#9a694e'},
    armored:{name:tr('装甲卫兵','ARMORED'),hp:35,speed:60,size:1.1,score:30,damage:2,skin:'#92a391',cloth:'#526c70'},
    brute:{name:tr('巨力者','BRUTE'),hp:58,speed:51,size:1.45,score:45,damage:3,skin:'#b2a284',cloth:'#77634f'},
    tank:{name:tr('巨型坦克','TANK'),hp:130,speed:42,size:1.85,score:70,damage:3,skin:'#87967a',cloth:'#54624f'},
    spitter:{name:tr('喷毒者','SPITTER'),hp:26,speed:56,size:1.06,score:30,damage:1,skin:'#abc580',cloth:'#61795c'},
    exploder:{name:tr('自爆者','EXPLODER'),hp:24,speed:102,size:1.18,score:35,damage:3,skin:'#b6a976',cloth:'#99704f'},
    flyer:{name:tr('飞翼尸','WINGED'),hp:26,speed:110,size:1,score:35,damage:2,skin:'#9ea592',cloth:'#65716e'},
    screamer:{name:tr('尖啸者','SCREAMER'),hp:44,speed:44,size:1.12,score:50,damage:1,skin:'#c3b0a0',cloth:'#70586b'},
    leaper:{name:tr('跃袭者','LEAPER'),hp:34,speed:80,size:1.04,score:35,damage:2,skin:'#a7b390',cloth:'#696e58'},
    boss:{name:tr('缝合暴君','THE STITCHED TYRANT'),hp:3200,speed:50,size:2.8,score:1000,damage:3,skin:'#aba58b',cloth:'#685851'}
  };
  const G = {state:'menu',time:0,score:0,kills:0,bossKills:0,wave:1,nextChoice:30,nextBoss:180,spawnCd:1,packCd:45,itemCd:2,specialCd:40,shake:0,flash:0,difficulty:'normal',death:'',best:0,menuTime:0,toastUntil:0};
  const P = {};
  let worldW=1440,scale=1,offX=0,offY=0,dpr=1,bg=null;
  let enemies=[],bullets=[],hostiles=[],items=[],particles=[],floats=[],effects=[],hazards=[];
  let nextId=1,offers=[],input={},pressed={},touchPointers=new Map(),heldKeys=new Set(),hudCd=0;
  const pointer = {x:1000,y:440,active:false,down:false};
  let manualAim=false,touchMode=matchMedia('(pointer:coarse)').matches;
  document.body.classList.toggle('touch',touchMode);
  function resetPlayer(){
    Object.assign(P,{x:worldW*.39,y:FLOOR,vx:0,vy:0,grounded:true,coyote:0,jumpBuffer:0,jumps:0,maxJumps:1,face:1,aim:0,hp:DIFFICULTIES[G.difficulty].hp,maxHp:DIFFICULTIES[G.difficulty].hp,shield:0,inv:0,dashCd:0,dashTime:0,dashDir:1,fireCd:0,burstCd:0,recoil:0,walk:0,land:0,weapon:0,damage:1,growth:0,rate:1,pierce:0,chains:0,crit:0,lifesteal:0,slow:0,armor:0,speed:310,dashRate:1,pickup:1,crate:0,healCounter:0});
  }
  resetPlayer();
  const label = (id,cn,en) => $(id).textContent=tr(cn,en);
  label('edition','生存档案 / 取舍之战 2.0','SURVIVAL ARCHIVE / ZOMBIE TRADEOFF 2.0');
  $('title').innerHTML=tr('取舍之战<small>死 寂 天 空 / DEAD AIR</small>','ZOMBIE<br><em>TRADEOFF</em><small>D E A D  A I R</small>');
  label('tagline','地面已被占领。天空，也不再安全。','The streets are lost. The skies are no longer safe.');
  $('features').innerHTML=[tr('10 类变异僵尸','10 MUTATIONS'),tr('跳跃 · 空战','JUMP / AIR COMBAT'),tr('4 种武器','4 WEAPONS'),tr('双阶段 BOSS','2-PHASE BOSS')].map(t=>`<span>${t}</span>`).join('');
  label('briefingLabel','任务简报','FIELD BRIEFING');
  label('briefingText','左侧补给区正在空投装备，右侧尸潮不断逼近。去拿补给、守住位置，还是跃入空中？看清攻击前兆，在每次进化中选择你的生存方式。','Supplies fall on the left. The horde closes in from the right. Scavenge, hold your ground, or take to the air. Read their attacks. Choose how you evolve.');
  $('controlsText').innerHTML=tr('<kbd>A</kbd><kbd>D</kbd> 移动　<kbd>空格</kbd> 跳跃　<kbd>Shift</kbd> 冲刺<br>自动射击 · 鼠标瞄准 / <kbd>Q</kbd> 切换　左键 / <kbd>J</kbd> 强化射击<br><kbd>1</kbd>–<kbd>4</kbd> 换枪　按住 <kbd>E</kbd> 开补给箱　<kbd>Esc</kbd> 暂停','<kbd>A</kbd><kbd>D</kbd> MOVE　<kbd>SPACE</kbd> JUMP　<kbd>SHIFT</kbd> DASH<br>AUTO-FIRE · MOUSE AIM / <kbd>Q</kbd> TOGGLE　CLICK / <kbd>J</kbd> BURST<br><kbd>1</kbd>–<kbd>4</kbd> WEAPON　HOLD <kbd>E</kbd> OPEN CACHE　<kbd>ESC</kbd> PAUSE');
  label('difficultyLabel','选择生存难度','SURVIVAL DIFFICULTY');
  $('difficulty').innerHTML=[['assist',tr('辅助 · 更多生命与救援','ASSIST · MORE HEALTH & RESCUES')],['normal',tr('标准 · 战术生存','STANDARD · TACTICAL SURVIVAL')],['hard',tr('困难 · 尸潮压迫','HARD · RELENTLESS HORDE')]].map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
  $('difficulty').value=DIFFICULTIES[settings.difficulty]?settings.difficulty:'normal';
  label('startBtn','进入废墟 →','ENTER THE RUINS →');
  label('mobileHint','手机支持多点触控；横屏游玩视野更好。点击武器栏可换枪。','Multi-touch supported. Rotate to landscape for a wider view. Tap the weapon bar to switch.');
  label('pauseKicker','暂时撤离火线','OFF THE FIRING LINE');label('pauseTitle','战斗已暂停','PAUSED');
  label('pauseText','喘口气。重返战场时，所有攻击会从暂停处继续。','Catch your breath. Combat resumes exactly where you left it.');
  label('resumeBtn','继续战斗','RESUME');label('quitBtn','返回主菜单','RETURN TO MENU');
  label('upgradeKicker','战地改装 / 三选一','FIELD MODIFICATION / CHOOSE ONE');label('upgradeTitle','选择你的进化','CHOOSE YOUR EVOLUTION');
  label('upgradeText','战斗已暂停。这次升级将持续到本局结束。','Combat is paused. Your choice lasts for the rest of this run.');
  label('upgradeHint','点击卡片，或按 1 / 2 / 3 选择','CLICK A CARD, OR PRESS 1 / 2 / 3');
  label('endKicker','信号丢失 / 生存记录','SIGNAL LOST / SURVIVAL LOG');label('endTitle','你的防线倒下了','THE LINE HAS FALLEN');
  label('againBtn','再次出击','ONE MORE RUN');label('menuBtn','返回主菜单','RETURN TO MENU');
  label('healthLabel','生命信号','VITAL SIGNS');label('touchJump','跳跃','JUMP');label('touchBurst','射击','BURST');label('touchDash','冲刺','DASH');label('touchInteract','开箱','OPEN');
  $('languageLink').textContent=zh?'EN':'中文';$('languageLink').href=zh?'index.html':'打僵尸.html';
  $('weaponBar').innerHTML=WEAPONS.map((w,i)=>`<button type="button" data-weapon="${i}" title="${w.name}"><kbd>${i+1}</kbd>${w.name}</button>`).join('');
  $('weaponBar').addEventListener('click',e=>{const b=e.target.closest('[data-weapon]');if(b&&G.state==='running')switchWeapon(+b.dataset.weapon);});
  function updateSettings(){store.set('zombieDeadAirSettings',settings);label('soundBtn',settings.muted?'声音关':'声音开',settings.muted?'SOUND OFF':'SOUND ON');label('qualityBtn',settings.quality==='high'?'画质高':'画质低',settings.quality==='high'?'FX HIGH':'FX LOW');}
  updateSettings();
  $('soundBtn').onclick=()=>{settings.muted=!settings.muted;ensureAudio();updateSettings();};
  $('qualityBtn').onclick=()=>{settings.quality=settings.quality==='high'?'low':'high';updateSettings();resize();};
  function bestFor(d){return Math.max(store.get('zombieDeadAirBest.'+d,0),d==='normal'?store.get('zombieBest2d',0):0);}
  function bestLabel(){label('bestLabel',`本难度最高分 ${bestFor($('difficulty').value)}`,`BEST IN THIS MODE ${bestFor($('difficulty').value)}`);}
  $('difficulty').onchange=bestLabel;bestLabel();
  function showPanel(id){$('overlay').classList.toggle('hidden',!id);for(const p of ['menuPanel','pausePanel','upgradePanel','endPanel'])$(p).classList.toggle('hidden',p!==id);$('touchControls').classList.toggle('hidden',!touchMode||G.state!=='running');}
  function clearInput(){input={};pressed={};pointer.down=false;touchPointers.clear();heldKeys.clear();document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
  function start(){
    G.difficulty=$('difficulty').value;settings.difficulty=G.difficulty;updateSettings();
    Object.assign(G,{state:'running',time:0,score:0,kills:0,bossKills:0,wave:1,nextChoice:30,nextBoss:180,spawnCd:1.1,packCd:45,itemCd:1,specialCd:DIFFICULTIES[G.difficulty].rescue?30:47,shake:0,flash:0,death:'',best:bestFor(G.difficulty)});
    enemies=[];bullets=[];hostiles=[];items=[];particles=[];floats=[];effects=[];hazards=[];offers=[];nextId=1;
    resetPlayer();clearInput();manualAim=false;pointer.active=false;showPanel(null);$('hud').classList.remove('hidden');ensureAudio();sfx('start');hudCd=0;
    toast(tr('空格跳跃 · 左侧捡补给 · 1–4 切换武器','SPACE TO JUMP · SCAVENGE LEFT · 1–4 SWITCH WEAPONS'),4);
    document.activeElement?.blur();
  }
  function pause(){if(G.state!=='running')return;G.state='paused';clearInput();showPanel('pausePanel');}
  function resume(){if(G.state!=='paused')return;G.state='running';clearInput();showPanel(null);ensureAudio();}
  function menu(){G.state='menu';clearInput();resetPlayer();$('hud').classList.add('hidden');showPanel('menuPanel');bestLabel();}
  function end(source){
    G.state='over';G.death=source;P.hp=0;clearInput();
    const record=G.score>G.best;if(record){G.best=G.score;store.set('zombieDeadAirBest.'+G.difficulty,G.best);}
    $('endStats').innerHTML=[[G.score,tr('得分','SCORE')],[Math.floor(G.time)+'s',tr('存活','SURVIVED')],[G.kills,tr('击杀','ELIMINATIONS')],[G.bossKills,tr('暴君击败','BOSSES DEFEATED')]].map(([v,l])=>`<div><strong>${v}</strong><small>${l}</small></div>`).join('');
    const advice=source===tr('毒池','Toxic pool')?tr('毒池会持续封锁地面，跳过它或提前换位。','Toxic pools deny ground. Jump over them or reposition early.'):source===TYPES.flyer.name?tr('飞翼俯冲有红色轨迹提示，电弧枪适合对空。','Watch the dive warning. The arc gun is excellent against winged enemies.'):tr('跳过冲击波，优先击杀喷毒与尖啸僵尸。','Jump over shockwaves. Prioritize spitters and screamers.');
    $('endAdvice').textContent=(record?tr('新纪录！','NEW RECORD! '):'')+tr(`倒下原因：${source}。`, ` Lost to: ${source}. `)+advice;
    showPanel('endPanel');sfx('hurt');
  }
  $('startBtn').onclick=start;$('againBtn').onclick=start;$('pauseBtn').onclick=pause;$('resumeBtn').onclick=resume;$('quitBtn').onclick=menu;$('menuBtn').onclick=menu;
  function toast(text,duration=2.8){$('toast').textContent=text;$('toast').classList.add('visible');G.toastUntil=performance.now()+duration*1000;}
  function toggleAim(){manualAim=!manualAim;pointer.active=manualAim;hudCd=0;}
  $('aimBtn').onclick=toggleAim;
  function actionDown(action){if(!input[action])pressed[action]=true;input[action]=true;}
  const keyMap={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyW:'jump',ArrowUp:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyJ:'burst',KeyE:'interact'};
  window.addEventListener('keydown',e=>{
    if(e.target.matches('select'))return;
    if(keyMap[e.code]||['Escape','Enter','Digit1','Digit2','Digit3','Digit4','KeyQ'].includes(e.code))e.preventDefault();
    if(e.repeat)return;
    if(e.code==='Escape'){if(G.state==='running')pause();else if(G.state==='paused')resume();return;}
    if(e.code==='Enter'&&(G.state==='menu'||G.state==='over')){start();return;}
    if(G.state==='upgrade'){if(/^Digit[123]$/.test(e.code))chooseUpgrade(+e.code.slice(-1)-1);return;}
    if(G.state!=='running')return;
    if(e.code==='KeyQ'){toggleAim();return;}
    if(/^Digit[1234]$/.test(e.code)){switchWeapon(+e.code.slice(-1)-1);return;}
    if(keyMap[e.code]){heldKeys.add(e.code);actionDown(keyMap[e.code]);}
  });
  window.addEventListener('keyup',e=>{heldKeys.delete(e.code);const action=keyMap[e.code];if(action)input[action]=Array.from(heldKeys).some(k=>keyMap[k]===action)||Array.from(touchPointers.values()).includes(action);});
  window.addEventListener('blur',()=>{clearInput();pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer.x=(e.clientX-offX)/scale;pointer.y=(e.clientY-offY)/scale;pointer.active=true;manualAim=true;});
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;if(G.state==='running'){pointer.down=true;manualAim=true;pointer.active=true;pointer.x=(e.clientX-offX)/scale;pointer.y=(e.clientY-offY)/scale;ensureAudio();}});
  window.addEventListener('pointerup',()=>{pointer.down=false;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.querySelectorAll('[data-action]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{if(G.state!=='running')return;e.preventDefault();b.setPointerCapture(e.pointerId);touchPointers.set(e.pointerId,b.dataset.action);actionDown(b.dataset.action);b.classList.add('held');ensureAudio();});
    const release=e=>{const action=touchPointers.get(e.pointerId);touchPointers.delete(e.pointerId);if(action)input[action]=Array.from(touchPointers.values()).includes(action)||Array.from(heldKeys).some(k=>keyMap[k]===action);b.classList.remove('held');};
    b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  });
  let audio=null,audioCount=0,lastSound=0;
  function ensureAudio(){if(settings.muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
  function tone(a,b,d,type='triangle',vol=.04){if(!audio||settings.muted||audioCount>24)return;try{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=type;o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(Math.max(b,1),t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(audio.destination);audioCount++;o.onended=()=>{audioCount--;o.disconnect();g.disconnect();};o.start();o.stop(t+d+.015);}catch{}}
  function sfx(kind){
    if(kind==='shoot'){const now=performance.now();if(now-lastSound<65)return;lastSound=now;tone(P.weapon===2?1400:420,70,.065,'sawtooth',.018);}
    else if(kind==='pickup'){tone(660,1120,.14,'sine',.055);}
    else if(kind==='jump'){tone(190,490,.12,'triangle',.025);}
    else if(kind==='dash'){tone(340,90,.15,'sawtooth',.025);}
    else if(kind==='hurt'){tone(150,38,.23,'sawtooth',.05);}
    else if(kind==='boom'){tone(95,22,.45,'sawtooth',.06);tone(50,18,.5,'triangle',.05);}
    else if(kind==='start'){tone(330,440,.15);tone(660,880,.25,'sine',.035);}
    else if(kind==='warning'){tone(160,230,.32,'sawtooth',.045);}
    else if(kind==='arc'){tone(950,300,.1,'square',.012);}
  }
  function switchWeapon(i){if(i===P.weapon)return;P.weapon=i;P.fireCd=Math.max(P.fireCd,.18);P.recoil=0;hudCd=0;}
  function resize(){
    const old=worldW;worldW=clamp(innerWidth/innerHeight*WORLD_H,850,1800);scale=Math.min(innerWidth/worldW,innerHeight/WORLD_H);offX=(innerWidth-worldW*scale)/2;offY=(innerHeight-WORLD_H*scale)/2;dpr=Math.min(devicePixelRatio||1,settings.quality==='high'?2:1.25);
    canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
    if(old!==worldW){const ratio=worldW/old;P.x=clamp(P.x*ratio,25,worldW-25);for(const list of [enemies,items,hazards])for(const o of list){o.x*=ratio;if(o.tx!==undefined)o.tx*=ratio;}for(const o of [...bullets,...hostiles]){o.x*=ratio;o.oldX=o.x;}pointer.x*=ratio;}
    buildBackground();
  }
  window.addEventListener('resize',resize);
  function particle(x,y,n,color,power=1){const cap=settings.quality==='high'?480:160;for(let i=0;i<n&&particles.length<cap;i++){const a=rand(0,TAU),v=rand(35,180)*power;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-45,life:rand(.25,.7),maxLife:.7,color,size:rand(1.5,4.2)});}}
  function float(x,y,text,color='#e9d9b1'){if(floats.length>55)return;floats.push({x,y,text,color,life:.85});}
  function ring(x,y,r,color){effects.push({kind:'ring',x,y,r,color,life:.5,maxLife:.5});}
  function spawn(type,options={}){
    if(enemies.length>=85)return null;
    const def=TYPES[type],growth=1+G.time/110+Math.pow(Math.max(0,G.time-90)/240,1.35);
    const hp=(type==='boss'?def.hp*(1+G.bossKills*.8):def.hp*growth)*DIFFICULTIES[G.difficulty].hpMul;
    const z={id:nextId++,type,x:worldW+rand(30,110),y:FLOOR,vx:0,vy:0,hp,maxHp:hp,size:def.size,r:19*def.size,speed:def.speed*(1+Math.min(G.time/170,1.05))*DIFFICULTIES[G.difficulty].speed,face:-1,mode:'walk',timer:0,cd:rand(.9,1.8),ph:rand(0,TAU),hit:0,stun:0,slow:0,armor:type==='armored'?hp*.60:0,buff:0,phase:1,alive:true,hover:rand(145,250),tx:0,ty:FLOOR,attackCount:0,...options};
    if(type==='flyer'&&options.y===undefined)z.y=FLOOR-z.hover;
    enemies.push(z);return z;
  }
  function weightedEnemy(){
    const t=G.time,pool=['normal','normal','normal'];
    if(t>10)pool.push('fast','fast');if(t>25)pool.push('armored');if(t>30)pool.push('flyer');if(t>35)pool.push('spitter');if(t>40)pool.push('brute');if(t>50)pool.push('exploder');if(t>60)pool.push('leaper');if(t>65)pool.push('tank');if(t>80)pool.push('screamer');
    const phase=G.wave%4;
    if(t>90){if(phase===0)pool.push('armored','tank','spitter');if(phase===1)pool.push('flyer','flyer','leaper');if(phase===2)pool.push('fast','exploder','screamer');}
    if(enemies.filter(z=>z.type==='screamer'&&z.alive).length>=2)return pick(pool.filter(t=>t!=='screamer'));
    return pick(pool);
  }
  function spawnPack(){
    // Coordinated reinforcements enter from offscreen, never directly on the player.
    const choices=[['armored','fast','spitter']];
    if(G.time>60)choices.push(['flyer','flyer','leaper']);
    if(G.time>80)choices.push(['tank','spitter','screamer']);
    const group=pick(choices);
    for(let i=0;i<group.length;i++){
      const type=group[i];
      if(type==='screamer'&&enemies.filter(z=>z.alive&&z.type==='screamer').length>=2)continue;
      spawn(type,{x:worldW+35+i*48});
    }
  }
  function spawnItem(kind){
    if(items.length>=18)return;
    kind??=pick(['damage','damage','rate','heal','shield']);
    const rescue=DIFFICULTIES[G.difficulty].rescue&&(P.hp<=2||enemies.length>25);
    items.push({id:nextId++,kind,x:rescue&&['nuke','rail'].includes(kind)?clamp(P.x+rand(-90,90),40,worldW-40):rand(65,worldW*.29),y:rand(-50,-20),vy:rand(92,125),land:false,age:0,landAge:0,progress:0});
  }
  function applyItem(it){
    if(it.kind==='damage'){P.growth+=.6;float(P.x,P.y-90,tr('攻击 +','DMG +'));}
    if(it.kind==='rate'){if(P.rate>.34)P.rate=Math.max(.34,P.rate*.94);else P.growth+=.8;float(P.x,P.y-90,tr('火力提升','FIREPOWER +'));}
    if(it.kind==='heal'){if(P.hp<P.maxHp)P.hp=Math.min(P.maxHp,P.hp+1);else P.shield=Math.min(3,P.shield+1);float(P.x,P.y-90,tr('医疗补给','MEDICAL SUPPLY'),'#afd09a');}
    if(it.kind==='shield'){P.shield=Math.min(3,P.shield+1);float(P.x,P.y-90,tr('护盾 +1','SHIELD +1'),'#8ed8dc');}
    if(it.kind==='crate'){P.growth+=1.6;P.shield=Math.min(3,P.shield+1);P.hp=Math.min(P.maxHp,P.hp+1);toast(tr('补给箱开启：攻击提升 / 护盾 / 医疗','CACHE OPENED: FIREPOWER / SHIELD / MEDICAL'));}
    if(it.kind==='nuke'){
      for(const z of enemies)if(z.alive&&z.x>=0&&z.x<=worldW)damageEnemy(z,z.type==='boss'?z.maxHp*.16:z.maxHp+z.armor+1,{pierce:true,noProc:true});
      for(const h of hostiles)h.life=0;hazards=[];G.flash=.55;G.shake=14;ring(P.x,P.y-40,650,'#ef9456');sfx('boom');toast(tr('空袭支援 · 尸潮清除','AIR SUPPORT · HORDE CLEARED'));
    }
    if(it.kind==='rail'){
      const a=P.aim,x=P.x+Math.cos(a)*38,y=P.y-42+Math.sin(a)*38;
      bullets.push({x,y,oldX:x,oldY:y,vx:Math.cos(a)*2300,vy:Math.sin(a)*2300,damage:80+P.growth*6,life:1.1,pierce:25,armorPierce:true,hits:new Set(),color:'#8ed8dc',r:8,rail:true});sfx('arc');ring(x,y,50,'#8ed8dc');
    }
    sfx('pickup');particle(it.x,it.y,12,'#ead7a0',.8);hudCd=0;
  }
  const UPGRADES = [
    {id:'power',icon:'↗',name:tr('重型弹芯','HEAVY ROUNDS'),desc:tr('所有武器伤害 +18%，基础攻击额外提升。','All weapon damage +18%. Adds base damage.'),apply(){P.damage*=1.18;P.growth+=.8;}},
    {id:'rate',icon:'≋',name:tr('快装枪机','RAPID CYCLING'),desc:tr('射击间隔缩短 12%；极限攻速后转为伤害。','Fire interval −12%. At the limit, gain damage instead.'),apply(){if(P.rate>.34)P.rate=Math.max(.34,P.rate*.88);else P.damage*=1.16;}},
    {id:'double',icon:'⇈',name:tr('空中跃迁','AIR STEP'),desc:tr('解锁二段跳，再按一次跳跃改变落点。','Unlock a second jump. Jump again to change your landing.'),eligible:()=>P.maxJumps===1,apply(){P.maxJumps=2;}},
    {id:'vital',icon:'✚',name:tr('生存强化','VITAL RESERVE'),desc:tr('生命上限 +1，并恢复 2 点生命。','Max health +1. Recover 2 health.'),eligible:()=>P.maxHp<10,apply(){P.maxHp++;P.hp=Math.min(P.maxHp,P.hp+2);}},
    {id:'shield',icon:'◇',name:tr('应急护盾','EMERGENCY SHIELD'),desc:tr('获得 2 层护盾，可完全抵挡两次攻击。','Gain 2 shields, each blocking one attack.'),eligible:()=>P.shield<3,apply(){P.shield=Math.min(3,P.shield+2);}},
    {id:'dash',icon:'»',name:tr('机动伺服','MOBILITY SERVO'),desc:tr('冲刺冷却缩短 18%，移动速度 +8%。','Dash cooldown −18%. Move speed +8%.'),eligible:()=>P.dashRate>.5,apply(){P.dashRate=Math.max(.5,P.dashRate*.82);P.speed=Math.min(420,P.speed*1.08);}},
    {id:'pierce',icon:'➶',name:tr('贯穿弹道','OVERPENETRATION'),desc:tr('步枪和穿甲枪额外贯穿 1 个目标。','Rifle and piercer penetrate one additional target.'),eligible:()=>P.pierce<5,apply(){P.pierce++;}},
    {id:'chain',icon:'ϟ',name:tr('电弧扩散','ARC DIFFUSION'),desc:tr('电弧枪多连锁 1 个目标，连锁距离增加。','Arc gun chains to one more target over a longer distance.'),eligible:()=>P.chains<4,apply(){P.chains++;}},
    {id:'crit',icon:'◎',name:tr('弱点识别','WEAKPOINT OPTICS'),desc:tr('暴击概率 +12%，暴击造成双倍伤害。','Critical chance +12%. Critical hits deal double damage.'),eligible:()=>P.crit<.6,apply(){P.crit=Math.min(.6,P.crit+.12);}},
    {id:'leech',icon:'♥',name:tr('回收医疗','SALVAGE MEDIC'),desc:tr('每击杀 25 个敌人恢复 1 点生命。','Recover 1 health for every 25 enemies eliminated.'),eligible:()=>!P.lifesteal,apply(){P.lifesteal=1;P.healCounter=0;}},
    {id:'slow',icon:'❄',name:tr('迟滞弹头','SUPPRESSION'),desc:tr('命中使敌人短暂减速 25%。','Hits briefly slow enemies by 25%.'),eligible:()=>!P.slow,apply(){P.slow=1;}},
    {id:'armor',icon:'▣',name:tr('防护内衬','REINFORCED LINING'),desc:tr('每次受到的伤害减少 25%，最低仍为 1。','Damage taken −25%, with a minimum of 1.'),eligible:()=>!P.armor,apply(){P.armor=1;}}
  ];
  function openUpgrade(){
    const pool=UPGRADES.filter(u=>!u.eligible||u.eligible());offers=[];while(offers.length<3&&pool.length){const i=Math.floor(Math.random()*pool.length);offers.push(pool.splice(i,1)[0]);}
    G.state='upgrade';clearInput();$('upgradeCards').innerHTML=offers.map((u,i)=>`<button type="button" data-choice="${i}"><span class="upgrade-icon">${u.icon}</span><strong>${u.name}</strong><p>${u.desc}</p></button>`).join('');showPanel('upgradePanel');
  }
  $('upgradeCards').onclick=e=>{const b=e.target.closest('[data-choice]');if(b)chooseUpgrade(+b.dataset.choice);};
  function chooseUpgrade(i){if(G.state!=='upgrade'||!offers[i])return;offers[i].apply();G.state='running';clearInput();showPanel(null);sfx('pickup');toast(tr('改装完成：','MOD INSTALLED: ')+offers[i].name);offers=[];hudCd=0;}
  function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
  function enemyCenter(z){return {x:z.x,y:z.y-(z.type==='flyer'?0:34*z.size)};}
  function playerHit(x,y,r=0){return segmentDistance(x,y,P.x,P.y-54,P.x,P.y-19)<r+17;}
  function damagePlayer(amount,source,kx=0){
    if(P.inv>0||G.state!=='running')return false;
    if(P.shield>0){P.shield--;float(P.x,P.y-90,tr('护盾抵挡','BLOCKED'),'#8ed8dc');ring(P.x,P.y-35,55,'#8ed8dc');}
    else {const n=Math.max(1,Math.round(amount*DIFFICULTIES[G.difficulty].damage*(P.armor?.75:1)));P.hp=Math.max(0,P.hp-n);float(P.x,P.y-85,'−'+n,'#efa07b');particle(P.x,P.y-35,10,'#e9a380');}
    P.inv=.9;P.vx+=kx;G.shake=7;G.flash=.14;sfx('hurt');hudCd=0;if(P.hp<=0)end(source);return true;
  }
  function damageEnemy(z,amount,opts={}){
    if(!z.alive)return;
    const front=opts.fromX===undefined||(opts.fromX-z.x)*z.face>=0;
    if(z.armor>0&&!opts.pierce&&front){const absorbed=Math.min(z.armor,amount*.70);z.armor-=absorbed;amount-=absorbed;if(z.armor<=0){particle(z.x,z.y-40,15,'#a2c3c1');float(z.x,z.y-95,tr('破甲','ARMOR BROKEN'),'#8ed8dc');}}
    z.hp-=amount;z.hit=.12;if(P.slow&&!opts.noProc)z.slow=.7;
    if(!opts.noProc&&Math.random()<.16)particle(z.x,z.y-32*z.size,2,'#b1bc8b',.7);
    if(z.hp<=0)kill(z,opts);
  }
  function kill(z,opts={}){
    if(!z.alive)return;z.alive=false;G.kills++;G.score+=TYPES[z.type].score;particle(z.x,z.y-25*z.size,z.type==='boss'?40:9,TYPES[z.type].skin,1.2);float(z.x,z.y-65*z.size,'+'+TYPES[z.type].score,'#c4d7a9');
    if(z.type==='exploder'&&!opts.noExplosion)explode(z,false);
    if(z.type==='boss'){G.bossKills++;G.shake=15;sfx('boom');toast(tr('暴君已倒下 · 继续生存','TYRANT DOWN · KEEP SURVIVING'),4);spawnItem('crate');P.hp=Math.min(P.maxHp,P.hp+2);}
    if(P.lifesteal&&++P.healCounter>=25){P.healCounter=0;P.hp=Math.min(P.maxHp,P.hp+1);float(P.x,P.y-90,tr('回收医疗 +1','SALVAGE HEAL +1'),'#b3d09c');}
  }
  function explode(z,hurtsPlayer){
    ring(z.x,z.y-25,155,'#efa06a');particle(z.x,z.y-25,28,'#eb9f61',1.8);G.shake=Math.max(G.shake,8);sfx('boom');
    if(hurtsPlayer&&Math.hypot(P.x-z.x,P.y-30-(z.y-25))<160)damagePlayer(TYPES.exploder.damage,TYPES.exploder.name,Math.sign(P.x-z.x)*180);
    // Marking each victim dead before detonating makes chain reactions finite.
    for(const e of enemies)if(e!==z&&e.alive&&Math.hypot(e.x-z.x,e.y-z.y)<160)damageEnemy(e,e.type==='boss'?30:38,{pierce:true,noProc:true});
  }
  function targetEnemy(range=1500){
    let best=null,bestValue=Infinity;
    for(const z of enemies){if(!z.alive||z.x<0||z.x>worldW+12)continue;const c=enemyCenter(z),d=Math.hypot(c.x-P.x,c.y-(P.y-40));if(d>range)continue;const urgency=z.mode==='dive'||z.mode==='explode'||z.mode==='charge'?-.28:0;const score=d*(1+urgency)*(z.type==='screamer'?.85:1);if(score<bestValue){bestValue=score;best=z;}}
    return best;
  }
  function aim(){
    const target=targetEnemy();let tx,ty;
    if(manualAim&&pointer.active){tx=pointer.x;ty=pointer.y;}
    else if(target){const c=enemyCenter(target);tx=c.x;ty=c.y;}
    else {tx=P.x+P.face*150;ty=P.y-42;}
    P.aim=Math.atan2(ty-(P.y-42),tx-P.x);if(Math.abs(tx-P.x)>4)P.face=tx>P.x?1:-1;
    return target;
  }
  function fire(burst=false){
    const w=WEAPONS[P.weapon],a=P.aim,x=P.x+Math.cos(a)*39,y=P.y-42+Math.sin(a)*39;
    const damage=(w.damage+P.growth*(P.weapon===1?.45:1))*P.damage*(burst?.8:1);
    if(w.id==='arc'){
      let z=null,best=Infinity;
      for(const e of enemies){if(!e.alive)continue;const c=enemyCenter(e),d=Math.hypot(c.x-x,c.y-y),angle=Math.atan2(c.y-y,c.x-x);const delta=Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)));if(d<w.range&&(!manualAim||delta<.30)&&d<best){best=d;z=e;}}
      if(z){let px=x,py=y,used=new Set();for(let i=0;z&&i<3+P.chains;i++){const c=enemyCenter(z);effects.push({kind:'arc',x:px,y:py,tx:c.x,ty:c.y,life:.14,maxLife:.14,color:w.color});used.add(z.id);damageEnemy(z,damage*Math.pow(.82,i)*(Math.random()<P.crit?2:1),{pierce:true});px=c.x;py=c.y;z=enemies.filter(e=>e.alive&&!used.has(e.id)&&Math.hypot(e.x-px,enemyCenter(e).y-py)<160+P.chains*20).sort((u,v)=>Math.hypot(u.x-px,enemyCenter(u).y-py)-Math.hypot(v.x-px,enemyCenter(v).y-py))[0];}}
      else effects.push({kind:'arc',x,y,tx:x+Math.cos(a)*100,ty:y+Math.sin(a)*100,life:.10,maxLife:.10,color:w.color});sfx('arc');
    }else{
      const n=w.pellets*(burst&&w.id==='rifle'?3:1);
      for(let i=0;i<n&&bullets.length<260;i++){const angle=a+(i-(n-1)/2)*(burst&&w.id==='rifle'?.055:w.spread)+rand(-.008,.008);bullets.push({x,y,oldX:x,oldY:y,vx:Math.cos(angle)*w.speed,vy:Math.sin(angle)*w.speed,damage:damage*(Math.random()<P.crit?2:1),life:w.range/w.speed,pierce:w.pierce+(w.id==='shotgun'?0:P.pierce),armorPierce:w.id==='rail',hits:new Set(),r:w.id==='rail'?3:2.5,color:w.color});}
      sfx('shoot');
    }
    P.recoil=1;particle(x,y,3,w.color,.25);effects.push({kind:'muzzle',x,y,a,color:w.color,life:.055,maxLife:.055});
  }
  function updatePlayer(dt){
    const mv=(input.right?1:0)-(input.left?1:0);
    P.inv=Math.max(0,P.inv-dt);P.dashCd=Math.max(0,P.dashCd-dt);P.burstCd=Math.max(0,P.burstCd-dt);P.recoil=Math.max(0,P.recoil-dt*9);P.land=Math.max(0,P.land-dt*4);
    if(pressed.jump)P.jumpBuffer=.14;else P.jumpBuffer=Math.max(0,P.jumpBuffer-dt);
    P.coyote=P.grounded?.10:Math.max(0,P.coyote-dt);
    if(P.jumpBuffer>0&&(P.coyote>0||P.jumps<P.maxJumps)){
      const first=P.grounded||P.coyote>0;P.vy=first?-735:-650;P.grounded=false;P.coyote=0;P.jumps=first?1:P.jumps+1;P.jumpBuffer=0;particle(P.x,P.y,first?9:15,'#bcc5a5',.7);ring(P.x,P.y,first?25:40,'#c2d5b1');sfx('jump');
    }
    if(pressed.dash&&P.dashCd<=0){P.dashDir=mv||P.face;P.dashTime=.18;P.dashCd=2.5*P.dashRate;P.inv=Math.max(P.inv,.23);sfx('dash');particle(P.x,P.y-28,12,'#b0cbbd',1.2);}
    if(P.dashTime>0){P.dashTime-=dt;P.vx=P.dashDir*860;}
    else P.vx=lerp(P.vx,mv*P.speed,1-Math.exp(-dt*(P.grounded?20:10)));
    P.x=clamp(P.x+P.vx*dt,25,worldW-25);P.vy+=1900*dt;P.y+=P.vy*dt;
    if(P.y>=FLOOR){if(!P.grounded&&P.vy>150){P.land=1;particle(P.x,FLOOR,10,'#b6b9a1',.6);}P.y=FLOOR;P.vy=0;P.grounded=true;P.jumps=0;}
    if(!P.grounded&&P.y<FLOOR)P.coyote=Math.max(0,P.coyote-dt);
    if(Math.abs(P.vx)>20&&P.grounded)P.walk+=dt*Math.abs(P.vx)*.042;
    const target=aim();P.fireCd-=dt;
    const crate=items.find(it=>it.kind==='crate'&&it.land&&Math.hypot(it.x-P.x,it.y-(P.y-15))<58);
    P.crate=crate&&input.interact?crate.id:0;
    if(!P.crate){
      if(P.fireCd<=0&&(target||manualAim)){fire();P.fireCd=Math.max(.065,WEAPONS[P.weapon].rate*P.rate);}
      if((input.burst||pointer.down)&&P.burstCd<=0){fire(true);P.burstCd=1.15;}
    }
  }
  function windup(z,mode,duration){z.mode=mode;z.timer=duration;z.tx=P.x;z.ty=P.y-30;z.face=Math.sign(P.x-z.x)||z.face;}
  function shockwave(z){
    for(const dir of [-1,1])hostiles.push({kind:'wave',x:z.x,y:FLOOR-12,vx:dir*(z.type==='boss'?540:380),vy:0,r:18,life:2.1,damage:z.type==='boss'?3:2,source:TYPES[z.type].name});
    ring(z.x,FLOOR-8,z.type==='boss'?120:65,'#dfb77c');particle(z.x,FLOOR,18,'#c5b995',1.2);G.shake=Math.max(G.shake,z.type==='boss'?12:6);sfx('boom');
  }
  function spit(z){
    const duration=.8,x=z.x,y=z.y-55,baseX=P.x+P.vx*.55,ty=P.y-25;
    const offsets=z.type==='boss'?[-60,0,60]:G.time>=60?[-42,42]:[0];
    for(const offset of offsets){
      const tx=clamp(baseX+offset,25,worldW-25);
      hostiles.push({kind:'toxic',x,y,vx:(tx-x)/duration,vy:(ty-y-480*duration*duration/2)/duration,g:480,r:10,life:3,damage:2,source:TYPES[z.type].name});
      ring(tx,FLOOR-3,44,'#b1c47d');
    }
  }
  function updateEnemy(z,dt){
    if(!z.alive)return;z.hit=Math.max(0,z.hit-dt);z.slow=Math.max(0,z.slow-dt);z.buff=Math.max(0,z.buff-dt);z.stun=Math.max(0,z.stun-dt);z.cd-=dt;z.ph+=dt*(z.type==='fast'?10:5);z.timer-=dt;
    const delta=P.x-z.x,dist=Math.abs(delta),dir=Math.sign(delta)||z.face;
    const speed=z.speed*(z.slow>0?.75:1)*(z.buff>0?1.5:1)*(z.type==='tank'&&z.hp<z.maxHp*.35?1.7:1);
    if(z.stun>0){z.x+=z.vx*dt;z.vx*=Math.exp(-dt*9);return;}
    if(z.type==='flyer'){
      if(z.mode==='windup'){if(z.timer<=0){z.mode='dive';const distance=Math.hypot(z.ty-z.y,z.tx-z.x);z.timer=clamp(distance/580+.12,.45,1.1);const a=Math.atan2(z.ty-z.y,z.tx-z.x);z.vx=Math.cos(a)*580;z.vy=Math.sin(a)*580;}}
      else if(z.mode==='dive'){z.x+=z.vx*dt;z.y+=z.vy*dt;if(z.timer<=0||z.y>FLOOR-12){z.mode='rise';z.timer=.85;z.cd=2.1;}}
      else if(z.mode==='rise'){z.y=lerp(z.y,FLOOR-z.hover,dt*3);z.x+=dir*speed*dt;if(z.timer<=0)z.mode='walk';}
      else {z.face=dir;z.x+=dir*speed*dt*(dist<70?.3:1);z.y=lerp(z.y,FLOOR-z.hover+Math.sin(z.ph)*20,dt*4);if(z.cd<=0&&dist<460)windup(z,'windup',.8);}
      z.x=clamp(z.x,-30,worldW+180);
    }else if(z.type==='leaper'){
      if(z.mode==='windup'){if(z.timer<=0){z.mode='leap';z.vy=-600;z.vx=clamp((z.tx-z.x)/.63,-760,760);}}
      else if(z.mode==='leap'){z.x+=z.vx*dt;z.vy+=1900*dt;z.y+=z.vy*dt;if(z.y>=FLOOR){z.y=FLOOR;z.mode='walk';z.cd=2.1;particle(z.x,z.y,9,'#b6b995');}}
      else {z.face=dir;z.x+=dir*speed*dt;if(z.cd<=0&&dist<480)windup(z,'windup',.65);}
    }else if(z.type==='boss'){
      if(z.hp<z.maxHp*.5&&z.phase===1){z.phase=2;toast(tr('暴君狂暴 · 第二阶段','TYRANT ENRAGED · PHASE TWO'),3);sfx('warning');ring(z.x,z.y-50,170,'#e39177');z.cd=.3;}
      if(z.mode==='chargePrep'){if(z.timer<=0){z.mode='charge';z.timer=z.phase===2?1.15:.85;z.vx=z.face*(z.phase===2?550:420);}}
      else if(z.mode==='charge'){z.x=clamp(z.x+z.vx*dt,65,worldW-65);if(z.timer<=0){z.mode='recover';z.timer=.65;}}
      else if(z.mode==='slamPrep'){if(z.timer<=0){shockwave(z);if(z.phase===2)spit(z);z.mode='recover';z.timer=.65;}}
      else if(z.mode==='summon'){if(z.timer<=0){for(let i=0;i<(z.phase===2?4:3);i++)spawn('flyer',{x:clamp(z.x+rand(-130,130),35,worldW-35)});ring(z.x,z.y-90,110,'#bea0b2');z.mode='recover';z.timer=.7;}}
      else if(z.mode==='recover'){if(z.timer<=0){z.mode='walk';z.cd=z.phase===2?.95:1.7;}}
      else {z.face=dir;z.x+=dir*speed*dt;if(z.cd<=0){const m=['chargePrep','slamPrep','summon'][z.attackCount++%3];windup(z,m,m==='chargePrep'?1:1.2);sfx('warning');}}
    }else {
      if(z.mode==='runPrep'){if(z.timer<=0){z.mode='charge';z.vx=z.face*speed*3.1;z.timer=.62;}}
      else if(z.mode==='charge'){z.x+=z.vx*dt;if(z.timer<=0){z.mode='walk';z.cd=2;}}
      else if(z.mode==='slamPrep'){if(z.timer<=0){shockwave(z);z.mode='recover';z.timer=.55;}}
      else if(z.mode==='spitPrep'){if(z.timer<=0){spit(z);z.mode='recover';z.timer=.45;}}
      else if(z.mode==='screamPrep'){if(z.timer<=0){for(const e of enemies)if(e.alive&&Math.abs(e.x-z.x)<380)e.buff=5;for(let i=0;i<2;i++)spawn(i===1&&G.time>90?'fast':'normal',{x:clamp(z.x+rand(-80,80),30,worldW-30)});ring(z.x,z.y-45,380,'#bca0b2');z.mode='recover';z.timer=.5;}}
      else if(z.mode==='explode'){if(z.timer<=0){z.alive=false;explode(z,true);}}
      else if(z.mode==='recover'){if(z.timer<=0){z.mode='walk';z.cd=z.type==='screamer'?4.8:z.type==='spitter'?1.65:2.5;}}
      else {
        z.face=dir;
        const ranged=z.type==='spitter'||z.type==='screamer';
        z.x+=(ranged&&dist<280?-dir*.25:dir)*speed*dt;
        if(z.type==='fast'&&dist<420&&z.cd<=0)windup(z,'runPrep',.45);
        if(z.type==='brute'&&dist<250&&z.cd<=0)windup(z,'slamPrep',.8);
        if(z.type==='spitter'&&dist<730&&z.cd<=0)windup(z,'spitPrep',.7);
        if(z.type==='screamer'&&dist<800&&z.cd<=0)windup(z,'screamPrep',1.05);
        if(z.type==='exploder'&&Math.hypot(delta,P.y-z.y)<125)windup(z,'explode',1.1);
      }
    }
    if(z.type!=='flyer'&&z.mode!=='leap')z.y=FLOOR;
    z.x=clamp(z.x,20,worldW+200);
    const c=enemyCenter(z);
    if(z.alive&&z.mode!=='explode'&&playerHit(c.x,c.y,z.r)){if(damagePlayer(TYPES[z.type].damage,TYPES[z.type].name,dir*200)&&z.type!=='boss'){z.stun=.4;z.vx=-dir*160;}}
  }
  function updateBullets(dt){
    for(const b of bullets){b.oldX=b.x;b.oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      const hits=enemies.filter(z=>{if(!z.alive||b.hits.has(z.id))return false;const c=enemyCenter(z);return segmentDistance(c.x,c.y,b.oldX,b.oldY,b.x,b.y)<z.r+b.r;}).sort((a,c)=>Math.hypot(a.x-b.oldX,enemyCenter(a).y-b.oldY)-Math.hypot(c.x-b.oldX,enemyCenter(c).y-b.oldY));
      for(const z of hits){if(b.life<=0)break;b.hits.add(z.id);damageEnemy(z,b.damage,{pierce:b.armorPierce,fromX:b.oldX});if(--b.pierce<=0)b.life=0;}
      if(b.x<-50||b.x>worldW+100||b.y<-60||b.y>WORLD_H)b.life=0;
    }
    bullets=bullets.filter(b=>b.life>0);
    for(const h of hostiles){const ox=h.x,oy=h.y;h.x+=h.vx*dt;h.vy+=(h.g||0)*dt;h.y+=h.vy*dt;h.life-=dt;
      // Sweep fast projectiles against the player's capsule, rather than testing endpoints only.
      const hit=segmentDistance(P.x,P.y-36,ox,oy,h.x,h.y)<h.r+19||playerHit(h.x,h.y,h.r);
      if(hit&&P.inv<=0){damagePlayer(h.damage,h.source,Math.sign(h.vx)*100);h.life=0;}
      if(h.kind==='toxic'&&h.y>=FLOOR-4){if(hazards.length<20)hazards.push({x:h.x,y:FLOOR,r:50,life:7});h.life=0;particle(h.x,FLOOR,9,'#a9bd79');}
      if(h.x<-70||h.x>worldW+70)h.life=0;
    }
    hostiles=hostiles.filter(h=>h.life>0);
    for(const h of hazards){h.life-=dt;if(P.y>FLOOR-22&&Math.abs(P.x-h.x)<h.r+12)damagePlayer(1,tr('毒池','Toxic pool'));}
    hazards=hazards.filter(h=>h.life>0);
  }
  function updateItems(dt){
    for(const it of items){it.age+=dt;if(!it.land){it.y+=it.vy*dt;it.x+=Math.sin(it.age*2+it.id)*8*dt;if(it.y>=FLOOR-18){it.y=FLOOR-18;it.land=true;}}else it.landAge+=dt;
      const near=Math.hypot(it.x-P.x,it.y-(P.y-25))<42*P.pickup;
      if(it.kind==='crate'){if(P.crate===it.id){it.progress+=dt;if(it.progress>=.85){applyItem(it);it.dead=true;}}else it.progress=Math.max(0,it.progress-dt*.6);}
      else if(near){applyItem(it);it.dead=true;}
      if(it.landAge>(it.kind==='crate'?18:12))it.dead=true;
    }
    items=items.filter(it=>!it.dead);
  }
  function updateFx(dt){
    for(const p of particles){p.life-=dt;p.vy+=390*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*1.6);}
    particles=particles.filter(p=>p.life>0);
    for(const f of floats){f.life-=dt;f.y-=35*dt;}floats=floats.filter(f=>f.life>0);
    for(const e of effects)e.life-=dt;effects=effects.filter(e=>e.life>0);
    G.shake=Math.max(0,G.shake-dt*35);G.flash=Math.max(0,G.flash-dt*2);
  }
  function update(dt){
    if(G.state!=='running')return;
    G.time+=dt;G.wave=1+Math.floor(G.time/30);let boss=enemies.some(z=>z.alive&&z.type==='boss');
    if(G.time>=G.nextBoss&&!boss){if(spawn('boss')){G.nextBoss+=180;boss=true;toast(tr('缝合暴君接近 · 留意地面与天空','THE TYRANT APPROACHES · WATCH GROUND AND SKY'),4);sfx('warning');}}
    G.spawnCd-=dt;if(G.spawnCd<=0){spawn(weightedEnemy());if(G.time>45&&Math.random()<Math.min(.62,.30+G.time/750))spawn(weightedEnemy());G.spawnCd=Math.max(.22,1.05-G.time*.005)*DIFFICULTIES[G.difficulty].spawn*(boss?1.25:1);}
    G.packCd-=dt;if(G.packCd<=0){if(!boss)spawnPack();G.packCd=Math.max(12,22-G.time*.012)*DIFFICULTIES[G.difficulty].spawn;}
    G.itemCd-=dt;if(G.itemCd<=0){spawnItem();G.itemCd=Math.max(1.5,2.8-G.time*.004);}
    G.specialCd-=dt*(DIFFICULTIES[G.difficulty].rescue&&P.hp<=2?1.4:1);
    if(G.specialCd<=0){spawnItem(pick(['nuke','rail','crate','crate']));G.specialCd=DIFFICULTIES[G.difficulty].rescue?rand(24,33):rand(35,48);}
    if(Math.floor(G.time/20)>Math.floor((G.time-dt)/20))spawnItem('crate');
    if(G.time>=G.nextChoice&&!enemies.some(z=>z.alive&&z.type==='boss')){G.nextChoice=(Math.floor(G.time/30)+1)*30;openUpgrade();return;}
    updatePlayer(dt);pressed={};for(const z of enemies){updateEnemy(z,dt);if(G.state!=='running')return;}
    updateBullets(dt);if(G.state!=='running')return;updateItems(dt);updateFx(dt);enemies=enemies.filter(z=>z.alive);
  }
  function updateHud(dt){
    hudCd-=dt;if(hudCd>0)return;hudCd=.10;
    $('health').innerHTML=Array.from({length:P.maxHp},(_,i)=>`<span${i<P.hp?'':' class="empty"'}>♥</span>`).join('');
    $('shield').textContent=P.shield?tr('护盾 ','SHIELD ')+('◇'.repeat(P.shield)):'';
    $('waveLabel').textContent=tr('进攻阶段 ','WAVE ')+String(G.wave).padStart(2,'0');$('waveProgress').style.width=((G.time%30)/30*100)+'%';
    $('phaseLabel').textContent=G.time<30?tr('保持移动 · 熟悉跳跃','KEEP MOVING · LEARN TO JUMP'):G.wave%4===0?tr('重装推进','ARMORED ADVANCE'):G.wave%4===1?tr('天空威胁','AIR SUPERIORITY'):G.wave%4===2?tr('高速突袭','RAPID ASSAULT'):tr('混合尸潮','MIXED HORDE');
    $('score').textContent=String(G.score).padStart(5,'0');$('time').textContent=`${Math.floor(G.time/60)}:${String(Math.floor(G.time%60)).padStart(2,'0')} · ${tr('最佳','BEST')} ${G.best}`;
    const boss=enemies.find(z=>z.type==='boss'&&z.alive);$('bossHud').classList.toggle('hidden',!boss);if(boss){$('bossName').textContent=TYPES.boss.name+(boss.phase===2?tr(' / 狂暴',' / ENRAGED'):'');$('bossProgress').style.width=(boss.hp/boss.maxHp*100)+'%';}
    $('weaponBar').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===P.weapon));
    $('abilityBar').textContent=tr(`攻击 ×${P.damage.toFixed(1)} / 冲刺 ${P.dashCd>0?P.dashCd.toFixed(1)+'s':'就绪'} / ${P.maxJumps===2?'二段跳':'单段跳'}`,`DMG ×${P.damage.toFixed(1)} / DASH ${P.dashCd>0?P.dashCd.toFixed(1)+'s':'READY'} / ${P.maxJumps===2?'DOUBLE JUMP':'SINGLE JUMP'}`);
    $('aimBtn').textContent=manualAim?tr('瞄准：手动 [Q]','AIM: MANUAL [Q]'):tr('瞄准：自动 [Q]','AIM: AUTO [Q]');
    $('touchDash').style.opacity=P.dashCd>0?'.45':'1';$('touchBurst').style.opacity=P.burstCd>0?'.6':'1';
  }
  // Original procedural 2D art. Static scenery is cached once per viewport change.
  function rounded(x,y,w,h,r,fill,stroke=null,line=1.5,c=ctx){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
  function poly(points,fill,stroke=null,line=1.5,c=ctx){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
  function ellipse(x,y,rx,ry,fill,stroke=null,line=1.5,c=ctx){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
  function line(x1,y1,x2,y2,color,width=2,c=ctx){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function text(txt,x,y,size=12,color='#d5d7ba',align='center',c=ctx){c.font=`700 ${size}px "Segoe UI","Microsoft YaHei",sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(txt,x,y);}
  function buildBackground(){
    bg=document.createElement('canvas');bg.width=Math.ceil(worldW);bg.height=WORLD_H;const c=bg.getContext('2d');
    let seed=713;const noise=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const sky=c.createLinearGradient(0,0,0,FLOOR);sky.addColorStop(0,'#142b35');sky.addColorStop(.44,'#425553');sky.addColorStop(.8,'#93856c');sky.addColorStop(1,'#ad9a7b');c.fillStyle=sky;c.fillRect(0,0,worldW,WORLD_H);
    const sunX=worldW*.79,sunY=205;const glow=c.createRadialGradient(sunX,sunY,12,sunX,sunY,240);glow.addColorStop(0,'#e9b57560');glow.addColorStop(1,'#e9b57500');c.fillStyle=glow;c.fillRect(sunX-240,sunY-240,480,480);ellipse(sunX,sunY,67,67,'#e4b77c',null,1,c);
    for(let i=0;i<12;i++){c.globalAlpha=.05+noise()*.06;ellipse(noise()*worldW,120+noise()*230,120+noise()*170,12+noise()*20,'#dbd2b2',null,1,c);}c.globalAlpha=1;
    // Distant skyline, antennas and ruined towers.
    for(let layer=0;layer<3;layer++){
      const base=FLOOR-100+layer*36,col=['#435955','#354b48','#293e3d'][layer];
      for(let x=-25;x<worldW;){const w=35+noise()*95,h=55+noise()*(layer===0?175:225);const top=base-h;
        poly([[x,base],[x,top+8],[x+w*.22,top+8],[x+w*.28,top-6],[x+w*.7,top],[x+w*.85,top+14],[x+w,top+10],[x+w,base]],col,null,1,c);
        if(noise()>.5)line(x+w*.6,top,x+w*.6,top-30-noise()*30,col,2,c);
        if(layer===2){for(let yy=top+28;yy<base-15;yy+=25)for(let xx=x+10;xx<x+w-8;xx+=19){const lit=noise()>.7;rounded(xx,yy,7,11,1,lit?'#bfa57455':'#142c2b',null,1,c);if(lit&&noise()>.5)line(xx,yy+5,xx+7,yy+5,'#344843',1,c);}line(x+2,top+18,x+2,base,'#71908433',2,c);
          if(noise()>.6)poly([[x+w*.4,top+50],[x+w*.55,top+90],[x+w*.49,top+110],[x+w*.65,top+155],[x+w*.55,top+160]],'#172f30',null,1,c);
        }x+=w+6+noise()*18;
      }
    }
    const fog=c.createLinearGradient(0,FLOOR-170,0,FLOOR);fog.addColorStop(0,'#a0b9a500');fog.addColorStop(1,'#a1af8b40');c.fillStyle=fog;c.fillRect(0,FLOOR-170,worldW,170);
    // Elevated rails and sagging electricity lines.
    line(0,FLOOR-89,worldW,FLOOR-89,'#223b3a',8,c);line(0,FLOOR-86,worldW,FLOOR-86,'#8a9a8044',2,c);
    for(let x=130;x<worldW;x+=270){line(x,FLOOR-80,x,FLOOR,'#2d4440',12,c);line(x-15,FLOOR-80,x+15,FLOOR-80,'#1e3435',5,c);}
    for(const x of [worldW*.19,worldW*.63]){line(x,FLOOR-15,x,FLOOR-250,'#293c3a',6,c);line(x-38,FLOOR-233,x+38,FLOOR-233,'#293c3a',5,c);rounded(x-28,FLOOR-249,17,11,2,'#3e5248',null,1,c);}
    c.strokeStyle='#243a37';c.lineWidth=2;c.beginPath();c.moveTo(worldW*.19,FLOOR-231);c.quadraticCurveTo(worldW*.4,FLOOR-150,worldW*.63,FLOOR-231);c.stroke();
    // Abandoned ambulance near the quarantine barricade.
    const bx=worldW*.81,by=FLOOR-9;c.save();c.translate(bx,by);
    poly([[-77,-23],[-66,-70],[8,-73],[43,-51],[65,-45],[69,-20]],'#6b7763','#263d37',3,c);rounded(-64,-63,69,29,3,'#1b3435','#95a38a',1,c);poly([[12,-62],[34,-47],[14,-47]],'#223e3d',null,1,c);line(-62,-47,3,-47,'#4d6960',2,c);rounded(-76,-33,144,14,2,'#465e50',null,1,c);rounded(-44,-30,34,6,1,'#b7885d',null,1,c);line(-27,-40,-27,-21,'#c09c70',6,c);ellipse(-46,-17,17,17,'#192c2b','#566656',3,c);ellipse(43,-17,17,17,'#192c2b','#566656',3,c);ellipse(-46,-17,7,7,'#77806b',null,1,c);ellipse(43,-17,7,7,'#77806b',null,1,c);rounded(52,-43,10,7,2,'#c8b37b',null,1,c);c.restore();
    // Ground perspective, cracks, chipped paint, small debris.
    const ground=c.createLinearGradient(0,FLOOR,0,WORLD_H);ground.addColorStop(0,'#46534a');ground.addColorStop(1,'#182d30');c.fillStyle=ground;c.fillRect(0,FLOOR,worldW,WORLD_H-FLOOR);line(0,FLOOR,worldW,FLOOR,'#b3b59288',2,c);line(0,FLOOR+7,worldW,FLOOR+7,'#1e3433',5,c);
    for(let i=0;i<230;i++){const x=noise()*worldW,y=FLOOR+noise()*140;c.fillStyle=noise()>.5?'#91a08812':'#11272740';c.fillRect(x,y,2+noise()*17,1+noise()*2);}
    for(let i=0;i<13;i++){const x=noise()*worldW,y=FLOOR+20+noise()*90;c.strokeStyle='#152a2b';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+20,y+8);c.lineTo(x+13,y+16);c.lineTo(x+55,y+19);c.stroke();}
    for(let x=-50;x<worldW;x+=170)poly([[x,FLOOR+83],[x+77,FLOOR+83],[x+91,FLOOR+88],[x+3,FLOOR+88]],'#a7ac8055',null,1,c);
    // Supply platform, muted vertical beacon and hazard-striped roadside blocks.
    const sx=worldW*.18;c.save();c.translate(sx,FLOOR);rounded(-84,-11,168,11,2,'#506a5c','#263c37',2,c);for(let x=-76;x<75;x+=24)poly([[x,-10],[x+12,-10],[x+18,-1],[x+6,-1]],'#bd9b63',null,1,c);line(-58,-14,-58,-110,'#567063',4,c);rounded(-109,-136,102,30,2,'#243b39','#6e8e76',2,c);text(tr('补给空投区','SUPPLY DROP'),-58,-122,11,'#c3d4ac','center',c);ellipse(-57,-102,3,3,'#b4d79a',null,1,c);c.restore();
    for(const x of [30,worldW-63]){rounded(x,FLOOR-27,45,27,3,'#697465','#233a35',2,c);for(let i=0;i<3;i++)poly([[x+4+i*13,FLOOR-23],[x+10+i*13,FLOOR-23],[x+17+i*13,FLOOR-3],[x+11+i*13,FLOOR-3]],'#b49760',null,1,c);}
    // Vignette and fine grain give the flat vector scenery a softer illustrated finish.
    const vignette=c.createRadialGradient(worldW*.5,350,100,worldW*.5,350,worldW*.67);vignette.addColorStop(0,'#071c1f00');vignette.addColorStop(1,'#071c1f88');c.fillStyle=vignette;c.fillRect(0,0,worldW,WORLD_H);
    for(let i=0;i<2500;i++){c.fillStyle=i%2?'#fff5dc07':'#00000009';c.fillRect(noise()*worldW,noise()*WORLD_H,1,1);}
  }
  function limb(points,width,color){ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#1c3030';ctx.lineWidth=width+3;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function shadow(x,y,r,air=0){ellipse(x,FLOOR+3,r*(1-air*.45),5*(1-air*.3),`rgba(9,25,25,${.38-air*.18})`);}
  function drawGun(a,weapon,recoil){
    const w=WEAPONS[weapon];ctx.save();ctx.translate(5,-42);ctx.rotate(a);ctx.translate(-recoil*4,0);
    limb([[0,2],[13,3],[20,1]],6,'#c6ac8a');rounded(8,-6,27,9,2,'#405859','#162d30',2);rounded(31,-4,13,5,1,'#7c938b','#1a3033',1);poly([[13,1],[21,1],[20,12],[15,12]],'#2c4142','#172d2e');rounded(10,-7,15,3,1,'#a1aaa0');line(24,-3,34,-3,w.color,2);
    if(weapon===1){rounded(10,4,24,4,1,'#a57653');rounded(31,-3,16,3,1,'#697e7b');}
    if(weapon===2){rounded(30,-5,21,7,1,'#526f70','#1a3033',1);line(31,-3,49,-3,'#8ed8dc',1.5);rounded(13,-13,10,6,1,'#425e61','#1c3131',1);}
    if(weapon===3){ellipse(28,-2,8,7,'#47685d','#183532');line(27,-2,45,-2,'#bfdbaa',3);ellipse(25,-2,3,3,'#c7e4b2');}
    ellipse(12,4,4,3,'#d9bd98','#263c3a');ctx.restore();
  }
  function drawPlayer(){
    const air=clamp((FLOOR-P.y)/160,0,1);shadow(P.x,P.y,24,air);
    if(P.dashTime>0){ctx.globalAlpha=.15;for(let i=1;i<4;i++){ellipse(P.x-P.dashDir*i*18,P.y-38,18,30,'#b4d6c5');}ctx.globalAlpha=1;}
    ctx.save();ctx.translate(P.x,P.y);if(P.inv>0&&Math.floor(P.inv*16)%2===0)ctx.globalAlpha=.5;
    const stride=P.grounded?Math.sin(P.walk)*10:0,squash=P.land*3,bob=P.grounded?Math.abs(Math.sin(P.walk))*2:0;
    ctx.translate(0,-bob+squash);
    // Boots and articulated trouser legs.
    limb([[-7,-26],[-7-stride*.5,-13],[-8+stride,-3]],9,'#45575a');limb([[7,-26],[9+stride*.5,-14],[9-stride,-3]],9,'#56666a');
    rounded(-14+stride,-7,15,7,2,'#263b3e','#182d30',2);rounded(3-stride,-7,16,7,2,'#2c4143','#182d30',2);
    ctx.save();ctx.scale(P.face,1);
    // Backpack, coat with highlighted seam, pockets, holster and scarf.
    rounded(-21,-48,15,27,5,'#65765d','#1d3434',2);rounded(-21,-42,8,14,2,'#8d9470');line(-17,-40,-17,-32,'#bac095',1);
    poly([[-13,-52],[10,-53],[16,-31],[10,-23],[-13,-24],[-17,-38]],'#bf8b5d','#213837',2.2);poly([[-10,-48],[-3,-51],[2,-26],[-12,-27]],'#e0ad77');poly([[4,-48],[11,-47],[13,-31],[4,-29]],'#a4704e');line(-1,-47,1,-27,'#665348',2);rounded(-11,-38,9,7,1,'#9b744f','#6e5d49',1);rounded(5,-35,7,6,1,'#896447');rounded(-14,-26,28,5,1,'#5a5448','#233a35',1);rounded(4,-27,5,5,1,'#bcb18d');
    limb([[-9,-46],[-19,-34],[-10,-31]],7,'#b38359');ellipse(-9,-31,4,4,'#ddbc91','#243b36');
    rounded(-7,-58,14,10,2,'#d6b58e','#2d3e35',1.5);ellipse(0,-65,13,14,'#e0bd94','#203635',2);poly([[-11,-66],[-7,-61],[-7,-54],[5,-52],[11,-60],[12,-65]],'#c69d75');ellipse(7,-66,2,2,'#213537');line(5,-62,11,-62,'#9a7456',1);poly([[-14,-69],[-14,-76],[-5,-83],[8,-81],[14,-73],[14,-68]],'#617d74','#233d39',2);rounded(-15,-72,30,6,2,'#698b7f','#203c37',1);rounded(3,-75,8,4,1,'#e4bb79');line(-10,-75,-2,-78,'#9cae8e',2);
    poly([[-9,-56],[8,-54],[11,-47],[-7,-49],[-14,-45],[-20,-47]],'#ac5541','#3b3e33',1.5);
    ctx.restore();drawGun(P.aim,P.weapon,P.recoil);
    if(P.shield){ctx.globalAlpha=.25+.05*Math.sin(G.time*4);ellipse(0,-40,32,49,null,'#9bd6d3',2);ctx.globalAlpha=1;}
    ctx.restore();
  }
  function drawFlyer(z){
    shadow(z.x,z.y,24,clamp((FLOOR-z.y)/270,0,1));ctx.save();ctx.translate(z.x,z.y);ctx.scale(z.face,1);if(z.hit>0)ctx.globalAlpha=.7;
    const flap=Math.sin(z.ph*2)*17,stroke='#263b39';
    poly([[-7,-5],[-34,-40-flap],[-65,-23-flap*.5],[-47,-11],[-37,5],[-22,9],[-8,12]],'#687b72',stroke,2);poly([[7,-5],[33,-38-flap],[63,-18-flap*.5],[45,-8],[33,8],[18,12],[7,10]],'#8b9480',stroke,2);
    line(-9,-1,-34,-38-flap,'#a8ad92',2);line(-34,-38-flap,-45,-10,'#40594e',2);line(8,-1,33,-36-flap,'#b0b397',2);line(33,-36-flap,42,-7,'#536758',2);
    ellipse(0,1,12,19,z.hit?'#d8d5b2':'#7d9080',stroke,2);limb([[-4,14],[-9,26],[-16,27]],3,'#9baa86');limb([[5,14],[10,25],[16,26]],3,'#9baa86');ellipse(0,-18,12,12,'#b3b89a',stroke,2);poly([[-10,-23],[-13,-35],[-2,-27]],'#9baa8b',stroke,1.5);poly([[5,-27],[13,-35],[11,-21]],'#9baa8b',stroke,1.5);ellipse(7,-20,4,3,'#e9b16c');ellipse(8,-20,1.5,2,'#302d26');poly([[2,-12],[12,-14],[10,-6],[5,-8]],'#253731');line(4,-12,5,-8,'#e5dfb9',2);ctx.restore();
  }
  function drawZombie(z){
    if(z.type==='flyer'){drawFlyer(z);return;}
    const d=TYPES[z.type],s=z.size,phase=G.state==='menu'?G.menuTime:G.time;shadow(z.x,z.y,21*s,clamp((FLOOR-z.y)/150,0,1));
    ctx.save();ctx.translate(z.x,z.y);ctx.scale(z.face*s,s);
    const fast=z.type==='fast',heavy=['brute','tank','boss'].includes(z.type),crouch=z.mode==='windup'||z.mode==='slamPrep'?5:0;
    ctx.translate(0,crouch);const step=Math.sin(z.ph)*(heavy?4:7),skin=z.hit>0?'#dbd8bb':d.skin,cloth=z.hit>0?'#b9bba0':d.cloth;
    if(fast)ctx.transform(1,0,.12,1,0,0);
    limb([[-7,-24],[-10+step*.4,-13],[-10-step,-3]],heavy?10:7,'#495a50');limb([[7,-24],[8-step*.3,-14],[7+step,-3]],heavy?11:8,'#62705a');rounded(-17-step,-7,15,7,2,'#303f36','#203530',1.5);rounded(1+step,-7,16,7,2,'#3c493c','#203530',1.5);
    const torso=heavy?18:13;
    poly([[-torso,-51],[torso-2,-48],[torso+3,-31],[torso-1,-21],[-torso,-23],[-torso-4,-40]],cloth,'#25392f',2);
    poly([[-torso+2,-48],[-5,-47],[-4,-27],[-torso+1,-31]],'#cbd0a21c');line(-2,-45,0,-25,'#233b33',1.5);poly([[3,-40],[9,-44],[8,-32],[4,-28]],skin,'#415341',1);
    limb([[-12,-44],[-24,-32],[-13,-29]],heavy?10:6,cloth);ellipse(-13,-29,4,4,skin,'#263a31');
    const armY=z.mode==='slamPrep'?-63:z.mode==='screamPrep'?-65:-38;
    limb([[12,-43],[23,armY],[33,armY-2]],heavy?12:7,cloth);ellipse(34,armY-2,heavy?6:4.5,heavy?6:4,skin,'#263a31',1.4);line(35,armY-2,40,armY-5,'#ced0b1',1.2);
    rounded(-6,-58,13,12,2,skin,'#314535',1.4);ellipse(0,-64,13,14,skin,'#263a31',2);
    // Torn scalp, expressive eyes, uneven jaw and exposed teeth.
    poly([[-13,-64],[-13,-74],[-4,-81],[7,-77],[12,-72],[1,-73],[-1,-68],[-7,-71]],'#5b6951','#314636',1);ellipse(6,-65,4,3.3,'#d9d9b1','#53604a',1);ellipse(7,-65,1.6,2.1,z.buff>0?'#f5bf85':'#8d553a');line(-5,-67,-1,-66,'#46573c',2);poly([[1,-59],[11,-58],[8,-52],[-1,-54]],'#3c4430','#4d5539',1);line(3,-59,3,-55,'#dfd9ac',2);line(7,-58,7,-55,'#dfd9ac',2);line(-8,-59,-4,-57,'#647752',1);
    if(z.type==='armored'){
      if(z.armor>0){poly([[-16,-48],[14,-48],[16,-28],[-13,-28]],'#5d7f81','#2c4648',2);poly([[-11,-45],[9,-45],[10,-35],[-9,-36]],'#93aaa2','#4a6c6b',1.4);line(-1,-45,0,-31,'#b4c2b1',2);rounded(-16,-50,13,8,2,'#718c89','#2c4648',1);rounded(8,-49,13,9,2,'#718c89','#2c4648',1);}
      else poly([[-15,-43],[-9,-46],[-9,-38],[-3,-39],[-7,-28],[-14,-30]],'#537276','#253f40',1.5);
      poly([[-14,-64],[-15,-75],[-5,-82],[7,-80],[15,-72],[15,-65]],'#5d7e7d','#263f3e',2);rounded(-10,-70,25,8,2,'#273e3f','#8ea89c',1);line(0,-67,13,-67,'#b6cfc1',1);
    }
    if(z.type==='fast'){poly([[-12,-49],[7,-48],[10,-42],[-8,-42]],'#b1855b');line(-7,-39,-4,-29,'#e0b98c',2);poly([[-11,-76],[-7,-83],[-4,-79],[1,-84],[6,-77]],'#655f45');}
    if(z.type==='brute'){rounded(-20,-47,16,15,3,'#82684e','#344232',1.5);limb([[18,-41],[28,armY],[35,armY-3]],13,'#a89a76');line(22,armY,33,armY-4,'#c4b089',2);rounded(-9,-27,24,7,1,'#5e5843');}
    if(z.type==='tank'){ellipse(0,-35,22,17,skin,'#40533c',2);poly([[-15,-49],[-7,-49],[-5,-21],[-14,-21]],'#4e5b45');poly([[10,-47],[16,-44],[17,-22],[9,-22]],'#4e5b45');line(-8,-37,6,-30,'#5a684d',1.4);line(4,-40,10,-37,'#c6c8a2',1.4);rounded(-22,-50,15,9,3,'#6e7856','#3b4f37');}
    if(z.type==='spitter'){ellipse(-9,-50,12,13,'#a2b970','#4d6940',2);ellipse(-11,-53,6,7,'#c6d78b');ellipse(0,-29,16,13,'#94ac67','#45613b',2);ellipse(4,-30,6,5,'#c6d590');ellipse(8,-58,7,5,'#b4c77f','#5b723f');if(z.mode==='spitPrep')ellipse(12,-57,5+Math.sin(phase*20)*2,5,'#d5e3a1');}
    if(z.type==='exploder'){ellipse(0,-35,19,17,'#a3895d','#574f35',2);ellipse(0,-36,11,11,z.mode==='explode'&&Math.floor(phase*12)%2?'#f0c586':'#d78e55','#856c44',2);line(-13,-39,13,-31,'#5c593d',3);line(-4,-48,-1,-22,'#5c593d',3);ellipse(0,-37,4,4,'#eab779');}
    if(z.type==='screamer'){ellipse(7,-58,7,10,'#352b32','#9f877b',1.5);ellipse(8,-60,4,5,'#171f25');poly([[-13,-50],[-5,-46],[0,-29],[12,-44],[17,-45],[13,-21],[-17,-24]],'#82677a','#433e46',1.5);line(-6,-37,-9,-27,'#bd9b98',1);ellipse(6,-65,3,2,'#f3cda6');}
    if(z.type==='leaper'){poly([[-16,-49],[-6,-55],[4,-49],[7,-37],[-9,-35]],'#7c8463','#354a37',1.5);line(20,armY-2,39,armY-6,'#d1ceb0',3);poly([[-12,-72],[-3,-84],[0,-79],[5,-83],[11,-72]],'#586747');}
    if(z.type==='boss'){
      ellipse(0,-37,24,20,'#a49b80','#4b503d',2);poly([[-25,-53],[-14,-57],[-12,-38],[-25,-39]],'#7f7260','#3c453b',2);poly([[12,-54],[29,-50],[30,-39],[12,-40]],'#8d7c67','#3c453b',2);for(const [x,y]of [[-22,-50],[-17,-53],[17,-51],[24,-48]])ellipse(x,y,2,2,'#c6b79a','#4d5544',.8);line(-16,-38,15,-29,'#4e5142',2);for(let i=-13;i<13;i+=5)line(i,-40+(i+16)*.3,i-1,-34+(i+16)*.3,'#d1b993',1.2);rounded(-24,-23,48,7,1,'#524b42','#323e35',1.2);rounded(-5,-24,10,9,1,'#b2946f','#4a4b3b',1);ellipse(6,-65,4,3,z.phase===2?'#f49b6e':'#d6bd90');poly([[-14,-77],[-7,-84],[5,-82],[13,-75],[4,-74]],'#707664','#354937',1.5);line(-9,-69,-2,-61,'#514f3e',1.5);for(let i=0;i<3;i++)line(-10+i*3,-67+i*3,-7+i*3,-70+i*3,'#d3c4a6',1);if(z.phase===2){ellipse(0,-37,23,18,null,'#d18768',1.5);}
    }
    ctx.restore();
    if(z.hp<z.maxHp&&z.type!=='boss'){
      const w=32*s,x=z.x-w/2,y=z.y-91*s;rounded(x,y,w,4,1,'#17332ddd');rounded(x,y,w*Math.max(0,z.hp/z.maxHp),4,1,z.type==='armored'&&z.armor>0?'#8db5b2':'#dbaf7f');
    }
    if(z.buff>0){text('↑',z.x,z.y-102*s,15,'#d2b4c3');}
  }
  function drawWarnings(z){
    if(!z.alive)return;
    const phase=1-clamp(z.timer/(z.type==='boss'?1.2:1),0,1),pulse=.45+.25*Math.sin(G.time*18),col=`rgba(237,145,106,${pulse})`;
    if(z.mode==='windup'&&z.type==='flyer'){
      ctx.setLineDash([8,7]);line(z.x,z.y,z.tx,z.ty,col,2);ctx.setLineDash([]);ellipse(z.tx,z.ty,24,24,null,col,2);line(z.tx-32,z.ty,z.tx+32,z.ty,col,1);text(tr('俯冲','DIVE'),z.tx,z.ty-36,11,'#f0af87');
    }
    if(z.mode==='runPrep'||z.mode==='chargePrep'){
      const x=z.x+z.face*40,w=z.face*(z.type==='boss'?360:220);rounded(Math.min(x,x+w),FLOOR-7,Math.abs(w),7,1,`rgba(227,138,94,${.12+phase*.16})`);line(x,FLOOR-5,x+w,FLOOR-5,col,2);poly([[x+w,FLOOR-5],[x+w-z.face*15,FLOOR-13],[x+w-z.face*15,FLOOR+3]],col);
    }
    if(z.mode==='slamPrep'){
      ellipse(z.x,FLOOR-3,z.type==='boss'?260:160,12,null,col,2);text(tr('跳跃躲避 ↑','JUMP ↑'),z.x,z.y-107*z.size,12,'#f1b88e');
    }
    if(z.mode==='explode'){ellipse(z.x,FLOOR-2,155,18,null,col,2);ellipse(z.x,z.y-36,35,35,null,col,2);text(tr('爆炸','BLAST'),z.x,z.y-97,12,'#f2b086');}
    if(z.mode==='windup'&&z.type==='leaper'){ellipse(z.tx,FLOOR-2,33,8,null,col,2);text(tr('扑击落点','LEAP TARGET'),z.tx,FLOOR-28,10,'#f0bd99');}
    if(z.mode==='screamPrep'||z.mode==='summon'){ellipse(z.x,z.y-45*z.size,40+phase*65,30+phase*45,null,'#bc9bae99',2);}
  }
  function drawItem(it){
    const color={damage:'#e0a476',rate:'#8dbbce',heal:'#b1cd93',shield:'#9dd2d4',crate:'#e4bb80',nuke:'#e8986f',rail:'#8ed8dc'}[it.kind],bob=it.land?Math.sin(G.time*3+it.id)*3:0;
    if(it.land)ellipse(it.x,FLOOR+1,it.kind==='crate'?26:17,4,'#152e2c66');
    ctx.save();ctx.translate(it.x,it.y+bob);
    if(!it.land){line(0,-10,0,-30,color+'55',1);poly([[-18,-34],[-12,-47],[0,-53],[12,-47],[18,-34]],'#bdc3a0','#49624d',1.5);line(-16,-34,-8,-9,'#9dba8a',1);line(16,-34,8,-9,'#9dba8a',1);}
    const crate=it.kind==='crate';rounded(crate?-24:-16,crate?-20:-15,crate?48:32,crate?35:30,3,'#314941','#68836a',2);rounded(crate?-22:-14,crate?-17:-13,crate?44:28,crate?8:6,1,color+'aa');
    if(crate){line(-8,-19,-8,14,'#8c9b73',4);line(10,-19,10,14,'#8c9b73',4);rounded(-4,-4,9,8,1,'#d4ba83','#746646',1);if(it.land){text(tr('按住 E','HOLD E'),0,-31,10,'#d8ca9f');if(it.progress>0){rounded(-24,22,48,4,1,'#304c43');rounded(-24,22,48*it.progress/.85,4,1,'#ecc68a');}}}
    else {const mark={damage:'+',rate:'»',heal:'✚',shield:'◇',nuke:'✹',rail:'↗'}[it.kind];text(mark,0,2,20,color);}
    ellipse(0,0,crate?32:23,crate?26:22,null,color+'40',1);ctx.restore();
  }
  function drawBullet(b){
    const len=b.rail?110:Math.min(20,Math.hypot(b.vx,b.vy)*.013),a=Math.atan2(b.vy,b.vx);
    line(b.x-Math.cos(a)*len,b.y-Math.sin(a)*len,b.x,b.y,b.color,b.rail?8:b.armorPierce?3:2);if(b.rail)line(b.x-Math.cos(a)*len,b.y-Math.sin(a)*len,b.x,b.y,'#e8ffff',2);else ellipse(b.x,b.y,b.r,b.r,'#f4e3bd');
  }
  function drawFx(){
    for(const e of effects){const t=e.life/e.maxLife;ctx.globalAlpha=t;
      if(e.kind==='ring'){ellipse(e.x,e.y,e.r*(1-t*.7),e.r*(1-t*.7),null,e.color,2);}
      if(e.kind==='muzzle'){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.a);poly([[0,-5],[9,-3],[17,-8],[14,0],[24,2],[12,5],[6,9],[4,3]],e.color);ctx.restore();}
      if(e.kind==='arc'){ctx.beginPath();ctx.moveTo(e.x,e.y);for(let j=1;j<=6;j++){const tt=j/6;ctx.lineTo(lerp(e.x,e.tx,tt)+Math.sin(j*11+G.time*80)*7,lerp(e.y,e.ty,tt)+Math.cos(j*7+G.time*90)*9);}ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#e1ecd4';ctx.lineWidth=1;ctx.stroke();}
    }ctx.globalAlpha=1;
    for(const p of particles){ctx.globalAlpha=clamp(p.life/.35,0,1);ellipse(p.x,p.y,p.size,p.size*.8,p.color);}ctx.globalAlpha=1;
    for(const f of floats){ctx.globalAlpha=Math.min(1,f.life*2);ctx.font='700 13px "Segoe UI","Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle='#183431';ctx.lineWidth=3;ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
  }
  function draw(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#10252a';ctx.fillRect(0,0,innerWidth,innerHeight);
    ctx.save();ctx.translate(offX,offY);ctx.scale(scale,scale);ctx.beginPath();ctx.rect(0,0,worldW,WORLD_H);ctx.clip();
    if(G.shake>0&&settings.quality==='high')ctx.translate(Math.sin(G.time*120)*G.shake*.35,Math.cos(G.time*95)*G.shake*.2);
    ctx.drawImage(bg,0,0,worldW,WORLD_H);
    const t=G.state==='menu'?G.menuTime:G.time;
    // Small drifting embers and fog remain behind combat and never obscure attack cues.
    if(settings.quality==='high'){for(let i=0;i<25;i++){const x=((i*173+t*(6+i%4))%(worldW+40))-20,y=300+(i*73)%325+Math.sin(t*.8+i)*12;ctx.globalAlpha=.15+(i%3)*.08;ellipse(x,y,i%4===0?1.7:1,1,'#dab989');}ctx.globalAlpha=1;}
    const sx=worldW*.18;const beam=ctx.createLinearGradient(0,FLOOR-220,0,FLOOR);beam.addColorStop(0,'#b6d49b00');beam.addColorStop(1,'#b6d49b0c');poly([[sx-50,FLOOR],[sx+50,FLOOR],[sx+110,FLOOR-220],[sx-110,FLOOR-220]],beam);
    if(G.state==='menu'){
      const demo=[{type:'tank',x:worldW*.89,y:FLOOR,ph:t*3,hp:50,maxHp:50,size:1.85,face:-1,mode:'walk',hit:0,buff:0,phase:1},{type:'armored',x:worldW*.76,y:FLOOR,ph:t*3+2,hp:20,maxHp:20,size:1.1,face:-1,mode:'walk',armor:10,hit:0,buff:0,phase:1},{type:'flyer',x:worldW*.91,y:FLOOR-175+Math.sin(t)*15,ph:t*4,hp:15,maxHp:15,size:1,face:-1,mode:'walk',hit:0,buff:0}];
      for(const z of demo)drawZombie(z);const originalX=P.x;P.x=worldW*.63;P.aim=-.2;P.face=1;drawPlayer();P.x=originalX;
    }else {
      for(const h of hazards){const alpha=clamp(h.life,0,1);ellipse(h.x,FLOOR-1,h.r,8,`rgba(149,180,100,${alpha*.4})`);ellipse(h.x-10,FLOOR-4,15,4,'#c3d18d66');for(let i=0;i<3;i++)ellipse(h.x+(i-1)*19,FLOOR-9-Math.sin(t*3+i)*3,2,2,'#c8d394');}
      for(const z of enemies)drawWarnings(z);for(const it of items)drawItem(it);
      for(const z of enemies.filter(z=>z.alive).sort((a,b)=>b.y-a.y))drawZombie(z);
      drawPlayer();for(const b of bullets)drawBullet(b);
      for(const h of hostiles){if(h.kind==='wave'){ellipse(h.x,h.y,24,13,null,'#d9b989',3);line(h.x-20,h.y+7,h.x+20,h.y+7,'#e2bf83',2);}else{ellipse(h.x,h.y,h.r,h.r,'#b5cc84','#6c8851',2);ellipse(h.x-2,h.y-2,3,3,'#d5e6a3');}}
      drawFx();
      if(manualAim&&pointer.active&&G.state==='running'){const x=pointer.x,y=pointer.y;ellipse(x,y,10,10,null,'#e1d8b1bb',1);line(x-16,y,x-6,y,'#e1d8b1bb',1);line(x+6,y,x+16,y,'#e1d8b1bb',1);line(x,y-16,x,y-6,'#e1d8b1bb',1);line(x,y+6,x,y+16,'#e1d8b1bb',1);}
      if(G.time<8&&G.state==='running'){text(tr('← 补给区','← SUPPLIES'),worldW*.18,FLOOR+35,13,'#bec8aa');text(tr('天空也有威胁 · 记得跳跃','WATCH THE SKY · KEEP JUMPING'),worldW*.56,FLOOR+35,12,'#b4bca7');}
    }
    if(G.flash>0){ctx.fillStyle=`rgba(239,149,97,${G.flash*.12})`;ctx.fillRect(0,0,worldW,WORLD_H);}
    ctx.restore();
  }
  let last=performance.now(),accumulator=0;
  function frame(now){
    const dt=Math.min(.10,(now-last)/1000);last=now;
    if(G.state==='running'){accumulator+=dt;let steps=0;while(accumulator>=STEP&&steps++<12&&G.state==='running'){update(STEP);accumulator-=STEP;}}
    else {accumulator=0;if(G.state==='menu')G.menuTime+=dt;}
    if(G.toastUntil<now)$('toast').classList.remove('visible');
    draw();if(G.state!=='menu')updateHud(dt);requestAnimationFrame(frame);
  }
  resize();requestAnimationFrame(frame);
  // Deliberately opt-in: the normal game never exposes mutation or QA controls.
  if(new URLSearchParams(location.search).has('test'))window.__zombieTest={
    start,pause,resume,menu,spawn,spawnItem,chooseUpgrade,openUpgrade,damagePlayer,damageEnemy,update,switchWeapon,applyItem,
    snapshot:()=>({state:G.state,time:G.time,wave:G.wave,score:G.score,kills:G.kills,bossKills:G.bossKills,difficulty:G.difficulty,worldW,player:{...P},enemies:enemies.map(z=>({...z})),items:items.map(i=>({...i})),bullets:bullets.length,hostiles:hostiles.length,hazards:hazards.length,offers:offers.map(u=>u.id),settings:{...settings}}),
    advance(seconds){for(let i=0;i<Math.ceil(seconds/STEP)&&G.state==='running';i++)update(STEP);updateHud(1);},
    setPlayer:patch=>Object.assign(P,patch),setGame:patch=>Object.assign(G,patch),
    setInput:(action,down)=>{if(down)actionDown(action);else input[action]=false;},
    clearEnemies(){enemies=[];hostiles=[];hazards=[];},
    setEnemy:(id,patch)=>Object.assign(enemies.find(z=>z.id===id),patch),
    addBullet:b=>bullets.push({x:0,y:FLOOR-34,oldX:0,oldY:FLOOR-34,vx:2000,vy:0,damage:100,life:1,pierce:1,hits:new Set(),color:'#fff',r:3,...b}),
    addHazard:h=>hazards.push({x:P.x,y:FLOOR,r:44,life:5,...h}),
    setManualAim:(enabled,x,y)=>{manualAim=enabled;pointer.active=enabled;pointer.x=x;pointer.y=y;},
    defs:{types:TYPES,weapons:WEAPONS,difficulties:DIFFICULTIES},render:draw
  };
})();
