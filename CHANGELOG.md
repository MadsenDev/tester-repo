# Changelog

This project uses [Semantic Versioning](https://semver.org/).

## [0.42.1] - 2026-09-01

- Move Expedition room-entry spawn points safely inside the arena so north, south and side transitions cannot immediately collide with their return exits.
- Add four-direction regression coverage and advance the PWA cache version.

## [0.42.0] - 2026-09-01

- Replace Expedition's linear choice chain with connected, controlled-randomized sector maps.
- Guarantee every sector has a reachable distant boss, core utility rooms, an elite encounter, optional branches and a hidden Null Chamber.
- Add cardinal arena-edge exits, understated special-room labels and a compact discovered-room minimap.
- Support full backtracking with persistent room clears, purchases and uncollected module pedestals.
- Move Black Signals into optional rooms unlocked beside defeated wardens while leaving the descent available.
- Advance the PWA version and game cache key so installed copies receive the map update.

## [0.41.0] - 2026-09-01

- Add Expedition as the new primary room-based mode while preserving the original ten-minute game as Last Stand.
- Add five sectors of finite combat waves, elite rooms, Module Vaults, Forked Signals, Scrap Exchanges, Quiet Docks and sector bosses.
- Replace Expedition reward overlays with physical module pedestals and fly-in arena doors.
- Add optional hidden Null Chambers, scrap currency, shops and persistent room-route records.
- Place exactly one relic after every Expedition boss and move Black Signal bargains into the arena.
- Give Rusted Key, Lucky Bolt, Second Opinion and Warm Seat room-economy effects.
- Record Expedition rooms, secrets and remaining scrap in the final debrief and Archive.
- Add Expedition rendering and logic to the complete offline PWA shell.

## [0.40.0] - 2026-09-01

- Keep Black Signal modules out of ordinary Salvage, Companion and Boss Relic transmissions.
- Require two accepted Black Signal contracts before Dead God Circuit becomes eligible and make its selection exceptionally rare.
- Reduce the expected completed-campaign Dead God Circuit offer rate from roughly one in two runs to about six percent.
- Advance the PWA cache version for the new module economy.

## [0.39.2] - 2026-09-01

- Restore the original spinning hexagon around the player ship as an in-combat force shield.
- Let armor strengthen the field and incoming hits briefly expand, brighten and fill it.
- Keep the authored chassis visible inside the shield and advance the PWA cache version.

## [0.39.1] - 2026-09-01

- Restore a rotating hexagonal force shield behind the active chassis on the flight deck.
- Intensify the shield while the chassis selector is focused or pressed and respect reduced-motion preferences.
- Advance the PWA cache version so installed clients receive the restored animation.

## [0.39.0] - 2026-09-01

- Rebuild the mobile flight deck around one active-chassis hero, a compact mission and threat configuration block, and a first-viewport launch action.
- Reduce the primary navigation from six cramped destinations to five focused tabs.
- Add a More directory for records, the build playground, device settings, offline status and the installed version.
- Make the current chassis card open the hangar and ensure every launch reads the latest saved ship, mode and difficulty.
- Improve keyboard focus, active-navigation semantics, touch targets and small-screen menu readability.

## [0.38.1] - 2026-09-01

- Rotate every chassis around an authored center-of-mass pivot instead of its visual bounding-box center.
- Mark the stable collision coordinate with a subtle combat core and align manifestation hull details to it.
- Advance the PWA cache version so installed clients receive the pivot renderer.

## [0.38.0] - 2026-09-01

- Expand the playable roster from four to eight chassis with Wraith, Lancer, Relay and Halo.
- Give every chassis an authored silhouette, accent pattern, canopy and engine layout shared by the hangar and combat renderer.
- Make the active ship steer smoothly toward its movement direction and retain its heading while stationary.
- Add distinct hitbox sizes and starting combat profiles, including piercing, twin-shot and orbital-carrier builds.
- Surface each ship's role and headline stats directly in the hangar.

## [0.37.0] - 2026-09-01

- Expand the module catalog from 150 to 160 entries and the authored special set from 50 to 60.
- Add Constellation Engine, Reversal Chamber, Aegis Reservoir, Orbit Loom and Broadside Protocol.
- Add Grave Echo, Split Horizon, Devouring Moon, Pulse Heart and Execution Mark.
- Introduce shared arena-module lifecycle and rendering systems for persistent geometry, captured fire and temporary allies.
- Preserve combat readability with gold/white constructed effects and distinct friendly projectile palettes.

## [0.36.2] - 2026-09-01

- Fix the combat HUD reporting zero modules for the Set-backed live loadout.
- Preserve compatibility with legacy array-backed loadout summaries.

## [0.36.1] - 2026-09-01

- Rebuild the Wrecking Node around automatic targeted slings, ricochets, and returns.
- Make its tether damage enemies from level one and cut projectiles when reinforced.
- Let movement and sharp turns charge stronger launches without making movement mandatory.
- Grow the Node from successful impacts rather than requiring killing blows.
- Add impact shockwaves and clearer charge, sling, tether, and collision feedback.

## [0.36.0] - 2026-09-01

- Add the momentum-driven Wrecking Node familiar.
- Make Razor orbitals launch at distant targets and return.
- Turn Aegis into a threat-facing projectile interceptor with rechargeable charges.
- Let Ballast and Razor Wire influence Wrecking Node impact behavior.
- Extend Dead God Circuit to activate the new familiar.

## [0.35.0] - 2026-08-31

- Add installable PWA metadata and an offline application shell.
- Add atomic, versioned service-worker caches.
- Prompt players before activating a downloaded update.
- Display the running version on the title screen.
- Fix the fresh-run arsenal HUD crash and force stale v34 clients onto the corrected release.
