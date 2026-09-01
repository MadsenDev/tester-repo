import assert from "node:assert/strict";
import test from "node:test";
import {
  beginExpeditionRoom,
  createExpeditionState,
  expeditionDoorChoices,
  expeditionOffersBlackSignal,
  expeditionPedestalSpec,
  expeditionWavePlan,
  takeExpeditionDoor,
} from "../src/expedition.js";
import { applyModule, moduleById } from "../src/module-catalog.js";
import { MODES, objectiveFor, runLimit } from "../src/modes.js";
import { drawExpedition, layoutExpeditionObjects } from "../src/expedition-render.js";

test("Expedition is a room-based primary mode beside Last Stand", () => {
  assert.equal(MODES[0].id, "expedition");
  assert.equal(MODES.find((mode) => mode.id === "campaign").name, "LAST STAND");
  assert.equal(runLimit("expedition"), Infinity);
  assert.equal(runLimit("campaign"), 600);
  assert.match(objectiveFor("expedition"), /ROOM/);
});

test("combat rooms use finite waves that scale with depth and threat", () => {
  const state = createExpeditionState("normal");
  assert.equal(state.roomType, "combat");
  assert.equal(state.waves, 2);
  const normal = expeditionWavePlan(state, "normal");
  const intense = expeditionWavePlan(state, "intense");
  assert.ok(normal.count > 0);
  assert.ok(intense.count > normal.count);
});

test("a module room is guaranteed before the sector boss", () => {
  const state = createExpeditionState();
  state.room = 3;
  state.itemVisited = false;
  const doors = expeditionDoorChoices(state, {}, () => 0.99);
  assert.ok(doors.some((door) => ["item", "choice"].includes(door.type)));
});

test("secret rooms return to the choices they interrupted", () => {
  const state = createExpeditionState();
  state.room = 2;
  const original = expeditionDoorChoices(state, { revealExpeditionSecrets: true }, () => 0);
  assert.ok(original.some((door) => door.type === "secret"));
  takeExpeditionDoor(state, "secret");
  assert.equal(state.room, 2);
  assert.equal(state.roomType, "secret");
  assert.equal(state.secretsFound, 1);
  const returned = expeditionDoorChoices(state);
  assert.ok(returned.length >= 2);
  assert.ok(returned.every((door) => door.type !== "secret"));
});

test("bosses always leave one physical relic before descent", () => {
  const state = createExpeditionState();
  beginExpeditionRoom(state, "boss", "normal", false);
  assert.deepEqual(expeditionPedestalSpec(state, { expeditionChoiceBonus: 4 }), {
    count: 1,
    pool: "boss",
    cost: 0,
    exclusive: true,
  });
  const doors = expeditionDoorChoices(state);
  assert.equal(doors[0].type, "descend");
  state.sector = 5;
  assert.equal(expeditionDoorChoices(state)[0].type, "victory");
});

test("five sector descents terminate at a victory gate", () => {
  const state = createExpeditionState();
  for (let sector = 1; sector <= 5; sector++) {
    while (state.room < 4) takeExpeditionDoor(state, "combat");
    takeExpeditionDoor(state, "boss");
    const exit = expeditionDoorChoices(state)[0];
    if (sector < 5) {
      assert.equal(exit.type, "descend");
      takeExpeditionDoor(state, exit.type);
      assert.equal(state.sector, sector + 1);
      assert.equal(state.room, 1);
    } else assert.equal(exit.type, "victory");
  }
});

test("Expedition routes every defeated warden through an in-room Black Signal", () => {
  const state = createExpeditionState();
  assert.equal(expeditionOffersBlackSignal(state), false);
  beginExpeditionRoom(state, "boss", "normal", false);
  assert.equal(expeditionOffersBlackSignal(state), true);
});

test("room-economy modules alter choices, secrets and shop prices", () => {
  const player = { items: new Set(), maxHp: 100, hp: 100 };
  applyModule(player, moduleById("second-opinion"));
  applyModule(player, moduleById("rusted-key"));
  applyModule(player, moduleById("warm-seat"));
  assert.equal(player.expeditionChoiceBonus, 1);
  assert.equal(player.revealExpeditionSecrets, true);
  assert.equal(player.expeditionSecretChance, 0.32);
  assert.equal(player.expeditionShopDiscount, 0.3);
  const state = createExpeditionState();
  beginExpeditionRoom(state, "item", "normal");
  assert.equal(expeditionPedestalSpec(state, player).count, 2);
});

test("physical doors and pedestals remain inside a narrow mobile arena", () => {
  const state = createExpeditionState();
  state.doors = [
    { type: "item", label: "MODULE VAULT", color: "#8dffcf" },
    { type: "elite", label: "ELITE INTERCEPT", color: "#ff8b69" },
    { type: "secret", label: "UNKNOWN SIGNAL", color: "#ff74ad", hidden: true },
  ];
  state.pedestals = [
    { module: { name: "RUSTED KEY", desc: "Reveals hidden doors." }, color: "#ff74ad" },
    { module: { name: "LUCKY BOLT", desc: "Adds a choice." }, color: "#8dffcf" },
  ];
  layoutExpeditionObjects(state, 360, 700);
  assert.ok(state.doors.every((door) => door.x - door.w / 2 >= 0));
  assert.ok(state.doors.every((door) => door.x + door.w / 2 <= 360));
  assert.ok(state.pedestals.every((pedestal) => pedestal.x > 0 && pedestal.x < 360));
  const ctx = new Proxy(
    { measureText: (value) => ({ width: String(value).length * 5 }) },
    {
      get(target, key) {
        if (key in target) return target[key];
        return () => {};
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      },
    },
  );
  assert.doesNotThrow(() => drawExpedition(ctx, state, 1, 360, 700));
});
