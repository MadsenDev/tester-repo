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
import { drawArenaModules } from "./arena-module-render.js";
import { drawPlayerShield, drawPlayerShip } from "./ship-render.js";
import { drawExpedition } from "./expedition-render.js";
import { drawExpeditionEncounter } from "./expedition-encounters.js";
import {
  drawBlastZones,
  drawEnemy,
  drawEnemySupportLinks,
  drawSideWarnings,
} from "./enemy-render.js";
import { polygon } from "./canvas-shapes.js";
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
      expedition,
      sectorTime = time,
    } = world,
    sector = sectorAt(sectorTime);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const sx = (Math.random() - 0.5) * shake,
    sy = (Math.random() - 0.5) * shake;
  ctx.translate(sx, sy);
  drawBackdrop(ctx, W, H, time, sector);
  if (expedition)
    drawExpeditionEncounter(ctx, expedition.encounterRuntime, time, W, H);
  if (expedition) drawExpedition(ctx, expedition, time, W, H);
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
  drawEnemySupportLinks(ctx, enemies, time);
  for (const e of enemies) drawEnemy(ctx, e, time);
  drawSideWarnings(ctx, enemies, time, W);
  if (player) drawArenaModules(ctx, player, time, W, H);
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
      const arenaColors = {
        reversal: "#ffe680",
        horizon: "#a9b7ff",
        reservoir: "#ff9bc0",
        echo: "#d4adff",
        moon: "#fff1b0",
        heart: "#9bf5ff",
      };
      ctx.shadowColor = arenaColors[b.arenaFlavor] || "#a8f6ff";
      ctx.fillStyle = arenaColors[b.arenaFlavor] || "#baf8ff";
      ctx.shadowBlur = b.arenaFlavor ? 18 : 10;
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
    drawManifestationAura(ctx, player, time);
    ctx.restore();
    const baseColor = player.shipColor || "#78ebff",
      glow = player.nullified
        ? "#79ffd2"
        : player.overdrive > 0
          ? "#b585ff"
          : player.invuln > 0
            ? "#fff"
            : baseColor;
    drawPlayerShield(ctx, player, time, glow);
    drawPlayerShip(ctx, player, time, glow);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate((player.facing ?? -Math.PI / 2) + Math.PI / 2);
    const pivot = player.shipVisual?.pivot || [0, 0];
    ctx.translate(-pivot[0] * player.r, -pivot[1] * player.r);
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
