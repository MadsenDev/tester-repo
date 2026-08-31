import { hasSpecial } from "./special-modules.js";

const nearest = (x, y, enemies, range = Infinity) => {
  let best = null,
    bd = range * range;
  for (const e of enemies) {
    if (e.hp <= 0 || e.targetable === false) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
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
  p.companions ??= { blade: 0, shield: 0, ember: 0, wisp: 0, drone: 0 };
  p.companionState ??= { shots: {}, hits: {}, shieldCd: 0 };
}
export function updateCompanions(p, dt, enemies, bullets, time) {
  initCompanions(p);
  const c = p.companions,
    s = p.companionState,
    guided = hasSpecial(p, "familiar-guidance");
  s.shieldCd = Math.max(0, s.shieldCd - dt);
  const orbitCount = c.blade || 0;
  for (let i = 0; i < orbitCount; i++) {
    const velocityScale = hasSpecial(p, "razor-velocity")
        ? 1 + Math.min(0.55, Math.max(0, p.bulletSpeed / 520 - 1) * 1.5)
        : 1,
      a =
        time * (2.3 + 0.08 * orbitCount) * velocityScale +
        (i * Math.PI * 2) / orbitCount,
      x = p.x + Math.cos(a) * 48,
      y = p.y + Math.sin(a) * 48,
      key = `b${i}`;
    s.hits[key] ??= new Map();
    for (const e of enemies) {
      if (e.hp <= 0 || e.targetable === false) continue;
      const last = s.hits[key].get(e) || 0;
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
  if (c.shield && s.shieldCd <= 0) {
    const nova = hasSpecial(p, "aegis-nova"),
      electric = hasSpecial(p, "saint-elmo"),
      radius = p.r + 26 + c.shield * 4 + (nova ? 22 : 0),
      damage =
        p.damage *
        (0.18 + 0.05 * c.shield) *
        (nova ? 1.35 : 1) *
        (electric ? 1.25 : 1);
    damageNear(p.x, p.y, radius, damage, enemies);
    if (nova)
      p.weaponFx?.push({
        kind: "nova",
        x: p.x,
        y: p.y,
        radius,
        life: 0.14,
        max: 0.14,
        synergy: true,
      });
    s.shieldCd = Math.max(0.22, 0.62 - c.shield * 0.08);
  }
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
      x = p.x + Math.cos(a) * 48,
      y = p.y + Math.sin(a) * 48;
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
    ctx.save();
    ctx.strokeStyle = "#83eaff";
    ctx.shadowColor = "#83eaff";
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.3 + 0.12 * Math.sin(time * 6);
    ctx.lineWidth = 2 + c.shield * 0.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 20 + c.shield * 3, 0, Math.PI * 2);
    ctx.stroke();
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
