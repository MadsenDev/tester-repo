import {spawnEnemyProjectile,particle} from "./entities.js";

export function moveEnemy(e,dt,{player,enemyBullets,particles,time,onShake}){
  const dx=player.x-e.x,dy=player.y-e.y,d=Math.max(1,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d;
  e.shootCd-=dt;e.chargeCd-=dt;

  if(e.behavior==="shooter"){
    const desired=230,radial=d>desired+35?1:d<desired-35?-1:0,tangent=Math.sin(e.phase)>0?1:-1;
    e.x+=(nx*radial-ny*.45*tangent)*e.s*dt;e.y+=(ny*radial+nx*.45*tangent)*e.s*dt;
    if(e.shootCd<=0){enemyBullets.push(spawnEnemyProjectile(e.x,e.y,Math.atan2(dy,dx),190,10,4,5));e.shootCd=1.75+Math.random()*.55}
  }else if(e.behavior==="strafe"){
    const radial=d>175?1:d<125?-.6:0;
    e.x+=(nx*radial-ny*.75)*e.s*dt;e.y+=(ny*radial+nx*.75)*e.s*dt;
  }else if(e.behavior==="charger"){
    const burst=e.chargeCd<=0?3.4:1;
    e.x+=nx*e.s*burst*dt;e.y+=ny*e.s*burst*dt;
    if(e.chargeCd<=0){e.chargeCd=2.3+Math.random()*.9;for(let i=0;i<5;i++)particles.push(particle(e.x,e.y,"boss"))}
  }else if(e.behavior==="boss"){
    const radial=d>210?1:d<145?-.55:0;
    e.x+=(nx*radial-ny*.38)*e.s*dt;e.y+=(ny*radial+nx*.38)*e.s*dt;
    if(e.shootCd<=0){const count=10;for(let i=0;i<count;i++)enemyBullets.push(spawnEnemyProjectile(e.x,e.y,i*Math.PI*2/count+time*.18,145,12,5,7));e.shootCd=1.45;onShake(5)}
  }else{
    e.x+=nx*e.s*dt;e.y+=ny*e.s*dt;
  }
}
