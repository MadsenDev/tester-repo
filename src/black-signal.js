import { applyModule, randomModules } from "./module-catalog.js";
import { recordContract } from "./discovery.js";

const TERMS = Object.freeze([
  {
    id: "blood-tithe",
    name: "BLOOD TITHE",
    price: "Permanently lose 18 maximum hull.",
    boon: "Weapon damage rises by 12%.",
    apply(player) {
      player.maxHp = Math.max(25, player.maxHp - 18);
      player.hp = Math.min(player.hp, player.maxHp);
      player.damage *= 1.12;
    },
  },
  {
    id: "severed-drive",
    name: "SEVERED DRIVE",
    price: "Permanently lose 18% movement speed.",
    boon: "Fire cycle accelerates by 12%.",
    apply(player) {
      player.speed *= 0.82;
      player.fireRate *= 0.88;
    },
  },
  {
    id: "fractured-seal",
    name: "FRACTURED SEAL",
    price: "Incoming damage permanently rises by 22%.",
    boon: "Add one round to every volley.",
    apply(player) {
      player.contractDamageTaken = (player.contractDamageTaken || 1) * 1.22;
      player.shots++;
    },
  },
]);

export function shouldOfferBlackSignal(defeatedBosses) {
  return defeatedBosses > 0 && defeatedBosses % 2 === 0;
}

export function blackSignalOffers(player, random = Math.random) {
  const modules = randomModules(player, TERMS.length, "black", random);
  return modules.map((module, index) => ({ terms: TERMS[index], module }));
}

export function acceptBlackSignal(player, offer) {
  offer.terms.apply(player);
  applyModule(player, offer.module);
  recordContract();
  return { id: offer.terms.id, module: offer.module.id };
}

export function createBlackSignalUI() {
  const panel = document.createElement("section");
  panel.id = "blackSignal";
  panel.className = "panel black-signal-panel hidden";
  panel.innerHTML = `
    <div class="black-signal-heading">
      <div><p class="eyebrow">UNLICENSED TRANSMISSION</p><h2>Black Signal</h2></div>
      <span>THE PRICE IS PERMANENT</span>
    </div>
    <p class="black-signal-intro">Something outside the mapped orbit offers power. It does not accept currency.</p>
    <div id="blackSignalChoices" class="black-signal-choices"></div>
    <button id="rejectBlackSignal" class="secondary black-signal-reject">SEVER CONNECTION</button>`;
  document
    .querySelector(".screen-stack")
    ?.insertBefore(panel, document.querySelector("#levelup"));
  return {
    panel,
    choices: panel.querySelector("#blackSignalChoices"),
    reject: panel.querySelector("#rejectBlackSignal"),
  };
}

export function renderBlackSignal(ui, offers, { onAccept, onReject }) {
  ui.choices.innerHTML = "";
  for (const offer of offers) {
    const button = document.createElement("button");
    button.className = "black-signal-choice";
    button.innerHTML = `
      <span>${offer.terms.name}</span>
      <h3>${offer.module.name}</h3>
      <p>${offer.module.desc}</p>
      <dl><div><dt>PRICE</dt><dd>${offer.terms.price}</dd></div><div><dt>BOON</dt><dd>${offer.terms.boon}</dd></div></dl>`;
    button.addEventListener("click", () => onAccept(offer));
    ui.choices.appendChild(button);
  }
  ui.reject.onclick = onReject;
}
