import { blasterTraits } from "./synergies.js";

export const APEX_MANIFESTATIONS = Object.freeze([
  Object.freeze({
    id: "seekingStorm",
    name: "SEEKING STORM",
    color: "#75f6ff",
    accent: "#ffe86e",
    tone: 330,
  }),
  Object.freeze({
    id: "recursiveViolence",
    name: "RECURSIVE VIOLENCE",
    color: "#ff82df",
    accent: "#a9f7ff",
    tone: 196,
  }),
  Object.freeze({
    id: "eventHorizon",
    name: "EVENT HORIZON",
    color: "#b792ff",
    accent: "#f4eaff",
    tone: 110,
  }),
  Object.freeze({
    id: "thunderChoir",
    name: "THUNDER CHOIR",
    color: "#ffe36d",
    accent: "#86f6ff",
    tone: 440,
  }),
  Object.freeze({
    id: "guardianSwarm",
    name: "GUARDIAN SWARM",
    color: "#79ffd2",
    accent: "#a9e9ff",
    tone: 262,
  }),
]);

const PRIORITY_HOSTILE_KINDS = new Set(["rail", "blast"]);

export function activeManifestations(player) {
  const traits = blasterTraits(player);
  return APEX_MANIFESTATIONS.filter(({ id }) => traits[id]);
}

export function syncManifestations(player) {
  const active = activeManifestations(player),
    seen = (player.manifestationsSeen ??= new Set()),
    newlyActive = active.filter(({ id }) => !seen.has(id));

  player.manifestations = active.map(({ id }) => id);
  for (const { id } of newlyActive) seen.add(id);

  if (newlyActive.length) {
    const latest = newlyActive[newlyActive.length - 1];
    player.manifestationCue = {
      ...latest,
      name: newlyActive.length > 1 ? "APEX CONVERGENCE" : latest.name,
      life: 2.2,
      max: 2.2,
    };
  }
  return newlyActive;
}

function runtime(player) {
  return (player.manifestationRuntime ??= {
    choirCooldown: 0,
    guardianCooldown: 0,
  });
}

function pushFx(player, effect) {
  player.manifestationFx ??= [];
  player.manifestationFx.push(effect);
}

function updateThunderChoir(player, state, dt, enemies) {
  state.choirCooldown -= dt;
  if (state.choirCooldown > 0) return;

  const count = Math.min(
      7,
      3 +
        (player.companions?.ember || 0) +
        (player.companions?.wisp || 0),
    ),
    targets = enemies
      .filter((enemy) => enemy.hp > 0 && enemy.targetable !== false)
      .sort(
        (a, b) =>
          (a.x - player.x) ** 2 +
          (a.y - player.y) ** 2 -
          ((b.x - player.x) ** 2 + (b.y - player.y) ** 2),
      )
      .slice(0, count);

  if (!targets.length) {
    state.choirCooldown = 0.25;
    return;
  }

  const damage = player.damage * 0.36,
    points = [{ x: player.x, y: player.y }];
  for (const target of targets) {
    target.hp -= damage;
    target.flash = 0.1;
    points.push({ x: target.x, y: target.y });
  }
  pushFx(player, {
    kind: "choir",
    points,
    life: 0.3,
    max: 0.3,
  });
  state.choirCooldown = Math.max(1.9, 3.2 - (count - 3) * 0.16);
}

function updateGuardianSwarm(player, state, dt, enemyBullets) {
  state.guardianCooldown -= dt;
  if (state.guardianCooldown > 0) return;

  const radius = 102 + (player.companions?.shield || 0) * 9,
    capacity = 1 + Math.min(2, player.companions?.drone || 0),
    candidates = enemyBullets
      .map((bullet, index) => ({
        bullet,
        index,
        distance:
          (bullet.x - player.x) ** 2 + (bullet.y - player.y) ** 2,
      }))
      .filter(
        ({ bullet, distance }) =>
          !PRIORITY_HOSTILE_KINDS.has(bullet.kind) &&
          distance < radius * radius,
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, capacity);

  if (!candidates.length) {
    state.guardianCooldown = 0.08;
    return;
  }

  for (const { bullet } of candidates)
    pushFx(player, {
      kind: "guard",
      x: bullet.x,
      y: bullet.y,
      life: 0.24,
      max: 0.24,
    });
  for (const { index } of candidates.sort((a, b) => b.index - a.index))
    enemyBullets.splice(index, 1);
  state.guardianCooldown = 0.36;
}

export function updateManifestations(
  player,
  dt,
  { enemies = [], enemyBullets = [] } = {},
) {
  const active = new Set(player.manifestations || []),
    state = runtime(player);

  if (player.manifestationCue)
    player.manifestationCue.life = Math.max(
      0,
      player.manifestationCue.life - dt,
    );
  player.manifestationFx = (player.manifestationFx || []).filter(
    (effect) => (effect.life -= dt) > 0,
  );

  if (active.has("thunderChoir"))
    updateThunderChoir(player, state, dt, enemies);
  if (active.has("guardianSwarm"))
    updateGuardianSwarm(player, state, dt, enemyBullets);
}
