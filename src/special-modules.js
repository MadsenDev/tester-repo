const entry = (description, effect = {}) => ({ description, effect });

export const SPECIAL_MODULES = Object.freeze({
  "Blood Battery": entry(
    "Kills repair hull; elites and bosses feed the battery harder.",
    { damage: 1.06 },
  ),
  "Revenge Relay": entry(
    "Taking hull damage triggers four seconds of overdrive.",
    { armor: 0.02 },
  ),
  "Last Bulkhead": entry(
    "Once per run, lethal damage leaves the ship at one hull.",
    { maxHp: 12 },
  ),
  "Kill Switch": entry("Weapon damage rises by 45% below 35% hull integrity.", {
    crit: 0.04,
  }),
  "Scrap Feast": entry("Every salvage gem yields 35% more experience.", {
    magnet: 1.2,
  }),
  "Critical Reboot": entry(
    "Level-ups repair 12% hull and purge nearby hostile fire.",
    { crit: 0.05 },
  ),
  "Phase Memory": entry("Piercing rounds gain 12% damage after every target.", {
    pierce: 1,
    passives: ["pierce"],
  }),
  "Terminal Velocity": entry(
    "Projectile speed converts into up to 40% bonus damage.",
    { bulletSpeed: 1.2, passives: ["bullet"] },
  ),
  "Big Bang Board": entry("Nova impacts gain 35% radius and 20% damage.", {
    flags: ["nova"],
    passives: ["nova"],
  }),
  "Echo Chamber": entry("Every sixth volley echoes at 60% damage.", {
    fireRate: 0.95,
  }),
  "Fork Tax": entry("Extra volley rounds recover 8% damage each, up to 32%.", {
    shots: 1,
    passives: ["multishot"],
  }),
  "Ghost Protocol": entry(
    "Incoming hits have a 12% chance to phase harmlessly.",
    { speed: 1.06 },
  ),
  "Arc Battery": entry(
    "Arc discharges jump twice farther and hit 20% harder.",
    { flags: ["arc"], passives: ["arc"] },
  ),
  "Prism Mirror": entry("Prism impacts fire a second beam backwards.", {
    flags: ["beam"],
    passives: ["beam"],
  }),
  "Anchor Clock": entry(
    "Gravity anchors detonate 35% faster with larger collapse radius.",
    { flags: ["mines"], passives: ["mines"] },
  ),
  "Homing Instinct": entry("Guided projectiles turn 80% faster.", {
    flags: ["missile"],
    passives: ["missile"],
  }),
  "Second Opinion": entry(
    "Level-up transmissions offer four modules instead of three.",
    { xpGain: 1.05 },
  ),
  "Orbital Foundry": entry("Fabricates one Razor orbital and one Gundrone.", {
    companions: ["blade", "drone"],
  }),
  "Mutual Defense": entry(
    "Each companion reduces incoming damage by 4%, up to 20%.",
    { companions: ["shield"] },
  ),
  "Crowded Orbit": entry(
    "Each companion increases weapon damage by 5%, up to 30%.",
    { companions: ["blade"] },
  ),
  "Black Sun": entry("A close-range gravity aura burns nearby hostiles.", {
    flags: ["mines"],
    passives: ["mines", "size"],
  }),
  "White Noise": entry(
    "A defensive pulse erases nearby hostile fire every four seconds.",
    { armor: 0.03 },
  ),
  "Needle Storm": entry(
    "Adds two compact rounds and accelerates the firing cycle.",
    {
      shots: 2,
      damage: 0.88,
      bulletSize: 0.76,
      fireRate: 0.88,
      passives: ["multishot"],
    },
  ),
  "Glass Needle": entry(
    "Critical needle rounds hit brutally hard at the cost of hull.",
    {
      damage: 1.24,
      crit: 0.12,
      bulletSize: 0.78,
      maxHp: -18,
      passives: ["crit"],
    },
  ),
  "Heavy Phase": entry("Massive rounds pierce twice but travel more slowly.", {
    damage: 1.14,
    bulletSize: 1.28,
    bulletSpeed: 0.86,
    pierce: 2,
    passives: ["size", "pierce"],
  }),
  "Bright Ghost": entry(
    "Fast phase rounds gain piercing and critical chance.",
    {
      bulletSpeed: 1.16,
      crit: 0.08,
      pierce: 1,
      passives: ["bullet", "pierce", "crit"],
    },
  ),
  "Seeking Splitter": entry(
    "Adds a split volley whose rounds independently seek targets.",
    { shots: 1, flags: ["missile"], passives: ["multishot", "missile"] },
  ),
  "Storm Lens": entry("Completes the circuit required for Seeking Storm.", {
    shots: 1,
    flags: ["missile", "arc"],
    passives: ["multishot", "missile", "arc"],
    transforms: ["storm"],
  }),
  "Gravity Prism": entry(
    "Installs prism and gravity behavior in a single module.",
    { flags: ["mines", "beam"], passives: ["mines", "beam"] },
  ),
  "Nova Guidance": entry(
    "Guided rounds carry nova payloads into clustered targets.",
    { flags: ["missile", "nova"], passives: ["missile", "nova"] },
  ),
  "Phase Anchor": entry(
    "Piercing rounds leave gravity anchors after their final target.",
    { pierce: 1, flags: ["mines"], passives: ["pierce", "mines"] },
  ),
  "Critical Arc": entry("Critical hits overcharge chained arc damage.", {
    crit: 0.1,
    flags: ["arc"],
    passives: ["crit", "arc"],
  }),
  "Razor Payload": entry("Razor orbitals scale with heavy payload behavior.", {
    bulletSize: 1.18,
    companions: ["blade"],
    passives: ["size", "razor-orbit"],
  }),
  "Razor Velocity": entry(
    "Razor orbitals accelerate with projectile velocity.",
    {
      bulletSpeed: 1.18,
      companions: ["blade"],
      passives: ["bullet", "razor-orbit"],
    },
  ),
  "Ember Arc": entry("Ember familiars conduct arcs through their targets.", {
    flags: ["arc"],
    companions: ["ember"],
    passives: ["arc", "ember-familiar"],
  }),
  "Wisp Anchor": entry("Void wisps seed gravity anchors around their pulses.", {
    flags: ["mines"],
    companions: ["wisp"],
    passives: ["mines", "wisp-familiar"],
  }),
  "Drone Fork": entry("Gundrones inherit split-volley behavior.", {
    shots: 1,
    companions: ["drone"],
    passives: ["multishot", "drone-familiar"],
  }),
  "Aegis Nova": entry("Aegis pulses carry nova behavior into nearby enemies.", {
    flags: ["nova"],
    companions: ["shield"],
    passives: ["nova", "aegis-orbit"],
  }),
  "Familiar Guidance": entry(
    "Familiars acquire farther targets and attack faster.",
    {
      flags: ["missile"],
      companions: ["ember"],
      passives: ["missile", "ember-familiar"],
    },
  ),
  "Orbital Prism": entry(
    "Razor contacts refract prism damage through the formation.",
    {
      bulletSpeed: 1.15,
      flags: ["beam"],
      companions: ["blade"],
      passives: ["bullet", "beam", "razor-orbit"],
      transforms: ["razor-prism"],
    },
  ),
  "Saint Elmo": entry("The Aegis field becomes an electrical conductor.", {
    flags: ["arc"],
    companions: ["shield"],
    passives: ["arc", "aegis-orbit"],
  }),
  "Funeral Star": entry(
    "Boss kills reinforce maximum hull and fully repair the ship.",
    { flags: ["nova"], crit: 0.05, passives: ["nova", "crit"] },
  ),
  "Choir Engine": entry(
    "Completes the Ember, Wisp and arc circuit for Thunder Choir.",
    {
      flags: ["arc"],
      companions: ["ember", "wisp"],
      passives: ["arc", "ember-familiar", "wisp-familiar"],
      transforms: ["thunder-choir"],
    },
  ),
  "Event Horizon Chip": entry(
    "Completes payload, nova, gravity and phase behavior.",
    {
      bulletSize: 1.16,
      pierce: 1,
      flags: ["nova", "mines"],
      passives: ["size", "pierce", "nova", "mines"],
      transforms: ["horizon"],
    },
  ),
  "Recursive Bus": entry("Completes fork, phase, guidance and arc behavior.", {
    shots: 1,
    pierce: 1,
    flags: ["missile", "arc"],
    passives: ["multishot", "pierce", "missile", "arc"],
    transforms: ["recursive"],
  }),
  "Prism Rail": entry("Completes velocity, phase and prism behavior.", {
    bulletSpeed: 1.2,
    pierce: 1,
    flags: ["beam"],
    passives: ["bullet", "pierce", "beam"],
    transforms: ["rail-prism"],
  }),
  "Critical Mass Cell": entry(
    "Completes payload, critical and nova behavior.",
    {
      bulletSize: 1.18,
      crit: 0.08,
      flags: ["nova"],
      passives: ["size", "crit", "nova"],
      transforms: ["critical-mass"],
    },
  ),
  "Guardian Network": entry("Completes Aegis, Gundrone and fork behavior.", {
    shots: 1,
    companions: ["shield", "drone"],
    passives: ["multishot", "aegis-orbit", "drone-familiar"],
    transforms: ["guardian-swarm"],
  }),
  "Moon Court": entry("Completes Wisp, gravity, nova and payload behavior.", {
    bulletSize: 1.16,
    flags: ["mines", "nova"],
    companions: ["wisp"],
    passives: ["size", "mines", "nova", "wisp-familiar"],
    transforms: ["singularity-court"],
  }),
  "Constellation Engine": entry(
    "Expired rounds become stars; every three connect into a damaging constellation.",
    { damage: 1.05, flags: ["beam"], passives: ["beam"] },
  ),
  "Reversal Chamber": entry(
    "Rounds reverse in flight, returning through the arena with more damage and piercing.",
    { bulletSpeed: 1.08, pierce: 1, passives: ["bullet", "pierce"] },
  ),
  "Aegis Reservoir": entry(
    "Aegis stores intercepted hostile rounds and retaliates with their captured energy.",
    { companions: ["shield"], passives: ["aegis-orbit"] },
  ),
  "Orbit Loom": entry(
    "Companions weave damaging energy threads through the space between them.",
    { companions: ["blade", "wisp"], passives: ["razor-orbit", "wisp-familiar"] },
  ),
  "Broadside Protocol": entry(
    "Friendly cannons periodically occupy both arena edges and fire across three lanes.",
    { damage: 1.08, bulletSize: 1.08 },
  ),
  "Grave Echo": entry(
    "Elites, bosses and every tenth kill leave temporary ghosts that fire for the ship.",
    { crit: 0.05 },
  ),
  "Split Horizon": entry(
    "Friendly rounds leaving the arena wrap through the opposite edge once.",
    { bulletSpeed: 1.1, passives: ["bullet"] },
  ),
  "Devouring Moon": entry(
    "A dark familiar consumes friendly rounds and releases their damage as a colossal lance.",
    { bulletSize: 1.12, passives: ["size"] },
  ),
  "Pulse Heart": entry(
    "Periodically gathers nearby rounds into orbit before releasing them as a spiral.",
    { fireRate: 0.94 },
  ),
  "Execution Mark": entry(
    "Marks one target for familiar focus; its death detonates the mark and passes it onward.",
    { companions: ["ember", "drone"], passives: ["ember-familiar", "drone-familiar"] },
  ),
  "Dead God Circuit": entry(
    "Activates every apex transformation and an annihilation aura.",
    {
      damage: 1.12,
      fireRate: 0.92,
      flags: ["missile", "arc", "nova", "mines", "beam"],
      companions: ["blade", "shield", "ember", "wisp", "drone", "wrecking"],
      passives: ["multishot", "pierce", "size", "crit", "bullet"],
      transforms: [
        "storm",
        "horizon",
        "recursive",
        "rail-prism",
        "critical-mass",
        "thunder-choir",
        "razor-prism",
        "guardian-swarm",
        "singularity-court",
      ],
    },
  ),
});

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export const SPECIAL_IDS = Object.freeze(
  Object.fromEntries(
    Object.keys(SPECIAL_MODULES).map((name) => [name, slug(name)]),
  ),
);
export const hasSpecial = (player, id) => player?.specials?.has(id) || false;

const companionCount = (player) =>
  Object.values(player.companions || {}).reduce((sum, count) => sum + count, 0);
const runtime = (player) =>
  (player.specialRuntime ??= { volley: 0, whiteNoise: 4, lastBulkhead: false });

export const specialChoiceCount = (player) =>
  hasSpecial(player, "second-opinion") ? 4 : 3;
export const specialGemMultiplier = (player) =>
  hasSpecial(player, "scrap-feast") ? 1.35 : 1;

export function specialDamageMultiplier(player) {
  let multiplier = 1;
  if (hasSpecial(player, "kill-switch") && player.hp / player.maxHp < 0.35)
    multiplier *= 1.45;
  if (hasSpecial(player, "terminal-velocity"))
    multiplier *=
      1 + Math.min(0.4, Math.max(0, player.bulletSpeed / 520 - 1) * 0.7);
  if (hasSpecial(player, "fork-tax"))
    multiplier *= 1 + Math.min(0.32, Math.max(0, player.shots - 1) * 0.08);
  if (hasSpecial(player, "crowded-orbit"))
    multiplier *= 1 + Math.min(0.3, companionCount(player) * 0.05);
  return multiplier;
}

export function resolveSpecialDamage(player, amount, random = Math.random) {
  const state = runtime(player);
  if (hasSpecial(player, "ghost-protocol") && random() < 0.12)
    return { damage: 0, evaded: true, lastStand: false };
  if (hasSpecial(player, "mutual-defense"))
    amount *= 1 - Math.min(0.2, companionCount(player) * 0.04);
  if (
    hasSpecial(player, "last-bulkhead") &&
    !state.lastBulkhead &&
    amount >= player.hp
  ) {
    state.lastBulkhead = true;
    return {
      damage: Math.max(0, player.hp - 1),
      evaded: false,
      lastStand: true,
    };
  }
  return { damage: amount, evaded: false, lastStand: false };
}

export function afterSpecialDamage(player, result) {
  if (result.damage > 0 && hasSpecial(player, "revenge-relay"))
    player.overdrive = Math.max(player.overdrive, 4);
  if (result.lastStand) player.invuln = Math.max(player.invuln, 2);
}

export function onSpecialKill(player, enemy) {
  if (hasSpecial(player, "blood-battery"))
    player.hp = Math.min(
      player.maxHp,
      player.hp + (enemy.boss ? 6 : enemy.elite ? 1.5 : 0.35),
    );
  if (enemy.boss && hasSpecial(player, "funeral-star")) {
    player.maxHp += 10;
    player.hp = player.maxHp;
  }
  if (enemy.boss && hasSpecial(player, "dead-god-circuit"))
    player.damage *= 1.05;
}

export function onSpecialLevelUp(player, enemyBullets) {
  if (!hasSpecial(player, "critical-reboot")) return;
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.12);
  for (let i = enemyBullets.length - 1; i >= 0; i--)
    if (
      (enemyBullets[i].x - player.x) ** 2 +
        (enemyBullets[i].y - player.y) ** 2 <
      220 ** 2
    )
      enemyBullets.splice(i, 1);
}

export function echoSpecialVolley(player, bullets, startIndex) {
  const state = runtime(player);
  state.volley++;
  if (!hasSpecial(player, "echo-chamber") || state.volley % 6 !== 0) return;
  for (const bullet of bullets.slice(startIndex)) {
    const angle = Math.atan2(bullet.vy, bullet.vx) + 0.12,
      speed = Math.hypot(bullet.vx, bullet.vy);
    bullets.push({
      ...bullet,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: bullet.damage * 0.6,
      hit: new Set(),
      echo: true,
    });
  }
}

export function updateSpecialModules(
  player,
  dt,
  { enemies, enemyBullets, particles, time },
) {
  const state = runtime(player),
    deadGod = hasSpecial(player, "dead-god-circuit");
  if (hasSpecial(player, "black-sun") || deadGod) {
    const radius = deadGod ? 175 : 125,
      dps = player.damage * (deadGod ? 0.34 : 0.18);
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distance < radius + enemy.r)
        enemy.hp -= dps * dt * (1 - (distance / (radius + enemy.r)) * 0.45);
    }
    if (Math.floor(time * 8) % 8 === 0)
      particles.push({
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        life: 0.18,
        max: 0.18,
        kind: "nova",
        size: 3,
      });
  }
  if (hasSpecial(player, "white-noise")) {
    state.whiteNoise -= dt;
    if (state.whiteNoise <= 0) {
      state.whiteNoise = 4;
      for (let i = enemyBullets.length - 1; i >= 0; i--)
        if (
          (enemyBullets[i].x - player.x) ** 2 +
            (enemyBullets[i].y - player.y) ** 2 <
          190 ** 2
        )
          enemyBullets.splice(i, 1);
      particles.push({
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        life: 0.42,
        max: 0.42,
        kind: "nova",
        size: 8,
      });
    }
  }
}
