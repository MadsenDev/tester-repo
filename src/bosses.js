import { spawnEnemyProjectile, particle } from "./entities.js";
import {
  applyBossDifficulty,
  bossDifficulty,
  predictiveTarget,
  tuneBossProjectiles,
} from "./boss-difficulty.js";
import {
  beginBossPhaseGate,
  updateBossCounterplay,
} from "./boss-counterplay.js";
import {
  fireSideVolley,
  publishBossArena,
  queueBlastZones,
  queueRail,
  updateBlastZones,
  updateRails,
} from "./boss-arena-attacks.js";

export const BOSSES = [
  {
    kind: "warden",
    name: "THE WARDEN",
    color: "#ff547c",
    r: 40,
    s: 30,
    hp: 900,
    d: 30,
  },
  {
    kind: "harrower",
    name: "HARROWER",
    color: "#ff9b5d",
    r: 34,
    s: 38,
    hp: 980,
    d: 34,
  },
  {
    kind: "prism",
    name: "PRISMATIC EYE",
    color: "#8ee8ff",
    r: 37,
    s: 28,
    hp: 1080,
    d: 30,
  },
  {
    kind: "singularity",
    name: "SINGULARITY",
    color: "#c77dff",
    r: 42,
    s: 24,
    hp: 1180,
    d: 28,
  },
  {
    kind: "crown",
    name: "THE CROWN",
    color: "#ffe06a",
    r: 46,
    s: 27,
    hp: 1380,
    d: 36,
  },
  {
    kind: "leviathan",
    name: "LEVIATHAN",
    color: "#6dffca",
    r: 150,
    s: 0,
    hp: 1750,
    d: 40,
  },
  {
    kind: "brood",
    name: "THE BROODMIND",
    color: "#b7ff65",
    r: 44,
    s: 28,
    hp: 1480,
    d: 24,
  },
  {
    kind: "mirror",
    name: "THE MIRROR ENGINE",
    color: "#ff8bd8",
    r: 40,
    s: 31,
    hp: 1580,
    d: 30,
  },
  {
    kind: "lastlight",
    name: "THE LAST LIGHT",
    color: "#fff19a",
    r: 51,
    s: 29,
    hp: 1900,
    d: 40,
  },
  {
    kind: "architect",
    name: "GRID ARCHITECT",
    color: "#72f4ff",
    r: 45,
    s: 26,
    hp: 1710,
    d: 34,
  },
];
function edgeSpawn(w, h) {
  const side = Math.floor(Math.random() * 4),
    m = 80;
  if (side === 0) return { x: Math.random() * w, y: -m };
  if (side === 1) return { x: w + m, y: Math.random() * h };
  if (side === 2) return { x: Math.random() * w, y: h + m };
  return { x: -m, y: Math.random() * h };
}
export function spawnBoss(w, h, time, difficulty = "normal") {
  const minute = Math.max(1, Math.floor(time / 60)),
    bossIndex = (minute - 1) % BOSSES.length,
    base = BOSSES[bossIndex],
    pos = base.kind === "leviathan" ? { x: w / 2, y: -92 } : edgeSpawn(w, h),
    scale = 1 + (minute - 1) * 0.18,
    durability =
      bossIndex >= 2 ? 1.55 + Math.min(0.55, (bossIndex - 2) * 0.12) : 1,
    hp = base.hp * scale * durability;
  return applyBossDifficulty(
    {
      ...pos,
      px: pos.x,
      py: pos.y,
      ...base,
      hp,
      hpMax: hp,
      boss: true,
      bossName: base.name,
      bossOrder: bossIndex + 1,
      behavior: "boss",
      v: 280 + minute * 35,
      flash: 0,
      phase: Math.random() * 6.28,
      shootCd: 0.7,
      chargeCd: 1.7,
      telegraph: 0,
      dashTime: 0,
      dashVx: 0,
      dashVy: 0,
      elite: false,
      bossPhase: 1,
      phaseFlash: 0,
      blastCd: 2.6,
      blastZones: [],
      arenaW: w,
      arenaH: h,
      sideWarnings: [],
      sideVolleyCd: 1.1,
      railCd: 2.8,
      sideFlip: Math.random() < 0.5 ? -1 : 1,
      summonCd: 2.4,
      summonBurst: 0,
      phaseGate: 0,
      positionTests: [],
      positionTestCd: 3.6,
      positionTestFlip: false,
    },
    difficulty,
  );
}
export function updateBoss(
  e,
  dt,
  { player, enemyBullets, particles, time, onHazard, onShake },
) {
  const tuning = e.bossTuning || bossDifficulty(e.bossDifficulty),
    tempoDt = dt * tuning.tempo,
    projectileStart = enemyBullets.length,
    target = predictiveTarget(player, tuning, e.arenaW, e.arenaH),
    finishAttacks = () =>
      tuneBossProjectiles(enemyBullets, projectileStart, tuning),
    ratio = e.hp / e.hpMax;
  if (ratio <= tuning.phaseThreshold && e.bossPhase === 1) {
    e.bossPhase = 2;
    e.phaseFlash = 1.4;
    e.shootCd = 0;
    e.chargeCd = 0;
    e.railCd = 0.4;
    e.summonCd = 0.35;
    beginBossPhaseGate(e);
    onShake(12);
    for (let i = 0; i < 28; i++) particles.push(particle(e.x, e.y, "boss"));
  }
  e.phaseFlash = Math.max(0, e.phaseFlash - tempoDt);
  updateBossCounterplay(e, tempoDt, player, onHazard, onShake);
  const rage = e.bossPhase === 2;
  e.summonBurst = Math.max(0, e.summonBurst - tempoDt);
  publishBossArena(e);
  const dx = player.x - e.x,
    dy = player.y - e.y,
    d = Math.max(1, Math.hypot(dx, dy)),
    nx = dx / d,
    ny = dy / d,
    wasTelegraph = e.telegraph;
  e.shootCd -= tempoDt;
  e.chargeCd -= tempoDt;
  e.telegraph = Math.max(0, e.telegraph - tempoDt);
  e.dashTime = Math.max(0, e.dashTime - tempoDt);
  e.blastCd -= tempoDt;
  updateBlastZones(e, tempoDt, enemyBullets, particles, onShake);
  if (e.kind === "leviathan") {
    e.x = e.arenaW / 2;
    e.y = -92;
    e.sideVolleyCd -= tempoDt;
    e.railCd -= tempoDt;
    updateRails(e, tempoDt, enemyBullets, onShake);
    if (e.sideVolleyCd <= 0) {
      fireSideVolley(e, target, enemyBullets, rage);
      e.sideVolleyCd = rage ? 1.05 : 1.45;
    }
    if (e.railCd <= 0) {
      queueRail(e, target, rage);
      e.railCd = rage ? 2.6 : 3.5;
    }
    finishAttacks();
    return;
  }
  if (e.kind === "brood") {
    const radial = d > 245 ? 1 : d < 190 ? -0.55 : 0,
      tangent = Math.sin(e.phase) > 0.0 ? 1 : -1;
    e.x += (nx * radial - ny * 0.34 * tangent) * e.s * dt;
    e.y += (ny * radial + nx * 0.34 * tangent) * e.s * dt;
    e.summonCd -= tempoDt;
    if (e.summonCd <= 0) {
      e.summonBurst = rage ? 1.55 : 1.15;
      e.summonCd = rage ? 3.7 : 5.0;
      onShake(5);
      for (let i = 0; i < 16; i++) particles.push(particle(e.x, e.y, "boss"));
    }
    if (e.shootCd <= 0) {
      const base = Math.atan2(target.y - e.y, target.x - e.x),
        count = rage ? 5 : 3;
      for (let i = 0; i < count; i++)
        enemyBullets.push(
          spawnEnemyProjectile(
            e.x,
            e.y,
            base + (i - (count - 1) / 2) * 0.28,
            rage ? 205 : 175,
            10,
            4,
            5,
          ),
        );
      e.shootCd = rage ? 1.25 : 1.75;
    }
    finishAttacks();
    return;
  }
  if (e.kind === "warden") {
    const radial = d > 220 ? 1 : d < 155 ? -0.5 : 0;
    e.x += (nx * radial - ny * (rage ? 0.58 : 0.38)) * e.s * dt;
    e.y += (ny * radial + nx * (rage ? 0.58 : 0.38)) * e.s * dt;
    if (e.shootCd <= 0) {
      const count = rage ? 18 : 14,
        gaps = rage ? 1 : 2,
        gap = Math.floor((time * (rage ? 1.35 : 0.8)) % count);
      for (let i = 0; i < count; i++) {
        let skip = false;
        for (let g = 0; g < gaps; g++) if (i === (gap + g) % count) skip = true;
        if (!skip)
          enemyBullets.push(
            spawnEnemyProjectile(
              e.x,
              e.y,
              (i * Math.PI * 2) / count + time * 0.22,
              rage ? 185 : 155,
              12,
              5,
              7,
            ),
          );
      }
      e.shootCd = rage ? 0.82 : 1.25;
      onShake(4);
    }
  } else if (e.kind === "harrower") {
    if (wasTelegraph > 0 && e.telegraph === 0) e.dashTime = rage ? 0.52 : 0.42;
    if (e.dashTime > 0) {
      e.x += e.dashVx * dt;
      e.y += e.dashVy * dt;
    } else if (e.telegraph <= 0) {
      e.x += nx * e.s * dt;
      e.y += ny * e.s * dt;
    }
    if (e.chargeCd <= 0 && e.dashTime <= 0 && e.telegraph <= 0) {
      e.telegraph = rage ? 0.4 : 0.6;
      e.chargeCd = rage ? 1.35 : 2.5;
      const a = Math.atan2(target.y - e.y, target.x - e.x);
      e.dashVx = Math.cos(a) * (rage ? 520 : 430);
      e.dashVy = Math.sin(a) * (rage ? 520 : 430);
    }
    if (e.shootCd <= 0) {
      for (let i = -2; i <= 2; i++)
        enemyBullets.push(
          spawnEnemyProjectile(
            e.x,
            e.y,
            Math.atan2(target.y - e.y, target.x - e.x) + i * 0.18,
            rage ? 245 : 205,
            11,
            4,
            5,
          ),
        );
      e.shootCd = rage ? 1.05 : 1.7;
    }
  } else if (e.kind === "prism") {
    const radial = d > 275 ? 1 : d < 200 ? -0.6 : 0;
    e.x += (nx * radial - ny * (rage ? 0.42 : 0.28)) * e.s * dt;
    e.y += (ny * radial + nx * (rage ? 0.42 : 0.28)) * e.s * dt;
    if (e.shootCd <= 0) {
      const base = Math.atan2(target.y - e.y, target.x - e.x),
        spread = rage ? 4 : 3,
        spacing = rage ? 0.17 : 0.2;
      for (let i = -spread; i <= spread; i++)
        enemyBullets.push(
          spawnEnemyProjectile(
            e.x,
            e.y,
            base + i * spacing,
            rage ? 255 : 225,
            11,
            4,
            5,
          ),
        );
      e.shootCd = rage ? 0.9 : 1.32;
      onShake(3);
    }
    if (e.blastCd <= 0) {
      queueBlastZones(e, target, rage);
      e.blastCd = rage ? 2.8 : 3.7;
    }
  } else if (e.kind === "singularity") {
    const radial = d > 190 ? 1 : d < 135 ? -0.45 : 0;
    e.x += (nx * radial - ny * 0.5) * e.s * dt;
    e.y += (ny * radial + nx * 0.5) * e.s * dt;
    if (d < 390) {
      const force =
        (1 - d / 390) *
        (rage ? 62 : 36) *
        (rage && Math.floor(time / 3) % 2 ? -1 : 1);
      player.x -= nx * force * dt;
      player.y -= ny * force * dt;
    }
    if (e.shootCd <= 0) {
      const count = rage ? 16 : 12;
      for (let i = 0; i < count; i++)
        enemyBullets.push(
          spawnEnemyProjectile(
            e.x,
            e.y,
            (i * Math.PI * 2) / count - time * (rage ? 1.05 : 0.65),
            rage ? 155 + (i % 2) * 65 : 125 + (i % 2) * 55,
            10,
            4,
            8,
          ),
        );
      e.shootCd = rage ? 0.72 : 1.05;
    }
  } else if (e.kind === "mirror") {
    const radial = d > 245 ? 1 : d < 180 ? -0.6 : 0,
      tangent = Math.sin(time * 0.7) > 0 ? 0.48 : -0.48;
    e.x += (nx * radial - ny * tangent) * e.s * dt;
    e.y += (ny * radial + nx * tangent) * e.s * dt;
    if (e.shootCd <= 0) {
      const origins = [
          [e.x, e.y],
          [e.arenaW - e.x, e.arenaH - e.y],
        ],
        spread = rage ? 3 : 2;
      for (const [x, y] of origins) {
        const aim = Math.atan2(target.y - y, target.x - x);
        for (let i = -spread; i <= spread; i++)
          enemyBullets.push(
            spawnEnemyProjectile(
              x,
              y,
              aim + i * 0.19,
              rage ? 255 : 215,
              rage ? 13 : 11,
              4,
              6,
            ),
          );
      }
      e.shootCd = rage ? 0.88 : 1.24;
      onShake(4);
    }
    if (e.blastCd <= 0) {
      queueBlastZones(e, target, rage);
      e.blastCd = rage ? 2.5 : 3.2;
    }
  } else if (e.kind === "architect") {
    const targetX = e.arenaW / 2,
      targetY = Math.max(120, e.arenaH * 0.27),
      tx = targetX - e.x,
      ty = targetY - e.y,
      td = Math.max(1, Math.hypot(tx, ty));
    e.x += (tx / td) * e.s * dt;
    e.y += (ty / td) * e.s * dt;
    e.railCd -= tempoDt;
    updateRails(e, tempoDt, enemyBullets, onShake);
    if (e.railCd <= 0) {
      queueRail(e, target, rage);
      e.railCd = rage ? 1.9 : 2.7;
    }
    if (e.blastCd <= 0) {
      const spacing = rage ? 82 : 96,
        count = rage ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const horizontal = i % 2 === 0;
        e.blastZones.push({
          x: horizontal ? target.x + (i - count / 2) * spacing : target.x,
          y: horizontal ? target.y : target.y + (i - count / 2) * spacing,
          r: rage ? 48 : 43,
          warn: rage ? 0.8 : 1.05,
          life: 0,
          detonated: false,
          damage: rage ? 28 : 24,
        });
      }
      e.blastCd = rage ? 2.35 : 3.1;
    }
  } else if (e.kind === "lastlight") {
    const radial = d > 220 ? 1 : d < 165 ? -0.55 : 0;
    e.x += (nx * radial - ny * 0.4) * e.s * dt;
    e.y += (ny * radial + nx * 0.4) * e.s * dt;
    if (d < 450) {
      const force = (1 - d / 450) * (rage ? 48 : 26);
      player.x -= nx * force * dt;
      player.y -= ny * force * dt;
    }
    e.railCd -= tempoDt;
    updateRails(e, tempoDt, enemyBullets, onShake);
    if (e.railCd <= 0) {
      queueRail(e, target, rage);
      e.railCd = rage ? 2.75 : 3.7;
    }
    if (e.shootCd <= 0) {
      const count = rage ? 22 : 18,
        gap = Math.floor((time * 1.4) % count);
      for (let i = 0; i < count; i++) {
        if (i === gap || (!rage && i === (gap + 1) % count)) continue;
        enemyBullets.push(
          spawnEnemyProjectile(
            e.x,
            e.y,
            (i * Math.PI * 2) / count - time * 0.72,
            175 + (i % 3) * 34,
            rage ? 15 : 13,
            5,
            7,
          ),
        );
      }
      e.shootCd = rage ? 0.58 : 0.82;
      onShake(7);
    }
    if (e.blastCd <= 0) {
      queueBlastZones(e, target, true);
      e.blastCd = rage ? 2.15 : 2.8;
    }
  } else {
    const radial = d > 205 ? 1 : d < 150 ? -0.5 : 0;
    e.x += (nx * radial - ny * 0.34) * e.s * dt;
    e.y += (ny * radial + nx * 0.34) * e.s * dt;
    if (e.shootCd <= 0) {
      const base = time * (rage ? 0.58 : 0.35),
        rings = rage ? 3 : 2;
      for (let ring = 0; ring < rings; ring++)
        for (let i = 0; i < 10; i++)
          enemyBullets.push(
            spawnEnemyProjectile(
              e.x,
              e.y,
              base + (i * Math.PI * 2) / 10 + ring * 0.16,
              145 + ring * 62,
              13,
              5,
              7,
            ),
          );
      for (let i = 0; i < 10; i++) particles.push(particle(e.x, e.y, "boss"));
      e.shootCd = rage ? 0.62 : 0.95;
      onShake(6);
    }
  }
  finishAttacks();
}
