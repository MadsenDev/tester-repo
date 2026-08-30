import {dist2,particle} from "./entities.js";
import {sectorIndex} from "./world.js";

export function createHazardState(){return{sector:-1,objects:[],flare:0,beam:null,pulse:0}}

function asteroidAt(x,y,tier=2,vx=(Math.random()-.5)*18,vy=10+Math.random()*16){const r=tier===2?30+Math.random()*14:tier===1?18+Math.random()*5:9+Math.random()*3,hp=tier===2?90:tier===1?38:12;return{kind:"asteroid",x,y,r,tier,hp,hpMax:hp,vx,vy,phase:Math.random()*6.28,spin:(Math.random()-.5)*1.1,impactCd:0}}
function safeAsteroid(W,H,player){let x,y;for(let tries=0;tries<30;tries++){x=80+Math.random()*Math.max(1,W-160);y=120+Math.random()*Math.max(1,H-180);if(!player||Math.hypot(x-player.x,y-player.y)>190)return asteroidAt(x,y)}return asteroidAt(Math.random()<.5?60:W-60,120)}
function splitAsteroid(o,objects,particles){for(let i=0;i<12+o.tier*5;i++)particles.push(particle(o.x,o.y,"spark"));if(o.tier<=0)return;const count=o.tier===2?2+Math.floor(Math.random()*2):2;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=28+Math.random()*35;objects.push(asteroidAt(o.x+Math.cos(a)*o.r*.3,o.y+Math.sin(a)*o.r*.3,o.tier-1,o.vx+Math.cos(a)*s,o.vy+Math.sin(a)*s))}}

export function resetHazards(state,time,W,H,player){
  const idx=sectorIndex(time);if(state.sector===idx)return;state.sector=idx;state.objects=[];state.flare=0;state.beam=null;state.pulse=0;
  if(idx===0)for(let i=0;i<7;i++)state.objects.push(safeAsteroid(W,H,player));
  if(idx===2)for(let i=0;i<3;i++)state.objects.push({kind:"gravity",x:100+Math.random()*(W-200),y:150+Math.random()*(H-260),r:80+Math.random()*35,phase:Math.random()*6.28});
  if(idx===3)for(let i=0;i<3;i++)state.objects.push({kind:"null",x:90+Math.random()*(W-180),y:140+Math.random()*(H-230),r:70+Math.random()*25,phase:Math.random()*6.28});
}

export function updateHazards(state,dt,{time,W,H,player,bullets,enemyBullets,enemies,particles,hurt}){
  resetHazards(state,time,W,H,player);const idx=state.sector;
  if(idx===0){for(let oi=state.objects.length-1;oi>=0;oi--){const o=state.objects[oi];o.x+=o.vx*dt;o.y+=o.vy*dt;o.phase+=o.spin*dt;o.impactCd=Math.max(0,o.impactCd-dt);if(o.y>H+60)o.y=-60;if(o.x<-60)o.x=W+60;if(o.x>W+60)o.x=-60;for(const b of bullets){if(b.life>0&&dist2(o,b)<(o.r+b.r)**2){o.hp-=b.damage;b.life=0;for(let i=0;i<3;i++)particles.push(particle(b.x,b.y,"spark"))}}if(o.hp<=0){splitAsteroid(o,state.objects,particles);state.objects.splice(oi,1);continue}if(o.impactCd<=0&&dist2(o,player)<(o.r+player.r)**2){hurt(8+o.tier*3);o.impactCd=.55;const dx=o.x-player.x,dy=o.y-player.y,d=Math.max(1,Math.hypot(dx,dy));o.vx+=dx/d*55;o.vy+=dy/d*55}}}
  if(idx===1){state.flare=(Math.sin(time*.72)+1)/2;if(state.flare>.82){const edge=H*(.18+.08*Math.sin(time*.21));if(player.y<edge||player.y>H-edge)hurt(9*dt*6);for(const e of enemies)if(e.y<edge||e.y>H-edge)e.hp-=12*dt}}
  if(idx===2){for(const o of state.objects){o.phase+=dt;for(const list of [bullets,enemyBullets])for(const b of list){const dx=o.x-b.x,dy=o.y-b.y,d=Math.max(20,Math.hypot(dx,dy));if(d<o.r*1.8){const f=(1-d/(o.r*1.8))*115;b.vx+=dx/d*f*dt;b.vy+=dy/d*f*dt}}}}
  if(idx===3){player.nullified=state.objects.some(o=>dist2(o,player)<o.r*o.r);for(const o of state.objects)o.phase+=dt}else player.nullified=false;
  if(idx===4){state.pulse-=dt;if(state.pulse<=0){const vertical=Math.floor(time/4)%2===0,pos=vertical?W*(.2+Math.random()*.6):H*(.22+Math.random()*.56);state.beam={vertical,pos,warn:1.05,active:.55};state.pulse=3.1}if(state.beam){state.beam.warn-=dt;if(state.beam.warn<=0){state.beam.active-=dt;const d=state.beam.vertical?Math.abs(player.x-state.beam.pos):Math.abs(player.y-state.beam.pos);if(d<18)hurt(18*dt*5);for(const e of enemies){const ed=state.beam.vertical?Math.abs(e.x-state.beam.pos):Math.abs(e.y-state.beam.pos);if(ed<18)e.hp-=34*dt}}if(state.beam.active<=0)state.beam=null}}
}

function drawAsteroid(ctx,o){const damage=1-o.hp/o.hpMax;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.phase);ctx.strokeStyle=damage>.55?"#b7c6cd":"#7894a6";ctx.fillStyle="#182632";ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=o.r*(.78+(i%3)*.1),x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();if(damage>.2){ctx.strokeStyle=`rgba(190,215,224,${.35+damage*.55})`;ctx.lineWidth=1.5;const cracks=damage>.65?4:2;for(let i=0;i<cracks;i++){const a=i*2.1+o.phase*.17;ctx.beginPath();ctx.moveTo(Math.cos(a)*o.r*.12,Math.sin(a)*o.r*.12);ctx.lineTo(Math.cos(a+.18)*o.r*.48,Math.sin(a+.18)*o.r*.48);ctx.lineTo(Math.cos(a-.12)*o.r*.76,Math.sin(a-.12)*o.r*.76);ctx.stroke()}}ctx.restore()}
export function drawHazards(ctx,state,time,W,H){
  if(state.sector===0)for(const o of state.objects)drawAsteroid(ctx,o);
  if(state.sector===1&&state.flare>.55){const a=Math.max(0,(state.flare-.55)/.45),edge=H*(.18+.08*Math.sin(time*.21));ctx.fillStyle=`rgba(255,91,55,${.08+a*.18})`;ctx.fillRect(0,0,W,edge);ctx.fillRect(0,H-edge,W,edge)}
  if(state.sector===2)for(const o of state.objects){ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle="#c687ff";ctx.lineWidth=2;for(let r=o.r*.35;r<o.r;r+=18){ctx.beginPath();ctx.arc(o.x,o.y,r,0,Math.PI*2);ctx.stroke()}ctx.restore()}
  if(state.sector===3)for(const o of state.objects){ctx.save();ctx.globalAlpha=.16+.05*Math.sin(o.phase*3);ctx.fillStyle="#79ffd2";ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle="#79ffd2";ctx.setLineDash([5,9]);ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();ctx.restore()}
  if(state.sector===4&&state.beam){const b=state.beam,warning=b.warn>0;ctx.save();ctx.globalAlpha=warning?.28:.75;ctx.fillStyle=warning?"#ff668f":"#fff0f4";if(b.vertical)ctx.fillRect(b.pos-(warning?3:16),0,warning?6:32,H);else ctx.fillRect(0,b.pos-(warning?3:16),W,warning?6:32);ctx.restore()}
}
