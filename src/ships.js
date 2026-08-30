import {applyCore} from "./core.js";
export const SHIPS=[
  {id:"strider",name:"STRIDER",unlock:"Always available",desc:"Balanced interceptor. Reliable in every sector.",apply:p=>p},
  {id:"bulwark",name:"BULWARK",unlock:"Win 1 run",desc:"Heavy hull: +45 HP, +18% armor, -14% speed.",apply:p=>{p.maxHp+=45;p.hp+=45;p.armor+=.18;p.speed*=.86;p.shipSides=4;p.shipColor="#8fffc3"}},
  {id:"volt",name:"VOLT",unlock:"Reach 2,500 kills",desc:"Glass cannon: +22% fire rate, +20% damage, -25 max HP.",apply:p=>{p.maxHp-=25;p.hp=Math.min(p.hp,p.maxHp);p.fireRate*=.78;p.damage*=1.2;p.shipSides=3;p.shipColor="#ffe47a"}},
  {id:"harvester",name:"HARVESTER",unlock:"Win 3 runs",desc:"Collector: +70% pickup range and +18% XP, but slower fire.",apply:p=>{p.magnet*=1.7;p.xpGain*=1.18;p.fireRate*=1.12;p.shipSides=6;p.shipColor="#c994ff"}}
];
export function unlockedShips(stats){return SHIPS.filter(s=>s.id==="strider"||(s.id==="bulwark"&&stats.wins>=1)||(s.id==="volt"&&stats.kills>=2500)||(s.id==="harvester"&&stats.wins>=3))}
export function shipById(id){return SHIPS.find(s=>s.id===id)||SHIPS[0]}
export function applyShip(player,id){const ship=shipById(id);player.shipId=ship.id;player.shipName=ship.name;player.shipSides??=3;player.shipColor??="#78ebff";applyCore(player);ship.apply(player);return player}
