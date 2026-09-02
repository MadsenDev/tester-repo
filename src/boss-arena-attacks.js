import { particle, spawnEnemyProjectile } from "./entities.js";
import { bossDifficulty } from "./boss-difficulty.js";

export function updateBlastZones(boss, dt, enemyBullets, particles, onShake) {
  for (const zone of boss.blastZones) {
    zone.warn -= dt;
    if (zone.warn <= 0 && !zone.detonated) {
      zone.detonated = true;
      zone.life = 0.28;
      enemyBullets.push({
        ...spawnEnemyProjectile(
          zone.x,
          zone.y,
          0,
          0,
          zone.damage,
          zone.r,
          0.14,
        ),
        kind: "blast",
      });
      for (let i = 0; i < 18; i++)
        particles.push(particle(zone.x, zone.y, "boss"));
      onShake(7);
    }
    if (zone.detonated) zone.life -= dt;
  }
  boss.blastZones = boss.blastZones.filter(
    (zone) => !zone.detonated || zone.life > 0,
  );
}

export function queueBlastZones(boss, player, rage) {
  const count = rage ? 3 : 2;
  const base = Math.atan2(player.y - boss.y, player.x - boss.x);
  const lead = rage ? 62 : 48;
  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) / 2) * (rage ? 1.0 : 1.2);
    const distance = i === 0 ? 0 : lead;
    boss.blastZones.push({
      x: player.x + Math.cos(base + spread) * distance,
      y: player.y + Math.sin(base + spread) * distance,
      r: rage ? 58 : 52,
      warn: rage ? 1.0 : 1.2,
      life: 0,
      detonated: false,
      damage: rage ? 26 : 22,
    });
  }
}

export function queueRail(boss, player, rage) {
  const count = rage ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? boss.sideFlip : -boss.sideFlip;
    const offset = count === 1 ? 0 : i === 0 ? -46 : 46;
    const y = Math.max(120, Math.min(boss.arenaH - 36, player.y + offset));
    boss.sideWarnings.push({
      side,
      y,
      warn: rage ? 0.68 : 0.86,
      fired: false,
    });
  }
  boss.sideFlip *= -1;
}

export function updateRails(boss, dt, enemyBullets, onShake) {
  for (const warning of boss.sideWarnings) {
    warning.warn -= dt;
    if (warning.warn <= 0 && !warning.fired) {
      warning.fired = true;
      const fromLeft = warning.side < 0;
      const x = fromLeft ? -34 : boss.arenaW + 34;
      const angle = fromLeft ? 0 : Math.PI;
      enemyBullets.push({
        ...spawnEnemyProjectile(
          x,
          warning.y,
          angle,
          boss.bossPhase === 2 ? 760 : 680,
          boss.bossPhase === 2 ? 25 : 21,
          10,
          2.2,
        ),
        kind: "rail",
        side: warning.side,
      });
      onShake(6);
    }
  }
  boss.sideWarnings = boss.sideWarnings.filter((warning) => !warning.fired);
}

export function fireSideVolley(boss, player, enemyBullets, rage) {
  const fromLeft = boss.sideFlip < 0;
  const x = fromLeft ? -28 : boss.arenaW + 28;
  const direction = fromLeft ? 1 : -1;
  const count = rage ? 4 : 3;
  for (let i = 0; i < count; i++) {
    const y = Math.max(
      120,
      Math.min(boss.arenaH - 30, player.y + (i - (count - 1) / 2) * 58),
    );
    const bullet = spawnEnemyProjectile(
      x,
      y,
      fromLeft ? 0 : Math.PI,
      rage ? 235 : 195,
      rage ? 14 : 12,
      6,
      4,
    );
    enemyBullets.push({
      ...bullet,
      kind: "sidebolt",
      vx: Math.abs(bullet.vx) * direction,
    });
  }
  boss.sideFlip *= -1;
}

export function publishBossArena(boss) {
  const tuning = boss.bossTuning || bossDifficulty(boss.bossDifficulty);
  globalThis.__orbitalBossArena = {
    at: performance.now(),
    suppressRegulars: !tuning.regularsDuringBoss,
    summoner: tuning.regularsDuringBoss && boss.kind === "brood",
    burst:
      tuning.regularsDuringBoss &&
      boss.kind === "brood" &&
      boss.summonBurst > 0,
    hpRatio: boss.hp / boss.hpMax,
  };
}
