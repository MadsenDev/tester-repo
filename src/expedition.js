export const EXPEDITION_SECTORS = 5;
export const EXPEDITION_ROOMS = 9;

export const EXPEDITION_ROOM_TYPES = Object.freeze({
  combat: { name: "HOSTILE GRID", short: "", color: "#78ebff", danger: "COMBAT" },
  elite: { name: "ELITE INTERCEPT", short: "ELITE", color: "#ff8b69", danger: "DANGEROUS" },
  item: { name: "MODULE VAULT", short: "MODULE", color: "#8dffcf", danger: "REWARD" },
  choice: { name: "FORKED SIGNAL", short: "CHOICE", color: "#c994ff", danger: "CHOICE" },
  shop: { name: "SCRAP EXCHANGE", short: "SHOP", color: "#ffe27b", danger: "SHOP" },
  repair: { name: "QUIET DOCK", short: "REPAIR", color: "#79ffb2", danger: "RECOVERY" },
  secret: { name: "NULL CHAMBER", short: "SECRET", color: "#ff74ad", danger: "SECRET" },
  black: { name: "BLACK SIGNAL", short: "BLACK", color: "#ff5c93", danger: "CONTRACT" },
  boss: { name: "SECTOR WARDEN", short: "BOSS", color: "#ff665f", danger: "BOSS" },
});

export const EXPEDITION_DIRECTIONS = Object.freeze({
  n: { dx: 0, dy: -1, opposite: "s" },
  e: { dx: 1, dy: 0, opposite: "w" },
  s: { dx: 0, dy: 1, opposite: "n" },
  w: { dx: -1, dy: 0, opposite: "e" },
});

const difficultyScale = (difficulty) =>
  difficulty === "chill" ? 0.82 : difficulty === "intense" ? 1.24 : 1;
const key = (x, y) => `${x},${y}`;
const shuffled = (values, random) =>
  [...values]
    .map((value) => ({ value, order: random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ value }) => value);

function connect(a, b, direction) {
  a.links[direction] = b.id;
  b.links[EXPEDITION_DIRECTIONS[direction].opposite] = a.id;
}

function freeDirections(node, occupied, random) {
  return shuffled(Object.keys(EXPEDITION_DIRECTIONS), random).filter((direction) => {
    const dir = EXPEDITION_DIRECTIONS[direction];
    return !occupied.has(key(node.x + dir.dx, node.y + dir.dy));
  });
}

function growConnectedMap(count, random) {
  const nodes = [{ id: "r0", x: 0, y: 0, type: "combat", links: {} }],
    occupied = new Map([[key(0, 0), nodes[0]]]);
  let attempts = 0;
  while (nodes.length < count && attempts++ < 500) {
    const candidates = shuffled(nodes, random).filter(
      (node) => freeDirections(node, occupied, random).length,
    );
    const parent = candidates[0];
    if (!parent) break;
    const direction = freeDirections(parent, occupied, random)[0],
      dir = EXPEDITION_DIRECTIONS[direction],
      node = {
        id: `r${nodes.length}`,
        x: parent.x + dir.dx,
        y: parent.y + dir.dy,
        type: "combat",
        links: {},
      };
    nodes.push(node);
    occupied.set(key(node.x, node.y), node);
    connect(parent, node, direction);
    if (random() < 0.3) {
      for (const extraDirection of shuffled(Object.keys(EXPEDITION_DIRECTIONS), random)) {
        const extra = EXPEDITION_DIRECTIONS[extraDirection],
          neighbor = occupied.get(key(node.x + extra.dx, node.y + extra.dy));
        if (neighbor && neighbor !== parent && !node.links[extraDirection]) {
          connect(node, neighbor, extraDirection);
          break;
        }
      }
    }
  }
  while (nodes.length < count) {
    const parent = nodes[nodes.length - 1],
      node = { id: `r${nodes.length}`, x: parent.x + 1, y: parent.y, type: "combat", links: {} };
    nodes.push(node);
    occupied.set(key(node.x, node.y), node);
    connect(parent, node, "e");
  }
  return { nodes, occupied };
}

function distancesFromStart(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node])),
    distance = new Map([["r0", 0]]),
    queue = ["r0"];
  while (queue.length) {
    const id = queue.shift(), node = byId.get(id);
    for (const next of Object.values(node.links))
      if (!distance.has(next)) {
        distance.set(next, distance.get(id) + 1);
        queue.push(next);
      }
  }
  return distance;
}

function attachLeaf(nodes, occupied, anchor, type, id, random) {
  const direction = freeDirections(anchor, occupied, random)[0];
  if (!direction) return null;
  const dir = EXPEDITION_DIRECTIONS[direction],
    node = {
      id,
      x: anchor.x + dir.dx,
      y: anchor.y + dir.dy,
      type,
      links: {},
      hidden: true,
      locked: type === "black",
    };
  nodes.push(node);
  occupied.set(key(node.x, node.y), node);
  connect(anchor, node, direction);
  return node;
}

export function generateExpeditionMap(sector = 1, random = Math.random, player = {}) {
  const { nodes, occupied } = growConnectedMap(EXPEDITION_ROOMS, random),
    distance = distancesFromStart(nodes),
    bossCandidates = nodes.filter(
      (node) => node.id !== "r0" && freeDirections(node, occupied, random).length,
    ),
    boss = [...(bossCandidates.length ? bossCandidates : nodes.filter((node) => node.id !== "r0"))]
      .sort((a, b) => distance.get(b.id) - distance.get(a.id))[0];
  boss.type = "boss";
  const assignments = shuffled(
      ["item", "choice", "shop", "repair", "elite", "combat", "combat"],
      random,
    ),
    ordinary = shuffled(
      nodes.filter((node) => node.id !== "r0" && node !== boss),
      random,
    );
  ordinary.forEach((node, index) => (node.type = assignments[index] || "combat"));
  const leafAnchors = shuffled(
    nodes.filter((node) => node.id !== "r0" && node !== boss),
    random,
  ).filter((node) => freeDirections(node, occupied, random).length);
  const secret = leafAnchors.length
    ? attachLeaf(nodes, occupied, leafAnchors[0], "secret", "secret", random)
    : null;
  const secondAnchor = leafAnchors.find(
    (node) => node.id !== secret?.id && freeDirections(node, occupied, random).length,
  );
  const secondSecret =
    secondAnchor && random() < (player.expeditionSecretChance || 0)
      ? attachLeaf(nodes, occupied, secondAnchor, "secret", "secret-2", random)
      : null;
  const black = attachLeaf(nodes, occupied, boss, "black", "black", random);
  for (const node of nodes) {
    node.visited = false;
    node.discovered = node.id === "r0";
    node.cleared = false;
    node.initialized = false;
    node.pedestals = [];
    node.pedestalsInitialized = false;
    node.rewardGranted = false;
  }
  return {
    sector,
    nodes,
    startId: "r0",
    bossId: boss.id,
    secretIds: [secret?.id, secondSecret?.id].filter(Boolean),
    blackId: black?.id,
  };
}

export function currentExpeditionNode(state) {
  return state.map.nodes.find((node) => node.id === state.currentId);
}

function initializeNode(state, node, difficulty) {
  const scale = difficultyScale(difficulty), type = node.type;
  node.wave = 0;
  node.waveDelay = 0.35;
  node.waves =
    type === "combat"
      ? Math.max(1, Math.round((2 + (state.sector - 1) * 0.5) * scale))
      : type === "elite"
        ? Math.max(1, Math.round((1 + state.sector * 0.34) * scale))
        : type === "boss"
          ? 1
          : 0;
  node.phase = ["combat", "elite", "boss"].includes(type) ? "combat" : "reward";
  node.initialized = true;
}

function discoverNeighbors(state, node) {
  for (const id of Object.values(node.links)) {
    const neighbor = state.map.nodes.find((candidate) => candidate.id === id);
    if (neighbor && !neighbor.hidden && !neighbor.locked) neighbor.discovered = true;
  }
}

function loadNode(state, node, difficulty, firstVisit = false) {
  if (!node.initialized) initializeNode(state, node, difficulty);
  node.visited = true;
  node.discovered = true;
  discoverNeighbors(state, node);
  state.currentId = node.id;
  state.roomType = node.type;
  state.phase = node.phase;
  state.wave = node.wave;
  state.waves = node.waves;
  state.waveDelay = node.waveDelay;
  state.pedestals = node.pedestals;
  state.pedestalsInitialized = node.pedestalsInitialized;
  state.rewardGranted = node.rewardGranted;
  state.room = state.map.nodes.filter((room) => room.visited).length;
  state.doors = [];
  const meta = EXPEDITION_ROOM_TYPES[node.type];
  state.message = `${firstVisit ? "NEW SIGNAL" : "RETURN"} // ${meta.name}`;
  state.messageTime = firstVisit ? 2.2 : 1.1;
  state.history.push(`S${state.sector}:${node.id}:${node.type}`);
  return state;
}

export function persistExpeditionRoom(state) {
  const node = currentExpeditionNode(state);
  if (!node) return state;
  node.phase = state.phase;
  node.wave = state.wave;
  node.waves = state.waves;
  node.waveDelay = state.waveDelay;
  node.pedestals = state.pedestals;
  node.pedestalsInitialized = state.pedestalsInitialized;
  node.rewardGranted = state.rewardGranted;
  return state;
}

export function createExpeditionState(
  difficulty = "normal",
  player = {},
  random = Math.random,
) {
  const map = generateExpeditionMap(1, random, player),
    state = {
      active: true,
      sector: 1,
      map,
      currentId: map.startId,
      room: 1,
      roomType: "combat",
      phase: "combat",
      wave: 0,
      waves: 0,
      waveDelay: 0.35,
      credits: 0,
      doors: [],
      pedestals: [],
      secretsFound: 0,
      roomsCleared: 0,
      rewardGranted: false,
      pedestalsInitialized: false,
      history: [],
      message: "",
      messageTime: 0,
      random,
      player,
    };
  return loadNode(state, map.nodes[0], difficulty, true);
}

export function expeditionDepth(state) {
  return (state.sector - 1) * EXPEDITION_ROOMS + state.roomsCleared + 1;
}

export function expeditionWavePlan(state, difficulty = "normal") {
  const depth = expeditionDepth(state),
    base = 3 + state.sector + Math.floor(depth / 5),
    difficultyBonus = difficulty === "intense" ? 2 : difficulty === "chill" ? -1 : 0;
  return {
    count: Math.max(2, base + difficultyBonus + (state.roomType === "elite" ? 2 : 0)),
    eliteBonus: state.roomType === "elite" ? 0.72 : state.sector * 0.025,
    syntheticTime: 25 + depth * 28,
  };
}

export function markExpeditionWaveSpawned(state) {
  state.wave++;
  state.waveDelay = 0.7;
  return persistExpeditionRoom(state);
}

function doorLabel(node, player) {
  if (node.hidden && !node.visited && !player.revealExpeditionSecrets) return "";
  return EXPEDITION_ROOM_TYPES[node.type].short;
}

export function expeditionDoorChoices(state, player = {}) {
  persistExpeditionRoom(state);
  const node = currentExpeditionNode(state), doors = [];
  for (const [direction, id] of Object.entries(node.links)) {
    const target = state.map.nodes.find((candidate) => candidate.id === id);
    if (!target || target.locked) continue;
    doors.push({
      type: "room",
      nodeId: target.id,
      direction,
      label: doorLabel(target, player),
      color: EXPEDITION_ROOM_TYPES[target.type].color,
      hidden: target.hidden && !target.visited && !player.revealExpeditionSecrets,
      backtrack: target.visited,
    });
  }
  if (node.type === "boss" && node.cleared) {
    const exitDirection = ["s", "e", "w", "n"].find(
      (direction) => !node.links[direction],
    ) || "s";
    doors.push({
      type: state.sector >= EXPEDITION_SECTORS ? "victory" : "descend",
      direction: exitDirection,
      label: state.sector >= EXPEDITION_SECTORS ? "STABILIZE" : "DESCEND",
      color: state.sector >= EXPEDITION_SECTORS ? "#8dffcf" : "#ffe27b",
    });
  }
  state.doors = doors;
  state.phase = node.cleared || !["combat", "elite", "boss"].includes(node.type)
    ? "choice"
    : state.phase;
  return doors;
}

export function markExpeditionRoomCleared(state) {
  const node = currentExpeditionNode(state);
  if (!node.cleared) state.roomsCleared++;
  node.cleared = true;
  state.phase = "choice";
  node.phase = "choice";
  if (node.type === "boss") {
    const black = state.map.nodes.find((room) => room.id === state.map.blackId);
    if (black) {
      black.locked = false;
      black.hidden = false;
      black.discovered = true;
    }
  }
  return persistExpeditionRoom(state);
}

export function takeExpeditionDoor(state, door, difficulty = "normal") {
  if (typeof door === "string") door = state.doors.find((candidate) => candidate.type === door);
  if (!door) return state;
  persistExpeditionRoom(state);
  if (door.type === "descend") {
    state.sector++;
    state.map = generateExpeditionMap(state.sector, state.random, state.player);
    return loadNode(state, state.map.nodes[0], difficulty, true);
  }
  if (door.type !== "room") return state;
  const target = state.map.nodes.find((node) => node.id === door.nodeId), firstVisit = !target.visited;
  if (target.type === "secret" && firstVisit) state.secretsFound++;
  return loadNode(state, target, difficulty, firstVisit);
}

export function expeditionPedestalSpec(state, player = {}) {
  const bonus = Math.max(0, player.expeditionChoiceBonus || 0);
  if (state.roomType === "item") return { count: 1 + bonus, pool: "salvage", cost: 0, exclusive: true };
  if (state.roomType === "choice") return { count: 2 + bonus, pool: "companion", cost: 0, exclusive: true };
  if (state.roomType === "shop") return { count: 3, pool: "salvage", cost: 5, exclusive: false };
  if (state.roomType === "secret") return { count: 1 + Math.min(1, bonus), pool: "boss", cost: 0, exclusive: true };
  if (state.roomType === "boss") return { count: 1, pool: "boss", cost: 0, exclusive: true };
  return null;
}

export function expeditionRoomReward(state) {
  const rewards = { combat: 3 + state.sector, elite: 7 + state.sector * 2, repair: 2, item: 1, choice: 1, shop: 0, secret: 4, black: 0, boss: 8 + state.sector * 2 };
  return rewards[state.roomType] || 0;
}

export function expeditionOffersBlackSignal(state) {
  return !!state?.active && state.roomType === "boss";
}

export function expeditionShopCost(base, player = {}) {
  return Math.max(1, Math.ceil(base * (1 - (player.expeditionShopDiscount || 0))));
}

export function expeditionObjective(state) {
  if (state.phase === "combat")
    return state.roomType === "boss"
      ? `DEFEAT SECTOR ${state.sector} WARDEN`
      : `CLEAR WAVE ${Math.min(state.wave + 1, state.waves)}/${state.waves}`;
  if (state.pedestals.length) return "MODULES MAY BE LEFT FOR LATER";
  return "EXPLORE THE SECTOR";
}
