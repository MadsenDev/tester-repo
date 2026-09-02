import { dist2, particle } from "./entities.js";
import { difficultyConfig } from "./meta.js";
import { eventModifiers } from "./events.js";
import { combineModifiers, routeModifiers } from "./sector-routes.js";
import {
  afterSpecialDamage,
  echoSpecialVolley,
  onSpecialKill,
  resolveSpecialDamage,
  specialDamageMultiplier,
} from "./special-modules.js";
import { shouldOfferBlackSignal } from "./black-signal.js";
import { onArenaEnemyKilled } from "./arena-modules.js";
import { rollPowerupDrop } from "./drop-economy.js";

export function createCombatActions(runtime) {
  function nearestEnemy() {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const enemy of runtime.enemies) {
      const distance = dist2(runtime.player, enemy);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = enemy;
      }
    }
    return nearest;
  }

  function shoot() {
    const target = nearestEnemy();
    if (!target) return;
    const base = Math.atan2(
      target.y - runtime.player.y,
      target.x - runtime.player.x,
    );
    const startIndex = runtime.bullets.length;
    const damageMultiplier = specialDamageMultiplier(runtime.player);
    for (let i = 0; i < runtime.player.shots; i++) {
      const spread = (i - (runtime.player.shots - 1) / 2) * 0.14;
      const angle = base + spread;
      runtime.bullets.push({
        kind: "blaster",
        x: runtime.player.x,
        y: runtime.player.y,
        vx: Math.cos(angle) * runtime.player.bulletSpeed,
        vy: Math.sin(angle) * runtime.player.bulletSpeed,
        r: runtime.player.bulletSize,
        life: 1.8,
        pierce: runtime.player.pierce,
        damage:
          runtime.player.damage *
          damageMultiplier *
          (Math.random() < runtime.player.crit ? 2 : 1),
      });
    }
    echoSpecialVolley(runtime.player, runtime.bullets, startIndex);
    runtime.audio.shot();
  }

  function hurt(amount) {
    if (runtime.player.invuln > 0 || runtime.state !== "playing") return;
    const difficulty = difficultyConfig(runtime.settings.difficulty);
    const mods = combineModifiers(
      runtime.settings.mode === "bossrush"
        ? {}
        : eventModifiers(runtime.events),
      routeModifiers(runtime.routes),
    );
    const result = resolveSpecialDamage(
      runtime.player,
      amount *
        (1 - runtime.player.armor) *
        difficulty.damage *
        mods.damageTaken *
        (runtime.player.contractDamageTaken || 1),
      Math.random,
    );
    if (result.evaded) {
      for (let i = 0; i < 6; i++)
        runtime.particles.push(
          particle(runtime.player.x, runtime.player.y, "spark"),
        );
      return;
    }
    runtime.player.hp -= result.damage;
    runtime.player.invuln = 0.22;
    runtime.player.boost = 0.65;
    runtime.shake = 8;
    runtime.combo = 0;
    runtime.comboTimer = 0;
    runtime.audio.hurt();
    for (let i = 0; i < 10; i++)
      runtime.particles.push(
        particle(runtime.player.x, runtime.player.y, "hurt"),
      );
    afterSpecialDamage(runtime.player, result);
    if (runtime.player.hp <= 0) runtime.finish(false);
  }

  function awardKill(enemy, mods) {
    const difficulty = difficultyConfig(runtime.settings.difficulty);
    runtime.kills++;
    runtime.killsSinceRepair++;
    onSpecialKill(runtime.player, enemy);
    onArenaEnemyKilled(runtime.player, enemy);
    if (enemy.boss) {
      runtime.defeatedBosses.push(enemy.kind);
      runtime.noteDiscovery("bosses", enemy.kind);
      if (
        !runtime.expedition &&
        shouldOfferBlackSignal(runtime.defeatedBosses.length)
      )
        runtime.pendingBlackSignal = true;
    }
    runtime.combo = runtime.comboTimer > 0 ? runtime.combo + 1 : 1;
    runtime.comboTimer = 2.8;
    runtime.score +=
      (enemy.boss ? 700 : 20 + enemy.v) *
      (1 + Math.min(runtime.combo, 30) * 0.03) *
      difficulty.score *
      mods.score;
    const salvageCount = runtime.expedition ? 0 : enemy.boss ? 16 : 1;
    for (let i = 0; i < salvageCount; i++)
      runtime.gems.push({
        x: enemy.x + (Math.random() - 0.5) * 24,
        y: enemy.y + (Math.random() - 0.5) * 24,
        v: enemy.boss ? 24 : enemy.v,
        r: enemy.boss ? 5 : 4,
      });
    const particleCount = enemy.boss ? 36 : enemy.elite ? 16 : 9;
    for (let i = 0; i < particleCount; i++)
      runtime.particles.push(
        particle(enemy.x, enemy.y, enemy.boss ? "boss" : "spark"),
      );
    const drop = rollPowerupDrop(
      enemy,
      runtime.settings.difficulty,
      runtime.player,
      runtime.killsSinceRepair,
    );
    if (drop) {
      runtime.powerups.push({
        x: enemy.x,
        y: enemy.y,
        ...drop,
        r: 9,
        phase: Math.random() * 6.28,
      });
      if (drop.kind === "repair") runtime.killsSinceRepair = 0;
    }
    if (enemy.boss && runtime.settings.mode === "bossrush")
      runtime.nextBoss = runtime.time + 8;
  }

  function collectPowerup(powerup) {
    if (powerup.kind === "repair")
      runtime.player.hp = Math.min(
        runtime.player.maxHp,
        runtime.player.hp + (powerup.value || 32),
      );
    else if (powerup.kind === "pulse") {
      runtime.enemyBullets = [];
      for (const enemy of runtime.enemies)
        enemy.hp -= Math.max(80, runtime.player.damage * 4);
      runtime.shake = 14;
      for (let i = 0; i < 30; i++)
        runtime.particles.push(
          particle(runtime.player.x, runtime.player.y, "boss"),
        );
    } else if (powerup.kind === "overdrive")
      runtime.player.overdrive = Math.max(runtime.player.overdrive, 8);
    runtime.audio.level();
  }

  return { awardKill, collectPowerup, hurt, shoot };
}
