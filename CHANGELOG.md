# Changelog

This project uses [Semantic Versioning](https://semver.org/).

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
