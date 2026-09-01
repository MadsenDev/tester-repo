const polygon = (ctx, x, y, radius, sides, rotation = 0) => {
  ctx.beginPath();
  for (let index = 0; index < sides; index++) {
    const angle = rotation + (index * Math.PI * 2) / sides,
      px = x + Math.cos(angle) * radius,
      py = y + Math.sin(angle) * radius;
    index ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
};

const drawConstellations = (ctx, state, time) => {
  ctx.save();
  ctx.strokeStyle = "rgba(255,232,143,.34)";
  ctx.fillStyle = "#fff1ae";
  ctx.shadowColor = "#ffe680";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 1.6;
  for (let index = 0; index + 2 < state.stars.length; index += 3) {
    const stars = state.stars.slice(index, index + 3);
    ctx.beginPath();
    ctx.moveTo(stars[0].x, stars[0].y);
    ctx.lineTo(stars[1].x, stars[1].y);
    ctx.lineTo(stars[2].x, stars[2].y);
    ctx.closePath();
    ctx.stroke();
  }
  for (const star of state.stars) {
    ctx.globalAlpha = Math.min(1, star.life * 0.7);
    polygon(ctx, star.x, star.y, 4.5, 4, time * 1.4 + star.phase);
    ctx.fill();
  }
  ctx.restore();
};

const drawBroadside = (ctx, broadside, W, time) => {
  if (!broadside) return;
  const fired = broadside.fired,
    pulse = 0.55 + Math.sin(time * 24) * 0.25;
  ctx.save();
  ctx.strokeStyle = fired ? "#fff5c2" : "#ffd871";
  ctx.shadowColor = "#ffe680";
  ctx.shadowBlur = fired ? 28 : 12;
  ctx.globalAlpha = fired ? Math.max(0, broadside.timer / 0.2) : pulse;
  ctx.lineWidth = fired ? 11 : 2;
  ctx.setLineDash(fired ? [] : [12, 12]);
  for (const row of broadside.rows) {
    ctx.beginPath();
    ctx.moveTo(0, row);
    ctx.lineTo(W, row);
    ctx.stroke();
    if (!fired) {
      ctx.fillStyle = "#ffd871";
      ctx.beginPath();
      ctx.moveTo(18, row);
      ctx.lineTo(2, row - 9);
      ctx.lineTo(2, row + 9);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W - 18, row);
      ctx.lineTo(W - 2, row - 9);
      ctx.lineTo(W - 2, row + 9);
      ctx.fill();
    }
  }
  ctx.restore();
};

const drawOrbitLoom = (ctx, nodes, time) => {
  if (!nodes || nodes.length < 2) return;
  ctx.save();
  ctx.strokeStyle = `rgba(255,247,194,${0.32 + Math.sin(time * 7) * 0.08})`;
  ctx.shadowColor = "#fff0a0";
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  ctx.beginPath();
  nodes.forEach((node, index) =>
    index ? ctx.lineTo(node.x, node.y) : ctx.moveTo(node.x, node.y),
  );
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

const drawEchoes = (ctx, echoes, time) => {
  for (const echo of echoes) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.42, echo.life * 0.12);
    ctx.strokeStyle = echo.color;
    ctx.fillStyle = "rgba(215,177,255,.12)";
    ctx.shadowColor = "#d6a9ff";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2;
    polygon(ctx, echo.x, echo.y, echo.r, echo.sides, -time * 0.8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
};

const drawExecutionMark = (ctx, state, time) => {
  const target = state.mark;
  if (target?.hp > 0) {
    const radius = target.r + 14 + Math.sin(time * 9) * 3;
    ctx.save();
    ctx.strokeStyle = "#ffe76f";
    ctx.shadowColor = "#ffe76f";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let index = 0; index < 4; index++) {
      const angle = time * 1.4 + (index * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(target.x + Math.cos(angle) * (radius - 5), target.y + Math.sin(angle) * (radius - 5));
      ctx.lineTo(target.x + Math.cos(angle) * (radius + 8), target.y + Math.sin(angle) * (radius + 8));
      ctx.stroke();
    }
    ctx.restore();
  }
  if (state.markBurst) {
    const alpha = state.markBurst.life / 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#fff1a8";
    ctx.shadowColor = "#ffe76f";
    ctx.shadowBlur = 24;
    ctx.lineWidth = 5 * alpha;
    ctx.beginPath();
    ctx.arc(state.markBurst.x, state.markBurst.y, 110 * (1.15 - alpha * 0.15), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

const drawReservoir = (ctx, player, reservoir, time) => {
  if (!reservoir.length) return;
  ctx.save();
  reservoir.forEach((shot, index) => {
    const angle = time * 1.8 + shot.phase + (index * Math.PI * 2) / reservoir.length,
      radius = 48 + (index % 3) * 6;
    ctx.fillStyle = index % 2 ? "#ff83ad" : "#fff0a0";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(angle) * radius, player.y + Math.sin(angle) * radius, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

const drawMoon = (ctx, moon) => {
  if (!moon) return;
  const charge = Math.min(1, moon.energy / Math.max(1, moon.threshold));
  ctx.save();
  ctx.translate(moon.x, moon.y);
  ctx.shadowColor = moon.flash > 0 ? "#ffffff" : "#b875ff";
  ctx.shadowBlur = 18 + charge * 25;
  ctx.fillStyle = "#07060d";
  ctx.strokeStyle = moon.flash > 0 ? "#ffffff" : "#d3a2ff";
  ctx.lineWidth = 2 + charge * 3;
  ctx.beginPath();
  ctx.arc(0, 0, 15 + charge * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,230,128,${0.25 + charge * 0.65})`;
  ctx.beginPath();
  ctx.moveTo(-5, -10);
  ctx.lineTo(2, -2);
  ctx.lineTo(-1, 4);
  ctx.lineTo(7, 11);
  ctx.stroke();
  ctx.restore();
};

const drawHeart = (ctx, player, heart, time) => {
  if (!heart) return;
  const progress = 1 - heart.timer / 0.72;
  ctx.save();
  heart.shots.forEach((shot, index) => {
    const angle = time * 4 + (index * Math.PI * 2) / heart.shots.length,
      radius = 34 + progress * 38;
    ctx.fillStyle = index % 2 ? "#fff0a0" : "#9bf5ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(angle) * radius, player.y + Math.sin(angle) * radius, Math.max(2.5, shot.r), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

export function drawArenaModules(ctx, player, time, W, H) {
  const state = player?.arenaRuntime;
  if (!state) return;
  drawConstellations(ctx, state, time);
  drawBroadside(ctx, state.broadside, W, time);
  drawOrbitLoom(ctx, state.loomNodes, time);
  drawEchoes(ctx, state.echoes, time);
  drawExecutionMark(ctx, state, time);
  drawReservoir(ctx, player, state.reservoir, time);
  drawMoon(ctx, state.moon);
  drawHeart(ctx, player, state.heart, time);
  void H;
}
