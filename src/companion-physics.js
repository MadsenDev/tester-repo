const angleDelta = (from, to) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

const validEnemy = (enemy) =>
  enemy && enemy.hp > 0 && enemy.targetable !== false;

const nearestThreat = (x, y, candidates, range, excluded = null) => {
  let best = null,
    bestDistance = range * range;
  for (const candidate of candidates) {
    if (
      candidate === excluded ||
      candidate.life <= 0 ||
      candidate.targetable === false ||
      (candidate.hp != null && candidate.hp <= 0)
    )
      continue;
    const distance = (candidate.x - x) ** 2 + (candidate.y - y) ** 2;
    if (candidate.arenaMarked && distance < bestDistance) return candidate;
    if (distance < bestDistance) {
      best = candidate;
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

const updateMovementCharge = (p, state, dt) => {
  const vx = p.vx || 0,
    vy = p.vy || 0,
    speed = Math.hypot(vx, vy),
    previousSpeed = Math.hypot(state.playerVx || 0, state.playerVy || 0);
  let turn = 0;
  if (speed > 70 && previousSpeed > 70) {
    const dot =
      (vx * (state.playerVx || 0) + vy * (state.playerVy || 0)) /
      (speed * previousSpeed);
    turn = (1 - Math.max(-1, Math.min(1, dot))) / 2;
  }
  state.charge = Math.max(
    0,
    Math.min(1, (state.charge || 0) + (speed / 460) * dt + turn * 0.5 - dt * 0.06),
  );
  state.playerVx = vx;
  state.playerVy = vy;
};

const launchAt = (p, state, target, level, ricochets) => {
  const dx = target.x - state.x,
    dy = target.y - state.y,
    distance = Math.max(1, Math.hypot(dx, dy)),
    guidance = p.passives?.["familiar-guidance"] ? 1.12 : 1,
    launchSpeed = (470 + level * 28 + (state.charge || 0) * 190) * guidance;
  state.mode = "outbound";
  state.target = target;
  state.attackTimer = 0;
  state.launchCharge = state.charge || 0;
  state.charge *= 0.35;
  state.ricochets = ricochets;
  state.vx = (dx / distance) * launchSpeed + (p.vx || 0) * 0.3;
  state.vy = (dy / distance) * launchSpeed + (p.vy || 0) * 0.3;
};

const returnToShip = (state) => {
  state.mode = "return";
  state.target = null;
  state.attackTimer = 0;
};

const addImpactFx = (p, state, radius) => {
  state.flash = 0.18;
  state.impactPulse = 0.2;
  state.impactX = state.x;
  state.impactY = state.y;
  p.weaponFx?.push({
    kind: "nova",
    x: state.x,
    y: state.y,
    radius,
    life: 0.18,
    max: 0.18,
    synergy: true,
  });
};

const applyShockwave = (p, state, level, enemies, primary) => {
  const ballast = p.passives?.ballast ? 12 : 0,
    radius = 34 + level * 9 + ballast,
    damage = p.damage * (0.1 + level * 0.04);
  for (const enemy of enemies) {
    if (!validEnemy(enemy) || enemy === primary) continue;
    if (Math.hypot(enemy.x - state.x, enemy.y - state.y) <= radius + enemy.r) {
      enemy.hp -= damage;
      enemy.flash = 0.09;
    }
  }
};

const hitWithNode = (p, state, level, enemy, enemies, speed, mass, time) => {
  const last = state.hits.get(enemy) ?? -Infinity;
  if (time - last < 0.24) return false;
  const activeSling = state.mode === "outbound",
    momentum = activeSling
      ? 1 + (state.launchCharge || 0) * 0.85 + Math.min(0.55, speed / 850)
      : 0.72 + Math.min(0.7, speed / 520),
    razor = p.passives?.["razor-wire"] ? 1.25 : 1,
    damage = p.damage * (0.72 + level * 0.28) * momentum * mass * razor,
    push = Math.min(26, 8 + speed / 34);
  enemy.hp -= damage;
  enemy.flash = 0.1;
  if (!enemy.boss) {
    enemy.x += (state.vx / Math.max(1, speed)) * push;
    enemy.y += (state.vy / Math.max(1, speed)) * push;
  }
  state.hits.set(enemy, time);
  state.impacts = (state.impacts || 0) + 1;
  addImpactFx(
    p,
    state,
    34 + level * 9 + (p.passives?.ballast ? 12 : 0),
  );
  applyShockwave(p, state, level, enemies, enemy);
  if (!activeSling) return true;
  const next =
    state.ricochets > 0
      ? nearestThreat(state.x, state.y, enemies, 290 + level * 15, enemy)
      : null;
  if (next) {
    state.ricochets--;
    state.charge = Math.max(state.charge || 0, 0.28);
    launchAt(p, state, next, level, state.ricochets);
  } else {
    returnToShip(state);
  }
  return true;
};

const updateTetherCut = (p, state, level, enemies, enemyBullets, time) => {
  state.tetherHits ??= new Map();
  const razor = p.passives?.["razor-wire"] ? 1.45 : 1,
    tetherDamage = p.damage * (0.16 + level * 0.045) * razor,
    ship = { x: p.x, y: p.y },
    node = { x: state.x, y: state.y };
  for (const enemy of enemies) {
    if (!validEnemy(enemy)) continue;
    const last = state.tetherHits.get(enemy) ?? -Infinity;
    if (
      time - last >= 0.32 &&
      distanceToSegment(enemy, ship, node) <= enemy.r + 5
    ) {
      enemy.hp -= tetherDamage;
      enemy.flash = 0.06;
      state.tetherHits.set(enemy, time);
    }
  }
  let cuts = level >= 2 || p.passives?.["razor-wire"] ? 1 : 0;
  for (const bullet of enemyBullets) {
    if (
      cuts > 0 &&
      bullet.life > 0 &&
      distanceToSegment(bullet, ship, node) <= (bullet.r || 0) + 4
    ) {
      bullet.life = 0;
      cuts--;
      state.flash = 0.1;
    }
  }
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
  }
  state.mode ??= "idle";
  state.cooldown ??= 0.25;
  state.hits ??= new Map();
  state.impacts ??= 0;
  updateMovementCharge(p, state, dt);
  const growth = Math.min(8, Math.floor(state.impacts / 5)),
    ballast = p.passives?.ballast ? 0.42 : 0,
    mass = 1 + level * 0.08 + growth * 0.05 + ballast,
    restingTether = 88 + level * 7 + growth * 3,
    radius = 10 + level * 1.5 + growth,
    previous = { x: state.x, y: state.y };
  state.cooldown -= dt;
  state.flash = Math.max(0, (state.flash || 0) - dt);
  state.impactPulse = Math.max(0, (state.impactPulse || 0) - dt);
  if (state.mode === "idle") {
    const dx = p.x - state.x,
      dy = p.y - state.y,
      spring = (11 + level * 0.7) / mass,
      drag = Math.exp((-2.05 * dt) / mass);
    state.vx = (state.vx + dx * spring * dt) * drag;
    state.vy = (state.vy + dy * spring * dt) * drag;
    const targetRange =
      390 + level * 24 + (p.passives?.["familiar-guidance"] ? 90 : 0);
    if (state.cooldown <= 0) {
      const target = nearestThreat(p.x, p.y, enemies, targetRange);
      if (target)
        launchAt(
          p,
          state,
          target,
          level,
          1 + Math.max(0, level - 1) +
            (p.passives?.["familiar-guidance"] ? 1 : 0),
        );
    }
  } else if (state.mode === "outbound") {
    state.attackTimer += dt;
    if (!validEnemy(state.target) || state.attackTimer > 0.95) {
      returnToShip(state);
    } else {
      const dx = state.target.x - state.x,
        dy = state.target.y - state.y,
        distance = Math.max(1, Math.hypot(dx, dy)),
        desiredSpeed = 500 + level * 30 + (state.launchCharge || 0) * 160,
        steering = Math.min(1, dt * (4.2 + level * 0.25));
      state.vx += ((dx / distance) * desiredSpeed - state.vx) * steering;
      state.vy += ((dy / distance) * desiredSpeed - state.vy) * steering;
    }
  } else {
    state.attackTimer += dt;
    const dx = p.x - state.x,
      dy = p.y - state.y,
      distance = Math.max(1, Math.hypot(dx, dy)),
      returnSpeed = 520 + level * 24,
      steering = Math.min(1, dt * 6.5);
    state.vx += ((dx / distance) * returnSpeed - state.vx) * steering;
    state.vy += ((dy / distance) * returnSpeed - state.vy) * steering;
    if (distance < 52 || state.attackTimer > 1.2) {
      state.mode = "idle";
      state.cooldown = Math.max(0.55, 1.35 - level * 0.09);
      state.vx *= 0.48;
      state.vy *= 0.48;
    }
  }
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  if (state.mode === "idle") {
    const dx = state.x - p.x,
      dy = state.y - p.y,
      distance = Math.max(1, Math.hypot(dx, dy)),
      maxLength = restingTether * 1.45;
    if (distance > maxLength) {
      state.x = p.x + (dx / distance) * maxLength;
      state.y = p.y + (dy / distance) * maxLength;
    }
  }
  const speed = Math.hypot(state.vx, state.vy);
  state.speed = speed;
  state.radius = radius;
  state.tether = Math.hypot(state.x - p.x, state.y - p.y);
  state.growth = growth;
  for (const enemy of enemies) {
    if (!validEnemy(enemy)) continue;
    if (distanceToSegment(enemy, previous, state) <= enemy.r + radius)
      hitWithNode(p, state, level, enemy, enemies, speed, mass, time);
  }
  updateTetherCut(p, state, level, enemies, enemyBullets, time);
  if (state.mode === "outbound" || speed >= 220) {
    let smashes = 1 + Math.floor((level - 1) / 3);
    for (const bullet of enemyBullets) {
      if (
        smashes > 0 &&
        bullet.life > 0 &&
        distanceToSegment(bullet, previous, state) <= radius + (bullet.r || 0) + 4
      ) {
        bullet.life = 0;
        smashes--;
        state.flash = 0.14;
      }
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
        intercepted.push({
          x: bullet.x,
          y: bullet.y,
          damage: bullet.damage,
          vx: bullet.vx,
          vy: bullet.vy,
        });
      }
    }
  }
  state.shieldFlash = Math.max(0, (state.shieldFlash || 0) - dt);
  state.shieldRadius = radius;
  state.shieldSpan = span;
  state.shieldMaxCharges = maxCharges;
  return intercepted;
}
