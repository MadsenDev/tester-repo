import { hasSpecial } from "./special-modules.js";

const stateOf = (player) =>
  (player.arenaRuntime ??= {
    stars: [],
    echoes: [],
    reservoir: [],
    pendingBursts: [],
  });

const alive = (enemy) =>
  enemy && enemy.hp > 0 && enemy.targetable !== false;

const nearest = (origin, enemies, range = Infinity, excluded = null) => {
  let best = null,
    bestDistance = range * range;
  for (const enemy of enemies) {
    if (!alive(enemy) || enemy === excluded) continue;
    const distance = (enemy.x - origin.x) ** 2 + (enemy.y - origin.y) ** 2;
    if (distance < bestDistance) {
      best = enemy;
      bestDistance = distance;
    }
  }
  return best;
};

const distanceToSegment = (point, a, b) => {
  const vx = b.x - a.x,
    vy = b.y - a.y,
    wx = point.x - a.x,
    wy = point.y - a.y,
    lengthSquared = vx * vx + vy * vy,
    position = lengthSquared
      ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / lengthSquared))
      : 0;
  return Math.hypot(point.x - (a.x + vx * position), point.y - (a.y + vy * position));
};

const arenaBullet = (bullet) =>
  bullet &&
  bullet.damage > 0 &&
  bullet.kind !== "synergy-anchor" &&
  !bullet.arenaMutationBlocked;

const combatBullet = (bullet) =>
  arenaBullet(bullet) && bullet.life > 0 && !bullet.arenaGenerated;

const pushRound = (bullets, source, angle, options = {}) => {
  const speed = options.speed || 420;
  bullets.push({
    kind: options.kind || "arena-round",
    x: source.x,
    y: source.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: options.r || 4,
    life: options.life || 1.8,
    pierce: options.pierce ?? 1,
    damage: options.damage,
    arenaFlavor: options.flavor,
    arenaGenerated: true,
  });
};

const updateProjectileMutations = (player, state, bullets, dt, W, H) => {
  state.starCooldown = Math.max(0, (state.starCooldown || 0) - dt);
  for (const bullet of bullets) {
    if (!arenaBullet(bullet)) continue;
    bullet.arenaAge = (bullet.arenaAge || 0) + dt;
    const horizonActive = hasSpecial(player, "split-horizon"),
      reversalAge = horizonActive && !bullet.wrapped ? 1.05 : 0.62;
    if (
      bullet.life > 0 &&
      hasSpecial(player, "reversal-chamber") &&
      !bullet.reversed &&
      bullet.arenaAge >= reversalAge
    ) {
      bullet.reversed = true;
      bullet.vx *= -1;
      bullet.vy *= -1;
      bullet.damage *= 1.35;
      bullet.pierce = Math.max(1, bullet.pierce + 1);
      bullet.life = Math.max(bullet.life, 1.05);
      bullet.arenaFlavor = "reversal";
    }
    const outside =
      bullet.x < -45 || bullet.x > W + 45 || bullet.y < -45 || bullet.y > H + 45;
    if (
      bullet.life > 0 &&
      horizonActive &&
      outside &&
      !bullet.wrapped
    ) {
      bullet.wrapped = true;
      if (bullet.x < -45) bullet.x = W + 42;
      else if (bullet.x > W + 45) bullet.x = -42;
      if (bullet.y < -45) bullet.y = H + 42;
      else if (bullet.y > H + 45) bullet.y = -42;
      bullet.damage *= 1.15;
      bullet.life = Math.max(bullet.life, 0.8);
      bullet.arenaFlavor = "horizon";
    }
    if (
      hasSpecial(player, "constellation-engine") &&
      !bullet.starSeeded &&
      state.starCooldown <= 0 &&
      (bullet.life <= 0.04 || (outside && !bullet.wrapped))
    ) {
      bullet.starSeeded = true;
      bullet.life = 0;
      state.starCooldown = 0.12;
      state.stars.push({ x: bullet.x, y: bullet.y, life: 7.5, phase: Math.random() * 6.28 });
      if (state.stars.length > 12) state.stars.shift();
    }
  }
};

const updateConstellations = (player, state, enemies, dt) => {
  for (const star of state.stars) star.life -= dt;
  state.stars = state.stars.filter((star) => star.life > 0);
  state.constellationTick = (state.constellationTick || 0) - dt;
  if (!hasSpecial(player, "constellation-engine") || state.stars.length < 3)
    return;
  if (state.constellationTick > 0) return;
  state.constellationTick = 0.22;
  const struck = new Set();
  for (let index = 0; index + 2 < state.stars.length; index += 3) {
    const triangle = state.stars.slice(index, index + 3),
      edges = [
        [triangle[0], triangle[1]],
        [triangle[1], triangle[2]],
        [triangle[2], triangle[0]],
      ];
    for (const enemy of enemies) {
      if (!alive(enemy) || struck.has(enemy)) continue;
      if (edges.some(([a, b]) => distanceToSegment(enemy, a, b) <= enemy.r + 5)) {
        enemy.hp -= player.damage * 0.38;
        enemy.flash = 0.08;
        struck.add(enemy);
      }
    }
  }
};

export const arenaCompanionNodes = (player, time) => {
  const companions = player.companions || {},
    companionState = player.companionState || {},
    nodes = [];
  for (let index = 0; index < (companions.blade || 0); index++) {
    const angle = time * 2.3 + (index * Math.PI * 2) / companions.blade,
      blade = companionState.blades?.[index];
    nodes.push({
      x: blade?.x ?? player.x + Math.cos(angle) * 66,
      y: blade?.y ?? player.y + Math.sin(angle) * 66,
    });
  }
  if (companions.shield) {
    const angle = companionState.shieldAngle || 0,
      radius = companionState.shieldRadius || player.r + 36;
    nodes.push({ x: player.x + Math.cos(angle) * radius, y: player.y + Math.sin(angle) * radius });
  }
  if (companions.ember)
    nodes.push({ x: player.x + Math.cos(time * 1.7) * 30, y: player.y + Math.sin(time * 1.7) * 30 });
  if (companions.wisp)
    nodes.push({ x: player.x + Math.cos(time * 1.25 + 2) * 34, y: player.y + Math.sin(time * 1.25 + 2) * 34 });
  if (companions.drone)
    nodes.push({ x: player.x + Math.cos(time * 0.9 + 2.1) * 36, y: player.y + Math.sin(time * 0.9 + 2.1) * 36 });
  if (companions.wrecking && companionState.wrecking)
    nodes.push({ x: companionState.wrecking.x, y: companionState.wrecking.y });
  return nodes;
};

const updateOrbitLoom = (player, state, enemies, dt, time) => {
  if (!hasSpecial(player, "orbit-loom")) return;
  const nodes = arenaCompanionNodes(player, time);
  state.loomNodes = nodes;
  state.loomTick = (state.loomTick || 0) - dt;
  if (nodes.length < 2 || state.loomTick > 0) return;
  state.loomTick = 0.18;
  const hit = new Set();
  for (let index = 0; index < nodes.length; index++) {
    const a = nodes[index],
      b = nodes[(index + 1) % nodes.length];
    for (const enemy of enemies) {
      if (!alive(enemy) || hit.has(enemy)) continue;
      if (distanceToSegment(enemy, a, b) <= enemy.r + 4) {
        enemy.hp -= player.damage * 0.32;
        enemy.flash = 0.07;
        hit.add(enemy);
      }
    }
  }
};

const updateBroadside = (player, state, enemies, dt, W, H) => {
  if (!hasSpecial(player, "broadside-protocol")) return;
  state.broadsideCooldown = (state.broadsideCooldown ?? 2.6) - dt;
  if (!state.broadside && state.broadsideCooldown <= 0) {
    const center = nearest(player, enemies)?.y ?? player.y;
    state.broadside = {
      timer: 0.78,
      fired: false,
      rows: [-64, 0, 64].map((offset) => Math.max(30, Math.min(H - 30, center + offset))),
      W,
    };
  }
  const broadside = state.broadside;
  if (!broadside) return;
  broadside.timer -= dt;
  if (!broadside.fired && broadside.timer <= 0.2) {
    broadside.fired = true;
    for (const enemy of enemies) {
      if (!alive(enemy)) continue;
      if (broadside.rows.some((row) => Math.abs(enemy.y - row) <= enemy.r + 13)) {
        enemy.hp -= player.damage * 2.1;
        enemy.flash = 0.14;
      }
    }
  }
  if (broadside.timer <= 0) {
    state.broadside = null;
    state.broadsideCooldown = 6.2;
  }
};

export function captureAegisProjectile(player, projectile) {
  if (!hasSpecial(player, "aegis-reservoir")) return false;
  const state = stateOf(player);
  if (state.reservoir.length >= 12) return false;
  state.reservoir.push({
    damage: projectile.damage || player.damage * 0.3,
    phase: Math.random() * Math.PI * 2,
  });
  state.reservoirHold = 0;
  return true;
}

const updateReservoir = (player, state, enemies, bullets, dt) => {
  if (!hasSpecial(player, "aegis-reservoir") || !state.reservoir.length) return;
  state.reservoirHold = (state.reservoirHold || 0) + dt;
  if (state.reservoir.length < 6 && state.reservoirHold < 1.4) return;
  const target = nearest(player, enemies, 620);
  if (!target) return;
  const stored = state.reservoir.splice(0),
    base = Math.atan2(target.y - player.y, target.x - player.x);
  stored.forEach((shot, index) => {
    const offset = (index - (stored.length - 1) / 2) * 0.11;
    pushRound(bullets, player, base + offset, {
      kind: "reservoir-round",
      speed: 470,
      damage: player.damage * 0.34 + shot.damage * 0.45,
      r: 4.5,
      pierce: 1,
      flavor: "reservoir",
    });
  });
  state.reservoirHold = 0;
};

const updateEchoes = (player, state, enemies, bullets, dt) => {
  if (!hasSpecial(player, "grave-echo")) return;
  for (const echo of state.echoes) {
    echo.life -= dt;
    echo.fireCooldown -= dt;
    if (echo.fireCooldown > 0) continue;
    const target = nearest(echo, enemies, 520);
    if (!target) continue;
    const angle = Math.atan2(target.y - echo.y, target.x - echo.x);
    pushRound(bullets, echo, angle, {
      kind: "echo-round",
      speed: 390,
      damage: player.damage * (echo.boss ? 0.85 : 0.55),
      r: echo.boss ? 6 : 4,
      pierce: echo.boss ? 2 : 0,
      flavor: "echo",
    });
    echo.fireCooldown = echo.boss ? 0.42 : 0.68;
  }
  state.echoes = state.echoes.filter((echo) => echo.life > 0);
};

const updateDevouringMoon = (player, state, enemies, bullets, dt, time) => {
  if (!hasSpecial(player, "devouring-moon")) return;
  const target = nearest(player, enemies, 650),
    desired = target
      ? Math.atan2(target.y - player.y, target.x - player.x)
      : time * 0.7,
    moon = (state.moon ??= { angle: desired, energy: 0 });
  moon.angle += Math.atan2(Math.sin(desired - moon.angle), Math.cos(desired - moon.angle)) * Math.min(1, dt * 5);
  moon.x = player.x + Math.cos(moon.angle) * 68;
  moon.y = player.y + Math.sin(moon.angle) * 68;
  const threshold = Math.max(100, player.damage * 6);
  moon.threshold = threshold;
  for (const bullet of bullets) {
    if (!combatBullet(bullet)) continue;
    if (Math.hypot(bullet.x - moon.x, bullet.y - moon.y) <= (bullet.r || 0) + 18) {
      moon.energy += bullet.damage;
      bullet.life = 0;
    }
  }
  if (moon.energy < threshold || !target) return;
  pushRound(bullets, moon, moon.angle, {
    kind: "moon-lance",
    speed: 370,
    damage: moon.energy * 0.82,
    r: Math.min(24, 12 + moon.energy / threshold * 7),
    pierce: 5,
    life: 2.4,
    flavor: "moon",
  });
  moon.energy = 0;
  moon.flash = 0.22;
};

const updatePulseHeart = (player, state, bullets, dt) => {
  if (!hasSpecial(player, "pulse-heart")) return;
  state.heartCooldown = (state.heartCooldown ?? 3.5) - dt;
  if (!state.heart && state.heartCooldown <= 0) {
    const captured = bullets
      .filter((bullet) => combatBullet(bullet) && Math.hypot(bullet.x - player.x, bullet.y - player.y) < 250)
      .slice(0, 18);
    if (!captured.length) {
      state.heartCooldown = 0.35;
      return;
    }
    for (const bullet of captured) bullet.life = 0;
    state.heart = {
      timer: 0.72,
      shots: captured.map((bullet) => ({ damage: bullet.damage, r: bullet.r || 4 })),
    };
  }
  if (!state.heart) return;
  state.heart.timer -= dt;
  if (state.heart.timer > 0) return;
  const shots = state.heart.shots;
  shots.forEach((shot, index) => {
    const angle = (index * Math.PI * 2) / shots.length + state.heartCooldown;
    pushRound(bullets, player, angle, {
      kind: "heart-round",
      speed: 380,
      damage: shot.damage * 0.78,
      r: Math.max(3, shot.r),
      pierce: 1,
      flavor: "heart",
    });
  });
  state.heart = null;
  state.heartCooldown = 5.2;
};

const updateExecutionMark = (player, state, enemies, dt) => {
  if (!hasSpecial(player, "execution-mark")) return;
  for (const burst of state.pendingBursts) {
    for (const enemy of enemies) {
      if (!alive(enemy)) continue;
      if (Math.hypot(enemy.x - burst.x, enemy.y - burst.y) <= 110 + enemy.r) {
        enemy.hp -= player.damage * 0.7;
        enemy.flash = 0.11;
      }
    }
    state.markBurst = { ...burst, life: 0.3 };
  }
  state.pendingBursts.length = 0;
  if (!alive(state.mark)) {
    state.mark = nearest(player, enemies, 700);
    if (state.mark) state.mark.arenaMarked = true;
  }
  if (state.markBurst) {
    state.markBurst.life -= dt;
    if (state.markBurst.life <= 0) state.markBurst = null;
  }
};

export function onArenaEnemyKilled(player, enemy) {
  const state = stateOf(player);
  if (hasSpecial(player, "grave-echo")) {
    state.echoCounter = (state.echoCounter || 0) + 1;
    if (enemy.elite || enemy.boss || state.echoCounter % 10 === 0) {
      state.echoes.push({
        x: enemy.x,
        y: enemy.y,
        r: Math.min(28, enemy.r || 10),
        sides: enemy.boss ? 8 : enemy.r > 18 ? 6 : 5,
        color: enemy.color || "#d8b6ff",
        boss: Boolean(enemy.boss),
        life: enemy.boss ? 12 : 7,
        fireCooldown: 0.2,
      });
      if (state.echoes.length > 5) state.echoes.shift();
    }
  }
  if (hasSpecial(player, "execution-mark") && state.mark === enemy) {
    enemy.arenaMarked = false;
    state.pendingBursts.push({ x: enemy.x, y: enemy.y });
    state.mark = null;
  }
}

export function updateArenaModules(
  player,
  dt,
  { enemies, bullets, enemyBullets, time, W, H },
) {
  const state = stateOf(player);
  state.view = { W, H };
  updateProjectileMutations(player, state, bullets, dt, W, H);
  updateConstellations(player, state, enemies, dt);
  updateOrbitLoom(player, state, enemies, dt, time);
  updateBroadside(player, state, enemies, dt, W, H);
  updateReservoir(player, state, enemies, bullets, dt);
  updateEchoes(player, state, enemies, bullets, dt);
  updateDevouringMoon(player, state, enemies, bullets, dt, time);
  updatePulseHeart(player, state, bullets, dt);
  updateExecutionMark(player, state, enemies, dt);
  if (state.moon) state.moon.flash = Math.max(0, (state.moon.flash || 0) - dt);
  void enemyBullets;
  return state;
}
