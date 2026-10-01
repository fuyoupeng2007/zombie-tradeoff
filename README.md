# Zombie Tradeoff 2.0 · Dead Air

A dependency-free, offline Canvas 2D survival game. Scavenge supplies on the left, fight the horde on the right, jump through ground attacks, and shoot enemies diving from above.

## Play

Open `index.html` for English or `打僵尸.html` for Chinese. Keep `game.js` and `styles.css` beside them. For a **single shareable offline file**, open either version in `standalone/` instead.

No installation, network requests, engine, or build step is required to play. Optional local server: `node tools/serve.mjs`, then open <http://127.0.0.1:8000/>. GitHub Pages uses root `index.html`; publish `game.js` and `styles.css` alongside it.

## Controls

| Input | Action |
| --- | --- |
| A / D or arrows | Move |
| Space / W / up arrow | Jump; jump again after unlocking Air Step |
| Shift | Dash in your movement or facing direction |
| Mouse movement | Manual aiming, including upward shots |
| Q / aim button | Toggle manual and automatic aiming |
| Left click / J | Enhanced attack, with a separate cooldown |
| 1–4 | Rifle, shotgun, piercer, arc gun |
| Hold E | Open a nearby grounded supply cache; firing stops while opening |
| Esc | Pause / resume |
| Enter | Start / restart |
| 1–3 on upgrade screen | Choose a modification |

Regular firing is automatic. Touch devices have simultaneous movement and action controls plus tappable weapons; landscape is recommended, and portrait is supported. Losing focus or switching tabs pauses combat.

## Combat

Ten enemy mutations: tracking walkers, charging runners, destructible frontal armor, brute shockwaves, enraged tanks, toxic projectiles and pools, chain-reacting exploders, telegraphed aerial dives, buffing and summoning screamers, and leaping ambushers.

The Stitched Tyrant arrives at approximately three minutes, then every three minutes while no previous boss remains. It cycles through charges, ground slams, and winged reinforcements, becoming more aggressive at half health. Dangerous attacks have visible tells.

Enemy reinforcement tuning raises most mutations to roughly twice their previous health and increases pursuit speed by approximately 30–60%. Walkers now have 13 base health, tanks 130, and the Tyrant 3200. Health scales faster with time, including additional growth after 90 seconds. Coordinated three-enemy reinforcements arrive from offscreen after 45 seconds, within the existing 85-enemy cap. Aerial dives and long leaps now actually reach their warned targets. Spitters fire paired volleys after one minute and leave seven-second pools; screamers call two reinforcements; bosses summon three or four winged enemies depending on phase. Skill recovery times are shorter while warning times remain readable.

Four weapons offer sustained fire, short-range pellet bursts, penetrating armor bypass, and chain lightning. Every thirty seconds, choose one of three run-long upgrades; boss fights defer the choice. Unlock double jumping, penetration, chains, critical hits, healing, protection, and mobility.

Supply cards continuously improve damage and fire rate, heal, or grant shields. Fire rate has a practical lower interval; subsequent rate cards become damage. Full-health healing becomes shielding. Caches require 0.85 seconds of interaction. Screen-clear support kills visible ordinary enemies and deals 16% max-health damage to bosses. Rail support follows your aim.

Assist starts with eight health, weaker enemies, and rescue acceleration. Standard has six health and regular supply timing. Hard has five health, stronger and faster enemies, and denser spawns. High scores are stored separately per difficulty with a safe fallback when browser storage is unavailable.

## Art and implementation

Original procedural post-apocalyptic cartoon characters, articulated limbs, distinctive silhouettes, armor breaks, weapon recoil, landing dust, shields, and readable attack warnings. Layered ruins, an abandoned ambulance, utility wires, a supply platform, cracked roads, haze, and embers form the background. Web Audio synthesizes sound effects. No external assets or fonts are requested.

Shared logic and styles prevent language versions from diverging. Static scenery is cached; entities and particles are bounded; fixed 120 Hz simulation and swept projectile collision support consistent movement and fast bullets. High/low effects modes are available.

## Development

```sh
node --check game.js
node tools/build-entry.mjs --standalone
node tools/verify.mjs
node tools/serve.mjs
```

Browser checks require development-only Playwright and Chromium / Chrome. Install with `npm install` and `npx playwright install chromium`, or specify existing packages through `PLAYWRIGHT_PACKAGE` and an executable through `CHROME_PATH`. Reports and screenshots are written to `qa/`. Only `?test=1` enables the opt-in automation interface.

`tools/build-entry.mjs` generates both entry points and standalone copies. Regenerate after changing shared source. Historical 1.5 design notes remain in `STORY.md`; see [Chinese documentation](README.zh-CN.md) for full enemy and upgrade details.

Original project's permission statement retained: code may be used, modified, and distributed freely.
