export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y}

const ARCHETYPES=[
  {kind:"scout",unlock:0,r:10,s:62,hp:20,d:8,v:8,behavior:"chase",color:"#ff845f"},
  {kind:"brute",unlock:35,r:16,s:42,hp:52,d:15,v:18,behavior:"chase",color:"#ff6f5a"},
  {kind:"dart",unlock:70,r:9,s:68,hp:24,d:10,v:14,behavior:"charger",color:"#ffb35a"},
  {kind:"bulwark",unlock:120,r:21,s:34,hp:96,d:20,v:30,behavior:"chase",color:"#ff5f74"},
  {kind:"wisp",unlock:170,r:12,s:78,hp:48,d:12,v:24,behavior:"strafe",color:"#d76dff"},
  {kind:"spitter",unlock:230,r:14,s:52,hp:64,d:14,v:32,behavior:"shooter",color:"#75d7ff"},
  {kind:"swarm",unlock:285,r:7,s:105,hp:20,d:7,v:16,behavior:"swarm",color:"#8dffcf"},
  {kind:"sniper",unlock:335,r:13,s:44,hp:70,d:13,v:38,behavior:"sniper",color:"#ffef83"},
  {kind:"orbiter",unlock:405,r:15,s:70,hp:82,d:15,v:42,behavior:"orbiter",color:"#91a2ff"}
];

function edgeSpawn(w,h){
  const side=Math.floor(Math.random()*4),m=70;
  if(side===0)return{x:Math.random()*w,y:-m};
  if(side===1)return{x:w+m,y:Math.random()*h};
  if(side===2)return{x:Math.random()*w,y:h+m};
  return{x:-m,y:Math.random()*h};
}

export function spawnEnemy(w,h,time){
  const pos=edgeSpawn(w,h),pool=ARCHETYPES.filter(a=>time>=a.unlock),base=pool[Math.floor(Math.random()*pool.length)];
  const elite=time>150&&Math.random()<Math.min(.18,.04+time/2400),scale=1+Math.max(0,time-180)*.0014,hp=base.hp*scale*(elite?1.9:1);
  return{...pos,px:pos.x,py:pos.y,...base,hp,hpMax:hp,d:base.d*(elite?1.25:1),v:Math.round(base.v*(elite?1.8:1)),s:base.s*(elite?1.08:1),r:base.r*(elite?1.18:1),boss:false,elite,flash:0,phase:Math.random()*6.28,shootCd:.8+Math.random()*1.4,chargeCd:1.2+Math.random()*1.8};
}

export function spawnEnemyProjectile(x,y,angle,speed=170,damage=10,r=4,life=5){return{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,r,life}}
export function particle(x,y,kind="spark"){const a=Math.random()*Math.PI*2,s=30+Math.random()*180;return{x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+Math.random()*.55,max:.8,kind,size:1+Math.random()*3}}
