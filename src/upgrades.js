import {MODULES,randomModules,applyModule} from "./module-catalog.js";
export const UPGRADES=MODULES;
const aliases={fork:"multishot",payload:"size",velocity:"bullet",crit:"crit",pierce:"pierce",seek:"missile",arc:"arc",nova:"nova",anchor:"mines",prism:"beam"};
function install(p,m){applyModule(p,m);p.passives??={};for(const tag of m.tags||[]){const id=aliases[tag];if(id)p.passives[id]=(p.passives[id]||0)+1}}
export function randomChoices(player,n=3){return randomModules(player,n).map(m=>({id:m.id,name:m.name,rarity:m.rarity,desc:`${m.rarity} MODULE · ${m.desc}`,module:true,apply:p=>install(p,m)}))}
