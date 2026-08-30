# Orbital Last Stand

A zero-asset browser arena-survival game built entirely from code.

- Vanilla JavaScript
- HTML5 Canvas
- Web Audio API
- localStorage
- No libraries, frameworks, images, fonts, or external network requests
- Deploys directly to GitHub Pages

## Play

Survive for **10 minutes**. Your ship fires automatically at the nearest hostile signal while the enemy roster, spawn pressure, elites and boss patterns escalate around you.

Move with **WASD**, the **arrow keys**, or **touch-drag on mobile**.

- **P** pause
- **M** mute

Collect XP fragments to level up and choose upgrades. Keep kills close together to build a score combo. Enemies and elites can also drop temporary power-ups:

- **Repair** restores hull integrity
- **Pulse** clears hostile projectiles and damages the swarm
- **Overdrive** temporarily boosts fire rate

## Enemies

Enemy types unlock as the run progresses rather than merely receiving larger numbers:

- Scouts pursue directly
- Brutes trade speed for health and collision damage
- Darts periodically charge
- Bulwarks soak sustained fire
- Wisps strafe around the player
- Spitters maintain range and fire hostile projectiles
- Elites can appear later in a run with stronger stats and bonus rewards
- Bosses arrive every minute and emit radial projectile patterns

## Local

Open `index.html` directly, or serve the directory with any static server:

```bash
python -m http.server 8080
```

## What is generated

Everything visible in-game is drawn at runtime with Canvas primitives, including the player, enemies, bosses, XP fragments, friendly and hostile projectiles, power-ups, particles, orbitals, health bars, the animated grid, hit flashes, and screen shake.

Sound effects are synthesized in the browser with oscillators and gain envelopes through the Web Audio API.

## Progression

The run includes escalating enemy spawn rates, behavior-based enemy archetypes, minute bosses, elite enemies, enemy projectiles, XP collection, score combos, power-ups, a 10-minute victory state, persistent best score, and fifteen upgrades covering fire rate, damage, multishot, piercing, movement, regeneration, armor, crits, XP gain, orbitals, and more.

## Philosophy

This repository started essentially empty as an experiment: can an AI coding agent create and ship a complete game without being given assets, starter code, a framework, or a design file?

No external assets were added. No game engine was added. No dependencies were installed.

## Deployment

CI syntax-checks the JavaScript on pull requests. Merges to `main` deploy automatically via GitHub Pages.
