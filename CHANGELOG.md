# Changelog

This project uses [Semantic Versioning](https://semver.org/).

## [0.44.3] - 2026-09-02

- Split the browser bootstrap, frame runtime, Expedition room lifecycle, menu/HUD controller, enemy renderer and boss arena attacks into focused modules.
- Keep gameplay formulas and encounter behavior unchanged while bringing every runtime JavaScript file below the 600-line maintenance ceiling.
- Add automated source-size checks with warnings above 400 lines and CI failures above 600 lines.
- Strengthen Expedition layout validation with connectivity, reciprocal-link, critical-path, required-room, secret and Black Signal invariants.
- Reformat the compressed stylesheets for reviewable diffs and advance the offline application version and game cache key.

## [0.44.1] - 2026-09-02

- Rework Expedition generation around explicit critical-path and optional-branch topology rules.
- Make the boss the deepest terminal room and prohibit shops, Module Vaults, Forked Signals, Rest Bays and Elite Intercepts from gating progression.
- Keep shops, module rooms and choice rooms terminal while preserving a guaranteed optional Elite Intercept branch.
- Replace the guaranteed Quiet Dock with a rare 12% Rest Bay recovery opportunity that may not appear for several runs.
- Validate generated layouts at runtime and add seeded regression coverage for special-room placement.
- Document the Expedition placement contract in `docs/expedition-layout.md`.

## [0.44.0] - 2026-09-01

- Add The Spine, a new tier-two segmented boss shared by Expedition, Last Stand, Endless and Boss Rush.
- Give The Spine five visible armor plates that absorb damage, break across health bands and expose an increasingly aggressive core.
- Keep segmentation compatible with overpowered builds by avoiding scripted invulnerability stops.
- Expand the shared boss roster and document the segmented-encounter design direction.

## [0.43.8] - 2026-09-01

- Route Expedition, Last Stand, Endless and Boss Rush boss spawns through the shared controlled-random boss director.
- Reset director history and adaptive telemetry cleanly for every new run.
- Measure effective enemy health lost each frame so boss scaling reacts to actual recent damage from the complete player build rather than only paper stats.
- Apply bounded adaptive boss HP, tempo, projectile speed and phase pressure at the live spawn sites while preserving the ceiling that lets earned god builds remain overpowered.

## [0.43.7] - 2026-09-01

- Raise Normal and Intense boss baseline pressure so existing encounters survive longer and reach their dangerous phases more reliably.
- Add a shared, mode-agnostic boss director foundation for controlled-random depth pools across Expedition, Last Stand, Endless and Boss Rush.
- Add bounded build-pressure estimation for future adaptive boss HP, tempo, projectile speed and phase timing without scaling enemy damage aggressively.
- Document the 18–20 boss roster target, encounter archetypes, phase philosophy and rollout plan in `docs/boss-system.md`.

## [0.43.6] - 2026-09-01

- Fix Execution Mark losing its target lifecycle across Endless boss roster swaps.
- Add a manual Check for updates action to Settings with live checking, downloading, ready, offline and up-to-date states.
- Keep the existing automatic service-worker update checks and update prompt.

## [0.43.5] - 2026-09-01

- Add a short Expedition room-entry pickup lock so freshly entered reward rooms cannot immediately collect a module.
- Require the player to move off any pedestal overlapped during the lock before it becomes collectible again.
- Rearm the pickup gate when backtracking into rooms with uncollected rewards.

## [0.43.4] - 2026-09-01

- Replace Expedition reward cards with compact centered module icons and names.
- Move module descriptions into a short non-pausing pickup notification shown after collection.
- Keep shop prices and Black Signal costs visible without restoring the oversized reward frames.

## [0.43.3] - 2026-09-01

- Replace tall mobile reward columns with a compact centered pedestal cluster.
- Shrink physical pickup radii so entering a reward room cannot accidentally select a module.
- Keep module cards readable at the smaller scale and add centered-layout regression coverage.

## [0.43.2] - 2026-09-01

- Move mobile Expedition reward pedestals away from cardinal entry spawn points.
- Add entry-clearance regression coverage for north, east, south and west transitions.

## [0.43.1] - 2026-09-01

- Move south-edge Expedition labels farther into the arena so the mobile loadout bar cannot cover them.
- Add restrained backing plates to all labeled exits for consistent readability over room geometry.
- Add label safe-area regression coverage and advance the PWA cache version.

## [0.43.0] - 2026-09-01

- Add six controlled Expedition encounter layouts with sector-based unlocks and anti-repeat selection.
- Give Shield Line, Gravity Knot, Crossfire, Relay Web and Breach Field distinct geometry, hazards and combat rules.
- Add Anchor, Relay and Burrower enemies with radial suppression, damage-sharing links and telegraphed submerged attacks.
- Turn Bulwarks into support enemies that visibly protect nearby hostiles instead of acting as oversized chasers.
- Give each specialized room a signature enemy while keeping the rest of its wave sector-appropriate.
- Add mobile rendering and behavior coverage for every encounter, support interaction and new enemy role.
- Advance the offline PWA manifest and version so installed copies receive the encounter system.

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
