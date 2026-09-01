import { BOSSES, spawnBoss } from "./bosses.js";
import {
  applyAdaptiveBossScaling,
  createBossDirectorState,
  selectBoss,
} from "./boss-director.js";

const WINDOW_SECONDS = 8;

export function createBossRuntime() {
  return {
    director: createBossDirectorState(),
    damage: [],
    totalBosses: 0,
  };
}

export function recordPlayerDamage(runtime, amount, nowSeconds) {
  if (!runtime || !Number.isFinite(amount) || amount <= 0) return;
  const now = Number.isFinite(nowSeconds) ? nowSeconds : 0;
  runtime.damage.push({ at: now, amount });
  const cutoff = now - WINDOW_SECONDS;
  while (runtime.damage.length && runtime.damage[0].at < cutoff)
    runtime.damage.shift();
}

export function recentPlayerDps(runtime, nowSeconds) {
  if (!runtime?.damage?.length) return 0;
  const now = Number.isFinite(nowSeconds) ? nowSeconds : 0,
    cutoff = now - WINDOW_SECONDS,
    samples = runtime.damage.filter((sample) => sample.at >= cutoff),
    total = samples.reduce((sum, sample) => sum + sample.amount, 0),
    oldest = samples[0]?.at ?? now,
    span = Math.max(1, Math.min(WINDOW_SECONDS, now - oldest));
  return total / span;
}

function syntheticBossTime(kind, progressionTime) {
  const index = Math.max(0, BOSSES.findIndex((boss) => boss.kind === kind));
  // spawnBoss still owns construction/legacy durability. Preserve progression scale
  // while selecting the requested catalog entry by moving within catalog cycles.
  const cycle = Math.max(0, Math.floor(Math.max(0, progressionTime - 1) / (BOSSES.length * 60)));
  return cycle * BOSSES.length * 60 + (index + 1) * 60;
}

export function spawnDirectedBoss(runtime, {
  w,
  h,
  time = 60,
  difficulty = "normal",
  mode = "campaign",
  sector = 1,
  bossCount = 0,
  player,
  random = Math.random,
} = {}) {
  if (!runtime) throw new Error("Boss runtime is required");
  const context = { mode, time, sector, bossCount },
    selected = selectBoss(BOSSES, runtime.director, context, random),
    boss = spawnBoss(w, h, syntheticBossTime(selected.kind, time), difficulty),
    telemetry = { recentDps: recentPlayerDps(runtime, time) };
  runtime.totalBosses += 1;
  boss.directorKind = selected.kind;
  boss.directorSequence = runtime.director.sequence;
  return applyAdaptiveBossScaling(boss, player, telemetry, context);
}
