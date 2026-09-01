import test from "node:test";
import assert from "node:assert/strict";
import {
  expeditionArenaBounds,
  expeditionRoomEntryPosition,
  layoutExpeditionObjects,
} from "../src/expedition-render.js";

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

test("mobile Expedition pickups stay clear of every room entry envelope",()=>{
  const W=390,H=844,playerRadius=12,safetyMargin=6;
  const state={doors:[],pedestals:Array.from({length:3},()=>({}))};
  layoutExpeditionObjects(state,W,H);
  for(const direction of ["n","e","s","w"]){
    const entry=expeditionRoomEntryPosition(direction,W,H,playerRadius);
    for(const pedestal of state.pedestals){
      assert.ok(distance(entry,pedestal)>playerRadius+pedestal.r+safetyMargin);
    }
  }
});

test("mobile Expedition pickups form a tight centered row",()=>{
  const W=390,H=844,state={doors:[],pedestals:Array.from({length:3},()=>({}))};
  layoutExpeditionObjects(state,W,H);
  const bounds=expeditionArenaBounds(W,H),middleY=(bounds.top+bounds.bottom)/2;
  assert.deepEqual(state.pedestals.map(p=>p.y),[middleY,middleY,middleY]);
  assert.ok(state.pedestals.every(p=>p.w<=72));
  assert.ok(state.pedestals.every(p=>p.h<=60));
  assert.ok(state.pedestals.every(p=>p.r<=12));
  assert.equal((state.pedestals[0].x+state.pedestals[2].x)/2,W/2);
  assert.ok(state.pedestals[2].x-state.pedestals[0].x<=160);
});

test("collecting a regular Expedition module creates a description toast",()=>{
  let applied=false;
  const module={name:"Saint Elmo",desc:"The Aegis field becomes an electrical conductor.",apply(){applied=true}};
  const state={doors:[],pedestals:[{module,color:"#c994ff"}]};
  layoutExpeditionObjects(state,390,844);
  state.pedestals[0].module.apply({});
  assert.equal(applied,true);
  assert.equal(state.pickupNotice.name,"Saint Elmo");
  assert.equal(state.pickupNotice.desc,module.desc);
  assert.equal(state.pickupNotice.color,"#c994ff");
  assert.ok(state.pickupNotice.expiresAt>Date.now());
});

test("single mobile pickup remains centered",()=>{
  const W=390,H=844,state={doors:[],pedestals:[{}]};
  layoutExpeditionObjects(state,W,H);
  const bounds=expeditionArenaBounds(W,H);
  assert.equal(state.pedestals[0].x,W/2);
  assert.equal(state.pedestals[0].y,(bounds.top+bounds.bottom)/2);
});
