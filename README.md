# Orbital Last Stand

A zero-asset browser arena-survival game built entirely from code.

- Vanilla JavaScript
- HTML5 Canvas
- Web Audio API
- localStorage
- No libraries, frameworks, images, fonts, or external network requests
- Deploys directly to GitHub Pages

## Play

Survive for **10 minutes** while crossing five increasingly hostile sectors. Your ship fires automatically and the run grows from simple pursuit enemies into elites, snipers, orbiters, enemy fire and boss encounters.

Move with **WASD**, the **arrow keys**, or **touch-drag on mobile**. **P** pauses and **M** toggles sound.

## World

The arena changes every two minutes:

- **Outer Drift** — baseline pressure
- **Ember Belt** — warmer visuals and higher spawn pressure
- **Violet Wake** — further escalation
- **Null Lattice** — late-run pressure
- **Core Approach** — the final two-minute push

Each sector has a generated palette, moving background detail and its own pressure multiplier.

## Bosses

Bosses arrive every minute and rotate through original behavior-driven encounters:

- **The Warden** fires rings with moving safe gaps
- **Harrower** telegraphs high-speed charge attacks
- **Prismatic Eye** fires dense aimed projectile fans
- **Singularity** pulls the player toward itself while emitting spiral patterns
- **The Crown** layers fast overlapping projectile rings

The goal is readable attack patterns and movement tests rather than merely giving ordinary enemies absurd health bars.

## Arsenal

Every run begins with the blaster. Level-up choices can unlock and improve five additional weapon families, each with five levels:

- **Seeker Rack** — homing missiles
- **Arc Conductor** — chain lightning
- **Nova Core** — radial damage pulses
- **Grav Mines** — persistent mines
- **Prism Lance** — piercing beam

## Enemies

The roster includes Scouts, Brutes, Darts, Bulwarks, Wisps, Spitters, Swarmers, Snipers and Orbiters. Their behavior ranges from direct pursuit and charging to strafing, ranged fire, long-range shots and orbiting attack patterns. Elite variants appear later in runs.

## Persistent menu

The title screen includes persistent local settings for difficulty, screen shake and sound, plus run statistics for completed runs, victories, kills and best score. Nothing leaves the browser.

## Local

Open `index.html` directly, or serve the directory with any static server:

```bash
python -m http.server 8080
```

## Philosophy

This repository started essentially empty as an experiment: can an AI coding agent create and ship a complete game without being given assets, starter code, a framework, or a design file?

Everything visible is rendered from code and all sound is synthesized at runtime. No external assets, game engine or runtime dependencies are used.

## Deployment

CI syntax-checks all JavaScript modules on pull requests. Merges to `main` deploy automatically via GitHub Pages.
