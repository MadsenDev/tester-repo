import { shipById } from "./ships.js";

function tracePoints(ctx, points, scale) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const px = x * scale,
      py = y * scale;
    index ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.closePath();
}

function drawTrail(ctx, engines, scale, color, time, thrust) {
  const pulse = 0.78 + Math.sin(time * 19) * 0.16,
    length = scale * (0.55 + thrust * 0.45) * pulse;
  for (const [x, y] of engines) {
    const px = x * scale,
      py = y * scale;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.42 + thrust * 0.3;
    ctx.beginPath();
    ctx.moveTo(px - scale * 0.1, py);
    ctx.lineTo(px + scale * 0.1, py);
    ctx.lineTo(px, py + length);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function playerShieldVisual(player, time) {
  const impact = Math.min(1, Math.max(0, (player.invuln || 0) / 0.22)),
    armor = Math.min(1, Math.max(0, (player.armor || 0) / 0.65));
  return {
    sides: 6,
    radius: player.r + 7 + impact * 3,
    rotation: time * -1.5,
    alpha: 0.5 + armor * 0.16 + impact * 0.3,
    lineWidth: 1.4 + armor * 0.7 + impact * 1.2,
    impact,
  };
}

export function drawPlayerShield(ctx, player, time, glow) {
  const visual = playerShieldVisual(player, time);
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(visual.rotation);
  ctx.globalAlpha = visual.alpha;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12 + visual.impact * 18;
  ctx.fillStyle = glow;
  ctx.strokeStyle = glow;
  ctx.lineWidth = visual.lineWidth;
  ctx.beginPath();
  for (let i = 0; i < visual.sides; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / visual.sides,
      x = Math.cos(angle) * visual.radius,
      y = Math.sin(angle) * visual.radius;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  if (visual.impact > 0) {
    ctx.globalAlpha = visual.impact * 0.1;
    ctx.fill();
  }
  ctx.restore();
}

export function drawPlayerShip(ctx, player, time, glow) {
  const ship = shipById(player.shipId),
    profile = player.shipVisual || ship.visual,
    scale = player.r,
    speed = Math.hypot(player.vx || 0, player.vy || 0),
    thrust = Math.min(1, speed / Math.max(1, player.speed || 1));
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate((player.facing ?? -Math.PI / 2) + Math.PI / 2);
  ctx.translate(-profile.pivot[0] * scale, -profile.pivot[1] * scale);
  ctx.shadowColor = glow;
  ctx.shadowBlur = player.overdrive > 0 ? 30 : 22;
  drawTrail(ctx, profile.engines, scale, profile.color, time, thrust);
  ctx.fillStyle =
    player.invuln > 0 && Math.floor(time * 20) % 2 ? "#fff" : profile.color;
  tracePoints(ctx, profile.points, scale);
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.shadowBlur = 5;
  ctx.strokeStyle = profile.accent;
  ctx.lineWidth = Math.max(1, scale * 0.075);
  ctx.globalAlpha = 0.78;
  for (const detail of profile.details) {
    ctx.beginPath();
    detail.forEach(([x, y], index) =>
      index ? ctx.lineTo(x * scale, y * scale) : ctx.moveTo(x * scale, y * scale),
    );
    ctx.stroke();
  }
  const [cx, cy] = profile.canopy;
  ctx.globalAlpha = 1;
  ctx.fillStyle = profile.accent;
  ctx.beginPath();
  ctx.arc(cx * scale, cy * scale, Math.max(1.8, scale * 0.14), 0, Math.PI * 2);
  ctx.fill();
  const [px, py] = profile.pivot;
  ctx.shadowBlur = 9;
  ctx.fillStyle = "rgba(3,8,14,.9)";
  ctx.strokeStyle = profile.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px * scale, py * scale, Math.max(1.7, scale * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const svgPoints = (points) =>
  points.map(([x, y]) => `${(x * 48).toFixed(1)},${(y * 48).toFixed(1)}`).join(" ");

export function shipSvgMarkup(shipOrId) {
  const ship = typeof shipOrId === "string" ? shipById(shipOrId) : shipOrId,
    profile = ship.visual,
    [cx, cy] = profile.canopy,
    [px, py] = profile.pivot;
  return `<svg class="ship-svg" viewBox="-58 -78 116 148" role="img" aria-label="${ship.name} chassis"><g style="filter:drop-shadow(0 0 8px ${profile.color})"><polygon points="${svgPoints(profile.points)}" fill="${profile.color}" stroke="${profile.accent}" stroke-width="2"/>${profile.details.map((line) => `<polyline points="${svgPoints(line)}" fill="none" stroke="${profile.accent}" stroke-width="1.6" opacity=".78"/>`).join("")}<circle cx="${(cx * 48).toFixed(1)}" cy="${(cy * 48).toFixed(1)}" r="5" fill="${profile.accent}"/><circle cx="${(px * 48).toFixed(1)}" cy="${(py * 48).toFixed(1)}" r="3.5" fill="#05070e" stroke="${profile.accent}" stroke-width="1.4"/></g></svg>`;
}
