import { hasSpecial } from "./special-modules.js";
import {
  interceptAegisProjectiles,
  stepWreckingNode,
} from "./companion-physics.js";
import { captureAegisProjectile } from "./arena-modules.js";

const nearest = (x, y, enemies, range = Infinity) => {
  let best = null,
    bd = range * range;
  for (const e of enemies) {
    if ((e.hp != null && e.hp <= 0) || e.targetable === false) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (e.arenaMarked && d < bd) return e;
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
};
const damageNear = (x, y, r, damage, enemies) => {
  for (const e of enemies) {
    if (e.hp <= 0 || e.targetable === false) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < r + e.r) {
      e.hp -= damage;
      e.flash = 0.06;
    }
  }
};
export function initCompanions(p) {
  p.companions ??= {
    blade: 0,
    shield: 0,
    ember: 0,
    wisp: 0,
    drone: 0,
    wrecking: 0,
  };
  p.companionState ??= { shots: {}, hits: {}, blades: [] };
}
export function updateCompanions(
  p,
  dt,
  enemies,
  bullets,
  enemyBullets,
  time,
) {
  initCompanions(p);
  const c = p.companions,
    s = p.companionState,
    guided = hasSpecial(p, "familiar-guidance");
  const orbitCount = c.blade || 0;
  s.blades ??= [];
  for (let i = 0; i < orbitCount; i++) {
    const velocityScale = hasSpecial(p, "razor-velocity")
        ? 1 + Math.min(0.55, Math.max(0, p.bulletSpeed / 520 - 1) * 1.5)
        : 1,
      a =
        time * (2.3 + 0.08 * orbitCount) * velocityScale +
        (i * Math.PI * 2) / orbitCount,
      orbitRadius = 62 + orbitCount * 4,
      orbitX = p.x + Math.cos(a) * orbitRadius,
      orbitY = p.y + Math.sin(a) * orbitRadius,
      blade = (s.blades[i] ??= { cooldown: i * 0.12, progress: 0 }),
      key = `b${i}`;
    blade.cooldown -= dt;
    if (!blade.target && blade.cooldown <= 0) {
      const target = nearest(p.x, p.y, enemies, guided ? 590 : 500);
      if (target) {
        blade.target = target;
        blade.tx = target.x;
        blade.ty = target.y;
        blade.progress = 0;
      }
    }
    if (blade.target) {
      if (blade.target.hp > 0) {
        blade.tx = blade.target.x;
        blade.ty = blade.target.y;
      }
      blade.progress += dt * (1.32 + orbitCount * 0.04) * velocityScale;
      const reach = Math.sin(Math.min(1, blade.progress) * Math.PI);
      blade.x = orbitX + (blade.tx - orbitX) * reach;
      blade.y = orbitY + (blade.ty - orbitY) * reach;
      if (blade.progress >= 1) {
        blade.target = null;
        blade.cooldown =
          Math.max(0.42, 1.38 - orbitCount * 0.1) * (guided ? 0.72 : 1);
      }
    } else {
      blade.x = orbitX;
      blade.y = orbitY;
    }
    const x = blade.x,
      y = blade.y;
    s.hits[key] ??= new Map();
    for (const e of enemies) {
      if (e.hp <= 0 || e.targetable === false) continue;
      const last = s.hits[key].get(e) ?? -Infinity;
      if (time - last > 0.32 && Math.hypot(e.x - x, e.y - y) < e.r + 9) {
        const payloadScale = hasSpecial(p, "razor-payload")
          ? 1 + Math.min(0.5, Math.max(0, p.bulletSize / 4 - 1))
          : 1;
        e.hp -= p.damage * (0.38 + 0.07 * c.blade) * payloadScale;
        e.flash = 0.06;
        s.hits[key].set(e, time);
        if (hasSpecial(p, "orbital-prism")) {
          damageNear(x, y, 62, p.damage * 0.18, enemies);
          p.weaponFx?.push({
            kind: "beam",
            a: { x: p.x, y: p.y },
            b: { x, y },
            width: 4,
            life: 0.1,
            max: 0.1,
            synergy: true,
          });
        }
      }
    }
  }
  if (c.shield) {
    const nova = hasSpecial(p, "aegis-nova"),
      electric = hasSpecial(p, "saint-elmo"),
      intercepted = interceptAegisProjectiles(
        p,
        s,
        c.shield,
        dt,
        enemies,
        enemyBullets,
    );
    for (const hit of intercepted) {
      captureAegisProjectile(p, hit);
      const radius = 44 + c.shield * 5 + (nova ? 20 : 0),
        damage =
          p.damage *
          (0.18 + 0.05 * c.shield) *
          (nova ? 1.35 : 1) *
          (electric ? 1.25 : 1);
      damageNear(hit.x, hit.y, radius, damage, enemies);
      if (nova || electric)
        p.weaponFx?.push({
          kind: "nova",
          x: hit.x,
          y: hit.y,
          radius,
          life: 0.14,
          max: 0.14,
          synergy: true,
        });
    }
  }
  if (c.wrecking)
    stepWreckingNode(
      p,
      (s.wrecking ??= {}),
      c.wrecking,
      dt,
      enemies,
      enemyBullets,
      time,
    );
  if (c.ember) {
    s.shots.ember = (s.shots.ember || 0) - dt;
    if (s.shots.ember <= 0) {
      const t = nearest(p.x, p.y, enemies, guided ? 420 : 330);
      if (t) {
        const a = Math.atan2(t.y - p.y, t.x - p.x),
          speed = 380;
        bullets.push({
          kind: "familiar-ember",
          x: p.x + Math.cos(time * 1.7) * 30,
          y: p.y + Math.sin(time * 1.7) * 30,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          r: 3.5,
          life: 1.6,
          pierce: 0,
          damage: p.damage * (0.42 + 0.08 * c.ember),
          companionArc: hasSpecial(p, "ember-arc"),
        });
        s.shots.ember =
          Math.max(0.38, 1.05 - c.ember * 0.12) * (guided ? 0.72 : 1);
      }
    }
  }
  if (c.wisp) {
    s.shots.wisp = (s.shots.wisp || 0) - dt;
    if (s.shots.wisp <= 0) {
      const t = nearest(p.x, p.y, enemies, guided ? 330 : 260);
      if (t) {
        const anchored = hasSpecial(p, "wisp-anchor");
        damageNear(
          t.x,
          t.y,
          42 + c.wisp * 5 + (anchored ? 18 : 0),
          p.damage * (0.24 + 0.06 * c.wisp),
          enemies,
        );
        bullets.push({
          kind: "familiar-pulse",
          x: t.x,
          y: t.y,
          vx: 0,
          vy: 0,
          r: 18 + c.wisp * 3,
          life: 0.18,
          pierce: 99,
          damage: 0,
        });
        if (anchored)
          bullets.push({
            kind: "synergy-anchor",
            x: t.x,
            y: t.y,
            vx: 0,
            vy: 0,
            r: 2,
            life: 0.72,
            timer: 0.55,
            pierce: 99,
            damage: 0,
            anchorPower: p.damage * 0.45,
            anchorRadius: 94,
            hit: new Set(),
          });
        s.shots.wisp =
          Math.max(0.7, 1.65 - c.wisp * 0.16) * (guided ? 0.72 : 1);
      }
    }
  }
  if (c.drone) {
    s.shots.drone = (s.shots.drone || 0) - dt;
    if (s.shots.drone <= 0) {
      const t = nearest(p.x, p.y, enemies, guided ? 500 : 420);
      if (t) {
        const a = Math.atan2(t.y - p.y, t.x - p.x),
          speed = p.bulletSpeed * 0.82,
          offsets = hasSpecial(p, "drone-fork") ? [-0.14, 0, 0.14] : [0];
        for (const offset of offsets)
          bullets.push({
            kind: "familiar-drone",
            x: p.x + Math.cos(time * 0.9 + 2.1) * 36,
            y: p.y + Math.sin(time * 0.9 + 2.1) * 36,
            vx: Math.cos(a + offset) * speed,
            vy: Math.sin(a + offset) * speed,
            r: 3,
            life: 1.8,
            pierce: Math.min(1, p.pierce),
            damage:
              p.damage *
              (0.3 + 0.05 * c.drone) *
              (offsets.length > 1 ? 0.58 : 1),
          });
        s.shots.drone =
          Math.max(0.3, 0.92 - c.drone * 0.1) * (guided ? 0.78 : 1);
      }
    }
  }
}
export function onCompanionProjectileHit(bullet, enemy, enemies, weaponFx) {
  if (!bullet.companionArc) return;
  const targets = enemies
    .filter(
      (candidate) =>
        candidate !== enemy &&
        candidate.hp > 0 &&
        candidate.targetable !== false &&
        Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) < 170,
    )
    .sort(
      (a, b) =>
        (a.x - enemy.x) ** 2 +
        (a.y - enemy.y) ** 2 -
        ((b.x - enemy.x) ** 2 + (b.y - enemy.y) ** 2),
    )
    .slice(0, 2);
  for (const target of targets) {
    target.hp -= bullet.damage * 0.3;
    target.flash = 0.06;
  }
  if (targets.length)
    weaponFx?.push({
      kind: "arc",
      points: [
        { x: enemy.x, y: enemy.y },
        ...targets.map(({ x, y }) => ({ x, y })),
      ],
      life: 0.14,
      max: 0.14,
      synergy: true,
    });
}
export function companionLabel(p) {
  initCompanions(p);
  const c = p.companions,
    n = [];
  if (c.blade) n.push(`RAZOR ${c.blade}`);
  if (c.shield) n.push(`AEGIS ${c.shield}`);
  if (c.ember) n.push(`EMBER ${c.ember}`);
  if (c.wisp) n.push(`WISP ${c.wisp}`);
  if (c.drone) n.push(`GUNDRONE ${c.drone}`);
  if (c.wrecking) n.push(`WRECKING NODE ${c.wrecking}`);
  return n.join(" · ");
}
export function drawCompanions(ctx, p, time) {
  if (!p?.companions) return;
  const c = p.companions,
    velocityScale = hasSpecial(p, "razor-velocity")
      ? 1 + Math.min(0.55, Math.max(0, p.bulletSpeed / 520 - 1) * 1.5)
      : 1;
  for (let i = 0; i < c.blade; i++) {
    const a =
        time * (2.3 + 0.08 * c.blade) * velocityScale +
        (i * Math.PI * 2) / c.blade,
      fallbackRadius = 62 + c.blade * 4,
      blade = p.companionState?.blades?.[i],
      x = blade?.x ?? p.x + Math.cos(a) * fallbackRadius,
      y = blade?.y ?? p.y + Math.sin(a) * fallbackRadius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = "#fff1a8";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffd95a";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(5, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (c.shield) {
    const state = p.companionState || {},
      radius = state.shieldRadius || p.r + 31 + c.shield * 5,
      span = state.shieldSpan || 1.5 + c.shield * 0.13,
      angle = state.shieldAngle || 0,
      charges = state.shieldCharges ?? 1,
      maxCharges = state.shieldMaxCharges || 1;
    ctx.save();
    ctx.strokeStyle = state.shieldFlash > 0 ? "#ffffff" : "#83eaff";
    ctx.shadowColor = "#83eaff";
    ctx.shadowBlur = state.shieldFlash > 0 ? 24 : 14;
    ctx.globalAlpha = charges ? 0.66 + 0.14 * Math.sin(time * 6) : 0.18;
    ctx.lineWidth = 4 + c.shield * 0.7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, angle - span / 2, angle + span / 2);
    ctx.stroke();
    for (let i = 0; i < maxCharges; i++) {
      const pipAngle = angle - span / 2 + ((i + 1) * span) / (maxCharges + 1);
      ctx.fillStyle = i < charges ? "#dffff6" : "rgba(131,234,255,.18)";
      ctx.beginPath();
      ctx.arc(
        p.x + Math.cos(pipAngle) * radius,
        p.y + Math.sin(pipAngle) * radius,
        2.6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
  if (c.wrecking && p.companionState?.wrecking) {
    const node = p.companionState.wrecking,
      speedGlow = Math.min(1, (node.speed || 0) / 420),
      charge = node.charge || 0,
      slinging = node.mode === "outbound" || node.mode === "return",
      radius = node.radius || 10;
    ctx.save();
    ctx.strokeStyle = slinging
      ? `rgba(120,235,255,${0.62 + speedGlow * 0.3})`
      : `rgba(210,145,255,${0.36 + charge * 0.42})`;
    ctx.shadowColor = slinging ? "#78ebff" : "#c991ff";
    ctx.shadowBlur = slinging ? 12 : 5 + charge * 8;
    ctx.lineWidth = 2 + speedGlow * 2 + (c.wrecking >= 2 ? 1 : 0);
    if (!slinging) ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(node.x, node.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(node.x, node.y);
    ctx.rotate(time * (1.6 + speedGlow * 5));
    ctx.shadowColor = node.flash > 0 ? "#ffffff" : "#c991ff";
    ctx.shadowBlur = 14 + speedGlow * 22 + charge * 10;
    ctx.fillStyle = node.flash > 0 ? "#ffffff" : slinging ? "#8ef4ff" : "#c991ff";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10,
        r = i % 2 ? radius * 0.72 : radius;
      i
        ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#311b47";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3, radius * 0.36), 0, Math.PI * 2);
    ctx.fill();
    if (charge > 0.08) {
      ctx.rotate(-time * (1.6 + speedGlow * 5));
      ctx.strokeStyle = `rgba(255,230,128,${0.25 + charge * 0.7})`;
      ctx.lineWidth = 1.5 + charge * 2;
      ctx.shadowColor = "#ffe680";
      ctx.shadowBlur = 8 + charge * 12;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5 + charge * 4, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  const fam = [
    c.ember && ["#ffb45f", time * 1.7, 30, 4],
    c.wisp && ["#c991ff", time * 1.25 + 2, 34, 5],
    c.drone && ["#78ebff", time * 0.9 + 2.1, 36, 5],
  ].filter(Boolean);
  for (const [color, a, r, size] of fam) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
