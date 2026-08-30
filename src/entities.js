export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y}
export function spawnEnemy(w,h,time,boss=false){
  const side=Math.floor(Math.random()*4),m=60;let x,y;
  if(side===0){x=Math.random()*w;y=-m}else if(side===1){x=w+m;y=Math.random()*h}else if(side===2){x=Math.random()*w;y=h+m}else{x=-m;y=Math.random()*h}
  const tier=Math.min(4,Math.floor(time/55)),types=[
    {r:10,s:58,hp:18,d:8,v:8},
    {r:15,s:42,hp:42,d:14,v:16},
    {r:8,s:92,hp:14,d:7,v:10},
    {r:20,s:34,hp:78,d:18,v:26},
    {r:12,s:65,hp:40,d:12,v:20}
  ];
  let t=types[Math.floor(Math.random()*(tier+1))];
  if(boss)t={r:36,s:28,hp:520+time*7,d:30,v:180};
  return {x,y,px:x,py:y,...t,boss,hpMax:t.hp,flash:0,phase:Math.random()*6.28}
}
export function particle(x,y,kind="spark"){
  const a=Math.random()*Math.PI*2,s=30+Math.random()*180;
  return{x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+Math.random()*.55,max:.8,kind,size:1+Math.random()*3}
}
