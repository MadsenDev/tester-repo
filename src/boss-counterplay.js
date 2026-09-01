const PROFILES = {
  chill: { gap: 190, warning: 1.55, damage: 14, cooldown: 6.2, phaseGate: 0.8 },
  normal: { gap: 145, warning: 1.18, damage: 22, cooldown: 5.1, phaseGate: 0.65 },
  intense: { gap: 108, warning: 0.9, damage: 30, cooldown: 4.2, phaseGate: 0.48 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function counterplayProfile(difficulty = "normal") {
  return PROFILES[difficulty] || PROFILES.normal;
}

export function beginBossPhaseGate(boss) {
  boss.phaseGate = counterplayProfile(boss.bossDifficulty).phaseGate;
}

function spineSegmentCount(boss) {
  const ratio = clamp((boss.hp || 0) / Math.max(1, boss.hpMax || 1), 0, 1);
  return ratio > 0.8 ? 5 : ratio > 0.6 ? 4 : ratio > 0.4 ? 3 : ratio > 0.2 ? 2 : 1;
}

export function bossDamageMultiplier(boss) {
  if (!boss?.boss || boss.phaseGate > 0) return boss?.boss ? 0 : 1;
  if (boss.kind !== "spine") return 1;
  const segments = spineSegmentCount(boss);
  return segments >= 4 ? 0.72 : segments === 3 ? 0.82 : segments === 2 ? 0.92 : 1;
}

export function queuePositionTest(boss, player, random = Math.random) {
  const profile = counterplayProfile(boss.bossDifficulty);
  const axis = boss.positionTestFlip ? "horizontal" : "vertical";
  boss.positionTestFlip = !boss.positionTestFlip;
  const span = axis === "vertical" ? boss.arenaW : boss.arenaH;
  const coordinate = axis === "vertical" ? player.x : player.y;
  const gapSize = Math.min(profile.gap, span * 0.48);
  const lead = (random() - 0.5) * span * 0.24;
  const gap = clamp(coordinate + lead, gapSize / 2 + 18, span - gapSize / 2 - 18);
  boss.positionTests ??= [];
  boss.positionTests.push({ axis, gap, gapSize, warn: profile.warning, life: 0, fired: false, damage: profile.damage });
  return boss.positionTests.at(-1);
}

function updateSpine(boss, dt) {
  if (boss.kind !== "spine") return;
  const segments = spineSegmentCount(boss),
    previous = boss.spineSegments ?? 5;
  boss.spineBreakFlash = Math.max(0, (boss.spineBreakFlash || 0) - dt);
  if (segments < previous) {
    boss.spineSegments = segments;
    boss.spineBroken = 5 - segments;
    boss.spineBreakFlash = 0.55;
    boss.shootCd = Math.min(boss.shootCd ?? 1, 0.18);
    boss.phaseFlash = Math.max(boss.phaseFlash || 0, 0.45);
  } else boss.spineSegments = segments;
  const base = boss.baseSpineSpeed || 30,
    difficultyMovement = boss.bossTuning?.movement || 1;
  boss.s = base * difficultyMovement * (1 + (5 - segments) * 0.12);
}

export function updateBossCounterplay(boss, dt, player, onHazard = () => {}, onShake = () => {}) {
  boss.phaseGate = Math.max(0, (boss.phaseGate || 0) - dt);
  boss.positionTests ??= [];
  boss.positionTestCd ??= counterplayProfile(boss.bossDifficulty).cooldown;
  updateSpine(boss, dt);
  if (["architect", "lastlight"].includes(boss.kind) && boss.bossPhase === 2) {
    boss.positionTestCd -= dt;
    if (boss.positionTestCd <= 0 && boss.positionTests.length === 0) {
      queuePositionTest(boss, player);
      boss.positionTestCd = counterplayProfile(boss.bossDifficulty).cooldown;
    }
  }
  for (const test of boss.positionTests) {
    if (!test.fired) {
      test.warn -= dt;
      if (test.warn <= 0) {
        test.fired = true;
        test.life = 0.3;
        const coordinate = test.axis === "vertical" ? player.x : player.y;
        if (Math.abs(coordinate - test.gap) > test.gapSize / 2) onHazard(test.damage);
        onShake(9);
      }
    } else test.life -= dt;
  }
  boss.positionTests = boss.positionTests.filter((test) => !test.fired || test.life > 0);
}

function drawSpineArmor(ctx, boss, time) {
  if (boss.kind !== "spine") return;
  const alive = boss.spineSegments ?? 5,
    radius = boss.r + 27,
    flash = boss.spineBreakFlash || 0;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(-time * 0.5);
  for (let index = 0; index < 5; index++) {
    const angle = (index * Math.PI * 2) / 5,
      x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius,
      active = index < alive;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.globalAlpha = active ? 0.9 : 0.12 + flash * 0.35;
    ctx.fillStyle = active ? (flash > 0 ? "#fff1f5" : "#ff9ab2") : "#5f2638";
    ctx.strokeStyle = active ? "#ffe2ea" : "#9b455d";
    ctx.lineWidth = active ? 2.5 : 1;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.restore();
  }
  ctx.globalAlpha = 0.28 + flash * 0.55;
  ctx.strokeStyle = "#ffb6c8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawBossCounterplay(ctx, enemies, time, width, height) {
  for (const boss of enemies) {
    drawSpineArmor(ctx, boss, time);
    if (boss.phaseGate > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(124,246,200,${0.45 + Math.sin(time * 18) * 0.18})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.r + 16 + Math.sin(time * 12) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const test of boss.positionTests || []) {
      const pulse = test.fired ? 0.48 : 0.15 + Math.sin(time * 14) * 0.05;
      const start = test.gap - test.gapSize / 2, end = test.gap + test.gapSize / 2;
      ctx.save();
      ctx.fillStyle = `rgba(255,72,112,${pulse})`;
      ctx.strokeStyle = test.fired ? "#fff0f4" : "#7cf6c8";
      ctx.lineWidth = test.fired ? 5 : 2;
      if (test.axis === "vertical") {
        ctx.fillRect(0, 0, Math.max(0, start), height);
        ctx.fillRect(end, 0, Math.max(0, width - end), height);
        ctx.strokeRect(start, 0, test.gapSize, height);
      } else {
        ctx.fillRect(0, 0, width, Math.max(0, start));
        ctx.fillRect(0, end, width, Math.max(0, height - end));
        ctx.strokeRect(0, start, width, test.gapSize);
      }
      ctx.fillStyle = "#dffff6";
      ctx.font = "800 10px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("SAFE CORRIDOR", test.axis === "vertical" ? test.gap : width / 2, test.axis === "vertical" ? 176 : test.gap + 4);
      ctx.restore();
    }
  }
}
