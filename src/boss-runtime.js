import { BOSSES, spawnBoss } from "./bosses.js";
import { applyBossDifficulty } from "./boss-difficulty.js";
import {
  applyAdaptiveBossScaling,
  createBossDirectorState,
  selectBoss,
} from "./boss-director.js";

const WINDOW_SECONDS = 8;
const EXPECTED_BOSS_TTK = 18;
const THE_SPINE = Object.freeze({
  kind: "spine",
  name: "THE SPINE",
  color: "#ff7f9d",
  r: 44,
  s: 30,
  hp: 1680,
  d: 34,
});
export const DIRECTED_BOSSES = Object.freeze([...BOSSES, THE_SPINE]);

export function createBossRuntime() {
  return {
    director: createBossDirectorState(),
    damage: [],
    totalBosses: 0,
    bossPressure: 0,
    bossResults: [],
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

export function captureEnemyHealth(enemies = []) {
  return new Map(
    enemies
      .filter((enemy) => enemy && Number.isFinite(enemy.hp) && enemy.hp > 0)
      .map((enemy) => [enemy, enemy.hp]),
  );
}

export function recordEnemyHealthDelta(runtime, snapshot, nowSeconds) {
  if (!runtime || !(snapshot instanceof Map)) return 0;
  let dealt = 0;
  for (const [enemy, before] of snapshot) {
    if (!Number.isFinite(before) || !Number.isFinite(enemy?.hp)) continue;
    dealt += Math.max(0, before - Math.max(0, enemy.hp));
  }
  recordPlayerDamage(runtime, dealt, nowSeconds);
  return dealt;
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

export function recordBossDefeat(runtime, boss, nowSeconds) {
  if (!runtime || !boss?.boss) return null;
  const now = Number.isFinite(nowSeconds) ? nowSeconds : 0,
    spawnedAt = Number.isFinite(boss.directorSpawnedAt) ? boss.directorSpawnedAt : now,
    ttk = Math.max(0.1, now - spawnedAt),
    ratio = EXPECTED_BOSS_TTK / ttk,
    fastKill = Math.max(0, Math.min(1, (ratio - 1) / 4)),
    slowKill = Math.max(0, Math.min(1, (1 - ratio) / 0.65));
  runtime.bossPressure = Math.max(
    0,
    Math.min(1, runtime.bossPressure * 0.72 + fastKill * 0.5 - slowKill * 0.18),
  );
  const result = {
    kind: boss.directorKind || boss.kind,
    ttk,
    fastKill,
    pressure: runtime.bossPressure,
  };
  runtime.bossResults.push(result);
  if (runtime.bossResults.length > 6) runtime.bossResults.shift();
  return result;
}

function syntheticBossTime(kind, progressionTime) {
  const index = Math.max(0, BOSSES.findIndex((boss) => boss.kind === kind));
  const cycle = Math.max(
    0,
    Math.floor(Math.max(0, progressionTime - 1) / (BOSSES.length * 60)),
  );
  return cycle * BOSSES.length * 60 + (index + 1) * 60;
}

function edgeSpawn(w, h, random) {
  const side = Math.floor(random() * 4),
    margin = 80;
  if (side === 0) return { x: random() * w, y: -margin };
  if (side === 1) return { x: w + margin, y: random() * h };
  if (side === 2) return { x: random() * w, y: h + margin };
  return { x: -margin, y: random() * h };
}

function spawnSpine(w, h, time, difficulty, random) {
  const minute = Math.max(1, Math.floor(time / 60)),
    scale = 1 + Math.min(1.35, (minute - 1) * 0.13),
    hp = THE_SPINE.hp * scale,
    pos = edgeSpawn(w, h, random);
  return applyBossDifficulty(
    {
      ...pos,
      px: pos.x,
      py: pos.y,
      ...THE_SPINE,
      hp,
      hpMax: hp,
      boss: true,
      bossName: THE_SPINE.name,
      bossOrder: DIRECTED_BOSSES.length,
      behavior: "boss",
      v: 320 + minute * 28,
      flash: 0,
      phase: random() * 6.28,
      shootCd: 0.55,
      chargeCd: 1.7,
      telegraph: 0,
      dashTime: 0,
      dashVx: 0,
      dashVy: 0,
      elite: false,
      bossPhase: 1,
      phaseFlash: 0,
      blastCd: 2.6,
      blastZones: [],
      arenaW: w,
      arenaH: h,
      sideWarnings: [],
      sideVolleyCd: 1.1,
      railCd: 2.8,
      sideFlip: random() < 0.5 ? -1 : 1,
      summonCd: 2.4,
      summonBurst: 0,
      phaseGate: 0,
      positionTests: [],
      positionTestCd: 3.6,
      positionTestFlip: false,
      spineSegments: 5,
      spineBroken: 0,
      baseSpineSpeed: THE_SPINE.s,
      spineBreakFlash: 0,
    },
    difficulty,
  );
}

export function spawnDirectedBoss(
  runtime,
  {
    w,
    h,
    time = 60,
    difficulty = "normal",
    mode = "campaign",
    sector = 1,
    bossCount = 0,
    player,
    random = Math.random,
  } = {},
) {
  if (!runtime) throw new Error("Boss runtime is required");
  const context = { mode, time, sector, bossCount },
    selected = selectBoss(DIRECTED_BOSSES, runtime.director, context, random),
    boss = selected.kind === "spine"
      ? spawnSpine(w, h, time, difficulty, random)
      : spawnBoss(w, h, syntheticBossTime(selected.kind, time), difficulty),
    telemetry = {
      recentDps: recentPlayerDps(runtime, time),
      bossPressure: runtime.bossPressure,
    };
  runtime.totalBosses += 1;
  boss.directorKind = selected.kind;
  boss.directorSequence = runtime.director.sequence;
  boss.directorSpawnedAt = time;
  return applyAdaptiveBossScaling(boss, player, telemetry, context);
}
