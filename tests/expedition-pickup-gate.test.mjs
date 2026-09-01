import test from "node:test";
import assert from "node:assert/strict";
import { dist2 } from "../src/entities.js";
import { layoutExpeditionObjects } from "../src/expedition-render.js";

test("Expedition pickups are locked briefly when entering a reward room",()=>{
  const state={currentId:"room-a",doors:[],pedestals:[{}]};
  layoutExpeditionObjects(state,390,844);
  const pedestal=state.pedestals[0];
  assert.ok(pedestal.pickupGateUntil>performance.now());
  const player={x:pedestal.x,y:pedestal.y,r:11};
  assert.equal(dist2(player,pedestal),Infinity);
  assert.equal(pedestal.pickupNeedsExit,true);
});

test("standing on a pickup when the lock expires requires leaving and re-entering",()=>{
  const pedestal={x:100,y:100,r:12,pickupGateUntil:performance.now()-1,pickupNeedsExit:true};
  const player={x:100,y:100,r:11};
  assert.equal(dist2(player,pedestal),Infinity);
  player.x=150;
  assert.equal(dist2(player,pedestal),Infinity);
  assert.equal(pedestal.pickupNeedsExit,false);
  player.x=100;
  assert.equal(dist2(player,pedestal),0);
});

test("returning to a room rearms its remaining pickups",()=>{
  const state={currentId:"room-a",doors:[],pedestals:[{}]};
  layoutExpeditionObjects(state,390,844);
  const first=state.pedestals[0].pickupGateUntil;
  state.currentId="room-b";
  state.pedestals=[];
  layoutExpeditionObjects(state,390,844);
  state.currentId="room-a";
  state.pedestals=[{_pickupGateRoomId:"room-a",pickupGateUntil:0}];
  layoutExpeditionObjects(state,390,844);
  assert.ok(state.pedestals[0].pickupGateUntil>=first);
});
