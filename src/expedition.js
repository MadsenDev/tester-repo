export const EXPEDITION_SECTORS = 5;
export const EXPEDITION_ROOMS = 4;

export const EXPEDITION_ROOM_TYPES = Object.freeze({
  combat: { name: "HOSTILE GRID", color: "#78ebff", danger: "COMBAT" },
  elite: { name: "ELITE INTERCEPT", color: "#ff8b69", danger: "DANGEROUS" },
  item: { name: "MODULE VAULT", color: "#8dffcf", danger: "REWARD" },
  choice: { name: "FORKED SIGNAL", color: "#c994ff", danger: "CHOICE" },
  shop: { name: "SCRAP EXCHANGE", color: "#ffe27b", danger: "SHOP" },
  repair: { name: "QUIET DOCK", color: "#79ffb2", danger: "RECOVERY" },
  secret: { name: "NULL CHAMBER", color: "#ff74ad", danger: "SECRET" },
  boss: { name: "SECTOR WARDEN", color: "#ff665f", danger: "BOSS" },
});

const difficultyScale = (difficulty) =>
  difficulty === "chill" ? 0.82 : difficulty === "intense" ? 1.24 : 1;

export function createExpeditionState(difficulty = "normal") {
  const state = {
    active: true,
    sector: 1,
    room: 1,
    roomType: "combat",
    phase: "combat",
    wave: 0,
    waves: 0,
    waveDelay: 0.35,
    credits: 0,
    doors: [],
    pedestals: [],
    itemVisited: false,
    secretAvailable: true,
    secretsFound: 0,
    pendingDoors: null,
    bossRewardTaken: false,
    blackSignalDue: false,
    rewardGranted: false,
    history: [],
    message: "SECTOR 1 // HOSTILE GRID",
    messageTime: 2.4,
  };
  return beginExpeditionRoom(state, "combat", difficulty, false);
}

export function expeditionDepth(state) {
  return (state.sector - 1) * (EXPEDITION_ROOMS + 1) + state.room;
}

export function beginExpeditionRoom(
  state,
  type,
  difficulty = "normal",
  advance = true,
) {
  if (advance && type !== "secret" && type !== "boss") state.room++;
  if (type === "boss") state.room = EXPEDITION_ROOMS + 1;
  state.roomType = type;
  state.doors = [];
  state.pedestals = [];
  state.wave = 0;
  state.waveDelay = 0.35;
  state.bossRewardTaken = false;
  state.rewardGranted = false;
  const scale = difficultyScale(difficulty);
  if (type === "combat") {
    state.waves = Math.max(1, Math.round((2 + (state.sector - 1) * 0.5) * scale));
    state.phase = "combat";
  } else if (type === "elite") {
    state.waves = Math.max(1, Math.round((1 + state.sector * 0.34) * scale));
    state.phase = "combat";
  } else if (type === "boss") {
    state.waves = 1;
    state.phase = "combat";
  } else {
    state.waves = 0;
    state.phase = "reward";
  }
  if (type === "item" || type === "choice") state.itemVisited = true;
  if (type === "secret") {
    state.secretAvailable = false;
    state.secretsFound++;
  }
  const meta = EXPEDITION_ROOM_TYPES[type];
  state.message = `SECTOR ${state.sector} // ${meta.name}`;
  state.messageTime = 2.2;
  state.history.push(`S${state.sector}:${type}`);
  return state;
}

export function expeditionWavePlan(state, difficulty = "normal") {
  const depth = expeditionDepth(state);
  const base = 3 + state.sector + Math.floor(depth / 5);
  const difficultyBonus = difficulty === "intense" ? 2 : difficulty === "chill" ? -1 : 0;
  return {
    count: Math.max(2, base + difficultyBonus + (state.roomType === "elite" ? 2 : 0)),
    eliteBonus: state.roomType === "elite" ? 0.72 : state.sector * 0.025,
    syntheticTime: 25 + depth * 28,
  };
}

export function markExpeditionWaveSpawned(state) {
  state.wave++;
  state.waveDelay = 0.7;
  return state;
}

function sampleUnique(values, count, random) {
  const pool = [...values], result = [];
  while (pool.length && result.length < count) {
    result.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return result;
}

export function expeditionDoorChoices(state, player = {}, random = Math.random) {
  if (state.roomType === "secret" && state.pendingDoors) {
    state.doors = state.pendingDoors;
    state.pendingDoors = null;
    state.phase = "choice";
    return state.doors;
  }
  if (state.roomType === "boss") {
    state.doors = [{
      type: state.sector >= EXPEDITION_SECTORS ? "victory" : "descend",
      label: state.sector >= EXPEDITION_SECTORS ? "STABILIZE ORBIT" : "DESCEND",
      color: state.sector >= EXPEDITION_SECTORS ? "#8dffcf" : "#ffe27b",
    }];
    state.phase = "choice";
    return state.doors;
  }
  const nextRoom = state.room + 1;
  if (nextRoom > EXPEDITION_ROOMS) {
    state.doors = [{ type: "boss", label: "WARDEN", color: "#ff665f" }];
  } else {
    const candidates = ["combat", "elite", "item", "choice", "shop", "repair"];
    let types = sampleUnique(candidates, 2, random);
    if (!state.itemVisited && nextRoom >= EXPEDITION_ROOMS - 1)
      types[0] = random() < 0.55 ? "item" : "choice";
    state.doors = [...new Set(types)].map((type) => ({
      type,
      label: EXPEDITION_ROOM_TYPES[type].name,
      color: EXPEDITION_ROOM_TYPES[type].color,
    }));
    while (state.doors.length < 2) {
      const type = state.doors[0].type === "combat" ? "shop" : "combat";
      state.doors.push({ type, label: EXPEDITION_ROOM_TYPES[type].name, color: EXPEDITION_ROOM_TYPES[type].color });
    }
  }
  const secretChance = Math.min(0.72, 0.16 + (player.expeditionSecretChance || 0));
  if (state.secretAvailable && random() < secretChance) {
    state.doors.push({
      type: "secret",
      label: player.revealExpeditionSecrets ? "NULL CHAMBER" : "UNKNOWN SIGNAL",
      color: "#ff74ad",
      hidden: !player.revealExpeditionSecrets,
    });
  }
  state.phase = "choice";
  return state.doors;
}

export function takeExpeditionDoor(state, type, difficulty = "normal") {
  if (type === "secret") {
    state.pendingDoors = state.doors.filter((door) => door.type !== "secret");
    return beginExpeditionRoom(state, "secret", difficulty, false);
  }
  if (type === "descend") {
    state.sector++;
    state.room = 1;
    state.itemVisited = false;
    state.secretAvailable = true;
    state.pendingDoors = null;
    return beginExpeditionRoom(state, "combat", difficulty, false);
  }
  return beginExpeditionRoom(state, type, difficulty, type !== "boss");
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
  const rewards = {
    combat: 3 + state.sector,
    elite: 7 + state.sector * 2,
    repair: 2,
    item: 1,
    choice: 1,
    shop: 0,
    secret: 4,
    boss: 8 + state.sector * 2,
  };
  return rewards[state.roomType] || 0;
}

export function expeditionOffersBlackSignal(state) {
  return !!state?.active && state.roomType === "boss";
}

export function expeditionShopCost(base, player = {}) {
  return Math.max(1, Math.ceil(base * (1 - (player.expeditionShopDiscount || 0))));
}

export function expeditionObjective(state) {
  const meta = EXPEDITION_ROOM_TYPES[state.roomType];
  if (state.phase === "combat")
    return state.roomType === "boss"
      ? `DEFEAT SECTOR ${state.sector} WARDEN`
      : `CLEAR WAVE ${Math.min(state.wave + 1, state.waves)}/${state.waves}`;
  if (state.phase === "reward") return "CLAIM A MODULE";
  return "CHOOSE THE NEXT SIGNAL";
}
