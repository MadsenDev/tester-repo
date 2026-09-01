# Adaptive boss performance

The boss director uses two different signals. Build telemetry estimates what the player should be capable of, while boss-performance telemetry records what actually happened in recent boss fights.

## Why both signals exist

Paper DPS and rolling enemy damage are useful, but they can miss multiplicative interactions, burst windows, companion effects, manifestations, and builds that only become exceptional against one large target. A boss that disappears in a couple of seconds is stronger evidence than another estimate of the build.

## Time-to-kill feedback

Each directed boss records its run time when spawned. Defeat telemetry compares the actual time-to-kill against an 18-second target encounter length.

Fast kills add bounded `bossPressure`. A roughly two-second kill produces a large adjustment. Pressure carries forward inside the current run and decays between results, so consecutive boss melts compound rather than being forgotten immediately.

Slow kills reduce accumulated pressure. The director should never respond to a player who is already struggling by making the next encounter even more durable.

The history resets with the normal per-run boss runtime.

## What performance pressure changes

Performance pressure deliberately favors survivability over retaliation:

- boss HP receives the largest additional multiplier, up to 1.95x on top of the existing bounded build/depth adaptation;
- attack tempo receives a small increase;
- projectile speed receives a very small increase;
- projectile damage does not receive an additional performance multiplier;
- phase thresholds can move somewhat earlier but remain capped.

This is intentionally asymmetric. The system is meant to stop later bosses from evaporating before their encounter can happen, not to make the player's health bar scale inversely with their success.

## Power fantasy ceiling

This is adaptive resistance, not level matching. Pressure is capped, it eases after difficult fights, and sufficiently extreme builds can still overwhelm bosses. The target is for the director to notice obvious under-tuning within a run while preserving the reward of assembling a genuinely absurd build.
