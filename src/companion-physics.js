const angleDelta = (from, to) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

const nearestThreat = (x, y, candidates, range) => {
  let best = null,
    bestDistance = range * range;
  for (const candidate of candidates) {
    if (
      candidate.life <= 0 ||
      candidate.targetable === false ||
      (candidate.hp != null && candidate.hp <= 0)
    )
      continue;
    const distance = (candidate.x - x) ** 2 + (candidate.y - y) ** 2;
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
};

export function stepWreckingNode(
  p,
  state,
  level,
  dt,
  enemies,
  enemyBullets,
  time,
) {
  if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) {
    state.x = p.x - 76;
    state.y = p.y;
    state.vx = 0;
    state.vy = 0;
    state.scrap = 0;
    state.hits = new Map();
  }
  const growth = Math.min(8, Math.floor((state.scrap || 0) / 5)),
    ballast = p.passives?.ballast ? 0.38 : 0,
    mass = 1 + level * 0.08 + growth * 0.035 + ballast,
    tether = 92 + level * 7 + growth * 2,
    dx = p.x - state.x,
    dy = p.y - state.y,
    spring = (10.5 + level * 0.65) / mass,
    drag = Math.exp((-2.15 * dt) / mass);
  state.vx = (state.vx + dx * spring * dt) * drag;
  state.vy = (state.vy + dy * spring * dt) * drag;
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  const afterDx = state.x - p.x,
    afterDy = state.y - p.y,
    distance = Math.max(1, Math.hypot(afterDx, afterDy)),
    maxLength = tether * 1.42;
  if (distance > maxLength) {
    const nx = afterDx / distance,
      ny = afterDy / distance,
      radial = state.vx * nx + state.vy * ny;
    state.x = p.x + nx * maxLength;
    state.y = p.y + ny * maxLength;
    if (radial > 0) {
      state.vx -= nx * radial * 1.45;
      state.vy -= ny * radial * 1.45;
    }
  }
  const speed = Math.hypot(state.vx, state.vy),
    radius = 9 + level * 1.35 + growth;
  state.speed = speed;
  state.radius = radius;
  state.tether = tether;
  state.flash = Math.max(0, (state.flash || 0) - dt);
  state.hits ??= new Map();
  if (speed >= 115) {
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.targetable === false) continue;
      if (Math.hypot(enemy.x - state.x, enemy.y - state.y) > enemy.r + radius)
        continue;
      const last = state.hits.get(enemy) || -Infinity;
      if (time - last < 0.24) continue;
      const before = enemy.hp,
        momentum = Math.min(2.5, Math.max(0.5, speed / 235)),
        razor = p.passives?.["razor-wire"] ? 1.22 : 1,
        damage = p.damage * (0.3 + level * 0.13) * momentum * mass * razor,
        push = Math.min(18, 5 + speed / 42);
      enemy.hp -= damage;
      enemy.flash = 0.08;
      enemy.x += (state.vx / Math.max(1, speed)) * push;
      enemy.y += (state.vy / Math.max(1, speed)) * push;
      state.hits.set(enemy, time);
      state.flash = 0.12;
      if (before > 0 && enemy.hp <= 0) state.scrap = (state.scrap || 0) + 1;
    }
  }
  if (speed >= 235) {
    let remaining = 1 + Math.floor((level - 1) / 3);
    for (const bullet of enemyBullets) {
      if (
        remaining <= 0 ||
        bullet.life <= 0 ||
        Math.hypot(bullet.x - state.x, bullet.y - state.y) >
          radius + (bullet.r || 0) + 5
      )
        continue;
      bullet.life = 0;
      remaining--;
      state.vx *= 0.84;
      state.vy *= 0.84;
      state.flash = 0.16;
    }
  }
  return state;
}

export function interceptAegisProjectiles(
  p,
  state,
  level,
  dt,
  enemies,
  enemyBullets,
) {
  const maxCharges = 1 + Math.floor((level - 1) / 2);
  state.shieldCharges ??= maxCharges;
  state.shieldRecharge = (state.shieldRecharge || 0) - dt;
  if (state.shieldCharges < maxCharges && state.shieldRecharge <= 0) {
    state.shieldCharges++;
    state.shieldRecharge = Math.max(0.32, 0.92 - level * 0.08);
  }
  const threat =
    nearestThreat(p.x, p.y, enemyBullets, 520) ||
    nearestThreat(p.x, p.y, enemies, 520);
  state.shieldAngle ??= 0;
  if (threat) {
    const target = Math.atan2(threat.y - p.y, threat.x - p.x);
    state.shieldAngle +=
      angleDelta(state.shieldAngle, target) * Math.min(1, dt * (8 + level));
  }
  const radius = p.r + 31 + level * 5,
    span = Math.min(Math.PI * 0.92, 1.5 + level * 0.13),
    intercepted = [];
  if (state.shieldCharges > 0) {
    for (const bullet of enemyBullets) {
      if (bullet.life <= 0 || state.shieldCharges <= 0) continue;
      const dx = bullet.x - p.x,
        dy = bullet.y - p.y,
        distance = Math.hypot(dx, dy),
        angle = Math.atan2(dy, dx);
      if (
        Math.abs(distance - radius) <= 14 + (bullet.r || 0) &&
        Math.abs(angleDelta(state.shieldAngle, angle)) <= span / 2
      ) {
        bullet.life = 0;
        state.shieldCharges--;
        state.shieldRecharge = Math.max(0.32, 0.92 - level * 0.08);
        state.shieldFlash = 0.16;
        intercepted.push({ x: bullet.x, y: bullet.y });
      }
    }
  }
  state.shieldFlash = Math.max(0, (state.shieldFlash || 0) - dt);
  state.shieldRadius = radius;
  state.shieldSpan = span;
  state.shieldMaxCharges = maxCharges;
  return intercepted;
}
