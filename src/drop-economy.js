export const DROP_PROFILES = Object.freeze({
  chill: Object.freeze({
    regularChance: 0.075,
    eliteChance: 0.34,
    bossChance: 1,
    lowHealthBonus: 0.075,
    repairWeight: 0.56,
    repairBias: 0.28,
    pulseWeight: 0.18,
    pityKills: 75,
    repairFlat: 34,
    repairHull: 0.1,
    life: 20,
    attractionRadius: 270,
    attractionSpeed: 250,
  }),
  normal: Object.freeze({
    regularChance: 0.058,
    eliteChance: 0.26,
    bossChance: 1,
    lowHealthBonus: 0.055,
    repairWeight: 0.44,
    repairBias: 0.26,
    pulseWeight: 0.24,
    pityKills: 120,
    repairFlat: 28,
    repairHull: 0.08,
    life: 17,
    attractionRadius: 210,
    attractionSpeed: 210,
  }),
  intense: Object.freeze({
    regularChance: 0.034,
    eliteChance: 0.17,
    bossChance: 1,
    lowHealthBonus: 0.025,
    repairWeight: 0.28,
    repairBias: 0.18,
    pulseWeight: 0.28,
    pityKills: 220,
    repairFlat: 22,
    repairHull: 0.05,
    life: 13,
    attractionRadius: 135,
    attractionSpeed: 165,
  }),
});

export function dropProfile(id = "normal") {
  return DROP_PROFILES[id] || DROP_PROFILES.normal;
}

export function rollPowerupDrop(
  enemy,
  difficulty,
  player,
  killsSinceRepair,
  random = Math.random,
) {
  const profile = dropProfile(difficulty),
    healthRatio = Math.max(0, Math.min(1, player.hp / player.maxHp)),
    missingHealth = 1 - healthRatio,
    pityRepair = killsSinceRepair >= profile.pityKills,
    woundedBossKill = enemy.boss && healthRatio < 0.62,
    chance =
      (enemy.boss
        ? profile.bossChance
        : enemy.elite
          ? profile.eliteChance
          : profile.regularChance) +
      missingHealth * profile.lowHealthBonus;

  if (!pityRepair && random() >= Math.min(1, chance)) return null;

  let kind = "repair";
  if (!pityRepair && !woundedBossKill) {
    const repairWeight =
        profile.repairWeight + missingHealth * profile.repairBias,
      pulseWeight = profile.pulseWeight,
      roll = random();
    kind =
      roll < repairWeight
        ? "repair"
        : roll < repairWeight + pulseWeight
          ? "pulse"
          : "overdrive";
  }

  return {
    kind,
    life: profile.life,
    value:
      kind === "repair"
        ? Math.round(profile.repairFlat + player.maxHp * profile.repairHull)
        : 0,
    attractionRadius: profile.attractionRadius,
    attractionSpeed: profile.attractionSpeed,
  };
}

export function attractPowerup(powerup, player, dt) {
  const dx = player.x - powerup.x,
    dy = player.y - powerup.y,
    distance = Math.max(1, Math.hypot(dx, dy));
  if (distance > powerup.attractionRadius) return;
  const strength = 0.45 + 0.55 * (1 - distance / powerup.attractionRadius),
    step = Math.min(distance, powerup.attractionSpeed * strength * dt);
  powerup.x += (dx / distance) * step;
  powerup.y += (dy / distance) * step;
}
