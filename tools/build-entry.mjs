import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const markup=(lang)=>`<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101d21"><title>${lang==='en'?'Zombie Tradeoff · Dead Air':'打僵尸 · 取舍之战：死寂天空'}</title><link rel="stylesheet" href="styles.css"><script src="game.js" defer></script></head>
<body>
<canvas id="game" aria-label="${lang==='en'?'Zombie survival game':'僵尸生存游戏'}"></canvas>
<div id="hud" class="hidden">
 <div class="hud-left"><span class="eyebrow" id="healthLabel"></span><div id="health"></div><span id="shield"></span></div>
 <div class="hud-center"><div id="waveLabel"></div><div class="progress"><i id="waveProgress"></i></div><small id="phaseLabel"></small></div>
 <div class="hud-right"><strong id="score">0</strong><small id="time"></small></div>
 <div id="bossHud" class="hidden"><span id="bossName"></span><div class="progress"><i id="bossProgress"></i></div></div>
 <div id="loadout"><div id="weaponBar"></div><div id="abilityBar"></div></div>
 <div id="toolbar"><button id="aimBtn" type="button"></button><button id="pauseBtn" type="button" aria-label="${lang==='en'?'Pause':'暂停'}">Ⅱ</button></div>
</div>
<div id="globalTools"><button id="soundBtn" type="button"></button><button id="qualityBtn" type="button"></button><a id="languageLink"></a></div>
<div id="overlay">
 <main id="menuPanel" class="panel menu-panel">
  <div class="eyebrow" id="edition"></div><h1 id="title"></h1><div class="title-rule"></div><p id="tagline" class="tagline"></p><div class="feature-row" id="features"></div>
  <div class="menu-bottom"><div class="briefing"><div class="eyebrow" id="briefingLabel"></div><p id="briefingText"></p><div id="controlsText" class="controls-text"></div></div><div class="launch"><label for="difficulty" id="difficultyLabel"></label><select id="difficulty"></select><button id="startBtn" class="primary" type="button"></button><small id="bestLabel"></small></div></div><p id="mobileHint" class="mobile-hint"></p>
 </main>
 <section id="pausePanel" class="panel compact hidden"><div class="eyebrow" id="pauseKicker"></div><h2 id="pauseTitle"></h2><p id="pauseText"></p><button id="resumeBtn" class="primary" type="button"></button><button id="quitBtn" class="secondary" type="button"></button></section>
 <section id="upgradePanel" class="panel upgrade-panel hidden"><div class="eyebrow" id="upgradeKicker"></div><h2 id="upgradeTitle"></h2><p id="upgradeText"></p><div id="upgradeCards"></div><small id="upgradeHint"></small></section>
 <section id="endPanel" class="panel compact hidden"><div class="eyebrow" id="endKicker"></div><h2 id="endTitle"></h2><div id="endStats"></div><p id="endAdvice"></p><button id="againBtn" class="primary" type="button"></button><button id="menuBtn" class="secondary" type="button"></button></section>
</div>
<div id="toast" role="status"></div>
<div id="touchControls" class="hidden"><div class="touch-move"><button data-action="left" aria-label="${lang==='en'?'Move left':'向左移动'}">◀</button><button data-action="right" aria-label="${lang==='en'?'Move right':'向右移动'}">▶</button></div><div class="touch-actions"><button data-action="interact" id="touchInteract"></button><button data-action="dash" id="touchDash"></button><button data-action="burst" id="touchBurst"></button><button data-action="jump" id="touchJump"></button></div></div>
</body></html>`;
for(const [name,lang] of [['index.html','en'],['打僵尸.html','zh-CN']])writeFileSync(root+name,markup(lang));
if(process.argv.includes('--standalone')){
 mkdirSync(root+'standalone',{recursive:true});
 const css=readFileSync(root+'styles.css','utf8');
 const js=readFileSync(root+'game.js','utf8').replaceAll('</script','<\\/script');
 for(const [name,lang] of [['index.html','en'],['打僵尸.html','zh-CN']]){
  const html=markup(lang).replace('<link rel="stylesheet" href="styles.css">',()=>`<style>${css}</style>`).replace('<script src="game.js" defer></script>',()=>`<script defer>${js}</script>`);
  // Inline scripts do not support defer; place the script after the DOM instead.
  const script=`<script>${js}</script>`;
  writeFileSync(root+'standalone/'+name,html.replace(`<script defer>${js}</script>`,'').replace('</body>',()=>script+'</body>'));
 }
}
