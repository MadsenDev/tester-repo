const CORE_KEY="orbital-ship-core-v1";
export const CORE_UPGRADES=[
{id:"hull",name:"HULL",desc:"Start every run with more maximum HP.",max:10,value:"+8 HP",apply:(p,l)=>{p.maxHp+=8*l;p.hp+=8*l}},
{id:"weapons",name:"WEAPONS",desc:"Increase all starting weapon damage.",max:10,value:"+5% damage",apply:(p,l)=>{p.damage*=1+.05*l}},
{id:"reactor",name:"REACTOR",desc:"Fire the blaster faster from the first second.",max:10,value:"+4% fire rate",apply:(p,l)=>{p.fireRate/=1+.04*l}},
{id:"thrusters",name:"THRUSTERS",desc:"Increase permanent movement speed.",max:8,value:"+3% speed",apply:(p,l)=>{p.speed*=1+.03*l}},
{id:"salvage",name:"SALVAGE",desc:"Gain more XP from every collected gem.",max:8,value:"+8% XP",apply:(p,l)=>{p.xpGain*=1+.08*l}},
{id:"armor",name:"ARMOR",desc:"Permanently reduce incoming damage.",max:8,value:"+2% reduction",apply:(p,l)=>{p.armor=1-(1-p.armor)*(1-.02*l)}}
];
const blank=()=>({shards:0,levels:Object.fromEntries(CORE_UPGRADES.map(u=>[u.id,0]))});
export function loadCore(){try{const v=JSON.parse(localStorage.getItem(CORE_KEY)||"{}");return{...blank(),...v,levels:{...blank().levels,...(v.levels||{})}}}catch{return blank()}}
export function saveCore(core){localStorage.setItem(CORE_KEY,JSON.stringify(core))}
export function coreCost(level){return[1,2,3,5,8,12,17,23,30,38][level]??Infinity}
export function buyCore(id){const core=loadCore(),u=CORE_UPGRADES.find(x=>x.id===id);if(!u)return core;const level=core.levels[id]||0,cost=coreCost(level);if(level>=u.max||core.shards<cost)return core;core.shards-=cost;core.levels[id]=level+1;saveCore(core);return core}
export function applyCore(player){const core=loadCore();for(const u of CORE_UPGRADES)u.apply(player,core.levels[u.id]||0);return player}
export function awardCore({bosses=0,victory=false,sectors=0}){const core=loadCore();core.shards+=Math.max(0,bosses)+Math.max(0,sectors)+(victory?4:0);saveCore(core);return core}
