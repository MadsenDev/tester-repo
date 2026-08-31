function has(player, id) {
  return player?.manifestations?.includes(id);
}

function line(ctx, ax, ay, bx, by) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

export function drawManifestationAura(ctx, player, time) {
  if (!player?.manifestations?.length) return;
  ctx.save();

  if (has(player, "eventHorizon")) {
    ctx.globalAlpha = 0.24 + Math.sin(time * 3) * 0.05;
    ctx.strokeStyle = "#b792ff";
    ctx.shadowColor = "#8c61ff";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.r + 25, player.r + 12, time, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (has(player, "guardianSwarm")) {
    ctx.globalAlpha = 0.28 + Math.sin(time * 5) * 0.06;
    ctx.strokeStyle = "#79ffd2";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, player.r + 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (has(player, "thunderChoir")) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#ffe36d";
    ctx.shadowColor = "#ffe36d";
    ctx.shadowBlur = 14;
    for (let i = 0; i < 3; i++) {
      const angle = time * 1.8 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * (player.r + 22),
        Math.sin(angle) * (player.r + 22),
        2.2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawManifestationHull(ctx, player, time) {
  if (!player?.manifestations?.length) return;
  const radius = player.r;
  ctx.save();
  ctx.lineCap = "round";

  if (has(player, "seekingStorm")) {
    ctx.strokeStyle = "#75f6ff";
    ctx.shadowColor = "#75f6ff";
    ctx.shadowBlur = 13;
    ctx.lineWidth = 2;
    line(ctx, -radius * 0.7, -radius * 0.45, -radius - 9, -radius - 12);
    line(ctx, radius * 0.7, -radius * 0.45, radius + 9, -radius - 12);
    ctx.fillStyle = "#ffe86e";
    for (const x of [-radius - 9, radius + 9]) {
      ctx.beginPath();
      ctx.arc(x, -radius - 12, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (has(player, "recursiveViolence")) {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#ff82df";
    ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * (radius + 4), -4);
      ctx.lineTo(side * (radius + 13), 0);
      ctx.lineTo(side * (radius + 4), 4);
      ctx.stroke();
    }
  }

  if (has(player, "eventHorizon")) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#06020f";
    ctx.shadowColor = "#b792ff";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, radius * 0.38), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f4eaff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(6, radius * 0.55), time, time + Math.PI * 1.45);
    ctx.stroke();
  }

  if (has(player, "guardianSwarm")) {
    ctx.fillStyle = "#79ffd2";
    ctx.shadowColor = "#79ffd2";
    ctx.shadowBlur = 10;
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (i - 1) * 1.8,
        distance = radius + 17;
      ctx.save();
      ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
      ctx.rotate(angle);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }
  }
  ctx.restore();
}

export function drawManifestationProjectile(ctx, bullet, time) {
  const traits = bullet.traits;
  if (!traits) return;
  ctx.save();

  if (traits.recursiveViolence) {
    const generation = bullet.generation || 0;
    ctx.globalAlpha = Math.max(0.35, 0.85 - generation * 0.18);
    ctx.strokeStyle = generation % 2 ? "#a9f7ff" : "#ff82df";
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.2;
    ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
    line(ctx, -bullet.r - 6 - generation * 2, 0, -bullet.r - 1, 0);
  } else if (traits.seekingStorm) {
    ctx.strokeStyle = "#75f6ff";
    ctx.shadowColor = "#ffe86e";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1;
    ctx.rotate(time * 8 + (bullet.guidanceSlot || 0));
    line(ctx, -bullet.r - 3, 0, bullet.r + 3, 0);
    line(ctx, 0, -bullet.r - 3, 0, bullet.r + 3);
  }

  if (traits.eventHorizon) {
    ctx.fillStyle = "#08020f";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.5, bullet.r * 0.58), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d7c7ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, bullet.r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawManifestationWorldFx(ctx, player) {
  for (const effect of player?.manifestationFx || []) {
    const alpha = Math.max(0, effect.life / effect.max);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (effect.kind === "choir") {
      ctx.strokeStyle = "#ffe36d";
      ctx.shadowColor = "#86f6ff";
      ctx.shadowBlur = 24;
      ctx.lineWidth = 3;
      ctx.beginPath();
      effect.points.forEach((point, index) =>
        index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
      );
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.globalAlpha = alpha * 0.7;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (effect.kind === "guard") {
      ctx.strokeStyle = "#79ffd2";
      ctx.shadowColor = "#79ffd2";
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 5 + (1 - alpha) * 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawManifestationCue(ctx, player, width, height) {
  const cue = player?.manifestationCue;
  if (!cue || cue.life <= 0) return;

  const remaining = cue.life / cue.max,
    visibility = Math.min(1, (1 - remaining) * 5, remaining * 2.5),
    y = Math.max(150, height * 0.28);
  ctx.save();
  ctx.globalAlpha = visibility;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(2,5,12,.72)";
  ctx.fillRect(0, y - 54, width, 108);
  ctx.strokeStyle = cue.color;
  ctx.shadowColor = cue.color;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 1.5;
  line(ctx, width * 0.14, y - 42, width * 0.86, y - 42);
  line(ctx, width * 0.14, y + 42, width * 0.86, y + 42);
  ctx.fillStyle = cue.accent;
  ctx.font = "700 11px IBM Plex Mono, monospace";
  ctx.letterSpacing = "4px";
  ctx.fillText("APEX MANIFESTATION", width / 2, y - 18);
  ctx.fillStyle = "#f7fbff";
  ctx.font = "700 " + Math.min(30, Math.max(20, width / 15)) +
    "px Chakra Petch, system-ui";
  ctx.fillText(cue.name, width / 2, y + 13);
  ctx.restore();
}
