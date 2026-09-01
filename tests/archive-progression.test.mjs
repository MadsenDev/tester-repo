import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptBlackSignal,
  blackSignalOffers,
  shouldOfferBlackSignal,
} from "../src/black-signal.js";
import {
  discover,
  loadArchive,
  recordArchiveRun,
  resetArchive,
} from "../src/discovery.js";
import {
  moduleById,
  moduleEligibleForPool,
  modulePool,
  modulePoolForLevel,
  moduleWeight,
  randomModules,
} from "../src/module-catalog.js";

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
};

const player = () => ({
  hp: 100,
  maxHp: 100,
  damage: 20,
  fireRate: 0.42,
  bulletSpeed: 520,
  bulletSize: 4,
  speed: 245,
  magnet: 110,
  xpGain: 1,
  armor: 0,
  crit: 0,
  regen: 0,
  shots: 1,
  pierce: 0,
  items: new Set(),
  specials: new Set(),
  passives: {},
  companions: {},
});

test("level milestones draw from distinct themed module pools", () => {
  assert.equal(modulePoolForLevel(2), "salvage");
  assert.equal(modulePoolForLevel(5), "boss");
  assert.equal(modulePoolForLevel(7), "companion");
  const black = randomModules(player(), 3, "black", () => 0.5);
  assert.equal(black.length, 3);
  assert.ok(black.every((module) => modulePool(module) === "black"));
});

test("Black Signal contracts apply a permanent price and reward", () => {
  storage.clear();
  resetArchive();
  const ship = player(),
    offers = blackSignalOffers(ship, () => 0.5);
  assert.equal(offers.length, 3);
  assert.equal(shouldOfferBlackSignal(1), false);
  assert.equal(shouldOfferBlackSignal(2), true);
  const accepted = acceptBlackSignal(ship, offers[0]);
  assert.equal(accepted.id, "blood-tithe");
  assert.ok(ship.maxHp < 100);
  assert.ok(ship.damage > 20);
  assert.equal(ship.items.has(accepted.module), true);
  assert.equal(ship.blackSignalContracts, 1);
  assert.equal(loadArchive().contracts, 1);
});

test("Dead God Circuit is a committed Black Signal jackpot", () => {
  const deadGod = moduleById("dead-god-circuit"),
    ordinary = player(),
    committed = { ...player(), blackSignalContracts: 2 };
  assert.equal(moduleEligibleForPool(deadGod, "salvage", ordinary), false);
  assert.equal(moduleEligibleForPool(deadGod, "boss", ordinary), false);
  assert.equal(moduleEligibleForPool(deadGod, "black", ordinary), false);
  assert.equal(moduleEligibleForPool(deadGod, "black", committed), true);
  assert.ok(moduleWeight(deadGod) < moduleWeight(moduleById("funeral-star")));
});

test("the archive persists discoveries, completion marks and run history", () => {
  storage.clear();
  resetArchive();
  assert.equal(discover("modules", "hot-core"), true);
  assert.equal(discover("modules", "hot-core"), false);
  const run = recordArchiveRun({
    won: true,
    ship: "strider",
    mode: "campaign",
    score: 12345,
    kills: 321,
    time: 600,
    level: 18,
    modules: ["hot-core", "storm-lens"],
    routes: ["quiet-line"],
    bosses: ["warden"],
    events: ["overload"],
    synergies: ["seekingStorm"],
    contracts: [{ id: "blood-tithe", module: "blood-battery" }],
    newly: [{ kind: "modules", id: "hot-core" }],
  });
  const archive = loadArchive();
  assert.equal(archive.runs[0].id, run.id);
  assert.equal(archive.completion.strider.campaign.wins, 1);
  assert.equal(archive.modules.includes("storm-lens"), true);
  assert.equal(archive.synergies.includes("seekingStorm"), true);
  assert.equal(run.newly.length, 6);
});

test("Expedition paths persist without polluting route discoveries", () => {
  storage.clear();
  resetArchive();
  const run = recordArchiveRun({
    won: true,
    ship: "strider",
    mode: "expedition",
    score: 9000,
    routes: [],
    expedition: {
      sector: 5,
      rooms: 25,
      secrets: 2,
      scrap: 7,
      path: ["S1:combat", "S1:item", "S1:boss"],
    },
  });
  const archive = loadArchive();
  assert.equal(archive.routes.length, 0);
  assert.equal(archive.completion.strider.expedition.wins, 1);
  assert.deepEqual(run.expedition.path, ["S1:combat", "S1:item", "S1:boss"]);
});
