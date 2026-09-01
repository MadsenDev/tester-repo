const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const BOSS_UNLOCK_TIER = Object.freeze({
  warden: 1,
  harrower: 1,
  prism: 1,
  singularity: 1,
  crown: 2,
  brood: 2,
  mirror: 2,
  architect: 2,
  spine: 2,
  leviathan: 3,
  lastlight: 3,
});

export function createBossDirectorState() {
  return { recent: [], sequence: 0 };
}

export function bossTierForProgress(mode, context = {}) {
  const time = Math.max(0, context.time || 0),
    sector = Math.max(1, context.sector || 1),
    bossCount = Math.max(0, context.bossCount || 0);
  if (mode === "expedition") return sector >= 5 ? 3 : sector >= 3 ? 2 : 1;
  if (mode === "bossrush") return bossCount >= 6 ? 3 : bossCount >= 2 ? 2 : 1;
  if (mode === "endless") return time >= 600 || bossCount >= 8 ? 3 : time >= 240 || bossCount >= 3 ? 2 : 1;
  if (mode === "playground") return 3;
  return time >= 480 ? 3 : time >= 240 ? 2 : 1;
}

export function eligibleBosses(catalog, mode, context = {}) {
  const tier = bossTierForProgress(mode, context),
    eligible = catalog.filter((boss) => (BOSS_UNLOCK_TIER[boss.kind] || 1) <= tier);
  return eligible.length ? eligible : catalog.slice(0, 1);
}

export function selectBoss(catalog, state, context = {}, random = Math.random) {
  if (!catalog?.length) throw new Error("Boss catalog is empty");
  const mode = context.mode || "campaign",
    eligible = eligibleBosses(catalog, mode, context),
    recent = new Set((state?.recent || []).slice(-2)),
    fresh = eligible.filter((boss) => !recent.has(boss.kind)),
    pool = fresh.length ? fresh : eligible,
    index = Math.min(pool.length - 1, Math.floor(clamp(random(), 0, 0.999999) * pool.length)),
    selected = pool[index];
  if (state) {
    state.recent = [...(state.recent || []), selected.kind].slice(-3);
    state.sequence = (state.sequence || 0) + 1;
  }
  return selected;
}

function weaponPressure(player) {
  const weapons = player?.weapons || {};
  return ["missile", "arc", "nova", "mines", "beam"]
    .reduce((sum, id) => sum + Math.max(0, weapons[id] || 0), 0);
}

function companionPressure(player) {
  const companions = player?.companions || {};
  return Object.values(companions).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
}

export function estimateBuildPower(player = {}, telemetry = {}) {
  const damage = Math.max(1, player.damage || 18),
    shots = Math.max(1, player.shots || 1),
    fireRate = Math.max(0.08, player.fireRate || 0.42),
    crit = clamp(player.crit || 0, 0, 1),
    directDps = (damage * shots * (1 + crit * 0.7)) / fireRate,
    baselineDps = 18 / 0.42,
    dpsPressure = clamp(Math.log2(Math.max(1, directDps / baselineDps)) / 4, 0, 1),
    recentDps = Number.isFinite(telemetry.recentDps)
      ? clamp(Math.log2(Math.max(1, telemetry.recentDps / 70)) / 4, 0, 1)
      : dpsPressure,
    weapons = clamp(weaponPressure(player) / 20, 0, 1),
    companions = clamp(companionPressure(player) / 8, 0, 1),
    modules = clamp((player.items?.size || player.items?.length || 0) / 22, 0, 1),
    durability = clamp(
      ((player.maxHp || 100) / 220 + (player.armor || 0) * 0.9 + Math.min(1, (player.regen || 0) / 10)) / 2.2,
      0,
      1,
    );
  return clamp(
    recentDps * 0.42 + dpsPressure * 0.2 + weapons * 0.14 + companions * 0.08 + modules * 0.1 + durability * 0.06,
    0,
    1,
  );
}

export function adaptiveBossTuning(player, telemetry = {}, context = {}) {
  const power = estimateBuildPower(player, telemetry),
    depth = clamp(
      context.mode === "expedition"
        ? ((context.sector || 1) - 1) / 4
        : (context.bossCount || Math.floor((context.time || 0) / 60)) / 10,
      0,
      1,
    ),
    pressure = clamp(power * 0.82 + depth * 0.18, 0, 1);
  return Object.freeze({
    power,
    pressure,
    hp: 1 + pressure * 0.72,
    tempo: 1 + pressure * 0.16,
    projectileSpeed: 1 + pressure * 0.07,
    projectileDamage: 1 + pressure * 0.025,
    phaseThresholdBonus: pressure * 0.12,
  });
}

export function applyAdaptiveBossScaling(boss, player, telemetry = {}, context = {}) {
  if (!boss) return boss;
  const adaptive = adaptiveBossTuning(player, telemetry, context),
    oldMax = Math.max(1, boss.hpMax || boss.hp || 1),
    ratio = clamp((boss.hp || oldMax) / oldMax, 0, 1),
    newMax = oldMax * adaptive.hp;
  boss.hpMax = newMax;
  boss.hp = newMax * ratio;
  boss.bossAdaptive = adaptive;
  if (boss.bossTuning) {
    boss.bossTuning = {
      ...boss.bossTuning,
      tempo: boss.bossTuning.tempo * adaptive.tempo,
      projectileSpeed: boss.bossTuning.projectileSpeed * adaptive.projectileSpeed,
      projectileDamage: boss.bossTuning.projectileDamage * adaptive.projectileDamage,
      phaseThreshold: clamp(
        boss.bossTuning.phaseThreshold + adaptive.phaseThresholdBonus,
        0.25,
        0.78,
      ),
    };
  }
  return boss;
}
