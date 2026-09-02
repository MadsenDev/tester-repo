import { clamp, dist2, spawnEnemy, particle } from "./entities.js";
import { updateWeapons, updateWeaponProjectiles } from "./weapons.js";
import { moveEnemy } from "./enemy-ai.js";
import { updateBoss } from "./bosses.js";
import {
  bossDifficulty,
  prepareBossArena,
  regularEnemiesAllowed,
} from "./boss-difficulty.js";
import {
  captureEnemyHealth,
  recordEnemyHealthDelta,
  spawnDirectedBoss,
} from "./boss-runtime.js";
import { sectorAt } from "./world.js";
import { difficultyConfig } from "./meta.js";
import { updateHazards } from "./hazards.js";
import { onCompanionProjectileHit } from "./companions.js";
import { updateEvents, eventModifiers } from "./events.js";
import { updateShipHeading } from "./ships.js";
import {
  runLimit,
  allowsRegularEnemies,
  bossInterval,
  spawnPressure,
} from "./modes.js";
import { combineModifiers, routeDue, routeModifiers } from "./sector-routes.js";
import {
  specialGemMultiplier,
  updateSpecialModules,
} from "./special-modules.js";
import { regulateProjectilePressure } from "./projectile-pressure.js";
import {
  applyFriendlyVisualBudget,
  compressSalvage,
} from "./combat-readability.js";
import { bossDamageMultiplier } from "./boss-counterplay.js";
import {
  damageExpeditionEnemy,
  updateExpeditionEncounter,
} from "./expedition-encounters.js";
import { syncManifestations, updateManifestations } from "./manifestations.js";
import { updateArenaModules } from "./arena-modules.js";

function updatePlayer(runtime, dt, mods) {
  const player = runtime.player;
  runtime.comboTimer = Math.max(0, runtime.comboTimer - dt);
  if (runtime.comboTimer === 0) runtime.combo = 0;
  player.invuln = Math.max(0, player.invuln - dt);
  player.boost = Math.max(0, player.boost - dt);
  player.overdrive = Math.max(0, player.overdrive - dt);
  player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

  const { dx, dy } = runtime.input.movement();
  const speed = player.speed * (player.boost > 0 ? 1 + player.dashBoost : 1);
  const margin = player.r + 4;
  player.vx = dx * speed;
  player.vy = dy * speed;
  updateShipHeading(player, dx, dy, dt);
  player.x = clamp(player.x + dx * speed * dt, margin, runtime.width - margin);
  player.y = clamp(player.y + dy * speed * dt, margin, runtime.height - margin);

  player.fireCd -= dt;
  if (player.fireCd <= 0 && !player.nullified) {
    runtime.shoot();
    player.fireCd =
      player.fireRate * (player.overdrive > 0 ? 0.55 : 1) * mods.fire;
  }
  if (!player.nullified)
    updateWeapons(
      player,
      dt,
      runtime.enemies,
      runtime.bullets,
      runtime.enemyBullets,
      runtime.particles,
      runtime.time,
    );
  updateSpecialModules(player, dt, {
    enemies: runtime.enemies,
    enemyBullets: runtime.enemyBullets,
    particles: runtime.particles,
    time: runtime.time,
  });
  const newManifestations = syncManifestations(player);
  if (newManifestations.length) {
    const latest = newManifestations[newManifestations.length - 1];
    runtime.audio.manifestation(latest.tone);
    runtime.shake = Math.max(runtime.shake, 16);
  }
  updateManifestations(player, dt, {
    enemies: runtime.enemies,
    enemyBullets: runtime.enemyBullets,
  });
  updateWeaponProjectiles(runtime.bullets, runtime.enemies, dt);
  return margin;
}

function updateSpawns(runtime, dt, diff, sector, mods) {
  const bossAlive = runtime.enemies.some((enemy) => enemy.boss);
  const bossRules = bossDifficulty(runtime.settings.difficulty);
  if (
    allowsRegularEnemies(runtime.settings.mode) &&
    regularEnemiesAllowed(runtime.settings.difficulty, bossAlive)
  ) {
    const rate =
      Math.max(0.085, 0.7 - runtime.time * 0.00092) /
      (diff.spawn *
        sector.pressure *
        spawnPressure(runtime.settings.mode, runtime.time) *
        mods.spawn);
    runtime.spawnTimer -= dt;
    while (runtime.spawnTimer <= 0) {
      runtime.enemies.push(
        spawnEnemy(runtime.width, runtime.height, runtime.time, mods.elite),
      );
      runtime.spawnTimer += rate;
    }
  }
  if (runtime.time < runtime.nextBoss || bossAlive) return;

  runtime.bossCount++;
  const bossTime =
    runtime.settings.mode === "bossrush"
      ? runtime.bossCount * 60
      : runtime.time;
  if (bossRules.clearArena) {
    const arena = prepareBossArena(
      runtime.enemies,
      runtime.enemyBullets,
      runtime.settings.difficulty,
    );
    runtime.enemies = arena.enemies;
    runtime.enemyBullets = arena.enemyBullets;
  }
  const boss = spawnDirectedBoss(runtime.bossRuntime, {
    w: runtime.width,
    h: runtime.height,
    time: bossTime,
    difficulty: runtime.settings.difficulty,
    mode: runtime.settings.mode,
    bossCount: runtime.bossCount,
    player: runtime.player,
  });
  runtime.enemies.push(boss);
  runtime.noteDiscovery("bosses", boss.kind);
  runtime.nextBoss =
    runtime.settings.mode === "bossrush"
      ? Infinity
      : runtime.nextBoss + bossInterval(runtime.settings.mode);
  runtime.audio.boss();
  runtime.shake = 12;
}

function updateEnemies(runtime, dt, mods, margin) {
  for (const enemy of runtime.enemies) {
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.phase += dt;
    enemy.px = enemy.x;
    enemy.py = enemy.y;
    if (enemy.boss)
      updateBoss(enemy, dt, {
        player: runtime.player,
        enemyBullets: runtime.enemyBullets,
        particles: runtime.particles,
        time: runtime.time,
        onHazard: runtime.hurt,
        onShake: (value) => (runtime.shake = Math.max(runtime.shake, value)),
      });
    else {
      const speed = enemy.s;
      enemy.s *= mods.enemySpeed;
      moveEnemy(enemy, dt, {
        player: runtime.player,
        enemyBullets: runtime.enemyBullets,
        particles: runtime.particles,
        time: runtime.time,
      });
      enemy.s = speed;
    }
    runtime.player.x = clamp(runtime.player.x, margin, runtime.width - margin);
    runtime.player.y = clamp(runtime.player.y, margin, runtime.height - margin);
    if (dist2(runtime.player, enemy) < (runtime.player.r + enemy.r) ** 2)
      runtime.hurt(enemy.d);
  }
}

function updateProjectiles(runtime, dt) {
  for (const bullet of runtime.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    bullet.hit ??= new Set();
    for (const enemy of runtime.enemies) {
      if (enemy.hp <= 0 || bullet.hit.has(enemy)) continue;
      if (dist2(bullet, enemy) >= (bullet.r + enemy.r) ** 2) continue;
      bullet.hit.add(enemy);
      const damage = bullet.damage * bossDamageMultiplier(enemy);
      if (runtime.expedition)
        damageExpeditionEnemy(enemy, damage, runtime.enemies);
      else enemy.hp -= damage;
      enemy.flash = 0.06;
      onCompanionProjectileHit(
        bullet,
        enemy,
        runtime.enemies,
        runtime.player.weaponFx,
      );
      bullet.pierce--;
      if (bullet.phaseMemory && bullet.pierce >= 0) bullet.damage *= 1.12;
      runtime.audio.hit();
      for (let i = 0; i < (bullet.kind === "missile" ? 8 : 3); i++)
        runtime.particles.push(
          particle(
            bullet.x,
            bullet.y,
            bullet.kind === "missile" ? "boss" : "spark",
          ),
        );
      if (bullet.pierce < 0) {
        bullet.life = 0;
        break;
      }
    }
  }
  for (const bullet of runtime.enemyBullets) {
    if (bullet.life <= 0) continue;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (dist2(runtime.player, bullet) < (runtime.player.r + bullet.r) ** 2) {
      bullet.life = 0;
      runtime.hurt(bullet.damage);
    }
  }
}

function pruneProjectiles(runtime) {
  runtime.bullets = runtime.bullets.filter(
    (bullet) =>
      bullet.life > 0 &&
      bullet.x > -50 &&
      bullet.y > -50 &&
      bullet.x < runtime.width + 50 &&
      bullet.y < runtime.height + 50,
  );
  runtime.enemyBullets = runtime.enemyBullets.filter(
    (bullet) =>
      bullet.life > 0 &&
      bullet.x > -70 &&
      bullet.y > -70 &&
      bullet.x < runtime.width + 70 &&
      bullet.y < runtime.height + 70,
  );
  runtime.enemyBullets = regulateProjectilePressure(runtime.enemyBullets, {
    difficulty: runtime.settings.difficulty,
    time: runtime.time,
    width: runtime.width,
    height: runtime.height,
    player: runtime.player,
  });
  applyFriendlyVisualBudget(runtime.bullets, {
    width: runtime.width,
    height: runtime.height,
    player: runtime.player,
  });
  runtime.gems = compressSalvage(runtime.gems, {
    width: runtime.width,
    height: runtime.height,
  });
}

function updateCollectibles(runtime, dt, mods) {
  const magnet = runtime.player.magnet * mods.magnet;
  for (let i = runtime.gems.length - 1; i >= 0; i--) {
    const gem = runtime.gems[i];
    const distance = Math.sqrt(dist2(runtime.player, gem));
    if (distance < magnet) {
      const pull = Math.max(0.1, 1 - distance / magnet);
      const angle = Math.atan2(
        runtime.player.y - gem.y,
        runtime.player.x - gem.x,
      );
      gem.x += Math.cos(angle) * (140 + 420 * pull) * dt;
      gem.y += Math.sin(angle) * (140 + 420 * pull) * dt;
    }
    if (distance >= runtime.player.r + 8) continue;
    runtime.player.xp +=
      gem.v *
      runtime.player.xpGain *
      mods.xp *
      specialGemMultiplier(runtime.player);
    runtime.audio.xp();
    runtime.gems.splice(i, 1);
    if (runtime.player.xp < runtime.player.nextXp) continue;
    runtime.player.xp -= runtime.player.nextXp;
    runtime.player.level++;
    runtime.player.nextXp = Math.floor(runtime.player.nextXp * 1.28 + 8);
    runtime.levelUp();
    break;
  }
  for (let i = runtime.powerups.length - 1; i >= 0; i--) {
    const powerup = runtime.powerups[i];
    powerup.life -= dt;
    powerup.phase += dt * 2;
    runtime.attractPowerup(powerup, runtime.player, dt);
    if (
      dist2(runtime.player, powerup) <
      (runtime.player.r + powerup.r + 8) ** 2
    ) {
      runtime.collectPowerup(powerup);
      runtime.powerups.splice(i, 1);
    } else if (powerup.life <= 0) runtime.powerups.splice(i, 1);
  }
}

function updateOrbitalsAndParticles(runtime, dt) {
  for (let orbital = 0; orbital < runtime.player.orbitals; orbital++) {
    const angle =
      runtime.time * 2.1 + (orbital * Math.PI * 2) / runtime.player.orbitals;
    const position = {
      x: runtime.player.x + Math.cos(angle) * 42,
      y: runtime.player.y + Math.sin(angle) * 42,
    };
    for (const enemy of runtime.enemies)
      if (dist2(position, enemy) < (8 + enemy.r) ** 2) enemy.hp -= 28 * dt;
  }
  for (const particleItem of runtime.particles) {
    particleItem.x += particleItem.vx * dt;
    particleItem.y += particleItem.vy * dt;
    particleItem.vx *= 0.96;
    particleItem.vy *= 0.96;
    particleItem.life -= dt;
  }
  runtime.particles = runtime.particles.filter((item) => item.life > 0);
  runtime.shake = Math.max(0, runtime.shake - 30 * dt);
}

export function updateGame(runtime, dt) {
  if (runtime.state !== "playing") return;
  const damageSnapshot = captureEnemyHealth(runtime.enemies);
  runtime.time += dt;
  const limit = runLimit(runtime.settings.mode);
  if (runtime.time >= limit) {
    runtime.time = limit;
    runtime.updateUI();
    runtime.finish(true);
    return;
  }
  if (runtime.routesEnabled() && routeDue(runtime.routes, runtime.time)) {
    runtime.chooseSectorRoute();
    return;
  }
  if (
    runtime.settings.mode !== "bossrush" &&
    runtime.settings.mode !== "expedition"
  ) {
    updateEvents(runtime.events, dt, runtime.time);
    if (
      runtime.events.current &&
      !runtime.encounteredEvents.includes(runtime.events.current.id)
    ) {
      runtime.encounteredEvents.push(runtime.events.current.id);
      runtime.noteDiscovery("events", runtime.events.current.id);
    }
  }
  const eventMods =
    runtime.settings.mode === "bossrush" ||
    runtime.settings.mode === "expedition"
      ? { fire: 1, enemySpeed: 1, magnet: 1, elite: 0, score: 1 }
      : eventModifiers(runtime.events);
  const mods = combineModifiers(eventMods, routeModifiers(runtime.routes));
  const diff = difficultyConfig(runtime.settings.difficulty);
  const sector = sectorAt(runtime.time);
  runtime.score += dt * 10 * diff.score * mods.score;

  const margin = updatePlayer(runtime, dt, mods);
  runtime.updateExpedition(dt);
  updateSpawns(runtime, dt, diff, sector, mods);
  updateEnemies(runtime, dt, mods, margin);

  if (runtime.expedition)
    updateExpeditionEncounter(runtime.expedition.encounterRuntime, dt, {
      player: runtime.player,
      bullets: runtime.bullets,
      enemyBullets: runtime.enemyBullets,
      enemies: runtime.enemies,
      hurt: runtime.hurt,
      W: runtime.width,
      H: runtime.height,
    });
  if (
    runtime.settings.mode !== "bossrush" &&
    runtime.settings.mode !== "expedition"
  )
    updateHazards(runtime.hazards, dt, {
      time: runtime.time,
      W: runtime.width,
      H: runtime.height,
      player: runtime.player,
      bullets: runtime.bullets,
      enemyBullets: runtime.enemyBullets,
      enemies: runtime.enemies,
      particles: runtime.particles,
      hurt: runtime.hurt,
    });

  updateProjectiles(runtime, dt);
  updateArenaModules(runtime.player, dt, {
    enemies: runtime.enemies,
    bullets: runtime.bullets,
    enemyBullets: runtime.enemyBullets,
    time: runtime.time,
    W: runtime.width,
    H: runtime.height,
  });
  recordEnemyHealthDelta(runtime.bossRuntime, damageSnapshot, runtime.time);
  for (let i = runtime.enemies.length - 1; i >= 0; i--)
    if (runtime.enemies[i].hp <= 0) {
      runtime.awardKill(runtime.enemies[i], mods);
      runtime.enemies.splice(i, 1);
    }
  if (runtime.pendingBlackSignal && !runtime.expedition) {
    runtime.chooseBlackSignal();
    return;
  }

  pruneProjectiles(runtime);
  updateCollectibles(runtime, dt, mods);
  updateOrbitalsAndParticles(runtime, dt);
  runtime.updateUI();
}
