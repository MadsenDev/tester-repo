import {dist2,particle} from "./entities.js";
import {sectorIndex} from "./world.js";

export function createHazardState(){return{sector:-1,objects:[],flare:0,beam:null,pulse:0}}

export function resetHazards(state,time,W,H){
  const idx=sectorIndex(time);if(state.sector===idx)return;state.sector=idx;state.objects=[];state.flare=0;state.beam=null;state.pulse=0;
  if(idx===0)for(let i=0;i<7;i++)state.objects.push({kind:"asteroid",x:80+Math.random()*(W-160),y:120+Math.random()*(H-180),r:20+Math.random()*25,hp:80,vx:(Math.random()-.5)*18,vy:10+Math.random()*16,phase:Math.random()*6.28});
  if(idx===2)for(let i=0;i<3;i++)state.objects.push({kind:"gravity",x:100+Math.random()*(W-200),y:150+Math.random()*(H-260),r:80+Math.random()*35,phase:Math.random()*6.28});
  if(idx===3)for(let i=0;i<3;i++)state.objects.push({kind:"null",x:90+Math.random()*(W-180),y:140+Math.random()*(H-230),r:70+Math.random()*25,phase:Math.random()*6.28});
}

export function updateHazards(state,dt,{time,W,H,player,bullets,enemyBullets,enemies,particles,hurt}){
  resetHazards(state,time,W,H);const idx=state.sector;
  if(idx===0){for(const o of state.objects){o.x+=o.vx*dt;o.y+=o.vy*dt;o.phase+=dt;if(o.y>H+50)o.y=-50;if(o.x<-50)o.x=W+50;if(o.x>W+50)o.x=-50;for(const b of bullets){if(b.life>0&&dist2(o,b)<(o.r+b.r)**2){o.hp-=b.damage;b.life=0;for(let i=0;i<3;i++)particles.push(particle(b.x,b.y,"spark"))}}if(o.hp<=0){o.hp=80;o.x=Math.random()*W;o.y=-50}if(dist2(o,player)<(o.r+player.r)**2)hurt(12)}}
  if(idx===1){state.flare=(Math.sin(time*.72)+1)/2;if(state.flare>.82){const edge=H*(.18+.08*Math.sin(time*.21));if(player.y<edge||player.y>H-edge)hurt(9*dt*6);for(const e of enemies)if(e.y<edge||e.y>H-edge)e.hp-=12*dt}}
  if(idx===2){for(const o of state.objects){o.phase+=dt;for(const list of [bullets,enemyBullets])for(const b of list){const dx=o.x-b.x,dy=o.y-b.y,d=Math.max(20,Math.hypot(dx,dy));if(d<o.r*1.8){const f=(1-d/(o.r*1.8))*115;b.vx+=dx/d*f*dt;b.vy+=dy/d*f*dt}}}}
  if(idx===3){player.nullified=state.objects.some(o=>dist2(o,player)<o.r*o.r);for(const o of state.objects)o.phase+=dt}else player.nullified=false;
  if(idx===4){state.pulse-=dt;if(state.pulse<=0){const vertical=Math.floor(time/4)%2===0,pos=vertical?W*(.2+Math.random()*.6):H*(.22+Math.random()*.56);state.beam={vertical,pos,warn:1.05,active:.55};state.pulse=3.1}if(state.beam){state.beam.warn-=dt;if(state.beam.warn<=0){state.beam.active-=dt;const d=state.beam.vertical?Math.abs(player.x-state.beam.pos):Math.abs(player.y-state.beam.pos);if(d<18)hurt(18*dt*5);for(const e of enemies){const ed=state.beam.vertical?Math.abs(e.x-state.beam.pos):Math.abs(e.y-state.beam.pos);if(ed<18)e.hp-=34*dt}}if(state.beam.active<=0)state.beam=null}}
}

export function drawHazards(ctx,state,time,W,H){
  if(state.sector===0)for(const o of state.objects){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.phase*.25);ctx.strokeStyle="#7894a6";ctx.fillStyle="#182632";ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=o.r*(.78+(i%3)*.1),x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  if(state.sector===1&&state.flare>.55){const a=Math.max(0,(state.flare-.55)/.45),edge=H*(.18+.08*Math.sin(time*.21));ctx.fillStyle=`rgba(255,91,55,${.08+a*.18})`;ctx.fillRect(0,0,W,edge);ctx.fillRect(0,H-edge,W,edge)}
  if(state.sector===2)for(const o of state.objects){ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle="#c687ff";ctx.lineWidth=2;for(let r=o.r*.35;r<o.r;r+=18){ctx.beginPath();ctx.arc(o.x,o.y,r,0,Math.PI*2);ctx.stroke()}ctx.restore()}
  if(state.sector===3)for(const o of state.objects){ctx.save();ctx.globalAlpha=.16+.05*Math.sin(o.phase*3);ctx.fillStyle="#79ffd2";ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle="#79ffd2";ctx.setLineDash([5,9]);ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();ctx.restore()}
  if(state.sector===4&&state.beam){const b=state.beam,warning=b.warn>0;ctx.save();ctx.globalAlpha=warning?.28:.75;ctx.fillStyle=warning?"#ff668f":"#fff0f4";if(b.vertical)ctx.fillRect(b.pos-(warning?3:16),0,warning?6:32,H);else ctx.fillRect(0,b.pos-(warning?3:16),W,warning?6:32);ctx.restore()}
}
