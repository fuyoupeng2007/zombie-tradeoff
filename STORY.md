# 🧟 Zombie Tradeoff — Devpost Story

## 💡 Inspiration

It started while scrolling short videos: one of those "ultra-satisfying zombie shooter" mini-games kept popping up. A little survivor at the bottom, weapons dropping on one side, zombies marching in from the other, and a constant stream of little numbers — `+1`, `×2`, `−1 ❤`. The hook was obvious and painful at the same time: **every second you spend grabbing loot is a second you're not shooting the horde.** The tradeoff *is* the game.

I wanted that feeling in a browser — no install, no engine, one file you can open anywhere. And I wanted it 2D, clean, and readable, with the same dusty wasteland mood of those mobile shooters (grey-green sky, golden loot, hordes that never stop).

So I entered BTT Web Game Jam with one question: **"Loot falls on the left, zombies swarm from the right — how long can you survive?"**

## 🛠 How I built it

**Zero-engine, single-file stack.** Pure HTML + Canvas 2D + vanilla JavaScript. No frameworks, no build step, no assets to download — the whole game is one HTML file, fully playable offline.

**The core loop.** Weapon cards rain down on the left (DMG +1, ATK SPD +1, Heal, Shield). Zombies pour in from the right (Normal / Fast / Armored / Brute / Mega Tank). You move with arrow keys or A/D, auto-fire does the shooting, Space/click fires a triple shot. Loot and horde pull you in opposite directions — that's the tradeoff.

**Endless mode, both sides uncapped.** The fun of an endless game dies the moment you hit a level cap. So the player's damage and fire rate stack forever (fire rate scales multiplicatively so it never stalls), and the zombies scale *endlessly too* — HP, speed, and spawn density all grow with survival time. You dominate early, then drown. The math is simple: both sides are infinite, but the horde's growth outpaces yours.

**Rare items on independent timers.** Two special drops — the **NUKE** (full-screen clear, ~30–35s) and the **RAILGUN** (a piercing beam that cuts through the whole row, ~20–25s). They use separate countdowns, not a shared RNG, so drops feel reliable. And when you're in trouble (low HP / surrounded / late game), the timers speed up and the item lands right at your feet. The game saves you just enough to keep the tension alive.

**Synthesized audio.** All sound — gunshots, explosions, pickups, the wave horn — is generated live with Web Audio oscillators. No audio files, no licensing, no download weight.

**Debugging the "invisible" bugs.** The biggest fights weren't about features:
- The **"slingshot" bug** — the character kept snapping back after moving left, because a leftover mouse-follow was fighting the keyboard input. Fix: remove mouse control entirely; keyboard-only movement.
- **Preview iframes that disable JavaScript** — the game looked dead in some previews because `sandbox=""` blocks scripts, and `localStorage` throws in sandboxed frames. Fix: wrap storage in try/catch so the game runs everywhere.
- **Cards that did nothing** — attack-speed cards kept dropping after the speed cap, so pickups felt useless. Fix: cap-free growth and a loot pool that only ever drops something useful (or converts a maxed stat into another).

**Publishing.** Pushed to GitHub, enabled GitHub Pages, and got a live URL in minutes — public repo + playable link, exactly what the jam asks for. Privacy: no API keys, no personal info in the code, noreply email for git identity.

## 📚 What I learned

1. **A tradeoff is the shortest possible story.** "Loot on the left, zombies on the right" is a complete game pitch in ten words. The best jam games make their hook obvious in one screenshot — this one does.
2. **Endless mode needs both sides to be infinite.** Capping the player kills the fantasy; capping the enemy kills the tension. Balance isn't a number, it's a *curve* — and the horde's curve has to outrun yours.
3. **Reliable beats random for "save me" items.** The nuke/railgun aren't RNG rolls — they're timed lifelines. Players feel the game is fair (it always comes) and dramatic (it comes *just in time*).
4. **Feedback is the gameplay.** Screen shake, particles, floating numbers, hit-stop, synthesized punchy audio — the juice is what makes "moving and shooting" feel like a *game*.
5. **Browsers are a hostile environment.** Sandboxed iframes, storage restrictions, autoplay policies — write defensively (try/catch everything fragile) and test in the actual places players will open it.
6. **Ship the smallest thing that's a complete game.** One file, zero dependencies, zero build. It deploys anywhere, runs offline, and leaves nothing to break.

## ▶️ Play it

- **Play online:** https://fuyoupeng2007.github.io/zombie-tradeoff/
- **Source code:** https://github.com/fuyoupeng2007/zombie-tradeoff

*Loot left, fight right — you can't do both forever.*
