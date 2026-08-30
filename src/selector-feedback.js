import {loadStats} from "./meta.js";
import {SHIPS,unlockedShips} from "./ships.js";
import {MODES,unlockedModes} from "./modes.js";

const shipButton=document.querySelector("#shipSelect");
const modeButton=document.querySelector("#modeSelect");
const status=document.querySelector("#selectorStatus");
let timer=null;

function nextLocked(all,unlocked){
  const ids=new Set(unlocked.map(item=>item.id));
  return all.find(item=>!ids.has(item.id));
}
function summary(){
  const stats=loadStats(),ships=unlockedShips(stats),modes=unlockedModes(stats);
  const shipNext=nextLocked(SHIPS,ships),modeNext=nextLocked(MODES,modes);
  const bits=[`${ships.length}/${SHIPS.length} ships`,`${modes.length}/${MODES.length} modes`];
  if(shipNext)bits.push(`next ship: ${shipNext.name} (${shipNext.unlock})`);
  if(modeNext)bits.push(`next mode: ${modeNext.name} (${modeNext.unlock})`);
  return bits.join(" · ");
}
function show(message){
  clearTimeout(timer);status.textContent=message;status.classList.add("active");
  timer=setTimeout(()=>{status.textContent=summary();status.classList.remove("active")},2200);
}
function refresh(){
  const stats=loadStats(),ships=unlockedShips(stats),modes=unlockedModes(stats);
  status.textContent=summary();
  shipButton.dataset.single=ships.length<2?"true":"false";
  modeButton.dataset.single=modes.length<2?"true":"false";
  shipButton.title=ships.length<2&&nextLocked(SHIPS,ships)?`Locked: ${nextLocked(SHIPS,ships).name} — ${nextLocked(SHIPS,ships).unlock}`:"Tap to change ship";
  modeButton.title=modes.length<2&&nextLocked(MODES,modes)?`Locked: ${nextLocked(MODES,modes).name} — ${nextLocked(MODES,modes).unlock}`:"Tap to change mode";
}
shipButton.addEventListener("click",()=>{
  const stats=loadStats(),ships=unlockedShips(stats),next=nextLocked(SHIPS,ships);
  if(ships.length<2&&next)show(`Only ${ships[0].name} is unlocked. ${next.name}: ${next.unlock}.`);
  else setTimeout(refresh,0);
});
modeButton.addEventListener("click",()=>{
  const stats=loadStats(),modes=unlockedModes(stats),next=nextLocked(MODES,modes);
  if(modes.length<2&&next)show(`Only ${modes[0].name} is unlocked. ${next.name}: ${next.unlock}.`);
  else setTimeout(refresh,0);
});
refresh();
