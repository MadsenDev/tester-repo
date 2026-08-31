const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function salvageLimit(width = 960, height = 720) {
  const scale = clamp(Math.sqrt((width * height) / (960 * 720)), 0.72, 1.45);
  return Math.round(92 * scale);
}

function mergeGem(target, gem) {
  const total = target.v + gem.v;
  if (total > 0) {
    target.x = (target.x * target.v + gem.x * gem.v) / total;
    target.y = (target.y * target.v + gem.y * gem.v) / total;
  }
  target.v = total;
  target.stack = (target.stack || 1) + (gem.stack || 1);
  target.r = Math.min(10, 4 + Math.log2(1 + Math.max(0, total) / 10));
}

export function compressSalvage(gems, { width = 960, height = 720 } = {}) {
  const limit = salvageLimit(width, height);
  if (gems.length <= limit) return gems;
  const cells = new Map();
  const cellSize = clamp(Math.min(width, height) / 8, 54, 88);
  for (const gem of gems) {
    const key = `${Math.floor(gem.x / cellSize)}:${Math.floor(gem.y / cellSize)}`;
    const existing = cells.get(key);
    if (existing) mergeGem(existing, gem);
    else cells.set(key, { ...gem, stack: gem.stack || 1 });
  }
  const merged = [...cells.values()];
  if (merged.length <= limit) return merged;
  merged.sort((a, b) => b.v - a.v);
  const kept = merged.slice(0, limit);
  for (const gem of merged.slice(limit)) {
    let nearest = kept[0], best = Infinity;
    for (const candidate of kept) {
      const distance = (candidate.x - gem.x) ** 2 + (candidate.y - gem.y) ** 2;
      if (distance < best) { best = distance; nearest = candidate; }
    }
    mergeGem(nearest, gem);
  }
  return kept;
}

export function friendlyVisualLimit(width = 960, height = 720) {
  const scale = clamp(Math.sqrt((width * height) / (960 * 720)), 0.72, 1.45);
  return Math.round(104 * scale);
}

const priorityKind = (kind) => ["mine", "missile", "synergy-anchor"].includes(kind);

export function applyFriendlyVisualBudget(
  bullets,
  { width = 960, height = 720, player = null } = {},
) {
  const limit = friendlyVisualLimit(width, height);
  const visible = [];
  const cells = new Map();
  for (const bullet of bullets) {
    bullet.visualAlpha = 1;
    bullet.visualStack = 1;
    if (bullet.x < -20 || bullet.y < -20 || bullet.x > width + 20 || bullet.y > height + 20) continue;
    const kind = bullet.kind || "blaster";
    if (priorityKind(kind)) { visible.push(bullet); continue; }
    const key = `${kind}:${Math.floor(bullet.x / 30)}:${Math.floor(bullet.y / 30)}`;
    const representative = cells.get(key);
    if (representative) {
      bullet.visualAlpha = 0;
      representative.visualStack += 1;
    } else {
      cells.set(key, bullet);
      visible.push(bullet);
    }
  }
  if (visible.length <= limit) return bullets;
  visible.sort((a, b) => {
    const priority = Number(priorityKind(b.kind)) - Number(priorityKind(a.kind));
    if (priority || !player) return priority;
    return ((a.x - player.x) ** 2 + (a.y - player.y) ** 2) -
      ((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
  });
  const kept = visible.slice(0, limit);
  const keptSet = new Set(kept);
  for (const bullet of visible.slice(limit)) bullet.visualAlpha = 0;
  for (const bullet of bullets) {
    if (bullet.visualAlpha > 0 && !keptSet.has(bullet)) bullet.visualAlpha = 0;
  }
  return bullets;
}

export function friendlyThreatAlpha(bullet, enemyBullets) {
  const base = bullet.visualAlpha ?? 1;
  if (base <= 0) return 0;
  let nearest = Infinity;
  for (const threat of enemyBullets) {
    const distance = (bullet.x - threat.x) ** 2 + (bullet.y - threat.y) ** 2;
    if (distance < nearest) nearest = distance;
    if (nearest < 52 ** 2) return base * 0.16;
  }
  return nearest < 96 ** 2 ? base * 0.42 : base;
}
