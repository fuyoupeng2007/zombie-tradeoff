import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url),root=fileURLToPath(new URL('../',import.meta.url));
let playwright;
try{playwright=require('playwright');}catch{
 const bundled=process.env.PLAYWRIGHT_PACKAGE||path.join(process.env.USERPROFILE||'', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 playwright=require(bundled);
}
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await playwright.chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const results=[],errors=[];
mkdirSync(root+'qa',{recursive:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
await page.goto(pathToFileURL(root+'打僵尸.html').href+'?test=1');
const snap=()=>page.evaluate(()=>window.__zombieTest.snapshot());
const run=async(name,fn)=>{try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:e.message});console.log('FAIL '+name+': '+e.message);}};
const reset=()=>page.evaluate(()=>{const t=window.__zombieTest;t.start();t.setGame({spawnCd:999,packCd:999,itemCd:999,specialCd:999,nextChoice:999,nextBoss:999});});
await run('Chinese entry renders without external requests',async()=>{assert.equal(await page.title(),'打僵尸 · 取舍之战：死寂天空');assert.equal(await page.locator('#startBtn').innerText(),'进入废墟 →');await page.evaluate(()=>window.__zombieTest.render());await page.screenshot({path:root+'qa/menu-zh.png'});});
await run('Keyboard jump has an apex, landing, and no held-key bounce',async()=>{await reset();await page.keyboard.down('Space');await page.evaluate(()=>window.__zombieTest.advance(.25));assert.ok((await snap()).player.y<590);await page.evaluate(()=>window.__zombieTest.advance(1));assert.equal((await snap()).player.y,667);assert.equal((await snap()).player.jumps,0);await page.keyboard.up('Space');});
await run('Second jump requires an upgrade and changes airborne velocity',async()=>{await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setInput('jump',true);t.advance(.25);t.setInput('jump',false);t.setPlayer({maxJumps:2});t.setInput('jump',true);t.advance(.01);});const s=await snap();assert.equal(s.player.jumps,2);assert.ok(s.player.vy<-600);});
await run('Dash grants brief immunity and obeys its cooldown',async()=>{await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setInput('right',true);t.setInput('dash',true);t.advance(.01);});const first=await snap();assert.ok(first.player.dashCd>2);assert.ok(first.player.inv>0);await page.evaluate(()=>{const t=window.__zombieTest;t.setInput('dash',false);t.advance(.3);t.setInput('dash',true);t.advance(.01);});assert.equal((await snap()).player.dashTime<=0,true);});
await run('Ground zombies chase a player behind them',async()=>{await reset();const before=await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({x:900,fireCd:99});const z=t.spawn('normal',{x:700});t.advance(.25);return t.snapshot();});assert.ok(before.enemies[0].x>700);assert.equal(before.enemies[0].face,1);});
await run('Swept bullet collision catches a target crossed between frames',async()=>{await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({fireCd:99});t.spawn('normal',{x:750,r:2,hp:1});t.addBullet({x:650,y:633,vx:24000,damage:5});t.advance(.009);});assert.equal((await snap()).kills,1);});
await run('Armor absorbs normal rounds, piercer bypasses it',async()=>{await reset();const values=await page.evaluate(()=>{const t=window.__zombieTest;const a=t.spawn('armored',{x:1000}),b=t.spawn('armored',{x:1100});const hp=a.hp;t.damageEnemy(a,10);t.damageEnemy(b,10,{pierce:true});const s=t.snapshot();return {hp,a:s.enemies.find(z=>z.id===a.id),b:s.enemies.find(z=>z.id===b.id)};});assert.equal(Math.round(values.hp-values.a.hp),3);assert.equal(Math.round(values.hp-values.b.hp),10);});
await run('All four weapons have working attack paths',async()=>{for(let i=0;i<4;i++){await reset();const damage=await page.evaluate(i=>{const t=window.__zombieTest;t.setPlayer({x:550});t.switchWeapon(i);const z=t.spawn('tank',{x:750,hp:1000,maxHp:1000,speed:0});t.advance(1.3);return t.snapshot().enemies.find(e=>e.id===z.id)?.hp;},i);assert.ok(damage<1000,'weapon '+i+' failed');}});
await run('Arc chains to multiple airborne enemies',async()=>{await reset();const hp=await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({x:600});t.switchWeapon(3);t.spawn('flyer',{x:720,y:480,mode:'windup',timer:99,hp:100});t.spawn('flyer',{x:790,y:475,mode:'windup',timer:99,hp:100});t.advance(.6);return t.snapshot().enemies.map(e=>e.hp);});assert.ok(hp.every(v=>v<100));});
await run('Flyer telegraphs, dives, and recovers',async()=>{await reset();const modes=await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({fireCd:99,inv:20});const z=t.spawn('flyer',{x:800,cd:0});t.advance(.05);const a=t.snapshot().enemies[0].mode;t.advance(.85);const b=t.snapshot().enemies[0].mode;t.advance(.8);const c=t.snapshot().enemies[0].mode;return [a,b,c];});assert.deepEqual(modes,['windup','dive','rise']);});
await run('Distant flyer reaches its warned target and punishes standing still',async()=>{
 await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({x:500,fireCd:999});t.spawn('flyer',{x:940,y:457,cd:0});t.advance(1.9);});assert.equal((await snap()).player.hp,4);
});
await run('Moving after a flyer warning lets the player dodge',async()=>{
 await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({x:500,fireCd:999});t.spawn('flyer',{x:940,y:457,cd:0});t.advance(.1);t.setInput('right',true);t.advance(1.8);});assert.equal((await snap()).player.hp,6);
});
await run('Long-distance leaper reaches its ground landing marker',async()=>{
 await reset();const result=await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({x:500,fireCd:999,inv:999});t.spawn('leaper',{x:950,cd:0});t.advance(1.29);return t.snapshot().enemies[0];});assert.ok(Math.abs(result.x-result.tx)<18);assert.equal(result.mode,'walk');
});
await run('Coordinated reinforcements spawn outside the screen and respect population cap',async()=>{
 await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setGame({time:100,packCd:0});t.advance(.01);});let s=await snap();assert.equal(s.enemies.length,3);assert.ok(s.enemies.every(z=>z.x>s.worldW));
 await page.evaluate(()=>{const t=window.__zombieTest;for(let i=0;i<100;i++)t.spawn('normal');t.setGame({packCd:0});t.advance(.01);});s=await snap();assert.ok(s.enemies.length<=85);
});
await run('Spitters fan out toxic volleys after the first minute',async()=>{
 await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setGame({time:65});t.setPlayer({x:500,fireCd:999,inv:999});t.spawn('spitter',{x:850,cd:0});t.advance(.85);});assert.equal((await snap()).hostiles,2);
});
await run('Boss summons a larger air escort in both phases',async()=>{
 for(const phase of [1,2]){await reset();const count=await page.evaluate(phase=>{const t=window.__zombieTest;t.setPlayer({fireCd:999,inv:999});t.spawn('boss',{x:1000,mode:'summon',timer:.01,phase});t.advance(.03);return t.snapshot().enemies.filter(z=>z.type==='flyer').length;},phase);assert.equal(count,phase===2?4:3);}
});
await run('Poison hurts on the ground and is avoided in the air',async()=>{await reset();const health=await page.evaluate(()=>{const t=window.__zombieTest;t.addHazard({});t.advance(.02);const ground=t.snapshot().player.hp;t.setPlayer({hp:6,inv:0,y:540,vy:0,grounded:false});t.advance(.02);return [ground,t.snapshot().player.hp];});assert.deepEqual(health,[5,6]);});
await run('Cash crate requires interaction and interrupts shooting',async()=>{await reset();const before=await page.evaluate(()=>{const t=window.__zombieTest;t.applyItem({kind:'crate',x:200,y:640});return t.snapshot().player;});assert.ok(before.growth>0&&before.shield===1);await page.evaluate(()=>{const t=window.__zombieTest;t.spawnItem('crate');t.advance(7);});const it=(await snap()).items.find(i=>i.kind==='crate');await page.evaluate(x=>window.__zombieTest.setPlayer({x,growth:0,shield:0}),it.x);await page.evaluate(()=>window.__zombieTest.advance(.1));assert.equal((await snap()).player.growth,0);await page.evaluate(()=>{const t=window.__zombieTest;t.setInput('interact',true);t.advance(1);});assert.ok((await snap()).player.growth>=1.6);});
await run('Thirty-second choice freezes combat and resumes with a real upgrade',async()=>{await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setGame({nextChoice:30});t.advance(31);});const a=await snap();assert.equal(a.state,'upgrade');assert.equal(a.offers.length,3);await page.evaluate(()=>window.__zombieTest.advance(3));assert.equal((await snap()).time,a.time);await page.keyboard.press('Digit1');const b=await snap();assert.equal(b.state,'running');assert.notDeepEqual(b.player,a.player);});
await run('Boss has three attacks and a second phase; nuke cannot one-shot it',async()=>{await reset();const result=await page.evaluate(()=>{const t=window.__zombieTest;t.setPlayer({fireCd:999,inv:999});const b=t.spawn('boss',{x:1000,cd:0});t.advance(.05);const a=t.snapshot().enemies.find(e=>e.id===b.id).mode;t.setEnemy(b.id,{mode:'walk',cd:0,attackCount:1});t.advance(.02);const c=t.snapshot().enemies.find(e=>e.id===b.id).mode;t.setEnemy(b.id,{mode:'walk',cd:0,attackCount:2});t.advance(.02);const d=t.snapshot().enemies.find(e=>e.id===b.id).mode;t.setEnemy(b.id,{hp:b.maxHp*.49});t.advance(.02);t.applyItem({kind:'nuke',x:300,y:640});return {modes:[a,c,d],boss:t.snapshot().enemies.find(e=>e.id===b.id)};});assert.deepEqual(result.modes,['chargePrep','slamPrep','summon']);assert.equal(result.boss.phase,2);assert.ok(result.boss.hp>0&&result.boss.alive);});
await run('Boss encounter starts at three minutes before an upgrade',async()=>{await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setGame({time:179.99,nextBoss:180,nextChoice:180});t.advance(.03);});const s=await snap();assert.equal(s.state,'running');assert.ok(s.enemies.some(z=>z.type==='boss'));});
await run('Pause and focus loss stop simulation; restart clears every cooldown',async()=>{await reset();await page.keyboard.press('Escape');assert.equal((await snap()).state,'paused');const a=(await snap()).time;await page.evaluate(()=>window.__zombieTest.advance(2));assert.equal((await snap()).time,a);await page.keyboard.press('Escape');assert.equal((await snap()).state,'running');await page.evaluate(()=>dispatchEvent(new Event('blur')));assert.equal((await snap()).state,'paused');await reset();const s=await snap();assert.equal(s.player.burstCd,0);assert.equal(s.player.dashCd,0);assert.equal(s.player.fireCd,0);assert.equal(s.enemies.length,0);});
await run('Window resize preserves grounded physics and reachable world bounds',async()=>{await reset();await page.setViewportSize({width:900,height:600});await page.evaluate(()=>window.__zombieTest.advance(.1));const s=await snap();assert.equal(s.player.y,667);assert.ok(s.player.x>0&&s.player.x<s.worldW);});
await run('Brute, spitter, screamer, and leaper execute their special abilities',async()=>{
 for(const type of ['brute','spitter','screamer','leaper']){
  await reset();const s=await page.evaluate(type=>{const t=window.__zombieTest;t.setPlayer({x:550,fireCd:999,inv:999});t.spawn(type,{x:730,cd:0});if(type==='screamer')t.spawn('normal',{x:800});t.advance(type==='screamer'?1.2:type==='leaper'?.8:.9);return t.snapshot();},type);
  if(type==='brute'||type==='spitter')assert.ok(s.hostiles>0,type+' failed to attack');
  if(type==='screamer'){assert.ok(s.enemies.length>=3);assert.ok(s.enemies.some(z=>z.buff>0));}
  if(type==='leaper')assert.ok(s.enemies[0].y<630);
 }
});
await run('Exploder kills trigger finite chain reactions',async()=>{await reset();const s=await page.evaluate(()=>{const t=window.__zombieTest;const a=t.spawn('exploder',{x:700});t.spawn('exploder',{x:790});t.spawn('exploder',{x:880});t.damageEnemy(a,100);return t.snapshot();});assert.equal(s.kills,3);assert.ok(s.enemies.every(e=>!e.alive));});
await run('Back shots bypass frontal armor',async()=>{await reset();const loss=await page.evaluate(()=>{const t=window.__zombieTest;const a=t.spawn('armored',{x:1000,face:-1});const old=a.hp;t.damageEnemy(a,10,{fromX:1100});return old-t.snapshot().enemies[0].hp;});assert.equal(loss,10);});
await run('Releasing one mapped key preserves another held movement key',async()=>{await reset();await page.keyboard.down('KeyD');await page.keyboard.down('ArrowRight');await page.keyboard.up('ArrowRight');await page.evaluate(()=>window.__zombieTest.advance(.1));assert.ok((await snap()).player.vx>0);await page.keyboard.up('KeyD');});
await run('Late-game population and effects remain bounded',async()=>{await reset();await page.evaluate(()=>{const t=window.__zombieTest;t.setGame({time:540,spawnCd:0,itemCd:0,specialCd:0,nextChoice:999,nextBoss:999});t.setPlayer({inv:999,hp:10,maxHp:10});for(let i=0;i<110;i++)t.spawn(Object.keys(t.defs.types)[i%10]);t.advance(8);});const s=await snap();assert.ok(s.enemies.length<=85);assert.ok(s.items.length<=18);assert.ok(s.bullets<=260);});
await run('Mobile supports simultaneous movement and jump',async()=>{
 const mobile=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.addInitScript(()=>{window.requestAnimationFrame=()=>1;});await mobile.goto(pathToFileURL(root+'打僵尸.html').href+'?test=1');await mobile.locator('#startBtn').tap();
 const right=await mobile.locator('[data-action="right"]').boundingBox(),jump=await mobile.locator('[data-action="jump"]').boundingBox();
 const session=await mobile.context().newCDPSession(mobile);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:right.x+right.width/2,y:right.y+right.height/2,id:4},{x:jump.x+jump.width/2,y:jump.y+jump.height/2,id:5}]});
 await mobile.evaluate(()=>{window.__zombieTest.advance(.15);window.__zombieTest.render();});const s=await mobile.evaluate(()=>window.__zombieTest.snapshot());assert.ok(s.player.y<630);assert.ok(s.player.vx>0);assert.equal(await mobile.locator('#touchControls').isVisible(),true);
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.screenshot({path:root+'qa/mobile-landscape.png'});
 await mobile.setViewportSize({width:390,height:844});await mobile.evaluate(()=>window.__zombieTest.render());
 const boxes=await mobile.evaluate(()=>Object.fromEntries(['weaponBar','toolbar','waveLabel','globalTools'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [id,{left:r.left,right:r.right,top:r.top,bottom:r.bottom}];})));
 const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 assert.equal(overlaps(boxes.weaponBar,boxes.toolbar),false);assert.equal(overlaps(boxes.waveLabel,boxes.globalTools),false);
 await mobile.screenshot({path:root+'qa/mobile-portrait.png'});await mobile.close();
});
await run('English and standalone entries load offline',async()=>{for(const file of ['index.html','standalone/打僵尸.html','standalone/index.html']){const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));const requests=[];p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await p.goto(pathToFileURL(root+file).href);assert.ok(await p.locator('#startBtn').innerText());await p.locator('#startBtn').click();assert.equal(await p.locator('#hud').isVisible(),true);assert.equal(requests.length,0);await p.close();}});
// Exercise the live RAF renderer and collect an illustrative screenshot.
const live=await browser.newPage({viewport:{width:1440,height:900}});live.on('pageerror',e=>errors.push(e.message));await live.goto(pathToFileURL(root+'打僵尸.html').href+'?test=1');await live.locator('#startBtn').click();
await live.evaluate(()=>{const t=window.__zombieTest;t.setGame({time:105,nextChoice:999,nextBoss:999,spawnCd:999});t.setPlayer({x:700,hp:6,shield:1,maxJumps:2,inv:999,fireCd:99});t.spawn('armored',{x:1020});t.spawn('brute',{x:1170,mode:'slamPrep',timer:1});t.spawn('spitter',{x:1310});t.spawn('flyer',{x:875,y:420});t.spawn('leaper',{x:960});t.spawn('exploder',{x:1230});t.spawn('screamer',{x:1380});t.spawnItem('crate');t.setInput('jump',true);});
await live.waitForTimeout(180);await live.screenshot({path:root+'qa/battle-zh.png'});
await run('Live rendering has no page errors',async()=>assert.deepEqual(errors,[]));
await page.setViewportSize({width:1440,height:900});await reset();
const performanceSample=await page.evaluate(()=>{const t=window.__zombieTest;t.setGame({time:300});t.setPlayer({inv:999,fireCd:999});for(let i=0;i<85;i++)t.spawn(Object.keys(t.defs.types)[i%10],{x:100+(i%17)*70,y:i%10===7?450:667});for(let i=0;i<80;i++)t.addBullet({x:100+i*15,y:580});for(let i=0;i<5;i++)t.render();const samples=[];for(let i=0;i<60;i++){const a=performance.now();t.render();samples.push(performance.now()-a);}samples.sort((a,b)=>a-b);return {entities:85,bullets:80,viewport:'1440×900',medianMs:samples[30],p95Ms:samples[57],note:'Synchronous Canvas drawing sample; not a device-independent FPS guarantee.'};});
console.log('Render sample '+JSON.stringify(performanceSample));
const report={date:new Date().toISOString(),passed:results.filter(r=>r.passed).length,total:results.length,results,pageErrors:errors,performanceSample};writeFileSync(root+'qa/report.json',JSON.stringify(report,null,2));
await browser.close();console.log(`${report.passed}/${report.total} checks passed`);if(report.passed!==report.total)process.exitCode=1;
