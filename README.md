# Orbital Last Stand

A zero-asset browser arena-survival game built entirely from code.

- Vanilla JavaScript
- HTML5 Canvas
- Web Audio API
- localStorage
- No libraries, frameworks, images, fonts, or external network requests
- Deploys directly to GitHub Pages

## Play

Move with **WASD** or the **arrow keys**. Your ship fires automatically at the nearest hostile signal. Collect fragments, level up, choose upgrades, and survive escalating waves and minute bosses.

- **P** pause
- **M** mute

## Local

Open `index.html` directly, or serve the directory with any static server:

```bash
python -m http.server 8080
```

## What is generated

Everything visible in-game is drawn at runtime with Canvas primitives, including the player, enemies, bosses, XP fragments, projectiles, particles, orbitals, health bars, the animated grid, hit flashes, and screen shake.

Sound effects are synthesized in the browser with oscillators and gain envelopes through the Web Audio API.

## Progression

The run includes escalating enemy spawn rates, five enemy stat archetypes, minute bosses, XP collection, persistent best score, and fifteen upgrades covering fire rate, damage, multishot, piercing, movement, regeneration, armor, crits, XP gain, orbitals, and more.

## Philosophy

This repository started essentially empty as an experiment: can an AI coding agent create and ship a complete game without being given assets, starter code, a framework, or a design file?

No external assets were added. No game engine was added. No dependencies were installed.

## Deployment

CI syntax-checks the JavaScript on pull requests. Merges to `main` deploy automatically via GitHub Pages.
