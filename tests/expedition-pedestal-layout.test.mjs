import test from "node:test";
import assert from "node:assert/strict";
import {
  expeditionRoomEntryPosition,
  layoutExpeditionObjects,
} from "../src/expedition-render.js";

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

test("mobile Expedition pedestals stay clear of every room entry",()=>{
  const W=390,H=844,playerRadius=12,pickupRadius=24;
  const state={
    doors:[],
    pedestals:Array.from({length:3},()=>({})),
  };
  layoutExpeditionObjects(state,W,H);
  for(const direction of ["n","e","s","w"]){
    const entry=expeditionRoomEntryPosition(direction,W,H,playerRadius);
    for(const pedestal of state.pedestals){
      assert.ok(
        distance(entry,pedestal)>playerRadius+pickupRadius,
        `${direction} entry overlaps pedestal at ${pedestal.x},${pedestal.y}`,
      );
    }
  }
});

test("single mobile pedestal remains centered",()=>{
  const W=390,H=844,state={doors:[],pedestals:[{}]};
  layoutExpeditionObjects(state,W,H);
  assert.equal(state.pedestals[0].x,W/2);
});
