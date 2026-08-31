import { drawWeaponFx } from "./weapons.js";
import { sectorAt } from "./world.js";
import { drawHazards } from "./hazards.js";
import { drawEventBanner } from "./events.js";
import {
  drawManifestationAura,
  drawManifestationCue,
  drawManifestationHull,
  drawManifestationProjectile,
  drawManifestationWorldFx,
} from "./manifestation-render.js";
import { friendlyThreatAlpha } from "./combat-readability.js";
import { drawBossCounterplay } from "./boss-counterplay.js";
function polygon(ctx, x, y, r, n, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI * 2) / n,
      px = x + Math.cos(a) * r,
      py = y + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function drawBlastZones(ctx, enemies, time) {
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
function drawSideWarnings(ctx, enemies, time, W) {
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
function drawEnemy(ctx, e, time) {
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
        : ["spitter", "sniper", "sentinel"].includes(e.kind)
          ? 6
          : e.kind === "swarm" || e.kind === "phaser"
            ? 3
            : e.kind === "orbiter"
              ? 7
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
function drawBackdrop(ctx, W, H, time, sector) {
  ctx.fillStyle = sector.bg;
  ctx.fillRect(-20, -20, W + 40, H + 40);
  ctx.strokeStyle = sector.grid;
  ctx.lineWidth = 1;
  const grid = 48,
    ox = (-time * 8) % grid,
    oy = (-time * 4) % grid;
  for (let x = ox; x < W; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = oy; y < H; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = sector.accent;
  for (let i = 0; i < 18; i++) {
    const x = ((i * 173 + time * (6 + (i % 4))) % (W + 80)) - 40,
      y = ((i * 97 + Math.sin(time * 0.2 + i) * 80 + H) % (H + 80)) - 40,
      r = 1 + (i % 3);
    ctx.fillRect(x, y, r, r);
  }
  ctx.globalAlpha = 1;
}
function particleColor(kind) {
  return kind === "hurt"
    ? "#ff557c"
    : kind === "boss"
      ? "#ffd36f"
      : kind === "nova"
        ? "#cf99ff"
        : kind === "frenzied"
          ? "#ff6b72"
          : kind === "volatile"
            ? "#ffb14f"
            : kind === "vampiric"
              ? "#d77cff"
              : kind === "splitter"
                ? "#72ffd2"
                : kind === "elite"
                  ? "#ffe895"
                  : "#95efff";
}
export function renderScene(ctx, view, world) {
  const { dpr, W, H } = view,
    {
      time,
      shake,
      state,
      player,
      enemies,
      bullets,
      enemyBullets,
      gems,
      particles,
      powerups,
      hazards,
      events,
    } = world,
    sector = sectorAt(time);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const sx = (Math.random() - 0.5) * shake,
    sy = (Math.random() - 0.5) * shake;
  ctx.translate(sx, sy);
  drawBackdrop(ctx, W, H, time, sector);
  if (hazards) drawHazards(ctx, hazards, time, W, H);
  drawBlastZones(ctx, enemies, time);
  drawBossCounterplay(ctx, enemies, time, W, H);
  for (const g of gems) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(time * 2);
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#7bf5ff";
    ctx.fillStyle = "#7bf5ff";
    polygon(ctx, 0, 0, g.r, 4, Math.PI / 4);
    ctx.fill();
    if ((g.stack || 1) > 1) {
      ctx.strokeStyle = "rgba(223,255,246,.88)";
      ctx.lineWidth = 1.5;
      polygon(ctx, 0, 0, g.r + 3, 4, Math.PI / 4);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const p of powerups) {
    const colors = {
        repair: "#7dffb2",
        pulse: "#fff07a",
        overdrive: "#b585ff",
      },
      symbols = { repair: "+", pulse: "○", overdrive: "»" },
      color = colors[p.kind];
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.phase);
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    polygon(ctx, 0, 0, p.r, 6, time);
    ctx.fill();
    ctx.rotate(-p.phase);
    ctx.fillStyle = "#071018";
    ctx.font = "900 10px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbols[p.kind], 0, 0.5);
    ctx.restore();
  }
  for (const e of enemies) drawEnemy(ctx, e, time);
  drawSideWarnings(ctx, enemies, time, W);
  if (player) {
    drawWeaponFx(ctx, player);
    drawManifestationWorldFx(ctx, player);
  }
  for (const b of bullets) {
    const kind = b.kind || "blaster";
    const visualAlpha = friendlyThreatAlpha(b, enemyBullets);
    if (visualAlpha <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = visualAlpha;
    ctx.translate(b.x, b.y);
    if (kind === "missile") {
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.shadowBlur = b.evolved ? 25 : 18;
      ctx.shadowColor = b.evolved ? "#ffe36a" : "#ffca73";
      ctx.fillStyle = b.evolved ? "#fff0a8" : "#ffe0a0";
      polygon(ctx, 0, 0, b.r + 2, b.evolved ? 4 : 3, 0);
    } else if (kind === "mine") {
      ctx.rotate(time * 2 + (b.phase || 0));
      ctx.shadowBlur = b.evolved ? 26 : 18;
      ctx.shadowColor = b.evolved ? "#ffe36a" : "#c48aff";
      ctx.fillStyle = b.evolved ? "#fff0a6" : "#d9adff";
      polygon(ctx, 0, 0, b.r, b.evolved ? 6 : 4, Math.PI / 4);
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#a8f6ff";
      ctx.fillStyle = "#baf8ff";
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    }
    ctx.fill();
    if (kind === "blaster") drawManifestationProjectile(ctx, b, time);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  if (player) {
    for (let o = 0; o < player.orbitals; o++) {
      const a = time * 2.1 + (o * Math.PI * 2) / player.orbitals,
        x = player.x + Math.cos(a) * 42,
        y = player.y + Math.sin(a) * 42;
      ctx.fillStyle = "#fff1a8";
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ffd95a";
      polygon(ctx, x, y, 7, 4, time);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(time * 0.8);
    drawManifestationAura(ctx, player, time);
    const baseColor = player.shipColor || "#78ebff",
      glow = player.nullified
        ? "#79ffd2"
        : player.overdrive > 0
          ? "#b585ff"
          : player.invuln > 0
            ? "#fff"
            : baseColor;
    ctx.shadowBlur = player.overdrive > 0 ? 30 : 22;
    ctx.shadowColor = glow;
    ctx.fillStyle =
      player.invuln > 0 && Math.floor(time * 20) % 2 ? "#fff" : baseColor;
    polygon(ctx, 0, 0, player.r, player.shipSides || 3, -Math.PI / 2);
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    polygon(
      ctx,
      0,
      0,
      player.r + 7,
      Math.max(5, (player.shipSides || 3) + 3),
      time * -1.5,
    );
    ctx.stroke();
    drawManifestationHull(ctx, player, time);
    ctx.restore();
  }
  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = particleColor(p.kind);
    if (["frenzied", "volatile", "vampiric", "splitter"].includes(p.kind)) {
      ctx.shadowColor = particleColor(p.kind);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * a), 0, Math.PI * 2);
      ctx.fill();
    } else ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
  // Hostile fire is deliberately the top combat layer.
  for (const b of enemyBullets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.kind === "rail") {
      ctx.rotate(b.vx >= 0 ? 0 : Math.PI);
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#ff547c";
      ctx.fillStyle = "#ffd8e2";
      ctx.fillRect(-34, -6, 68, 12);
      ctx.fillStyle = "#ff547c";
      ctx.fillRect(-48, -3, 96, 6);
    } else if (b.kind === "sidebolt") {
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#6dffca";
      ctx.fillStyle = "#aaffea";
      polygon(ctx, 0, 0, 8, 4, Math.PI / 4);
      ctx.fill();
    } else {
      ctx.shadowBlur = b.kind === "blast" ? 24 : 12;
      ctx.shadowColor = b.kind === "blast" ? "#fff1c7" : "#ff638e";
      ctx.fillStyle = b.kind === "blast" ? "rgba(255,238,190,.82)" : "#ff7a9c";
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (events) drawEventBanner(ctx, events, W);
  if (player) drawManifestationCue(ctx, player, W, H);
  ctx.restore();
  if (state === "paused") {
    ctx.fillStyle = "rgba(1,5,10,.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "800 36px system-ui";
    ctx.fillText("PAUSED", W / 2, H / 2);
  }
}
