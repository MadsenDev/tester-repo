import {CORE_UPGRADES,loadCore,buyCore,coreCost} from "./core.js";
const panel=document.querySelector("#core"),grid=document.querySelector("#coreGrid"),shards=document.querySelector("#coreShards");
function render(){
  if(!panel||!grid||!shards)return;
  const core=loadCore();shards.textContent=core.shards;grid.innerHTML="";
  for(const u of CORE_UPGRADES){
    const level=core.levels[u.id]||0,cost=coreCost(level),maxed=level>=u.max,b=document.createElement("button");
    b.className="core-upgrade";b.disabled=maxed||core.shards<cost;
    b.innerHTML=`<span><strong>${u.name}</strong><small>${u.desc}</small></span><span class="core-level">${level}/${u.max}<small>${maxed?"MAX":cost+" SHARD"+(cost===1?"":"S")}</small></span><i style="--core-progress:${level/u.max*100}%"></i><em>${u.value}</em>`;
    b.onclick=()=>{buyCore(u.id);render()};grid.appendChild(b)
  }
}
document.querySelectorAll('[data-nav="core"],#openCore').forEach(b=>b.addEventListener("click",render));
render();
