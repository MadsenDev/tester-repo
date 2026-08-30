import {loadStats} from "./meta.js";
import {loadCore} from "./core.js";
import {unlockedShips} from "./ships.js";
import {unlockedModes} from "./modes.js";

const overlay=document.querySelector("#overlay");
const stack=document.querySelector(".screen-stack");
const panels=()=>[...document.querySelectorAll(".panel")];
const startButtons=["#start","#restart","#victoryRestart"].map(s=>document.querySelector(s)).filter(Boolean);
let baseline=null,suppressPauseKey=false;

function snapshot(){
  const stats=loadStats(),core=loadCore();
  return{
    stats,core,
    best:Math.max(stats.best,Number(localStorage.getItem("orbital-best")||0)),
    ships:new Set(unlockedShips(stats).map(x=>x.id)),
    modes:new Set(unlockedModes(stats).map(x=>x.id))
  };
}
function captureRun(){baseline=snapshot()}
startButtons.forEach(b=>b.addEventListener("click",captureRun));

const pause=document.createElement("section");
pause.id="pause";pause.className="panel pause-panel hidden";
pause.innerHTML=`<p class="eyebrow">FLIGHT SUSPENDED</p><h2>Paused</h2><p class="pause-context"><span id="pauseTime">00:00</span><b id="pauseSector">OUTER DRIFT</b></p><div class="pause-actions"><button id="resumeRun">RESUME</button><button id="restartRun" class="secondary">RESTART RUN</button><button id="pauseMainMenu" class="danger">MAIN MENU</button></div><p class="pause-note">The simulation is frozen. The universe will resume being unreasonable when you do.</p>`;
stack?.insertBefore(pause,document.querySelector("#levelup"));

function dispatchPause(){
  suppressPauseKey=true;
  window.dispatchEvent(new KeyboardEvent("keydown",{key:"p",code:"KeyP",bubbles:true}));
  queueMicrotask(()=>suppressPauseKey=false);
}
function showPause(toggleState=true){
  if(toggleState)dispatchPause();
  document.querySelector("#pauseTime").textContent=document.querySelector("#time")?.textContent||"00:00";
  document.querySelector("#pauseSector").textContent=document.querySelector("#sector")?.textContent||"";
  panels().forEach(p=>p.classList.add("hidden"));
  pause.classList.remove("hidden");
  overlay?.classList.add("show","gameplay-modal");
}
function resume(){
  dispatchPause();
  pause.classList.add("hidden");
  overlay?.classList.remove("show","gameplay-modal");
}
window.addEventListener("orbital:pause-request",()=>showPause(true));
window.addEventListener("keydown",event=>{
  if(suppressPauseKey||event.key?.toLowerCase()!=="p")return;
  if(!pause.classList.contains("hidden")){event.preventDefault();resume();return}
  if(!overlay?.classList.contains("show"))showPause(false);
});
document.querySelector("#resumeRun")?.addEventListener("click",resume);
document.querySelector("#restartRun")?.addEventListener("click",()=>{
  pause.classList.add("hidden");overlay?.classList.remove("show","gameplay-modal");
  document.querySelector("#restart")?.click();
});
document.querySelector("#pauseMainMenu")?.addEventListener("click",()=>{
  if(confirm("Abandon this run and return to the command deck?"))location.reload();
});

function ensureSummary(panel){
  if(panel.querySelector(".run-summary"))return;
  const summary=document.createElement("div");summary.className="run-summary";
  summary.innerHTML=`<div><span>TIME</span><b data-run="time">00:00</b></div><div><span>KILLS</span><b data-run="kills">0</b></div><div><span>LEVEL</span><b data-run="level">1</b></div><div class="shard-earned"><span>CORE SHARDS</span><b data-run="shards">+0</b></div>`;
  panel.querySelector(".final")?.insertAdjacentElement("afterend",summary);
  const unlock=document.createElement("p");unlock.className="run-unlock hidden";unlock.dataset.run="unlock";summary.insertAdjacentElement("afterend",unlock);
  const actions=panel.querySelector(".result-actions");
  if(actions&&!actions.querySelector(".result-core")){
    const core=document.createElement("button");core.className="secondary result-core";core.textContent="UPGRADE CORE";
    core.addEventListener("click",()=>document.querySelector('[data-nav="core"]')?.click());
    actions.insertBefore(core,actions.lastElementChild);
  }
}
function renderResult(panel){
  ensureSummary(panel);
  const before=baseline||snapshot(),after=snapshot();
  const score=Number(panel.querySelector("#finalScore,#victoryScore")?.textContent||0);
  const kills=Math.max(0,after.stats.kills-before.stats.kills);
  const shards=Math.max(0,after.core.shards-before.core.shards);
  const level=document.querySelector("#level")?.textContent||"1";
  const time=document.querySelector("#time")?.textContent||"00:00";
  panel.querySelector('[data-run="time"]').textContent=time;
  panel.querySelector('[data-run="kills"]').textContent=kills;
  panel.querySelector('[data-run="level"]').textContent=level;
  panel.querySelector('[data-run="shards"]').textContent=`+${shards}`;
  const newly=[];
  for(const ship of unlockedShips(after.stats))if(!before.ships.has(ship.id))newly.push(`${ship.name} chassis unlocked`);
  for(const mode of unlockedModes(after.stats))if(!before.modes.has(mode.id))newly.push(`${mode.name} mode unlocked`);
  if(score>before.best)newly.unshift("NEW BEST SCORE");
  const unlock=panel.querySelector('[data-run="unlock"]');
  unlock.textContent=newly.join(" · ");unlock.classList.toggle("hidden",newly.length===0);
}
for(const id of ["gameover","victory"]){
  const panel=document.querySelector(`#${id}`);if(!panel)continue;ensureSummary(panel);
  new MutationObserver(()=>{if(!panel.classList.contains("hidden"))requestAnimationFrame(()=>renderResult(panel))}).observe(panel,{attributes:true,attributeFilter:["class"]});
}
