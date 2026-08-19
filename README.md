# 🧟 Zombie Tradeoff · Endless Survival

A 2D endless-survival web game where **weapons drop on the left and zombies swarm from the right** — grab the upgrade and you stop shooting; hold the line and you miss the loot. That's the tradeoff.

## 🎮 Gameplay

- **Core loop**: Weapon cards rain down on the left (DMG +1, ATK SPD +1, Heal, Shield) while zombies pour in from the right. Move left/right and decide: power up, or hold the horde back?
- **Endless mode**: Your growth has **no cap** (damage and fire rate stack forever), and neither does the horde — HP, speed and spawn rate scale endlessly with survival time. You dominate early, then drown. How long can you last?
- **Rare items** (independent timers):
  - 💣 **NUKE** (every ~30–35 s): instant full-screen blast, clears every zombie
  - 🚀 **RAILGUN** (every ~20–25 s): fires a piercing beam that cuts through every zombie in its path
  - When you're in danger (low HP / surrounded / late game) the timers speed up **and the item drops right at your feet**
- **Zombie types**: Normal / Fast / Armored / Brute / Mega Tank (mega zombies have huge HP and bite for −2 ❤)

## 🎮 Controls

| Key | Action |
|---|---|
| `←` `→` / `A` `D` | Move left/right |
| `Space` / Left Click | Triple shot (auto-fire is always on) |
| `Enter` / `Space` | Start / Restart |

## 🖥 Run it

Double-click `index.html` (English) or `打僵尸.html` (中文) to play — zero dependencies, no build step. Or serve it:

```bash
python -m http.server 8000
# → http://localhost:8000/index.html
```

Play it live on GitHub Pages: **https://fuyoupeng2007.github.io/zombie-tradeoff/**

## 🛠 Tech

- **Vanilla HTML + Canvas 2D + JavaScript** — single file, zero dependencies, no build
- Web Audio synthesized SFX (gunshots, explosions, pickups, wave horns) — no external audio files
- High score persisted in `localStorage` (gracefully degrades in sandboxed/private mode)
- No external requests at all — fully playable offline

## 📦 Files

- `index.html` — English version (GitHub Pages entry)
- `打僵尸.html` — Chinese version (中文版)
- `README.md` — this file (English)
- `README.zh-CN.md` — Chinese documentation (中文说明)

## 📄 License

Free to use, modify and distribute.
