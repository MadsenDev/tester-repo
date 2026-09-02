import { polygon } from "./canvas-shapes.js";
export function drawBlastZones(ctx, enemies, time) {
  for (const e of enemies) {
    for (const z of e.blastZones || []) {
      ctx.save();
      const warning = !z.detonated,
        pulse = 0.5 + 0.5 * Math.sin(time * 18);
      ctx.globalAlpha = warning ? 0.34 + 0.2 * pulse : 0.65;
      ctx.fillStyle = warning ? "rgba(255,76,115,.18)" : "rgba(255,236,190,.6)";
      ctx.strokeStyle = warning ? "#ff668f" : "#fff1c7";
      ctx.lineWidth = warning ? 3 : 7;
      ctx.setLineDash(warning ? [8, 7] : []);
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (warning) {
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(z.x - z.r * 0.55, z.y);
        ctx.lineTo(z.x + z.r * 0.55, z.y);
        ctx.moveTo(z.x, z.y - z.r * 0.55);
        ctx.lineTo(z.x, z.y + z.r * 0.55);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
export function drawSideWarnings(ctx, enemies, time, W) {
  for (const e of enemies) {
    if (!["leviathan", "architect", "lastlight"].includes(e.kind)) continue;
    for (const w of e.sideWarnings || []) {
      const left = w.side < 0,
        pulse = 0.55 + 0.45 * Math.sin(time * 22);
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.4 * pulse;
      ctx.strokeStyle = "#ff547c";
      ctx.fillStyle = "#ff547c";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff547c";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 12]);
      ctx.beginPath();
      ctx.moveTo(left ? 0 : W, w.y);
      ctx.lineTo(left ? Math.min(W, 190) : Math.max(0, W - 190), w.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.translate(left ? 14 : W - 14, w.y);
      ctx.rotate(left ? 0 : Math.PI);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-9, -10);
      ctx.lineTo(-9, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
function drawLeviathan(ctx, e, time) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const visualR = 320;
  ctx.shadowBlur = 34;
  ctx.shadowColor = e.color;
  ctx.fillStyle = "rgba(6,28,31,.96)";
  ctx.beginPath();
  ctx.arc(0, 0, visualR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = e.bossPhase === 2 ? "#dffff6" : e.color;
  ctx.lineWidth = e.bossPhase === 2 ? 6 : 4;
  for (let r = visualR - 18; r > visualR - 92; r -= 24) {
    ctx.globalAlpha = 0.38 + (visualR - r) / 200;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.22, Math.PI - 0.22);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = -3; i <= 3; i++) {
    const x = i * 58,
      y = visualR - 118 - Math.abs(i) * 10;
    ctx.fillStyle = i === 0 ? "#eafff8" : "#74d9bd";
    ctx.shadowBlur = i === 0 ? 26 : 14;
    ctx.beginPath();
    ctx.arc(x, y, i === 0 ? 14 : 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#87ffe0";
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(0, 0, visualR - 116, 0.34, Math.PI - 0.34);
  ctx.stroke();
  if (e.phaseFlash > 0) {
    ctx.globalAlpha = e.phaseFlash / 1.4;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, visualR - 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  const barW = Math.min(360, e.arenaW - 50),
    x = e.arenaW / 2 - barW / 2,
    y = 126;
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(x, y, barW, 6);
  ctx.fillStyle = e.color;
  ctx.fillRect(x, y, barW * Math.max(0, e.hp / e.hpMax), 6);
}
function drawEliteIdentity(ctx, e, time) {
  if (!e.elite || e.boss) return;
  const pulse =
    0.5 +
    0.5 * Math.sin(time * (e.eliteTrait === "frenzied" ? 12 : 6) + e.phase);
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.eliteTrait === "armored") {
    ctx.strokeStyle = "#fff3b0";
    ctx.globalAlpha = 0.35 + 0.3 * pulse;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 10 + i * 4, -0.8 + i * 0.7, 0.5 + i * 0.7);
      ctx.stroke();
    }
  } else if (e.eliteTrait === "volatile") {
    ctx.fillStyle = "#fff2a1";
    ctx.shadowColor = "#ff9f43";
    ctx.shadowBlur = 18 + 12 * pulse;
    ctx.globalAlpha = 0.55 + 0.35 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, 4 + 3 * pulse, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.eliteTrait === "vampiric") {
    ctx.strokeStyle = "#e7a1ff";
    ctx.globalAlpha = 0.18 + 0.22 * pulse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 15 + 5 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e.eliteTrait === "splitter") {
    ctx.strokeStyle = "#baffeb";
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-e.r * 0.55, -e.r * 0.7);
    ctx.lineTo(2, -2);
    ctx.lineTo(e.r * 0.6, -e.r * 0.35);
    ctx.moveTo(2, -2);
    ctx.lineTo(-e.r * 0.2, e.r * 0.72);
    ctx.stroke();
  }
  ctx.restore();
}
export function drawEnemySupportLinks(ctx, enemies, time) {
  ctx.save();
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.kind === "bulwark") {
      ctx.strokeStyle = "#ff8ca0";
      ctx.globalAlpha = 0.1 + Math.sin(time * 4 + enemy.phase) * 0.025;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 155, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (enemy.kind === "relay" && enemy.relayPartner?.hp > 0) {
      ctx.strokeStyle = "#72ffd8";
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(enemy.relayPartner.x, enemy.relayPartner.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}
export function drawEnemy(ctx, e, time) {
  if (e.kind === "leviathan") {
    drawLeviathan(ctx, e, time);
    return;
  }
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(time * 0.6 + e.phase);
  ctx.shadowBlur = e.boss ? 30 : e.elite ? 24 : 12;
  ctx.shadowColor = e.elite ? e.eliteColor : e.color;
  ctx.fillStyle = e.flash > 0 ? "#fff" : e.color;
  const sides =
    e.kind === "dart"
      ? 3
      : e.kind === "wisp"
        ? 4
        : ["spitter", "sniper", "sentinel", "anchor"].includes(e.kind)
          ? 6
          : e.kind === "swarm" || e.kind === "phaser"
            ? 3
            : e.kind === "orbiter" || e.kind === "relay"
              ? 7
              : e.kind === "burrower"
                ? 4
                : e.boss
                  ? 8
                  : e.r > 18
                    ? 6
                    : 5;
  polygon(ctx, 0, 0, e.r, sides, 0.2);
  ctx.fill();
  if (e.kind === "leech") {
    ctx.strokeStyle = "#ffd0e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 6, 0, Math.PI * 1.35);
    ctx.stroke();
  } else if (e.kind === "sentinel") {
    ctx.strokeStyle = "#d4fbff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.moveTo(e.r + 3, 0);
      ctx.lineTo(e.r + 11, 0);
      ctx.stroke();
    }
  } else if (e.kind === "phaser") {
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 12);
    ctx.strokeStyle = "#f1dcff";
    ctx.lineWidth = 2;
    polygon(ctx, 0, 0, e.r + 9, 3, -0.2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (e.kind === "anchor") {
    ctx.strokeStyle = "#eadcff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(e.r * 0.6, 0);
      ctx.lineTo(e.r + 9, 0);
      ctx.stroke();
    }
  } else if (e.kind === "relay") {
    ctx.strokeStyle = "#d8fff5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 7, 0, Math.PI * 1.5);
    ctx.stroke();
  } else if (e.kind === "burrower") {
    ctx.globalAlpha = e.submerged ? 0.2 : 0.75;
    ctx.strokeStyle = "#ffd1bc";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (e.shielded) {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#ffb2bf";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 6, -0.8, Math.PI + 0.8);
    ctx.stroke();
  }
  if (e.elite && !e.boss) {
    ctx.strokeStyle = e.eliteColor || "#ffe895";
    ctx.lineWidth = 3;
    polygon(ctx, 0, 0, e.r + 7, sides, -time * 1.4);
    ctx.stroke();
    ctx.globalAlpha = 0.4 + 0.25 * Math.sin(time * 7 + e.phase);
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (e.boss) {
    ctx.strokeStyle = e.bossPhase === 2 ? "#fff" : "#fff4df";
    ctx.lineWidth = e.bossPhase === 2 ? 4 : 2.5;
    polygon(ctx, 0, 0, e.r + 10, sides, time);
    ctx.stroke();
    if (e.kind === "mirror") {
      ctx.globalAlpha = 0.34;
      for (const side of [-1, 1]) {
        polygon(ctx, side * (e.r + 22), 0, e.r * 0.48, 6, -time * 1.8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (e.kind === "architect") {
      ctx.globalAlpha = 0.55;
      ctx.strokeRect(-e.r - 16, -e.r - 16, (e.r + 16) * 2, (e.r + 16) * 2);
      ctx.globalAlpha = 1;
    } else if (e.kind === "lastlight") {
      ctx.globalAlpha = 0.5;
      for (const radius of [e.r + 18, e.r + 28]) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (e.phaseFlash > 0) {
      ctx.globalAlpha = e.phaseFlash / 1.4;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 24 + (1.4 - e.phaseFlash) * 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.telegraph > 0) {
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(time * 18);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
  drawEliteIdentity(ctx, e, time);
  if (e.elite && !e.boss) {
    ctx.save();
    ctx.font = "800 7px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = e.eliteColor || "#ffe895";
    ctx.globalAlpha = 0.9;
    ctx.fillText(e.eliteName || "ELITE", e.x, e.y - e.r - 16);
    ctx.restore();
  }
  if (e.hp < e.hpMax) {
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(e.x - e.r, e.y - e.r - 10, e.r * 2, 3);
    ctx.fillStyle = e.boss ? e.color : e.elite ? e.eliteColor : "#ff9a72";
    ctx.fillRect(e.x - e.r, e.y - e.r - 10, e.r * 2 * (e.hp / e.hpMax), 3);
  }
}
