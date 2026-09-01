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

Difficulty changes the shape of boss encounters rather than only adjusting global numbers. **Chill** clears regular enemies and uses slower, simpler bosses. **Normal** also creates a clean duel, but bosses gain more durability, faster phases and predictive aim. **Intense** keeps the swarm active while bosses use their strongest tuning.

Difficulty also controls the recovery economy. Chill produces more frequent, stronger and longer-lived repair drops; Normal keeps recovery dependable without making it constant; Intense makes every recovery opportunity more deliberate. Missing hull increases the chance and repair bias, bosses rescue critically damaged ships, and a kill-based pity rule prevents extreme dry spells. Powerups attract from farther away on easier settings so healing does not require diving back into the worst part of the swarm.

Hostile projectile pressure follows the same philosophy. Chill and Normal use viewport-aware limits to stop late runs from becoming unreadable walls of stale shots, retiring off-screen and distant projectiles first while preserving nearby threats and telegraphed rail or blast attacks. Intense keeps the complete bullet hell.

## World

The arena changes every two minutes:

- **Outer Drift** — baseline pressure
- **Ember Belt** — warmer visuals and higher spawn pressure
- **Violet Wake** — further escalation
- **Null Lattice** — late-run pressure
- **Core Approach** — the final two-minute push

Each sector has a generated palette, moving background detail and its own pressure multiplier.

At every sector boundary, navigation pauses the run and offers three routes across distinct risk bands. Twelve possible routes can permanently shape the current build, while their threats alter enemy pressure, elites, damage or scoring until the next boundary. Endless mode keeps generating route decisions beyond the campaign's fifth sector.

## Bosses

Bosses arrive every minute and rotate through original behavior-driven encounters:

- **The Warden** fires rings with moving safe gaps
- **Harrower** telegraphs high-speed charge attacks
- **Prismatic Eye** fires dense aimed projectile fans
- **Singularity** pulls the player toward itself while emitting spiral patterns
- **The Crown** layers fast overlapping projectile rings
- **Leviathan** occupies the arena edge with rail warnings and side volleys
- **The Broodmind** replaces the swarm with concentrated summon bursts
- **The Mirror Engine** attacks from reflected positions on both sides of the arena
- **The Last Light** closes the campaign with gravity, rail fire and rotating rings
- **Grid Architect** enters the later Boss Rush rotation with rail-and-blast lattices

The goal is readable attack patterns and movement tests rather than merely giving ordinary enemies absurd health bars.

## Arsenal

Every run begins with the blaster. Level-up choices can unlock and improve five additional weapon families, each with five levels:

- **Seeker Rack** — homing missiles
- **Arc Conductor** — chain lightning
- **Nova Core** — radial damage pulses
- **Grav Mines** — persistent mines
- **Prism Lance** — piercing beam

The module pool contains 150 upgrades, including 50 authored special modules. Specials now change the rules of a run instead of merely carrying a rarity label: **Last Bulkhead** prevents one lethal hit, **Echo Chamber** repeats every sixth volley, **Prism Mirror** fires beams backwards, and companion modules can fork drone fire, electrify Ember shots, or turn Wisp pulses into gravity anchors.

Companions have distinct active jobs. Razor orbitals launch out to cut distant
targets, Aegis turns toward incoming fire and spends rechargeable interceptions,
and the **Wrecking Node** trails the ship on a spring-like tether. Sharp movement
slings the node through enemies, with damage driven by its real momentum; kills
grow its mass during the run, while Ballast and Razor Wire alter its impact.

Nine apex modules complete named multi-trait builds such as **Seeking Storm**, **Event Horizon**, **Recursive Violence**, **Thunder Choir**, and **Guardian Swarm**. The rare **Dead God Circuit** activates the entire apex network at once, with an appropriately unstable annihilation aura.

Five showcase apexes now manifest physically. Seeking Storm grows conductor fins and electrifies guided rounds; Recursive Violence exposes projectile generations; Event Horizon installs a dark gravity core; Thunder Choir synchronizes Ember and Wisp into periodic multi-target discharges; Guardian Swarm forms a defensive network that intercepts ordinary hostile shots while leaving telegraphed boss attacks intact. Every first activation receives a dedicated combat banner, palette and synthesized audio sting.

Level-ups now draw from themed module pools. Most levels offer salvage, every fifth level opens a boss cache, and every seventh level offers companion technology. This gives major milestones a distinct identity and makes build-defining modules feel earned rather than evenly shuffled into every choice.

## Signal Archive

The persistent **Signal Archive** records modules, synergies, bosses, routes and sector events as they are encountered. Undiscovered entries remain redacted, while a searchable module catalog reveals each recovered signal's pool, rarity and effect.

Completed runs earn ship-and-mode completion marks. The Archive also keeps a compact history of recent runs with their final loadouts, decoded synergies, routes and scores, and the end-of-run debrief highlights discoveries made during that attempt.

Every second defeated boss can intercept the run with a **Black Signal** contract. Accepting its forbidden module requires a permanent sacrifice for the rest of the run—hull, mobility or defenses—while rejecting it leaves the build untouched. Accepted contracts and their costs appear in the final debrief and Archive history.

## Enemies

The roster includes Scouts, Brutes, Darts, Bulwarks, Wisps, Spitters, Swarmers, Snipers, Orbiters, Leeches, Sentinels and Phasers. Their behavior ranges from direct pursuit and charging to strafing, ranged fire, long-range shots, teleportation and orbiting attack patterns. Elite variants appear later in runs.

Six timed sector events interrupt the normal pressure curve, including Swarm Tide, Glass Space and Temporal Echo. Event modifiers compose with the selected route instead of replacing it.

## Persistent menu

The title screen includes persistent local settings for difficulty, screen shake and sound, plus run statistics, completion marks and the Signal Archive. Nothing leaves the browser.

## Local

Open `index.html` directly, or serve the directory with any static server:

```bash
python -m http.server 8080
```

## Install and offline play

The deployed game is an installable PWA. After one successful online load, its
complete runtime shell is available offline. Releases use the semantic version
in `app-version.js`; a new service worker downloads each version into a
separate cache and waits until the player accepts the in-game **Update now**
prompt. This keeps the running page and its modules on one atomic version
instead of mixing new HTML with stale JavaScript.

See [the release guide](docs/releasing.md) for the versioning and cache rules.

## Philosophy

This repository started essentially empty as an experiment: can an AI coding agent create and ship a complete game without being given assets, starter code, a framework, or a design file?

Everything visible is rendered from code and all sound is synthesized at runtime. No external assets, game engine or runtime dependencies are used.

Late-game readability uses a visual-only friendly-projectile budget, value-preserving salvage consolidation and a compact loadout strip. The build still deals every point of earned damage; duplicate cyan effects simply stop competing with hostile fire. Architect and Last Light phase two encounters also introduce difficulty-scaled safe-corridor tests and brief phase gates, so the closing minutes reward positioning as well as build strength.

## Deployment

CI syntax-checks all JavaScript modules on pull requests. Merges to `main` deploy automatically via GitHub Pages.
