import {drawWeaponFx} from "./weapons.js";
import {sectorAt} from "./world.js";

function polygon(ctx,x,y,r,n,rot=0){ctx.beginPath();for(let i=0;i<n;i++){const a=rot+i*Math.PI*2/n,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}

function drawEnemy(ctx,e,time){
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(time*.6+e.phase);ctx.shadowBlur=e.boss?30:e.elite?20:12;ctx.shadowColor=e.color;ctx.fillStyle=e.flash>0?"#fff":e.color;
  const sides=e.kind==="dart"?3:e.kind==="wisp"?4:e.kind==="spitter"||e.kind==="sniper"?6:e.kind==="swarm"?3:e.kind==="orbiter"?7:e.boss?8:e.r>18?6:5;
  polygon(ctx,0,0,e.r,sides,.2);ctx.fill();
  if(e.elite&&!e.boss){ctx.strokeStyle="#ffe895";ctx.lineWidth=2;polygon(ctx,0,0,e.r+6,sides,-time);ctx.stroke()}
  if(e.boss){ctx.strokeStyle="#fff4df";ctx.lineWidth=2.5;polygon(ctx,0,0,e.r+10,sides,time);ctx.stroke();if(e.telegraph>0){ctx.globalAlpha=.35+.3*Math.sin(time*18);ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,e.r+18,0,Math.PI*2);ctx.stroke()}}
  ctx.restore();
  if(e.hp<e.hpMax){ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(e.x-e.r,e.y-e.r-10,e.r*2,3);ctx.fillStyle=e.boss?e.color:"#ff9a72";ctx.fillRect(e.x-e.r,e.y-e.r-10,e.r*2*(e.hp/e.hpMax),3)}
}

function drawBackdrop(ctx,W,H,time,sector){
  ctx.fillStyle=sector.bg;ctx.fillRect(-20,-20,W+40,H+40);ctx.strokeStyle=sector.grid;ctx.lineWidth=1;
  const grid=48,ox=(-time*8)%grid,oy=(-time*4)%grid;for(let x=ox;x<W;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=oy;y<H;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  ctx.globalAlpha=.22;ctx.fillStyle=sector.accent;for(let i=0;i<18;i++){const x=(i*173+time*(6+i%4))%(W+80)-40,y=(i*97+Math.sin(time*.2+i)*80+H)%(H+80)-40,r=1+(i%3);ctx.fillRect(x,y,r,r)}ctx.globalAlpha=1;
}

export function renderScene(ctx,view,world){
  const {dpr,W,H}=view,{time,shake,state,player,enemies,bullets,enemyBullets,gems,particles,powerups}=world,sector=sectorAt(time);
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);const sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake;ctx.translate(sx,sy);drawBackdrop(ctx,W,H,time,sector);
  for(const g of gems){ctx.save();ctx.translate(g.x,g.y);ctx.rotate(time*2);ctx.shadowBlur=12;ctx.shadowColor="#7bf5ff";ctx.fillStyle="#7bf5ff";polygon(ctx,0,0,g.r,4,Math.PI/4);ctx.fill();ctx.restore()}
  for(const p of powerups){const colors={repair:"#7dffb2",pulse:"#fff07a",overdrive:"#b585ff"},color=colors[p.kind];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.phase);ctx.shadowBlur=20;ctx.shadowColor=color;ctx.fillStyle=color;polygon(ctx,0,0,p.r,6,time);ctx.fill();ctx.restore()}
  for(const e of enemies)drawEnemy(ctx,e,time);if(player)drawWeaponFx(ctx,player);
  for(const b of bullets){const kind=b.kind||"blaster";ctx.save();ctx.translate(b.x,b.y);if(kind==="missile"){ctx.rotate(Math.atan2(b.vy,b.vx));ctx.shadowBlur=18;ctx.shadowColor="#ffca73";ctx.fillStyle="#ffe0a0";polygon(ctx,0,0,b.r+2,3,0)}else if(kind==="mine"){ctx.rotate(time*2+(b.phase||0));ctx.shadowBlur=18;ctx.shadowColor="#c48aff";ctx.fillStyle="#d9adff";polygon(ctx,0,0,b.r,4,Math.PI/4)}else{ctx.shadowBlur=10;ctx.shadowColor="#a8f6ff";ctx.fillStyle="#baf8ff";ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2)}ctx.fill();ctx.restore()}
  for(const b of enemyBullets){ctx.shadowBlur=12;ctx.shadowColor="#ff638e";ctx.fillStyle="#ff7a9c";ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;
  if(player){for(let o=0;o<player.orbitals;o++){const a=time*2.1+o*Math.PI*2/player.orbitals,x=player.x+Math.cos(a)*42,y=player.y+Math.sin(a)*42;ctx.fillStyle="#fff1a8";ctx.shadowBlur=14;ctx.shadowColor="#ffd95a";polygon(ctx,x,y,7,4,time);ctx.fill()}ctx.shadowBlur=0;ctx.save();ctx.translate(player.x,player.y);ctx.rotate(time*.8);ctx.shadowBlur=player.overdrive>0?30:22;ctx.shadowColor=player.overdrive>0?"#b585ff":player.invuln>0?"#fff":"#72e9ff";ctx.fillStyle=player.invuln>0&&Math.floor(time*20)%2?"#fff":"#78ebff";polygon(ctx,0,0,player.r,3,-Math.PI/2);ctx.fill();ctx.strokeStyle=player.overdrive>0?"#d8c1ff":"#d9fbff";ctx.lineWidth=2;polygon(ctx,0,0,player.r+7,6,time*-1.5);ctx.stroke();ctx.restore()}
  for(const p of particles){const a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.fillStyle=p.kind==="hurt"?"#ff557c":p.kind==="boss"?"#ffd36f":p.kind==="nova"?"#cf99ff":"#95efff";ctx.fillRect(p.x,p.y,p.size,p.size)}ctx.globalAlpha=1;ctx.restore();
  if(state==="paused"){ctx.fillStyle="rgba(1,5,10,.55)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="800 36px system-ui";ctx.fillText("PAUSED",W/2,H/2)}
}
