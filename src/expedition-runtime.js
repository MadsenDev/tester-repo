import { dist2, spawnEnemy } from "./entities.js";
import { randomChoices } from "./upgrades.js";
import { createHazardState } from "./hazards.js";
import { spawnDirectedBoss } from "./boss-runtime.js";
import { acceptBlackSignal, blackSignalOffers } from "./black-signal.js";
import {
  currentExpeditionNode,
  expeditionDoorChoices,
  expeditionPedestalSpec,
  expeditionRoomReward,
  expeditionShopCost,
  expeditionWavePlan,
  markExpeditionRoomCleared,
  markExpeditionWaveSpawned,
  persistExpeditionRoom,
  takeExpeditionDoor,
} from "./expedition.js";
import { expeditionRoomEntryPosition } from "./expedition-render.js";
import {
  createExpeditionEncounterRuntime,
  expeditionEnemyKind,
} from "./expedition-encounters.js";

export function createExpeditionController(runtime) {
  function grantRoomReward() {
    const expedition = runtime.expedition;
    if (!expedition || expedition.rewardGranted) return;
    expedition.credits += expeditionRoomReward(expedition);
    expedition.rewardGranted = true;
    persistExpeditionRoom(expedition);
  }

  function positionPlayer(entryDirection) {
    const position = expeditionRoomEntryPosition(
      entryDirection,
      runtime.width,
      runtime.height,
      runtime.player.r,
    );
    runtime.player.x = position.x;
    runtime.player.y = position.y;
    runtime.player.vx = runtime.player.vy = 0;
  }

  function clearArena(entryDirection) {
    runtime.enemies = [];
    runtime.bullets = [];
    runtime.enemyBullets = [];
    runtime.gems = [];
    runtime.powerups = [];
    runtime.hazards = createHazardState();
    positionPlayer(entryDirection);
  }

  function openDoors() {
    grantRoomReward();
    expeditionDoorChoices(runtime.expedition, runtime.player);
  }

  function createPedestals() {
    const expedition = runtime.expedition;
    if (expedition.pedestalsInitialized) return true;
    const spec = expeditionPedestalSpec(expedition, runtime.player);
    if (!spec) return false;
    const offers = randomChoices(runtime.player, spec.count, spec.pool);
    const baseCost = expeditionShopCost(
      spec.cost + expedition.sector * 2,
      runtime.player,
    );
    expedition.pedestals = offers.map((module) => ({
      module,
      kind: expedition.roomType,
      color:
        expedition.roomType === "boss"
          ? "#ffe27b"
          : expedition.roomType === "secret"
            ? "#ff74ad"
            : expedition.roomType === "choice"
              ? "#c994ff"
              : "#8dffcf",
      cost: expedition.roomType === "shop" ? baseCost : 0,
      exclusive: spec.exclusive,
    }));
    expedition.pedestalsInitialized = true;
    expedition.phase = "reward";
    persistExpeditionRoom(expedition);
    return true;
  }

  function createBlackSignalPedestals() {
    const expedition = runtime.expedition;
    if (expedition.pedestalsInitialized) return;
    const offers = blackSignalOffers(runtime.player);
    expedition.pedestals = offers.map((offer) => ({
      offer,
      module: {
        ...offer.module,
        desc: `${offer.terms.price} ${offer.terms.boon}`,
      },
      kind: "black",
      color: "#ff74ad",
      cost: 0,
      exclusive: true,
    }));
    expedition.pedestalsInitialized = true;
    expedition.phase = "reward";
    expedition.message = "BLACK SIGNAL // THE PRICE IS PERMANENT";
    expedition.messageTime = 2.4;
    persistExpeditionRoom(expedition);
  }

  function completeRoom() {
    const expedition = runtime.expedition;
    if (!expedition || expedition.phase !== "combat") return;
    runtime.enemyBullets = [];
    runtime.bullets = [];
    if (expedition.encounterRuntime) {
      expedition.encounterRuntime.active = false;
      expedition.encounterRuntime.beam = null;
    }
    markExpeditionRoomCleared(expedition);
    grantRoomReward();
    if (expedition.roomType === "boss") {
      createPedestals();
      openDoors();
      expedition.message = "WARDEN DESTROYED // RELIC MAY BE LEFT BEHIND";
      expedition.messageTime = 2.5;
      return;
    }
    openDoors();
    expedition.message = `ROOM CLEAR // ${expedition.credits} SCRAP`;
    expedition.messageTime = 1.8;
  }

  function prepareRoom(entryDirection) {
    const expedition = runtime.expedition;
    clearArena(entryDirection);
    expedition.encounterRuntime = createExpeditionEncounterRuntime(
      expedition.encounterId,
      runtime.width,
      runtime.height,
      expedition.random,
    );
    if (expedition.phase === "combat") return;
    expedition.encounterRuntime.active = false;
    const node = currentExpeditionNode(expedition);
    if (!node.cleared) markExpeditionRoomCleared(expedition);
    if (expedition.roomType === "repair" && !expedition.rewardGranted) {
      const ratio = 0.32 + (runtime.player.expeditionRepairBonus || 0);
      runtime.player.hp = Math.min(
        runtime.player.maxHp,
        runtime.player.hp + runtime.player.maxHp * ratio,
      );
      expedition.message = "QUIET DOCK // HULL RESTORED";
      expedition.messageTime = 2.2;
    } else if (expedition.roomType === "black") {
      createBlackSignalPedestals();
    } else if (
      ["item", "choice", "shop", "secret"].includes(expedition.roomType)
    ) {
      createPedestals();
    }
    openDoors();
  }

  function enterDoor(door) {
    if (door.type === "victory") {
      runtime.finish(true);
      return;
    }
    takeExpeditionDoor(runtime.expedition, door, runtime.settings.difficulty);
    prepareRoom(door.direction);
    runtime.audio.level();
  }

  function collectPedestal(pedestal) {
    const expedition = runtime.expedition;
    if (pedestal.cost && expedition.credits < pedestal.cost) {
      expedition.message = `INSUFFICIENT SCRAP // NEED ${pedestal.cost}`;
      expedition.messageTime = 1.2;
      return;
    }
    if (pedestal.cost) expedition.credits -= pedestal.cost;
    if (pedestal.kind === "black") {
      const accepted = acceptBlackSignal(runtime.player, pedestal.offer);
      runtime.contractHistory.push(accepted);
      runtime.noteDiscovery("modules", accepted.module);
    } else {
      pedestal.module.apply(runtime.player);
      runtime.noteDiscovery("modules", pedestal.module.id);
    }
    runtime.player.level++;
    runtime.syncSynergyDiscoveries();
    runtime.audio.level();
    runtime.shake = Math.max(runtime.shake, 10);
    if (pedestal.exclusive) expedition.pedestals = [];
    else
      expedition.pedestals = expedition.pedestals.filter(
        (item) => item !== pedestal,
      );
    persistExpeditionRoom(expedition);
    expeditionDoorChoices(expedition, runtime.player);
    runtime.updateUI();
  }

  function spawnWave() {
    const expedition = runtime.expedition;
    const plan = expeditionWavePlan(expedition, runtime.settings.difficulty);
    for (let i = 0; i < plan.count; i++)
      runtime.enemies.push(
        spawnEnemy(
          runtime.width,
          runtime.height,
          plan.syntheticTime,
          plan.eliteBonus,
          expedition.roomType === "elite" && i === 0,
          expeditionEnemyKind(expedition, i, expedition.random),
        ),
      );
    markExpeditionWaveSpawned(expedition);
    expedition.message = `WAVE ${expedition.wave}/${expedition.waves}`;
    expedition.messageTime = 1.1;
  }

  function update(dt) {
    const expedition = runtime.expedition;
    if (!expedition) return;
    expedition.messageTime = Math.max(0, expedition.messageTime - dt);
    if (expedition.phase === "combat" && runtime.enemies.length === 0) {
      expedition.waveDelay -= dt;
      if (expedition.waveDelay > 0) return;
      if (expedition.roomType === "boss" && expedition.wave === 0) {
        const boss = spawnDirectedBoss(runtime.bossRuntime, {
          w: runtime.width,
          h: runtime.height,
          time: expedition.sector * 120 - 60,
          difficulty: runtime.settings.difficulty,
          mode: "expedition",
          sector: expedition.sector,
          bossCount: runtime.bossRuntime.totalBosses,
          player: runtime.player,
          random: expedition.random,
        });
        runtime.enemies.push(boss);
        runtime.noteDiscovery("bosses", boss.kind);
        markExpeditionWaveSpawned(expedition);
        runtime.audio.boss();
        runtime.shake = 12;
      } else if (expedition.wave < expedition.waves) spawnWave();
      else completeRoom();
    }
    for (const pedestal of [...expedition.pedestals]) {
      if (!Number.isFinite(pedestal.x)) continue;
      if (
        dist2(runtime.player, pedestal) <
        (runtime.player.r + (pedestal.r || 24)) ** 2
      )
        collectPedestal(pedestal);
    }
    for (const door of [...expedition.doors]) {
      if (!Number.isFinite(door.x)) continue;
      if (
        Math.abs(runtime.player.x - door.x) < door.w / 2 + runtime.player.r &&
        Math.abs(runtime.player.y - door.y) < door.h / 2 + runtime.player.r
      ) {
        enterDoor(door);
        break;
      }
    }
  }

  return { update };
}
