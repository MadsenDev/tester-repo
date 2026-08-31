export const PROJECTILE_PRESSURE_PROFILES = Object.freeze({
  chill: Object.freeze({ early: 72, late: 96 }),
  normal: Object.freeze({ early: 110, late: 155 }),
  intense: Object.freeze({ early: Infinity, late: Infinity }),
});

const PRIORITY_KINDS = new Set(["rail", "blast"]);
const REFERENCE_AREA = 1280 * 720;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function projectileLimit(
  difficulty = "normal",
  time = 0,
  width = 1280,
  height = 720,
) {
  const profile =
    PROJECTILE_PRESSURE_PROFILES[difficulty] ||
    PROJECTILE_PRESSURE_PROFILES.normal;
  if (!Number.isFinite(profile.early)) return Infinity;

  const lateRun = clamp((time - 180) / 420, 0, 1),
    base = profile.early + (profile.late - profile.early) * lateRun,
    area = Math.max(1, width) * Math.max(1, height),
    viewportScale = clamp(Math.sqrt(area / REFERENCE_AREA), 0.72, 1.35);

  return Math.max(1, Math.round(base * viewportScale));
}

export function regulateProjectilePressure(
  bullets,
  {
    difficulty = "normal",
    time = 0,
    width = 1280,
    height = 720,
    player = { x: width / 2, y: height / 2 },
  } = {},
) {
  const limit = projectileLimit(difficulty, time, width, height);
  if (!Number.isFinite(limit) || bullets.length <= limit) return bullets;

  const overflow = bullets.length - limit,
    ranked = bullets
      .map((bullet, index) => {
        const dx = bullet.x - player.x,
          dy = bullet.y - player.y,
          pad = 40,
          visible =
            bullet.x >= -pad &&
            bullet.x <= width + pad &&
            bullet.y >= -pad &&
            bullet.y <= height + pad;
        return {
          index,
          protected: PRIORITY_KINDS.has(bullet.kind),
          visible,
          distance: dx * dx + dy * dy,
          life: bullet.life ?? 0,
        };
      })
      .sort(
        (a, b) =>
          Number(a.protected) - Number(b.protected) ||
          Number(a.visible) - Number(b.visible) ||
          b.distance - a.distance ||
          a.life - b.life ||
          a.index - b.index,
      ),
    removed = new Set(ranked.slice(0, overflow).map(({ index }) => index));

  return bullets.filter((_, index) => !removed.has(index));
}
