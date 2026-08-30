import {spawnEnemyProjectile,particle,isInViewport} from "./entities.js";

export function moveEnemy(e,dt,{player,enemyBullets,particles,time}){
  const dx=player.x-e.x,dy=player.y-e.y,d=Math.max(1,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d;
  e.shootCd-=dt;e.chargeCd-=dt;

  if(e.behavior==="shooter"){
    const desired=230,radial=d>desired+35?1:d<desired-35?-1:0,tangent=Math.sin(e.phase)>0?1:-1;
    e.x+=(nx*radial-ny*.45*tangent)*e.s*dt;e.y+=(ny*radial+nx*.45*tangent)*e.s*dt;
    if(e.shootCd<=0&&isInViewport(e)){enemyBullets.push(spawnEnemyProjectile(e.x,e.y,Math.atan2(dy,dx),190,10,4,5));e.shootCd=1.75+Math.random()*.55}
  }else if(e.behavior==="sniper"){
    const desired=350,radial=d>desired+25?1:d<desired-25?-1:0;e.x+=nx*radial*e.s*dt;e.y+=ny*radial*e.s*dt;
    if(e.shootCd<=0&&isInViewport(e)){enemyBullets.push(spawnEnemyProjectile(e.x,e.y,Math.atan2(dy,dx),330,15,3,4));e.shootCd=2.1;for(let i=0;i<4;i++)particles.push(particle(e.x,e.y,"boss"))}
  }else if(e.behavior==="strafe"||e.behavior==="orbiter"){
    const desired=e.behavior==="orbiter"?210:175,radial=d>desired+25?1:d<desired-25?-.6:0,tangent=e.behavior==="orbiter"?1:.75;
    e.x+=(nx*radial-ny*tangent)*e.s*dt;e.y+=(ny*radial+nx*tangent)*e.s*dt;
    if(e.behavior==="orbiter"&&e.shootCd<=0&&isInViewport(e)){enemyBullets.push(spawnEnemyProjectile(e.x,e.y,Math.atan2(dy,dx)+.25,175,10,4,5));enemyBullets.push(spawnEnemyProjectile(e.x,e.y,Math.atan2(dy,dx)-.25,175,10,4,5));e.shootCd=1.55}
  }else if(e.behavior==="charger"){
    const burst=e.chargeCd<=0?3.4:1;e.x+=nx*e.s*burst*dt;e.y+=ny*e.s*burst*dt;
    if(e.chargeCd<=0){e.chargeCd=2.3+Math.random()*.9;for(let i=0;i<5;i++)particles.push(particle(e.x,e.y,"boss"))}
  }else if(e.behavior==="swarm"){
    const wobble=Math.sin(time*6+e.phase)*.45;e.x+=(nx-ny*wobble)*e.s*dt;e.y+=(ny+nx*wobble)*e.s*dt;
  }else{
    e.x+=nx*e.s*dt;e.y+=ny*e.s*dt;
  }
}
