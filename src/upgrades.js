import {MODULES,randomModules,applyModule} from "./module-catalog.js";
export const UPGRADES=MODULES;
export function randomChoices(player,n=3){return randomModules(player,n).map(m=>({id:m.id,name:m.name,rarity:m.rarity,desc:`${m.rarity} MODULE · ${m.desc}`,module:true,apply:p=>applyModule(p,m)}))}
