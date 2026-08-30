import {spawnEnemyProjectile,particle} from "./entities.js";

const BOSSES=[
  {kind:"warden",name:"THE WARDEN",color:"#ff547c",r:40,s:30,hp:900,d:30},
  {kind:"harrower",name:"HARROWER",color:"#ff9b5d",r:34,s:38,hp:980,d:34},
  {kind:"prism",name:"PRISMATIC EYE",color:"#8ee8ff",r:37,s:28,hp:1080,d:30},
  {kind:"singularity",name:"SINGULARITY",color:"#c77dff",r:42,s:24,hp:1180,d:28},
  {kind:"crown",name:"THE CROWN",color:"#ffe06a",r:46,s:27,hp:1380,d:36}
];
function edgeSpawn(w,h){const side=Math.floor(Math.random()*4),m=80;if(side===0)return{x:Math.random()*w,y:-m};if(side===1)return{x:w+m,y:Math.random()*h};if(side===2)return{x:Math.random()*w,y:h+m};return{x:-m,y:Math.random()*h}}
export function spawnBoss(w,h,time){const minute=Math.max(1,Math.floor(time/60)),base=BOSSES[(minute-1)%BOSSES.length],pos=edgeSpawn(w,h),scale=1+(minute-1)*.18,hp=base.hp*scale;return{...pos,px:pos.x,py:pos.y,...base,hp,hpMax:hp,boss:true,bossName:base.name,behavior:"boss",v:280+minute*35,flash:0,phase:Math.random()*6.28,shootCd:.7,chargeCd:1.7,telegraph:0,dashTime:0,dashVx:0,dashVy:0,elite:false,bossPhase:1,phaseFlash:0}}
export function updateBoss(e,dt,{player,enemyBullets,particles,time,onShake}){
  const ratio=e.hp/e.hpMax;if(ratio<=.5&&e.bossPhase===1){e.bossPhase=2;e.phaseFlash=1.4;e.shootCd=0;e.chargeCd=0;onShake(12);for(let i=0;i<28;i++)particles.push(particle(e.x,e.y,"boss"))}e.phaseFlash=Math.max(0,e.phaseFlash-dt);const rage=e.bossPhase===2;
  const dx=player.x-e.x,dy=player.y-e.y,d=Math.max(1,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d,wasTelegraph=e.telegraph;e.shootCd-=dt;e.chargeCd-=dt;e.telegraph=Math.max(0,e.telegraph-dt);e.dashTime=Math.max(0,e.dashTime-dt);
  if(e.kind==="warden"){const radial=d>220?1:d<155?-.5:0;e.x+=(nx*radial-ny*(rage?.58:.38))*e.s*dt;e.y+=(ny*radial+nx*(rage?.58:.38))*e.s*dt;if(e.shootCd<=0){const count=rage?18:14,gaps=rage?1:2,gap=Math.floor((time*(rage?1.35:.8))%count);for(let i=0;i<count;i++){let skip=false;for(let g=0;g<gaps;g++)if(i===(gap+g)%count)skip=true;if(!skip)enemyBullets.push(spawnEnemyProjectile(e.x,e.y,i*Math.PI*2/count+time*.22,rage?185:155,12,5,7))}e.shootCd=rage?.82:1.25;onShake(4)}}
  else if(e.kind==="harrower"){if(wasTelegraph>0&&e.telegraph===0)e.dashTime=rage?.52:.42;if(e.dashTime>0){e.x+=e.dashVx*dt;e.y+=e.dashVy*dt}else if(e.telegraph<=0){e.x+=nx*e.s*dt;e.y+=ny*e.s*dt}if(e.chargeCd<=0&&e.dashTime<=0&&e.telegraph<=0){e.telegraph=rage?.4:.6;e.chargeCd=rage?1.35:2.5;const a=Math.atan2(dy,dx);e.dashVx=Math.cos(a)*(rage?520:430);e.dashVy=Math.sin(a)*(rage?520:430)}if(e.shootCd<=0){for(let i=-2;i<=2;i++)enemyBullets.push(spawnEnemyProjectile(e.x,e.y,Math.atan2(dy,dx)+i*.18,rage?245:205,11,4,5));e.shootCd=rage?1.05:1.7}}
  else if(e.kind==="prism"){const radial=d>260?1:d<205?-.6:0;e.x+=(nx*radial-ny*(rage?.42:.28))*e.s*dt;e.y+=(ny*radial+nx*(rage?.42:.28))*e.s*dt;if(e.shootCd<=0){const base=Math.atan2(dy,dx),spread=rage?6:4;for(let i=-spread;i<=spread;i++)enemyBullets.push(spawnEnemyProjectile(e.x,e.y,base+i*(rage?.1:.12),rage?275:245,11,4,5));e.shootCd=rage?.72:1.15;onShake(3)}}
  else if(e.kind==="singularity"){const radial=d>190?1:d<135?-.45:0;e.x+=(nx*radial-ny*.5)*e.s*dt;e.y+=(ny*radial+nx*.5)*e.s*dt;if(d<390){const force=(1-d/390)*(rage?62:36)*(rage&&Math.floor(time/3)%2?-1:1);player.x-=nx*force*dt;player.y-=ny*force*dt}if(e.shootCd<=0){const count=rage?16:12;for(let i=0;i<count;i++)enemyBullets.push(spawnEnemyProjectile(e.x,e.y,i*Math.PI*2/count-time*(rage?1.05:.65),rage?155+i%2*65:125+i%2*55,10,4,8));e.shootCd=rage?.72:1.05}}
  else{const radial=d>205?1:d<150?-.5:0;e.x+=(nx*radial-ny*.34)*e.s*dt;e.y+=(ny*radial+nx*.34)*e.s*dt;if(e.shootCd<=0){const base=time*(rage?.58:.35),rings=rage?3:2;for(let ring=0;ring<rings;ring++)for(let i=0;i<10;i++)enemyBullets.push(spawnEnemyProjectile(e.x,e.y,base+i*Math.PI*2/10+ring*.16,145+ring*62,13,5,7));for(let i=0;i<10;i++)particles.push(particle(e.x,e.y,"boss"));e.shootCd=rage?.62:.95;onShake(6)}}
}
