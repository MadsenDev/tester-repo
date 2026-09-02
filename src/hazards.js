import { dist2, particle } from "./entities.js";
import { sectorIndex } from "./world.js";

export function createHazardState() {
  return {
    sector: -1,
    objects: [],
    flare: 0,
    beam: null,
    pulse: 0,
    nullActive: false,
    nullPlayerX: 0,
    nullPlayerY: 0,
  };
}

function asteroidAt(
  x,
  y,
  tier = 2,
  vx = (Math.random() - 0.5) * 18,
  vy = 10 + Math.random() * 16,
) {
  const r =
      tier === 2
        ? 30 + Math.random() * 14
        : tier === 1
          ? 18 + Math.random() * 5
          : 9 + Math.random() * 3,
    hp = tier === 2 ? 90 : tier === 1 ? 38 : 12;
  return {
    kind: "asteroid",
    x,
    y,
    r,
    tier,
    hp,
    hpMax: hp,
    vx,
    vy,
    phase: Math.random() * 6.28,
    spin: (Math.random() - 0.5) * 1.1,
    impactCd: 0,
  };
}
function safeAsteroid(W, H, player) {
  let x, y;
  for (let tries = 0; tries < 30; tries++) {
    x = 80 + Math.random() * Math.max(1, W - 160);
    y = 120 + Math.random() * Math.max(1, H - 180);
    if (!player || Math.hypot(x - player.x, y - player.y) > 190)
      return asteroidAt(x, y);
  }
  return asteroidAt(Math.random() < 0.5 ? 60 : W - 60, 120);
}
function splitAsteroid(o, objects, particles) {
  for (let i = 0; i < 12 + o.tier * 5; i++)
    particles.push(particle(o.x, o.y, "spark"));
  if (o.tier <= 0) return;
  const count = o.tier === 2 ? 2 + Math.floor(Math.random() * 2) : 2;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 28 + Math.random() * 35;
    objects.push(
      asteroidAt(
        o.x + Math.cos(a) * o.r * 0.3,
        o.y + Math.sin(a) * o.r * 0.3,
        o.tier - 1,
        o.vx + Math.cos(a) * s,
        o.vy + Math.sin(a) * s,
      ),
    );
  }
}
function roamingNull(W, H) {
  const r = Math.min(86, Math.max(62, Math.min(W, H) * 0.14)),
    a = 0.45 + Math.random() * 1.1,
    s = 22 + Math.random() * 7;
  return {
    kind: "null",
    x: Math.max(r + 14, Math.min(W - r - 14, W * 0.32)),
    y: Math.max(r + 14, Math.min(H - r - 14, H * 0.38)),
    r,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s,
    phase: Math.random() * 6.28,
  };
}

export function resetHazards(state, time, W, H, player) {
  const idx = sectorIndex(time);
  if (state.sector === idx) return;
  state.sector = idx;
  state.objects = [];
  state.flare = 0;
  state.beam = null;
  state.pulse = 0;
  state.nullActive = false;
  if (idx === 0)
    for (let i = 0; i < 7; i++) state.objects.push(safeAsteroid(W, H, player));
  if (idx === 2)
    for (let i = 0; i < 3; i++)
      state.objects.push({
        kind: "gravity",
        x: 100 + Math.random() * (W - 200),
        y: 150 + Math.random() * (H - 260),
        r: 80 + Math.random() * 35,
        phase: Math.random() * 6.28,
      });
  if (idx === 3) state.objects.push(roamingNull(W, H));
}

export function updateHazards(
  state,
  dt,
  { time, W, H, player, bullets, enemyBullets, enemies, particles, hurt },
) {
  resetHazards(state, time, W, H, player);
  const idx = state.sector;
  if (idx === 0) {
    for (let oi = state.objects.length - 1; oi >= 0; oi--) {
      const o = state.objects[oi];
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.phase += o.spin * dt;
      o.impactCd = Math.max(0, o.impactCd - dt);
      if (o.y > H + 60) o.y = -60;
      if (o.x < -60) o.x = W + 60;
      if (o.x > W + 60) o.x = -60;
      for (const b of bullets) {
        if (b.life > 0 && dist2(o, b) < (o.r + b.r) ** 2) {
          o.hp -= b.damage;
          b.life = 0;
          for (let i = 0; i < 3; i++)
            particles.push(particle(b.x, b.y, "spark"));
        }
      }
      if (o.hp <= 0) {
        splitAsteroid(o, state.objects, particles);
        state.objects.splice(oi, 1);
        continue;
      }
      if (o.impactCd <= 0 && dist2(o, player) < (o.r + player.r) ** 2) {
        hurt(8 + o.tier * 3);
        o.impactCd = 0.55;
        const dx = o.x - player.x,
          dy = o.y - player.y,
          d = Math.max(1, Math.hypot(dx, dy));
        o.vx += (dx / d) * 55;
        o.vy += (dy / d) * 55;
      }
    }
  }
  if (idx === 1) {
    state.flare = (Math.sin(time * 0.72) + 1) / 2;
    if (state.flare > 0.82) {
      const edge = H * (0.18 + 0.08 * Math.sin(time * 0.21));
      if (player.y < edge || player.y > H - edge) hurt(9 * dt * 6);
      for (const e of enemies)
        if (e.y < edge || e.y > H - edge) e.hp -= 12 * dt;
    }
  }
  if (idx === 2) {
    for (const o of state.objects) {
      o.phase += dt;
      for (const list of [bullets, enemyBullets])
        for (const b of list) {
          const dx = o.x - b.x,
            dy = o.y - b.y,
            d = Math.max(20, Math.hypot(dx, dy));
          if (d < o.r * 1.8) {
            const f = (1 - d / (o.r * 1.8)) * 115;
            b.vx += (dx / d) * f * dt;
            b.vy += (dy / d) * f * dt;
          }
        }
    }
  }
  if (idx === 3) {
    const o = state.objects[0];
    if (o) {
      o.phase += dt * 0.7;
      const steer = Math.sin(time * 0.38 + o.phase) * 5;
      o.vx += Math.cos(o.phase) * steer * dt;
      o.vy += Math.sin(o.phase * 0.83) * steer * dt;
      const speed = Math.hypot(o.vx, o.vy),
        max = 31;
      if (speed > max) {
        o.vx = (o.vx / speed) * max;
        o.vy = (o.vy / speed) * max;
      }
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      const m = o.r + 10;
      if (o.x < m) {
        o.x = m;
        o.vx = Math.abs(o.vx);
      } else if (o.x > W - m) {
        o.x = W - m;
        o.vx = -Math.abs(o.vx);
      }
      if (o.y < m) {
        o.y = m;
        o.vy = Math.abs(o.vy);
      } else if (o.y > H - m) {
        o.y = H - m;
        o.vy = -Math.abs(o.vy);
      }
      state.nullActive = dist2(o, player) < o.r * o.r;
      state.nullPlayerX = player.x;
      state.nullPlayerY = player.y;
      player.nullified = state.nullActive;
    } else {
      state.nullActive = false;
      player.nullified = false;
    }
  } else {
    state.nullActive = false;
    player.nullified = false;
  }
  if (idx === 4) {
    state.pulse -= dt;
    if (state.pulse <= 0) {
      const vertical = Math.floor(time / 4) % 2 === 0,
        pos = vertical
          ? W * (0.2 + Math.random() * 0.6)
          : H * (0.22 + Math.random() * 0.56);
      state.beam = { vertical, pos, warn: 1.05, active: 0.55 };
      state.pulse = 3.1;
    }
    if (state.beam) {
      state.beam.warn -= dt;
      if (state.beam.warn <= 0) {
        state.beam.active -= dt;
        const d = state.beam.vertical
          ? Math.abs(player.x - state.beam.pos)
          : Math.abs(player.y - state.beam.pos);
        if (d < 18) hurt(18 * dt * 5);
        for (const e of enemies) {
          const ed = state.beam.vertical
            ? Math.abs(e.x - state.beam.pos)
            : Math.abs(e.y - state.beam.pos);
          if (ed < 18) e.hp -= 34 * dt;
        }
      }
      if (state.beam.active <= 0) state.beam = null;
    }
  }
}

function drawAsteroid(ctx, o) {
  const damage = 1 - o.hp / o.hpMax;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.phase);
  ctx.strokeStyle = damage > 0.55 ? "#b7c6cd" : "#7894a6";
  ctx.fillStyle = "#182632";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7,
      r = o.r * (0.78 + (i % 3) * 0.1),
      x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (damage > 0.2) {
    ctx.strokeStyle = `rgba(190,215,224,${0.35 + damage * 0.55})`;
    ctx.lineWidth = 1.5;
    const cracks = damage > 0.65 ? 4 : 2;
    for (let i = 0; i < cracks; i++) {
      const a = i * 2.1 + o.phase * 0.17;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * o.r * 0.12, Math.sin(a) * o.r * 0.12);
      ctx.lineTo(
        Math.cos(a + 0.18) * o.r * 0.48,
        Math.sin(a + 0.18) * o.r * 0.48,
      );
      ctx.lineTo(
        Math.cos(a - 0.12) * o.r * 0.76,
        Math.sin(a - 0.12) * o.r * 0.76,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}
function drawNullField(ctx, o, time, active) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 4.2);
  ctx.save();
  const gradient = ctx.createRadialGradient(o.x, o.y, o.r * 0.1, o.x, o.y, o.r);
  gradient.addColorStop(
    0,
    active ? "rgba(95,255,214,.2)" : "rgba(95,255,214,.11)",
  );
  gradient.addColorStop(0.7, "rgba(46,160,142,.08)");
  gradient.addColorStop(1, "rgba(32,110,102,.02)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = active ? "#b7ffe9" : "#79ffd2";
  ctx.lineWidth = active ? 3 : 2;
  ctx.globalAlpha = active ? 0.9 : 0.58;
  ctx.setLineDash([7, 8]);
  ctx.lineDashOffset = -time * 18;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.28 + 0.18 * pulse;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.42;
  for (let i = -2; i <= 2; i++) {
    const yy = o.y + i * 15,
      half = Math.sqrt(Math.max(0, o.r * o.r - (yy - o.y) * (yy - o.y)));
    ctx.beginPath();
    ctx.moveTo(o.x - half * 0.72, yy);
    ctx.lineTo(o.x + half * 0.72, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.92;
  ctx.translate(o.x, o.y);
  ctx.rotate(-0.12);
  ctx.strokeStyle = active ? "#e8fff9" : "#a9ffe8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -4, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-19, 15);
  ctx.lineTo(19, -23);
  ctx.stroke();
  ctx.rotate(0.12);
  ctx.font = "800 8px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = active ? "#eafff9" : "#9fffe3";
  ctx.fillText("WEAPONS OFFLINE", 0, 35);
  ctx.restore();
}
export function drawHazards(ctx, state, time, W, H) {
  if (state.sector === 0) for (const o of state.objects) drawAsteroid(ctx, o);
  if (state.sector === 1 && state.flare > 0.55) {
    const a = Math.max(0, (state.flare - 0.55) / 0.45),
      edge = H * (0.18 + 0.08 * Math.sin(time * 0.21));
    ctx.fillStyle = `rgba(255,91,55,${0.08 + a * 0.18})`;
    ctx.fillRect(0, 0, W, edge);
    ctx.fillRect(0, H - edge, W, edge);
  }
  if (state.sector === 2)
    for (const o of state.objects) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "#c687ff";
      ctx.lineWidth = 2;
      for (let r = o.r * 0.35; r < o.r; r += 18) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  if (state.sector === 3) {
    for (const o of state.objects)
      drawNullField(ctx, o, time, state.nullActive);
    if (state.nullActive) {
      const x = state.nullPlayerX,
        y = Math.max(34, state.nullPlayerY - 34),
        label = "FIRE CONTROL JAMMED";
      ctx.save();
      ctx.font = "900 8px system-ui";
      ctx.textAlign = "center";
      const w = ctx.measureText(label).width + 18;
      ctx.fillStyle = "rgba(2,18,19,.82)";
      ctx.fillRect(x - w / 2, y - 10, w, 17);
      ctx.strokeStyle = "rgba(121,255,210,.65)";
      ctx.strokeRect(x - w / 2, y - 10, w, 17);
      ctx.fillStyle = "#b7ffe9";
      ctx.fillText(label, x, y + 2);
      ctx.restore();
    }
  }
  if (state.sector === 4 && state.beam) {
    const b = state.beam,
      warning = b.warn > 0;
    ctx.save();
    ctx.globalAlpha = warning ? 0.28 : 0.75;
    ctx.fillStyle = warning ? "#ff668f" : "#fff0f4";
    if (b.vertical)
      ctx.fillRect(b.pos - (warning ? 3 : 16), 0, warning ? 6 : 32, H);
    else ctx.fillRect(0, b.pos - (warning ? 3 : 16), W, warning ? 6 : 32);
    ctx.restore();
  }
}
