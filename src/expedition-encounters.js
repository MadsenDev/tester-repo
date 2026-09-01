import { dist2, spawnEnemyProjectile } from "./entities.js";

export const EXPEDITION_ENCOUNTERS = Object.freeze([
  { id: "open", name: "OPEN INTERCEPT", minSector: 1, signature: "scout" },
  { id: "shield-line", name: "SHIELD LINE", minSector: 1, signature: "bulwark" },
  { id: "gravity-knot", name: "GRAVITY KNOT", minSector: 2, signature: "anchor" },
  { id: "crossfire", name: "CROSSFIRE", minSector: 2, signature: "sentinel" },
  { id: "relay-web", name: "RELAY WEB", minSector: 3, signature: "relay" },
  { id: "breach", name: "BREACH FIELD", minSector: 4, signature: "burrower" },
]);

export function encounterById(id) {
  return EXPEDITION_ENCOUNTERS.find((encounter) => encounter.id === id) || EXPEDITION_ENCOUNTERS[0];
}

export function assignExpeditionEncounters(nodes, sector, random = Math.random) {
  const eligible = EXPEDITION_ENCOUNTERS.filter((encounter) => encounter.minSector <= sector);
  let previous = "";
  for (const node of nodes) {
    if (!['combat', 'elite'].includes(node.type)) {
      node.encounterId = null;
      continue;
    }
    const choices = eligible.filter((encounter) => encounter.id !== previous);
    const encounter = choices[Math.floor(random() * choices.length)] || eligible[0];
    node.encounterId = encounter.id;
    previous = encounter.id;
  }
  return nodes;
}

export function expeditionEnemyKind(state, index, random = Math.random) {
  const encounter = encounterById(state.encounterId), sector = state.sector || 1;
  if (index === 0 && encounter.signature) return encounter.signature;
  const pools = [
    ["scout", "brute", "dart"],
    ["scout", "dart", "wisp", "spitter", "bulwark", "anchor"],
    ["dart", "spitter", "swarm", "orbiter", "anchor", "relay"],
    ["swarm", "sniper", "orbiter", "sentinel", "relay", "burrower"],
    ["leech", "sentinel", "phaser", "anchor", "relay", "burrower"],
  ];
  const pool = pools[Math.min(pools.length - 1, sector - 1)];
  return pool[Math.floor(random() * pool.length)];
}

export function createExpeditionEncounterRuntime(id, W, H, random = Math.random) {
  const runtime = {
    id: id || "open",
    name: encounterById(id).name,
    random,
    active: true,
    elapsed: 0,
    pulse: 1.2,
    beam: null,
    well: { x: W * (0.35 + random() * 0.3), y: H * (0.42 + random() * 0.2), r: Math.min(155, W * 0.34) },
    wall: { vertical: random() > 0.5, progress: random(), direction: random() > 0.5 ? 1 : -1, gap: 0.25 + random() * 0.5 },
  };
  return runtime;
}

function updateSupportLinks(enemies) {
  for (const enemy of enemies) {
    enemy.shielded = false;
    enemy.relayPartner = null;
  }
  for (const source of enemies) {
    if (source.hp <= 0) continue;
    if (source.kind === "bulwark")
      for (const target of enemies)
        if (target !== source && target.hp > 0 && dist2(source, target) < 155 ** 2)
          target.shielded = true;
    if (source.kind === "relay") {
      let nearest = null, best = 190 ** 2;
      for (const target of enemies) {
        if (target === source || target.hp <= 0 || target.kind === "relay") continue;
        const distance = dist2(source, target);
        if (distance < best) { best = distance; nearest = target; }
      }
      source.relayPartner = nearest;
    }
  }
}

export function updateExpeditionEncounter(runtime, dt, world) {
  if (!runtime || !runtime.active) return;
  const { player, bullets, enemyBullets, enemies, hurt, W, H } = world;
  runtime.elapsed += dt;
  updateSupportLinks(enemies);
  if (runtime.id === "gravity-knot") {
    const well = runtime.well, dx = well.x - player.x, dy = well.y - player.y,
      distance = Math.max(30, Math.hypot(dx, dy));
    if (distance < well.r * 1.5) {
      const force = (1 - distance / (well.r * 1.5)) * 42;
      player.x += (dx / distance) * force * dt;
      player.y += (dy / distance) * force * dt;
    }
    for (const projectile of [...bullets, ...enemyBullets]) {
      const px = well.x - projectile.x, py = well.y - projectile.y,
        pd = Math.max(24, Math.hypot(px, py));
      if (pd < well.r * 1.8) {
        const bend = (1 - pd / (well.r * 1.8)) * 105;
        projectile.vx += (px / pd) * bend * dt;
        projectile.vy += (py / pd) * bend * dt;
      }
    }
  } else if (runtime.id === "crossfire") {
    runtime.pulse -= dt;
    if (runtime.pulse <= 0 && !runtime.beam) {
      const vertical = Math.floor(runtime.elapsed / 3) % 2 === 0;
      runtime.beam = { vertical, pos: vertical ? W * (0.22 + runtime.random() * 0.56) : H * (0.3 + runtime.random() * 0.55), warn: 0.9, active: 0.42 };
      runtime.pulse = 2.8;
    }
    if (runtime.beam) {
      if (runtime.beam.warn > 0) runtime.beam.warn -= dt;
      else {
        runtime.beam.active -= dt;
        const distance = runtime.beam.vertical ? Math.abs(player.x - runtime.beam.pos) : Math.abs(player.y - runtime.beam.pos);
        if (distance < 16) hurt(12 * dt * 5);
      }
      if (runtime.beam.active <= 0) runtime.beam = null;
    }
  } else if (runtime.id === "breach" && runtime.active) {
    const wall = runtime.wall;
    wall.progress += wall.direction * dt * 0.16;
    if (wall.progress > 1 || wall.progress < 0) {
      wall.progress = Math.max(0, Math.min(1, wall.progress));
      wall.direction *= -1;
      wall.gap = 0.22 + runtime.random() * 0.56;
    }
    const line = wall.vertical ? W * wall.progress : H * (0.24 + wall.progress * 0.7),
      along = wall.vertical ? player.y / H : player.x / W,
      across = wall.vertical ? Math.abs(player.x - line) : Math.abs(player.y - line);
    if (across < 12 && Math.abs(along - wall.gap) > 0.12) hurt(10 * dt * 5);
  }
}

export function damageExpeditionEnemy(enemy, amount, enemies) {
  const reduced = amount * (enemy.shielded ? 0.34 : 1);
  enemy.hp -= reduced;
  if (enemy.relayPartner?.hp > 0) {
    const shared = reduced * 0.3;
    enemy.hp += shared;
    enemy.relayPartner.hp -= shared;
  }
  return reduced;
}

export function drawExpeditionEncounter(ctx, runtime, time, W, H) {
  if (!runtime || runtime.id === "open") return;
  ctx.save();
  if (runtime.id === "shield-line") {
    ctx.strokeStyle = "#ff8ca0"; ctx.globalAlpha = 0.12; ctx.lineWidth = 2;
    for (const x of [W * 0.28, W * 0.72]) {
      ctx.beginPath(); ctx.arc(x, H * 0.54, Math.min(72, W * 0.16), -1.1, 1.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, H * 0.54, Math.min(54, W * 0.12), Math.PI - 1.1, Math.PI + 1.1); ctx.stroke();
    }
  } else if (runtime.id === "relay-web") {
    ctx.strokeStyle = "#62f4d0"; ctx.fillStyle = "#62f4d0"; ctx.globalAlpha = 0.1; ctx.lineWidth = 1.5;
    const points = [[0.22,0.38],[0.78,0.38],[0.5,0.58],[0.25,0.76],[0.75,0.76]];
    for (let i = 0; i < points.length; i++) {
      const [ax, ay] = points[i], [bx, by] = points[(i + 2) % points.length];
      ctx.beginPath(); ctx.moveTo(W * ax, H * ay); ctx.lineTo(W * bx, H * by); ctx.stroke();
      ctx.beginPath(); ctx.arc(W * ax, H * ay, 4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (runtime.id === "gravity-knot") {
    const well = runtime.well;
    ctx.strokeStyle = "#b789ff"; ctx.globalAlpha = 0.2; ctx.lineWidth = 2;
    for (let radius = well.r * 0.35; radius < well.r; radius += 22) {
      ctx.beginPath(); ctx.arc(well.x, well.y, radius, time + radius, time + radius + Math.PI * 1.45); ctx.stroke();
    }
  } else if (runtime.id === "crossfire" && runtime.beam) {
    const beam = runtime.beam, warning = beam.warn > 0;
    ctx.globalAlpha = warning ? 0.26 : 0.7; ctx.fillStyle = warning ? "#ff668f" : "#fff4f7";
    if (beam.vertical) ctx.fillRect(beam.pos - (warning ? 2 : 14), 0, warning ? 4 : 28, H);
    else ctx.fillRect(0, beam.pos - (warning ? 2 : 14), W, warning ? 4 : 28);
  } else if (runtime.id === "breach" && runtime.active) {
    const wall = runtime.wall,
      line = wall.vertical ? W * wall.progress : H * (0.24 + wall.progress * 0.7),
      gapCenter = wall.vertical ? H * wall.gap : W * wall.gap,
      gap = wall.vertical ? H * 0.24 : W * 0.24;
    ctx.strokeStyle = "#ff7b9b"; ctx.globalAlpha = 0.42; ctx.lineWidth = 4; ctx.setLineDash([8, 8]);
    ctx.beginPath();
    if (wall.vertical) { ctx.moveTo(line, 0); ctx.lineTo(line, gapCenter - gap / 2); ctx.moveTo(line, gapCenter + gap / 2); ctx.lineTo(line, H); }
    else { ctx.moveTo(0, line); ctx.lineTo(gapCenter - gap / 2, line); ctx.moveTo(gapCenter + gap / 2, line); ctx.lineTo(W, line); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
