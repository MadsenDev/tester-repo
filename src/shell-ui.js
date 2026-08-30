import {loadSettings,saveSettings,loadStats} from "./meta.js";
import {SHIPS,unlockedShips,shipById} from "./ships.js";
import {MODES,unlockedModes,modeById} from "./modes.js";
import {loadCore,CORE_UPGRADES} from "./core.js";

const overlay=document.querySelector("#overlay");
const panels=[...document.querySelectorAll(".panel")];
const nav=[...document.querySelectorAll("[data-nav]")];
const shipButton=document.querySelector("#shipSelect");
const modeButton=document.querySelector("#modeSelect");
const difficulty=document.querySelector("#difficultySetting");
const launchSummary=document.querySelector("#launchSummary");
const shipArt=document.querySelector("#shipArt");
const shipName=document.querySelector("#shipHeroName");
const shipDesc=document.querySelector("#shipHeroDesc");
const coreHome=document.querySelector("#homeCoreShards");
const coreLevel=document.querySelector("#homeCoreLevel");
const bestHome=document.querySelector("#homeBest");
const hangarTrack=document.querySelector("#hangarTrack");
let settings=loadSettings();

function show(id){
  panels.forEach(p=>p.classList.toggle("hidden",p.id!==id));
  overlay.classList.add("show");
  nav.forEach(b=>b.classList.toggle("active",b.dataset.nav===id));
  if(id==="hangar")renderHangar();
  if(id==="menu")renderHome();
}
function coreTotal(){
  const core=loadCore();
  return CORE_UPGRADES.reduce((sum,u)=>sum+(core.levels[u.id]||0),0);
}
function renderHome(){
  settings=loadSettings();
  const stats=loadStats(),ship=shipById(settings.ship),mode=modeById(settings.mode),core=loadCore();
  shipName.textContent=ship.name;shipDesc.textContent=ship.desc;
  shipArt.dataset.sides=ship.id==="bulwark"?"4":ship.id==="harvester"?"6":"3";
  shipArt.style.setProperty("--ship-color",ship.id==="bulwark"?"#8fffc3":ship.id==="volt"?"#ffe47a":ship.id==="harvester"?"#c994ff":"#78ebff");
  coreHome.textContent=core.shards;coreLevel.textContent=coreTotal();
  bestHome.textContent=Math.max(stats.best,Number(localStorage.getItem("orbital-best")||0));
  launchSummary.innerHTML=`<b>${mode.name}</b><span>${settings.difficulty.toUpperCase()}</span>`;
}
function renderHangar(){
  const stats=loadStats(),available=new Set(unlockedShips(stats).map(s=>s.id));
  hangarTrack.innerHTML="";
  for(const ship of SHIPS){
    const unlocked=available.has(ship.id),card=document.createElement("button");
    card.className="hangar-card"+(settings.ship===ship.id?" selected":"")+(unlocked?"":" locked");
    card.innerHTML=`<div class="mini-ship" data-ship="${ship.id}"></div><span class="hangar-state">${unlocked?(settings.ship===ship.id?"EQUIPPED":"AVAILABLE"):"LOCKED"}</span><strong>${ship.name}</strong><small>${ship.desc}</small><em>${unlocked?"TAP TO EQUIP":ship.unlock}</em>`;
    card.disabled=!unlocked;card.onclick=()=>{settings.ship=ship.id;saveSettings(settings);renderHangar();renderHome()};
    hangarTrack.appendChild(card)
  }
}
nav.forEach(b=>b.addEventListener("click",()=>show(b.dataset.nav)));
document.querySelector("#openCore")?.addEventListener("click",()=>show("core"));
document.querySelector("#openSettings")?.addEventListener("click",()=>show("settings"));
document.querySelector("#openStats")?.addEventListener("click",()=>show("stats"));
document.querySelector("#openHangar")?.addEventListener("click",()=>show("hangar"));
shipButton?.addEventListener("click",()=>show("hangar"));
modeButton?.addEventListener("click",()=>setTimeout(renderHome,0));
difficulty?.addEventListener("click",()=>setTimeout(renderHome,0));
document.querySelectorAll(".back,.core-back").forEach(b=>b.addEventListener("click",()=>show("menu")));
window.addEventListener("storage",renderHome);
renderHome();
