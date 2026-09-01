import { spawnEnemyProjectile, particle, isInViewport } from "./entities.js";

function eliteMotionFx(e, particles, time) {
  if (!e.elite || e.boss || !isInViewport(e)) return;
  e.fxCd = (e.fxCd || 0) - 1 / 60;
  if (e.fxCd > 0) return;
  const kind = e.eliteTrait;
  if (kind === "frenzied") {
    particles.push({
      x: e.x,
      y: e.y,
      vx: 0,
      vy: 0,
      life: 0.22,
      max: 0.22,
      kind: "frenzied",
      size: 4,
    });
    e.fxCd = 0.06;
  } else if (kind === "volatile") {
    particles.push({
      x: e.x,
      y: e.y,
      vx: 0,
      vy: 0,
      life: 0.28,
      max: 0.28,
      kind: "volatile",
      size: 3,
    });
    e.fxCd = 0.16;
  } else if (kind === "vampiric") {
    particles.push({
      x: e.x,
      y: e.y,
      vx: 0,
      vy: -8,
      life: 0.35,
      max: 0.35,
      kind: "vampiric",
      size: 3,
    });
    e.fxCd = 0.22;
  } else if (kind === "splitter") {
    particles.push({
      x: e.x + (Math.random() - 0.5) * e.r,
      y: e.y + (Math.random() - 0.5) * e.r,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      life: 0.25,
      max: 0.25,
      kind: "splitter",
      size: 2,
    });
    e.fxCd = 0.12;
  }
}

export function moveEnemy(e, dt, { player, enemyBullets, particles, time }) {
  const dx = player.x - e.x,
    dy = player.y - e.y,
    d = Math.max(1, Math.hypot(dx, dy)),
    nx = dx / d,
    ny = dy / d;
  e.shootCd -= dt;
  e.chargeCd -= dt;

  if (e.behavior === "anchor") {
    const desired = 185, radial = d > desired + 25 ? 1 : d < desired - 25 ? -0.45 : 0;
    e.x += nx * radial * e.s * dt;
    e.y += ny * radial * e.s * dt;
    if (e.shootCd <= 0 && isInViewport(e)) {
      for (let i = 0; i < 8; i++)
        enemyBullets.push(spawnEnemyProjectile(e.x, e.y, (i * Math.PI * 2) / 8 + e.phase, 125, 9, 4, 6));
      e.shootCd = 2.65;
    }
  } else if (e.behavior === "relay") {
    const desired = 215, radial = d > desired + 25 ? 1 : d < desired - 25 ? -0.7 : 0;
    e.x += (nx * radial - ny * 0.7) * e.s * dt;
    e.y += (ny * radial + nx * 0.7) * e.s * dt;
    if (e.shootCd <= 0 && isInViewport(e)) {
      enemyBullets.push(spawnEnemyProjectile(e.x, e.y, Math.atan2(dy, dx), 205, 11, 4, 5));
      e.shootCd = 1.6;
    }
  } else if (e.behavior === "burrower") {
    e.burrowCycle = (e.burrowCycle || 0) + dt;
    e.submerged = e.burrowCycle < 1.15;
    const speed = e.submerged ? 1.85 : e.burrowCycle < 1.65 ? 2.6 : 0.72;
    e.x += nx * e.s * speed * dt;
    e.y += ny * e.s * speed * dt;
    if (e.burrowCycle >= 3.1) e.burrowCycle = 0;
    if (!e.submerged && e.burrowCycle < 1.3)
      for (let i = 0; i < 2; i++) particles.push(particle(e.x, e.y, "volatile"));
  } else if (e.behavior === "bulwark") {
    const desired = 145, radial = d > desired + 25 ? 1 : d < desired - 20 ? -0.5 : 0;
    e.x += nx * radial * e.s * dt;
    e.y += ny * radial * e.s * dt;
  } else if (e.behavior === "leech") {
    const desired = 135,
      radial = d > desired + 24 ? 1 : d < desired - 20 ? -0.7 : 0,
      tangent = Math.sin(e.phase * 1.7) > 0 ? 0.42 : -0.42;
    e.x += (nx * radial - ny * tangent) * e.s * dt;
    e.y += (ny * radial + nx * tangent) * e.s * dt;
    if (e.shootCd <= 0 && isInViewport(e)) {
      for (const offset of [-0.18, 0.18])
        enemyBullets.push(
          spawnEnemyProjectile(
            e.x,
            e.y,
            Math.atan2(dy, dx) + offset,
            155,
            12,
            5,
            5,
          ),
        );
      e.shootCd = 1.38;
      for (let i = 0; i < 5; i++)
        particles.push(particle(e.x, e.y, "vampiric"));
    }
  } else if (e.behavior === "sentinel") {
    const desired = 285,
      radial = d > desired + 30 ? 1 : d < desired - 30 ? -1 : 0;
    e.x += nx * radial * e.s * dt;
    e.y += ny * radial * e.s * dt;
    if (e.shootCd <= 0 && isInViewport(e)) {
      const base = Math.atan2(dy, dx);
      for (let i = -2; i <= 2; i++)
        enemyBullets.push(
          spawnEnemyProjectile(e.x, e.y, base + i * 0.2, 215, 11, 4, 5),
        );
      e.shootCd = 1.9;
      for (let i = 0; i < 7; i++) particles.push(particle(e.x, e.y, "boss"));
    }
  } else if (e.behavior === "phaser") {
    const wobble = Math.sin(time * 4 + e.phase) * 0.55;
    e.x += (nx - ny * wobble) * e.s * dt;
    e.y += (ny + nx * wobble) * e.s * dt;
    if (e.chargeCd <= 0 && isInViewport(e)) {
      for (let i = 0; i < 9; i++)
        particles.push(particle(e.x, e.y, "splitter"));
      const a = Math.random() * Math.PI * 2,
        range = 150 + Math.random() * 85;
      e.x = player.x + Math.cos(a) * range;
      e.y = player.y + Math.sin(a) * range;
      e.chargeCd = 2.7 + Math.random() * 0.8;
      for (let i = 0; i < 9; i++)
        particles.push(particle(e.x, e.y, "splitter"));
    }
  } else if (e.behavior === "shooter") {
    const desired = 230,
      radial = d > desired + 35 ? 1 : d < desired - 35 ? -1 : 0,
      tangent = Math.sin(e.phase) > 0 ? 1 : -1;
    e.x += (nx * radial - ny * 0.45 * tangent) * e.s * dt;
    e.y += (ny * radial + nx * 0.45 * tangent) * e.s * dt;
    if (e.shootCd <= 0 && isInViewport(e)) {
      enemyBullets.push(
        spawnEnemyProjectile(e.x, e.y, Math.atan2(dy, dx), 190, 10, 4, 5),
      );
      e.shootCd = 1.75 + Math.random() * 0.55;
    }
  } else if (e.behavior === "sniper") {
    const desired = 350,
      radial = d > desired + 25 ? 1 : d < desired - 25 ? -1 : 0;
    e.x += nx * radial * e.s * dt;
    e.y += ny * radial * e.s * dt;
    if (e.shootCd <= 0 && isInViewport(e)) {
      enemyBullets.push(
        spawnEnemyProjectile(e.x, e.y, Math.atan2(dy, dx), 330, 15, 3, 4),
      );
      e.shootCd = 2.1;
      for (let i = 0; i < 4; i++) particles.push(particle(e.x, e.y, "boss"));
    }
  } else if (e.behavior === "strafe" || e.behavior === "orbiter") {
    const desired = e.behavior === "orbiter" ? 210 : 175,
      radial = d > desired + 25 ? 1 : d < desired - 25 ? -0.6 : 0,
      tangent = e.behavior === "orbiter" ? 1 : 0.75;
    e.x += (nx * radial - ny * tangent) * e.s * dt;
    e.y += (ny * radial + nx * tangent) * e.s * dt;
    if (e.behavior === "orbiter" && e.shootCd <= 0 && isInViewport(e)) {
      enemyBullets.push(
        spawnEnemyProjectile(
          e.x,
          e.y,
          Math.atan2(dy, dx) + 0.25,
          175,
          10,
          4,
          5,
        ),
      );
      enemyBullets.push(
        spawnEnemyProjectile(
          e.x,
          e.y,
          Math.atan2(dy, dx) - 0.25,
          175,
          10,
          4,
          5,
        ),
      );
      e.shootCd = 1.55;
    }
  } else if (e.behavior === "charger") {
    const burst = e.chargeCd <= 0 ? 3.4 : 1;
    e.x += nx * e.s * burst * dt;
    e.y += ny * e.s * burst * dt;
    if (e.chargeCd <= 0) {
      e.chargeCd = 2.3 + Math.random() * 0.9;
      for (let i = 0; i < 5; i++) particles.push(particle(e.x, e.y, "boss"));
    }
  } else if (e.behavior === "swarm") {
    const wobble = Math.sin(time * 6 + e.phase) * 0.45;
    e.x += (nx - ny * wobble) * e.s * dt;
    e.y += (ny + nx * wobble) * e.s * dt;
  } else {
    e.x += nx * e.s * dt;
    e.y += ny * e.s * dt;
  }
  eliteMotionFx(e, particles, time);
}
