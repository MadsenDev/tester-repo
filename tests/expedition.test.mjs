import assert from "node:assert/strict";
import test from "node:test";
import {
  createExpeditionState,
  currentExpeditionNode,
  expeditionDoorChoices,
  expeditionOffersBlackSignal,
  expeditionPedestalSpec,
  expeditionWavePlan,
  generateExpeditionMap,
  markExpeditionRoomCleared,
  persistExpeditionRoom,
  takeExpeditionDoor,
} from "../src/expedition.js";
import {
  drawExpedition,
  expeditionDoorLabelOffset,
  expeditionRoomEntryPosition,
  layoutExpeditionObjects,
} from "../src/expedition-render.js";
import { applyModule, moduleById } from "../src/module-catalog.js";
import { MODES, objectiveFor, runLimit } from "../src/modes.js";

const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
function distances(map){const byId=new Map(map.nodes.map(n=>[n.id,n])),result=new Map([[map.startId,0]]),queue=[map.startId];while(queue.length){const id=queue.shift();for(const next of Object.values(byId.get(id).links))if(!result.has(next)){result.set(next,result.get(id)+1);queue.push(next);}}return result;}
function pathBetween(map,startId,targetId){const byId=new Map(map.nodes.map(n=>[n.id,n])),parent=new Map([[startId,null]]),queue=[startId];while(queue.length&&!parent.has(targetId)){const id=queue.shift();for(const next of Object.values(byId.get(id).links))if(!parent.has(next)){parent.set(next,id);queue.push(next);}}const path=[];for(let id=targetId;id&&id!==startId;id=parent.get(id))path.unshift(id);return path;}
function travel(state,targetId,difficulty="normal"){for(const id of pathBetween(state.map,state.currentId,targetId)){markExpeditionRoomCleared(state);const door=expeditionDoorChoices(state).find(c=>c.nodeId===id);assert.ok(door,`missing door to ${id}`);takeExpeditionDoor(state,door,difficulty);}return state;}

test("Expedition is a mapped primary mode beside Last Stand",()=>{assert.equal(MODES[0].id,"expedition");assert.equal(MODES.find(m=>m.id==="campaign").name,"LAST STAND");assert.equal(runLimit("expedition"),Infinity);assert.equal(runLimit("campaign"),600);assert.match(objectiveFor("expedition"),/ROOM/);});

test("controlled generation always creates a connected, complete sector",()=>{for(let seed=1;seed<=80;seed++){const map=generateExpeditionMap(1,seeded(seed)),coordinates=new Set(map.nodes.map(n=>`${n.x},${n.y}`)),types=map.nodes.map(n=>n.type),distance=distances(map),ordinary=map.nodes.filter(n=>/^r/.test(n.id));assert.equal(coordinates.size,map.nodes.length);assert.equal(distance.size,map.nodes.length);for(const required of ["item","choice","shop","elite","boss","secret","black"])assert.ok(types.includes(required),`seed ${seed} lacks ${required}`);assert.equal(distance.get(map.bossId),Math.max(...ordinary.map(n=>distance.get(n.id))));assert.equal(map.nodes.find(n=>n.id===map.blackId).locked,true);}});

test("topology and room placement genuinely vary between controlled seeds",()=>{const signatures=new Set();for(let seed=1;seed<=40;seed++){const map=generateExpeditionMap(1,seeded(seed));signatures.add(map.nodes.filter(n=>/^r/.test(n.id)).map(n=>`${n.x},${n.y}:${n.type}`).sort().join("|"));}assert.ok(signatures.size>=30);});

test("combat rooms use finite waves that scale with depth and threat",()=>{const state=createExpeditionState("normal",{},seeded(9));assert.equal(state.roomType,"combat");assert.equal(state.waves,2);assert.ok(expeditionWavePlan(state,"intense").count>expeditionWavePlan(state,"normal").count);});

test("cardinal doors support backtracking through cleared rooms",()=>{const state=createExpeditionState("normal",{},seeded(21));markExpeditionRoomCleared(state);const outward=expeditionDoorChoices(state)[0],origin=state.currentId;assert.match(outward.direction,/^[nesw]$/);takeExpeditionDoor(state,outward);markExpeditionRoomCleared(state);const back=expeditionDoorChoices(state).find(d=>d.nodeId===origin);assert.ok(back?.backtrack);takeExpeditionDoor(state,back);assert.equal(state.currentId,origin);});

test("uncollected pedestals persist when a player leaves and returns",()=>{const state=createExpeditionState("normal",{},seeded(32)),item=state.map.nodes.find(n=>n.type==="item");travel(state,item.id);state.pedestals=[{module:{id:"hot-core",name:"HOT CORE"}}];state.pedestalsInitialized=true;markExpeditionRoomCleared(state);persistExpeditionRoom(state);const back=expeditionDoorChoices(state)[0],itemId=state.currentId;takeExpeditionDoor(state,back);markExpeditionRoomCleared(state);const returning=expeditionDoorChoices(state).find(d=>d.nodeId===itemId);takeExpeditionDoor(state,returning);assert.equal(state.pedestals.length,1);assert.equal(state.pedestals[0].module.id,"hot-core");});

test("a cleared boss exposes its optional Black Signal room and descent",()=>{const state=createExpeditionState("normal",{},seeded(44));travel(state,state.map.bossId);assert.equal(expeditionOffersBlackSignal(state),true);markExpeditionRoomCleared(state);const doors=expeditionDoorChoices(state),black=state.map.nodes.find(n=>n.id===state.map.blackId);assert.equal(black.locked,false);assert.ok(doors.some(d=>d.nodeId===black.id&&d.label==="BLACK"));assert.ok(doors.some(d=>d.type==="descend"));assert.deepEqual(expeditionPedestalSpec(state,{expeditionChoiceBonus:4}),{count:1,pool:"boss",cost:0,exclusive:true});});

test("five randomized maps terminate at a victory edge",()=>{const state=createExpeditionState("normal",{},seeded(58));for(let sector=1;sector<=5;sector++){travel(state,state.map.bossId);markExpeditionRoomCleared(state);const exit=expeditionDoorChoices(state).find(d=>["descend","victory"].includes(d.type));if(sector<5){assert.equal(exit.type,"descend");takeExpeditionDoor(state,exit);assert.equal(state.sector,sector+1);assert.equal(state.currentId,state.map.startId);}else assert.equal(exit.type,"victory");}});

test("room-economy modules alter choices, secrets and shop prices",()=>{const player={items:new Set(),maxHp:100,hp:100};applyModule(player,moduleById("second-opinion"));applyModule(player,moduleById("rusted-key"));applyModule(player,moduleById("warm-seat"));assert.equal(player.expeditionChoiceBonus,1);assert.equal(player.revealExpeditionSecrets,true);assert.equal(player.expeditionSecretChance,.32);assert.equal(player.expeditionShopDiscount,.3);});

test("edge exits and the minimap remain restrained on a narrow mobile arena",()=>{const state=createExpeditionState("normal",{},seeded(71));state.doors=[{type:"room",direction:"n",label:"MODULE",color:"#8dffcf"},{type:"room",direction:"e",label:"SHOP",color:"#ffe27b"},{type:"room",direction:"s",label:"",color:"#78ebff"},{type:"room",direction:"w",label:"",color:"#78ebff",backtrack:true}];state.pedestals=[{module:{name:"RUSTED KEY",desc:"Reveals hidden doors."},color:"#ff74ad"}];layoutExpeditionObjects(state,360,700);assert.ok(state.doors.find(d=>d.direction==="n").y<260);assert.ok(state.doors.find(d=>d.direction==="s").y>640);assert.ok(state.doors.find(d=>d.direction==="w").x<30);assert.ok(state.doors.find(d=>d.direction==="e").x>330);const ctx=new Proxy({measureText:value=>({width:String(value).length*5})},{get(target,property){if(property in target)return target[property];return()=>{};},set(target,property,value){target[property]=value;return true;}});assert.doesNotThrow(()=>drawExpedition(ctx,state,1,360,700));});

test("entering a room cannot immediately collide with its return exit",()=>{const W=360,H=700,radius=12;for(const direction of ["n","e","s","w"]){const state=createExpeditionState("normal",{},seeded(19)),opposite={n:"s",e:"w",s:"n",w:"e"}[direction];state.doors=[{type:"room",direction:opposite,color:"#78ebff"}];layoutExpeditionObjects(state,W,H);const spawn=expeditionRoomEntryPosition(direction,W,H,radius),door=state.doors[0],touching=Math.abs(spawn.x-door.x)<door.w/2+radius&&Math.abs(spawn.y-door.y)<door.h/2+radius;assert.equal(touching,false,`${direction} entry overlaps ${opposite} return exit`);}});

test("the south exit label clears the mobile loadout safe area",()=>{assert.ok(expeditionDoorLabelOffset("s").y<=-40);assert.ok(expeditionDoorLabelOffset("n").y>0);assert.ok(Math.abs(expeditionDoorLabelOffset("e").x)>=28);});
