export const BOSS_DIFFICULTY = Object.freeze({
  chill: Object.freeze({
    clearArena: true,
    regularsDuringBoss: false,
    hp: 0.82,
    contactDamage: 0.8,
    movement: 0.88,
    tempo: 0.76,
    projectileSpeed: 0.86,
    projectileDamage: 0.78,
    phaseThreshold: 0.32,
    aimLead: 0,
  }),
  normal: Object.freeze({
    clearArena: true,
    regularsDuringBoss: false,
    hp: 1.16,
    contactDamage: 1.08,
    movement: 1.08,
    tempo: 1.12,
    projectileSpeed: 1.08,
    projectileDamage: 1.06,
    phaseThreshold: 0.56,
    aimLead: 0.18,
  }),
  intense: Object.freeze({
    clearArena: false,
    regularsDuringBoss: true,
    hp: 1.3,
    contactDamage: 1.18,
    movement: 1.18,
    tempo: 1.25,
    projectileSpeed: 1.15,
    projectileDamage: 1.16,
    phaseThreshold: 0.68,
    aimLead: 0.32,
  }),
});

export function bossDifficulty(id = "normal") {
  return BOSS_DIFFICULTY[id] || BOSS_DIFFICULTY.normal;
}

export function regularEnemiesAllowed(id, bossAlive) {
  return !bossAlive || bossDifficulty(id).regularsDuringBoss;
}

export function prepareBossArena(enemies, enemyBullets, id) {
  if (!bossDifficulty(id).clearArena) return { enemies, enemyBullets };
  return {
    enemies: enemies.filter((enemy) => enemy.boss),
    enemyBullets: [],
  };
}

export function applyBossDifficulty(boss, id = "normal") {
  const tuning = bossDifficulty(id);
  boss.hp *= tuning.hp;
  boss.hpMax = boss.hp;
  boss.d *= tuning.contactDamage;
  boss.s *= tuning.movement;
  boss.bossDifficulty = id;
  boss.bossTuning = tuning;
  return boss;
}

export function predictiveTarget(player, tuning, arenaW, arenaH) {
  const lead = tuning.aimLead || 0;
  return {
    x: Math.max(20, Math.min(arenaW - 20, player.x + (player.vx || 0) * lead)),
    y: Math.max(20, Math.min(arenaH - 20, player.y + (player.vy || 0) * lead)),
  };
}

export function tuneBossProjectiles(projectiles, startIndex, tuning) {
  for (let i = startIndex; i < projectiles.length; i++) {
    const projectile = projectiles[i];
    projectile.vx *= tuning.projectileSpeed;
    projectile.vy *= tuning.projectileSpeed;
    projectile.damage *= tuning.projectileDamage;
  }
}
