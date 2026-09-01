# Boss system direction

Bosses should feel like encounters, not inflated enemies. The long-term target is an Isaac-inspired pool of roughly 18–20 bosses with strong mechanical identities, controlled-random selection and enough overlap between modes that no mode becomes the place where the same scripted sequence goes to die.

## Design goals

- Boss variation applies to Expedition, Last Stand, Endless and Boss Rush. Playground may expose the full pool for testing.
- Runs should not follow a fixed boss order. Selection is controlled-random, depth-aware and anti-repeat.
- Expedition uses sector depth to gate boss pools, but it does not own the variation system. The same director selects bosses for survival modes and Boss Rush.
- A strong build should make bosses harder to trivialize, but a truly broken build must still be allowed to break them.
- Adaptive difficulty should react mostly to effective offensive power and recent DPS, not simply module count.
- Scaling must be bounded. Bosses are not allowed to become stat mirrors that erase the player's progression.
- Boss difficulty should come increasingly from attack structure, phase changes and positioning demands rather than raw contact/projectile damage.

## Shared boss director

`src/boss-director.js` is the common selection and scaling layer. It is deliberately mode-agnostic. Modes supply progression context such as sector, elapsed time and number of bosses defeated.

The director assigns an encounter tier, builds an eligible pool and avoids recently used bosses. This gives Expedition sector pools, Last Stand/Endless time-based pools and Boss Rush escalation without maintaining four unrelated boss schedulers.

`src/boss-runtime.js` owns per-run director state and rolling combat telemetry. `spawnDirectedBoss()` is the integration boundary for every real mode: it selects a catalog entry, delegates construction to the existing boss factory, then applies bounded adaptive tuning. This keeps selection policy out of the already-large attack loop and gives all modes the same machinery.

The first implementation uses three broad tiers. This is intentionally coarse while the roster is still only ten bosses. Once the roster grows, pools can become authored per-sector/per-depth groups with overlap rather than rigid tiers.

## Adaptive build pressure

Boss scaling considers:

- direct weapon DPS: damage, shots, crit and fire rate
- recent measured effective DPS
- secondary weapon investment
- companion count
- module count
- survivability, as a small factor only
- run depth

The runtime keeps an eight-second rolling damage window. Damage older than the window is discarded, so one ancient burst does not convince the director that the player is still producing absurd damage several rooms later. Effective DPS is deliberately weighted more heavily than static build score.

The current director caps adaptive scaling at approximately:

- +72% boss HP
- +16% attack tempo
- +7% projectile speed
- +2.5% projectile damage
- +12 percentage points on the phase-transition threshold

Those ceilings are deliberate. A god build should still be able to delete a boss. The purpose is to buy the encounter enough time to express itself, not punish the player for succeeding.

## Boss roster expansion

The roster target is roughly 18–20. New bosses should add encounter shapes that the current ten do not cover well.

### Priority archetypes

1. **Segmented / break-apart boss**
   - several linked sections with independent health or armor
   - losing sections changes movement and attacks
   - high burst damage can deliberately skip portions of the encounter

2. **Paired boss**
   - two distinct bodies with complementary patterns
   - behavior changes when one dies
   - avoids the lazy version where both are just clones with half HP

3. **Burrow / ambush boss**
   - disappears from direct fire and telegraphs re-entry lanes
   - leaves hazards or vulnerable anchors while hidden
   - rewards reading the arena rather than holding fire toward the nearest target

4. **Splitting boss**
   - begins as one target and divides at phase thresholds
   - children inherit different attack roles
   - killing one alters the survivor instead of simply reducing object count

5. **Weak-point boss**
   - mostly protected body with rotating or exposed vulnerable nodes
   - damage windows are readable and short, not arbitrary invulnerability
   - piercing and homing builds should interact with it differently

6. **Arena-control boss**
   - constructs walls, safe lanes, moving barriers or temporary zones
   - forces route planning without filling the screen with unreadable bullets

7. **Predator boss**
   - aggressive pursuit, feints and lunges
   - minimal bullet spam
   - tests movement builds and close-range composure

8. **Parasite / possession boss**
   - temporarily empowers existing enemies, hazards or summons
   - creates priority decisions instead of only adding bodies

## Phases

Two phases remain useful for simple bosses, but later bosses should support three-stage behavior or conditional desperation states.

A third phase should not mean "same attack, faster." Better transitions include:

- destroying or exposing parts of the boss
- changing arena geometry
- swapping movement model
- introducing a new targetable object
- combining two earlier patterns in a readable way
- changing which parts of the player's build are advantageous

Phase gates should stay short and telegraphed. Long invulnerability sequences undermine the entire overpowered-build fantasy.

## Mode behavior

### Expedition

Each sector draws from an overlapping pool appropriate to its depth. Controlled randomness prevents repeats and makes boss rooms uncertain. Final sectors can include upgraded early bosses as rare variants once variants exist.

### Last Stand

Minute bosses use progressively deeper pools instead of fixed minute-to-boss mapping. A ten-minute run should see a representative subset, not the whole roster in order.

### Endless

Pool depth continues beyond the campaign threshold. Later encounters may use stronger variants and higher adaptive ceilings only if testing proves the base cap too forgiving. Endless should not silently become infinite stat scaling.

### Boss Rush

Boss Rush should have the widest encounter variety. Early picks remain approachable, then the director quickly opens the full roster. Immediate repeats are forbidden and recent bosses are strongly deprioritized.

## Implementation sequence

1. Shared boss director, depth pools and bounded build-pressure model. **Done.**
2. Add the shared per-run runtime and rolling effective-DPS telemetry. **Done.**
3. Route all four real mode spawn sites through `spawnDirectedBoss()` and feed actual player damage into the runtime.
4. Expand the roster in small groups, starting with segmented, paired and burrow archetypes.
5. Add authored third phases/desperation states to selected existing bosses.
6. Add boss variants only after base encounters are distinct enough to justify them.
7. Rebalance pools and adaptive ceilings using real run data and mobile playtests.

The important rule is simple: variation must come from different problems to solve, not from recoloring the same bullet fountain and adding another zero to its health bar.
