# Orbital Last Stand

A zero-asset browser action roguelite built entirely from code.

- Vanilla JavaScript
- HTML5 Canvas
- Web Audio API
- localStorage
- No libraries, frameworks, images, fonts, or external network requests
- Deploys directly to GitHub Pages

## Play

The primary **Expedition** mode crosses five sectors as a deliberate room-based
run. Enter a room, clear its finite enemy waves, collect scrap and physically
fly into the door for the next encounter. Module Vaults, Forked Signals, Scrap
Exchanges, Quiet Docks, elite fights and hidden Null Chambers sit between five
sector wardens. Bosses leave exactly one physical relic in the arena before the
route continues.

**Last Stand** preserves the original game as its own mode: survive for ten
minutes while levels, routes, enemies and bosses arrive at high speed. Endless,
Boss Rush and Playground remain available alongside both core formats.

Move with **WASD**, the **arrow keys**, or **touch-drag on mobile**. **P** pauses and **M** toggles sound.

Eight playable chassis turn the opening choice into a real build decision.
Strider is the balanced baseline; Bulwark is a wide armored tank; Volt is a
fragile rapid-fire needle; and Harvester accelerates collection and XP. Wraith
trades hull for a tiny hitbox and speed, Lancer opens with heavy piercing
rounds, Relay starts with a twin-shot volley, and Halo enters with armor and two
orbitals. Every chassis has its own vector silhouette, accent pattern, engine
layout and collision radius. The selected ship is rendered consistently in the
hangar and arena, where it smoothly faces the direction it is moving.
Each hull rotates around its own slightly aft center-of-mass pivot rather than
the center of its bounding box. A small illuminated combat core marks that
pivot and the real collision center, keeping dense dodging predictable.

Difficulty changes the shape of boss encounters rather than only adjusting global numbers. **Chill** clears regular enemies and uses slower, simpler bosses. **Normal** also creates a clean duel, but bosses gain more durability, faster phases and predictive aim. **Intense** keeps the swarm active while bosses use their strongest tuning.

Difficulty also controls the recovery economy. Chill produces more frequent, stronger and longer-lived repair drops; Normal keeps recovery dependable without making it constant; Intense makes every recovery opportunity more deliberate. Missing hull increases the chance and repair bias, bosses rescue critically damaged ships, and a kill-based pity rule prevents extreme dry spells. Powerups attract from farther away on easier settings so healing does not require diving back into the worst part of the swarm.

Hostile projectile pressure follows the same philosophy. Chill and Normal use viewport-aware limits to stop late runs from becoming unreadable walls of stale shots, retiring off-screen and distant projectiles first while preserving nearby threats and telegraphed rail or blast attacks. Intense keeps the complete bullet hell.

## Expedition rooms

Expedition replaces continuous spawning with five controlled-randomized sector
maps. Every sector is connected and guarantees a distant warden, a Module
Vault, Forked Signal, Scrap Exchange, Quiet Dock, Elite Intercept and at least
one hidden Null Chamber. Room placement, branches, loops and routes vary from
run to run without producing unreachable objectives or progress-blocking dead
ends.

Combat exits lock until every finite wave is destroyed. Afterward, subtle
openings at the arena edges lead in their actual map directions. The restrained
minimap records explored rooms, supports full backtracking and keeps special
room labels readable without turning the arena into a navigation overlay.

- **Module Vaults** contain one permanent item
- **Forked Signals** present mutually exclusive companion-focused choices
- **Scrap Exchanges** sell up to three modules and permit multiple purchases
- **Quiet Docks** repair the hull without adding another permanent item
- **Elite Intercepts** guarantee an elite threat and pay additional scrap
- **Null Chambers** hide behind faint optional signals and contain boss-class rewards
- **Sector Wardens** leave one guaranteed relic before the descent

All pedestal modules remain physically in their rooms until collected, so the
player can leave an item behind and return for it later. Rusted Key, Lucky Bolt,
Second Opinion and Warm Seat manipulate secrets, pedestal counts, choices and
shop prices. Defeating a warden unlocks an optional adjacent Black Signal room
as well as the next-sector exit; both its relic and contract can be ignored. A
completed Expedition normally produces a much smaller, more legible build than
Last Stand, leaving the rare rule-breaking combinations genuinely exceptional.

## Last Stand world

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

The module pool contains 160 upgrades, including 63 authored special modules. Specials now change the rules of a run instead of merely carrying a rarity label: **Last Bulkhead** prevents one lethal hit, **Echo Chamber** repeats every sixth volley, **Prism Mirror** fires beams backwards, and companion modules can fork drone fire, electrify Ember shots, or turn Wisp pulses into gravity anchors.

Ten arena-altering modules push builds into stranger territory. **Constellation
Engine** constructs damaging star triangles, **Reversal Chamber** returns rounds
through the arena, **Aegis Reservoir** weaponizes intercepted fire, and **Orbit
Loom** connects companions into a moving damage web. Broadside cannons, friendly
enemy ghosts, screen-wrapping rounds, a projectile-devouring moon, an orbiting
Pulse Heart and transferable execution marks complete the set.

Companions have distinct active jobs. Razor orbitals launch out to cut distant
targets, Aegis turns toward incoming fire and spends rechargeable interceptions,
and the **Wrecking Node** automatically winds up, slings into distant targets,
ricochets and returns on its spring-like tether. The tether cuts enemies caught
across it, successful impacts grow the Node during the run, and sharp movement
charges harder launches. Ballast, Razor Wire and Familiar Guidance each reshape
that attack loop without being required to make the familiar useful.

Nine apex modules complete named multi-trait builds such as **Seeking Storm**, **Event Horizon**, **Recursive Violence**, **Thunder Choir**, and **Guardian Swarm**. The rare **Dead God Circuit** activates the entire apex network at once, with an appropriately unstable annihilation aura.

Five showcase apexes now manifest physically. Seeking Storm grows conductor fins and electrifies guided rounds; Recursive Violence exposes projectile generations; Event Horizon installs a dark gravity core; Thunder Choir synchronizes Ember and Wisp into periodic multi-target discharges; Guardian Swarm forms a defensive network that intercepts ordinary hostile shots while leaving telegraphed boss attacks intact. Every first activation receives a dedicated combat banner, palette and synthesized audio sting.

Level-ups now draw from themed module pools. Most levels offer salvage, every fifth level opens a boss cache, and every seventh level offers companion technology. This gives major milestones a distinct identity and makes build-defining modules feel earned rather than evenly shuffled into every choice.

## Signal Archive

The persistent **Signal Archive** records modules, synergies, bosses, routes and sector events as they are encountered. Undiscovered entries remain redacted, while a searchable module catalog reveals each recovered signal's pool, rarity and effect.

Completed runs earn ship-and-mode completion marks. The Archive also keeps a compact history of recent runs with their final loadouts, decoded synergies, routes and scores, and the end-of-run debrief highlights discoveries made during that attempt.

In Last Stand, every second defeated boss can intercept the run with a **Black Signal** contract. Expedition instead places the signal physically after every sector warden. Accepting its forbidden module requires a permanent sacrifice for the rest of the run—hull, mobility or defenses—while rejecting it leaves the build untouched. Accepted contracts and their costs appear in the final debrief and Archive history.

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
