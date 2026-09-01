import test from "node:test";
import assert from "node:assert/strict";
import {
  expeditionArenaBounds,
  expeditionRoomEntryPosition,
  layoutExpeditionObjects,
} from "../src/expedition-render.js";

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

test("mobile Expedition pedestals stay clear of every room entry pickup envelope",()=>{
  const W=390,H=844,playerRadius=12,safetyMargin=6;
  const state={doors:[],pedestals:Array.from({length:3},()=>({}))};
  layoutExpeditionObjects(state,W,H);
  for(const direction of ["n","e","s","w"]){
    const entry=expeditionRoomEntryPosition(direction,W,H,playerRadius);
    for(const pedestal of state.pedestals){
      assert.ok(
        distance(entry,pedestal)>playerRadius+pedestal.r+safetyMargin,
        `${direction} entry is too close to pedestal at ${pedestal.x},${pedestal.y}`,
      );
    }
  }
});

test("mobile Expedition pedestal cluster is small and centered",()=>{
  const W=390,H=844,state={doors:[],pedestals:Array.from({length:3},()=>({}))};
  layoutExpeditionObjects(state,W,H);
  const bounds=expeditionArenaBounds(W,H),middleY=(bounds.top+bounds.bottom)/2;
  assert.deepEqual(state.pedestals.map(p=>p.y),[middleY,middleY,middleY]);
  assert.ok(state.pedestals.every(p=>p.w<=84));
  assert.ok(state.pedestals.every(p=>p.h<=100));
  assert.ok(state.pedestals.every(p=>p.r<=14));
  assert.equal((state.pedestals[0].x+state.pedestals[2].x)/2,W/2);
});

test("single mobile pedestal remains centered",()=>{
  const W=390,H=844,state={doors:[],pedestals:[{}]};
  layoutExpeditionObjects(state,W,H);
  const bounds=expeditionArenaBounds(W,H);
  assert.equal(state.pedestals[0].x,W/2);
  assert.equal(state.pedestals[0].y,(bounds.top+bounds.bottom)/2);
});
