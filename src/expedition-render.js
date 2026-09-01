import { EXPEDITION_ROOM_TYPES } from "./expedition.js";

function roundRect(ctx, x, y, w, h, r = 12) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function layoutExpeditionObjects(state, W, H) {
  const doorWidth = Math.min(164, (W - 38) / Math.max(1, state.doors.length));
  state.doors.forEach((door, index) => {
    const total = state.doors.length * doorWidth + (state.doors.length - 1) * 8;
    door.x = W / 2 - total / 2 + doorWidth / 2 + index * (doorWidth + 8);
    door.y = Math.max(190, Math.min(280, H * 0.22));
    door.w = doorWidth - 8;
    door.h = 58;
  });
  const cardWidth = Math.min(168, (W - 32) / Math.max(1, state.pedestals.length));
  state.pedestals.forEach((pedestal, index) => {
    const total = state.pedestals.length * cardWidth + (state.pedestals.length - 1) * 8;
    pedestal.x = W / 2 - total / 2 + cardWidth / 2 + index * (cardWidth + 8);
    pedestal.y = Math.max(330, H * 0.46);
    pedestal.w = cardWidth - 8;
    pedestal.r = 24;
  });
}

function drawRoomFrame(ctx, state, W, H, time) {
  const meta = EXPEDITION_ROOM_TYPES[state.roomType];
  ctx.save();
  ctx.strokeStyle = meta.color;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 14]);
  ctx.strokeRect(16, 86, W - 32, H - 122);
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.08 + Math.sin(time * 2) * 0.025;
  ctx.fillStyle = meta.color;
  ctx.fillRect(16, 86, W - 32, 4);
  ctx.fillRect(16, H - 40, W - 32, 4);
  ctx.restore();
}

function drawDoor(ctx, door, time) {
  const pulse = 0.72 + Math.sin(time * 4 + door.x) * 0.12;
  ctx.save();
  ctx.globalAlpha = door.hidden ? 0.24 + pulse * 0.16 : 0.84;
  ctx.shadowBlur = door.hidden ? 8 : 22;
  ctx.shadowColor = door.color;
  ctx.strokeStyle = door.color;
  ctx.fillStyle = "rgba(3,9,16,.9)";
  ctx.lineWidth = 2;
  roundRect(ctx, door.x - door.w / 2, door.y - door.h / 2, door.w, door.h, 9);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = door.hidden ? 0.38 : 1;
  ctx.fillStyle = door.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 10px IBM Plex Mono, monospace";
  ctx.fillText(door.label, door.x, door.y - 4, door.w - 12);
  ctx.font = "500 8px IBM Plex Mono, monospace";
  ctx.fillText("ENTER", door.x, door.y + 13);
  ctx.restore();
}

function wrap(ctx, text, x, y, width, lineHeight, maxLines = 2) {
  const words = String(text || "").split(/\s+/), lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
}

function drawPedestal(ctx, pedestal, time, credits) {
  const module = pedestal.module || pedestal.offer?.module;
  const name = module?.name || pedestal.name || "UNKNOWN MODULE";
  const desc = module?.desc || pedestal.desc || "Signal awaiting contact.";
  const affordable = !pedestal.cost || credits >= pedestal.cost;
  const color = pedestal.color || "#8dffcf";
  ctx.save();
  ctx.globalAlpha = affordable ? 1 : 0.42;
  ctx.translate(pedestal.x, pedestal.y);
  ctx.shadowBlur = 24;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(4,11,18,.94)";
  ctx.lineWidth = 2;
  roundRect(ctx, -pedestal.w / 2, -76, pedestal.w, 152, 12);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(time * 0.9);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const x = Math.cos(angle) * (19 + Math.sin(time * 3) * 2);
    const y = Math.sin(angle) * (19 + Math.sin(time * 3) * 2);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.rotate(-time * 0.9);
  ctx.fillStyle = "#f3f7ff";
  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "700 11px Chakra Petch, sans-serif";
  ctx.fillText(name, 0, 32, pedestal.w - 12);
  ctx.fillStyle = "#91a0b8";
  ctx.font = "500 8px IBM Plex Mono, monospace";
  wrap(ctx, desc, 0, 48, pedestal.w - 14, 10, 2);
  if (pedestal.cost) {
    ctx.fillStyle = affordable ? "#ffe27b" : "#ff6688";
    ctx.font = "700 9px IBM Plex Mono, monospace";
    ctx.fillText(`${pedestal.cost} SCRAP`, 0, -65);
  } else if (pedestal.kind === "black") {
    ctx.fillStyle = "#ff74ad";
    ctx.font = "700 9px IBM Plex Mono, monospace";
    ctx.fillText("PERMANENT COST", 0, -65);
  }
  ctx.restore();
}

export function drawExpedition(ctx, state, time, W, H) {
  if (!state?.active) return;
  layoutExpeditionObjects(state, W, H);
  drawRoomFrame(ctx, state, W, H, time);
  for (const door of state.doors) drawDoor(ctx, door, time);
  for (const pedestal of state.pedestals)
    drawPedestal(ctx, pedestal, time, state.credits);
  if (state.messageTime > 0) {
    const meta = EXPEDITION_ROOM_TYPES[state.roomType];
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.messageTime);
    ctx.fillStyle = "rgba(2,7,13,.78)";
    ctx.fillRect(0, H * 0.2 - 30, W, 60);
    ctx.fillStyle = meta.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 13px IBM Plex Mono, monospace";
    ctx.fillText(state.message, W / 2, H * 0.2);
    ctx.restore();
  }
}
