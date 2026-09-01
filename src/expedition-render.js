import { EXPEDITION_ROOM_TYPES } from "./expedition.js";

const MAP_SYMBOLS = Object.freeze({
  item: "M",
  choice: "◇",
  shop: "$",
  repair: "+",
  elite: "!",
  boss: "B",
  secret: "?",
  black: "×",
});

function arenaBounds(W, H) {
  const top = Math.max(182, Math.min(250, H * 0.18));
  return { left: 18, right: W - 18, top, bottom: H - 42 };
}

function roundRect(ctx, x, y, w, h, r = 12) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function layoutExpeditionObjects(state, W, H) {
  const bounds = arenaBounds(W, H), middleY = (bounds.top + bounds.bottom) / 2;
  for (const door of state.doors) {
    if (door.direction === "n" || door.direction === "s") {
      door.x = W / 2;
      door.y = door.direction === "n" ? bounds.top : bounds.bottom;
      door.w = 92;
      door.h = 34;
    } else {
      door.x = door.direction === "w" ? bounds.left : bounds.right;
      door.y = middleY;
      door.w = 34;
      door.h = 92;
    }
  }
  const cardWidth = Math.min(168, (W - 32) / Math.max(1, state.pedestals.length));
  state.pedestals.forEach((pedestal, index) => {
    const total = state.pedestals.length * cardWidth + (state.pedestals.length - 1) * 8;
    pedestal.x = W / 2 - total / 2 + cardWidth / 2 + index * (cardWidth + 8);
    pedestal.y = bounds.top + (bounds.bottom - bounds.top) * 0.52;
    pedestal.w = cardWidth - 8;
    pedestal.r = 24;
  });
}

function drawRoomFrame(ctx, state, W, H, time) {
  const meta = EXPEDITION_ROOM_TYPES[state.roomType], bounds = arenaBounds(W, H);
  ctx.save();
  ctx.strokeStyle = meta.color;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 15]);
  ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.055 + Math.sin(time * 2) * 0.018;
  ctx.fillStyle = meta.color;
  ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, 3);
  ctx.fillRect(bounds.left, bounds.bottom - 3, bounds.right - bounds.left, 3);
  ctx.restore();
}

function drawChevron(ctx, direction, size = 8) {
  ctx.beginPath();
  if (direction === "n") {
    ctx.moveTo(-size, size / 2); ctx.lineTo(0, -size / 2); ctx.lineTo(size, size / 2);
  } else if (direction === "s") {
    ctx.moveTo(-size, -size / 2); ctx.lineTo(0, size / 2); ctx.lineTo(size, -size / 2);
  } else if (direction === "w") {
    ctx.moveTo(size / 2, -size); ctx.lineTo(-size / 2, 0); ctx.lineTo(size / 2, size);
  } else {
    ctx.moveTo(-size / 2, -size); ctx.lineTo(size / 2, 0); ctx.lineTo(-size / 2, size);
  }
  ctx.stroke();
}

function drawDoor(ctx, door, time) {
  const horizontal = door.direction === "n" || door.direction === "s",
    pulse = 0.58 + Math.sin(time * 3.5 + door.x + door.y) * 0.12;
  ctx.save();
  ctx.translate(door.x, door.y);
  ctx.globalAlpha = door.hidden ? 0.12 + pulse * 0.13 : door.backtrack ? 0.42 : 0.62 + pulse * 0.18;
  ctx.strokeStyle = door.color;
  ctx.fillStyle = door.color;
  ctx.shadowBlur = door.hidden ? 4 : 12;
  ctx.shadowColor = door.color;
  ctx.lineWidth = door.hidden ? 1 : 2;
  ctx.setLineDash(door.hidden ? [3, 6] : []);
  ctx.beginPath();
  if (horizontal) {
    ctx.moveTo(-door.w / 2, 0); ctx.lineTo(-17, 0);
    ctx.moveTo(17, 0); ctx.lineTo(door.w / 2, 0);
  } else {
    ctx.moveTo(0, -door.h / 2); ctx.lineTo(0, -17);
    ctx.moveTo(0, 17); ctx.lineTo(0, door.h / 2);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  drawChevron(ctx, door.direction, door.hidden ? 5 : 7);
  if (door.label) {
    ctx.globalAlpha = door.backtrack ? 0.55 : 0.86;
    ctx.shadowBlur = 0;
    ctx.font = "600 8px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const offset = horizontal
      ? { x: 0, y: door.direction === "n" ? 17 : -17 }
      : { x: door.direction === "w" ? 25 : -25, y: 0 };
    ctx.save();
    ctx.translate(offset.x, offset.y);
    if (!horizontal) ctx.rotate(-Math.PI / 2);
    ctx.fillText(door.label, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function visibleMapNodes(state) {
  return state.map.nodes.filter((node) =>
    node.id === state.currentId ||
    node.visited ||
    (node.discovered && (!node.hidden || node.visited)),
  );
}

function drawMinimap(ctx, state, W, H) {
  const nodes = visibleMapNodes(state);
  if (!nodes.length) return;
  const scale = 14,
    minX = Math.min(...nodes.map((node) => node.x)),
    maxX = Math.max(...nodes.map((node) => node.x)),
    minY = Math.min(...nodes.map((node) => node.y)),
    maxY = Math.max(...nodes.map((node) => node.y)),
    mapW = (maxX - minX) * scale + 12,
    mapH = (maxY - minY) * scale + 10,
    originX = W - 28 - mapW,
    originY = arenaBounds(W, H).top + 28,
    byId = new Map(nodes.map((node) => [node.id, node]));
  const point = (node) => ({
    x: originX + (node.x - minX) * scale + 6,
    y: originY + (node.y - minY) * scale + 5,
  });
  ctx.save();
  ctx.fillStyle = "rgba(2,7,13,.5)";
  roundRect(ctx, originX - 7, originY - 7, mapW + 14, mapH + 14, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(150,210,226,.2)";
  ctx.lineWidth = 1;
  for (const node of nodes) {
    const from = point(node);
    for (const id of Object.values(node.links)) {
      const target = byId.get(id);
      if (!target) continue;
      const to = point(target);
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
    }
  }
  for (const node of nodes) {
    const p = point(node), meta = EXPEDITION_ROOM_TYPES[node.type], current = node.id === state.currentId;
    ctx.fillStyle = current ? "#ecfff9" : node.visited ? "rgba(113,239,217,.42)" : "rgba(100,126,151,.25)";
    ctx.strokeStyle = meta.color;
    ctx.globalAlpha = current ? 1 : 0.72;
    ctx.lineWidth = current ? 2 : 1;
    ctx.fillRect(p.x - 5, p.y - 4, 10, 8);
    ctx.strokeRect(p.x - 5, p.y - 4, 10, 8);
    if (MAP_SYMBOLS[node.type]) {
      ctx.fillStyle = current ? "#061019" : meta.color;
      ctx.font = "700 6px IBM Plex Mono, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(MAP_SYMBOLS[node.type], p.x, p.y + 0.5);
    }
  }
  ctx.restore();
}

function wrap(ctx, text, x, y, width, lineHeight, maxLines = 2) {
  const words = String(text || "").split(/\s+/), lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line); line = word;
      if (lines.length >= maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
}

function drawPedestal(ctx, pedestal, time, credits) {
  const module = pedestal.module || pedestal.offer?.module,
    name = module?.name || pedestal.name || "UNKNOWN MODULE",
    desc = module?.desc || pedestal.desc || "Signal awaiting contact.",
    affordable = !pedestal.cost || credits >= pedestal.cost,
    color = pedestal.color || "#8dffcf";
  ctx.save();
  ctx.globalAlpha = affordable ? 1 : 0.42;
  ctx.translate(pedestal.x, pedestal.y);
  ctx.shadowBlur = 20; ctx.shadowColor = color; ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(4,11,18,.92)"; ctx.lineWidth = 2;
  roundRect(ctx, -pedestal.w / 2, -76, pedestal.w, 152, 12); ctx.fill(); ctx.stroke();
  ctx.rotate(time * 0.9); ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6,
      x = Math.cos(angle) * (19 + Math.sin(time * 3) * 2),
      y = Math.sin(angle) * (19 + Math.sin(time * 3) * 2);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.stroke(); ctx.rotate(-time * 0.9);
  ctx.fillStyle = "#f3f7ff"; ctx.shadowBlur = 0; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.font = "700 11px Chakra Petch, sans-serif"; ctx.fillText(name, 0, 32, pedestal.w - 12);
  ctx.fillStyle = "#91a0b8"; ctx.font = "500 8px IBM Plex Mono, monospace";
  wrap(ctx, desc, 0, 48, pedestal.w - 14, 10, 2);
  if (pedestal.cost) {
    ctx.fillStyle = affordable ? "#ffe27b" : "#ff6688";
    ctx.font = "700 9px IBM Plex Mono, monospace"; ctx.fillText(`${pedestal.cost} SCRAP`, 0, -65);
  } else if (pedestal.kind === "black") {
    ctx.fillStyle = "#ff74ad"; ctx.font = "700 9px IBM Plex Mono, monospace";
    ctx.fillText("PERMANENT COST", 0, -65);
  }
  ctx.restore();
}

export function drawExpedition(ctx, state, time, W, H) {
  if (!state?.active) return;
  layoutExpeditionObjects(state, W, H);
  drawRoomFrame(ctx, state, W, H, time);
  drawMinimap(ctx, state, W, H);
  for (const door of state.doors) drawDoor(ctx, door, time);
  for (const pedestal of state.pedestals) drawPedestal(ctx, pedestal, time, state.credits);
  if (state.messageTime > 0) {
    const meta = EXPEDITION_ROOM_TYPES[state.roomType], y = arenaBounds(W, H).top + 76;
    ctx.save(); ctx.globalAlpha = Math.min(1, state.messageTime);
    ctx.fillStyle = "rgba(2,7,13,.68)"; ctx.fillRect(0, y - 24, W, 48);
    ctx.fillStyle = meta.color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 11px IBM Plex Mono, monospace"; ctx.fillText(state.message, W / 2, y);
    ctx.restore();
  }
}
