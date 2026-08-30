const nearest=(origin,enemies,exclude=new Set())=>{let best=null,bd=Infinity;for(const e of enemies){if(e.hp<=0||exclude.has(e))continue;const dx=e.x-origin.x,dy=e.y-origin.y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e}}return best};
const distToSegment=(p,a,b)=>{const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y,c1=vx*wx+vy*wy,c2=vx*vx+vy*vy,t=c2?Math.max(0,Math.min(1,c1/c2)):0,dx=p.x-(a.x+t*vx),dy=p.y-(a.y+t*vy);return Math.hypot(dx,dy)};

export function initWeapons(player){
  player.weapons={missile:0,arc:0,nova:0,mines:0,beam:0};
  player.weaponCd={missile:0,arc:0,nova:0,mines:0,beam:0};
  player.weaponFx=[];
}

export function weaponLabel(player){
  const names={missile:"SEEKER",arc:"ARC",nova:"NOVA",mines:"MINES",beam:"BEAM"};
  const active=Object.entries(player.weapons||{}).filter(([,level])=>level>0).map(([id,level])=>`${names[id]} ${level}`);
  return active.length?active.join(" · "):"BLASTER ONLY";
}

export function updateWeapons(player,dt,enemies,bullets,particles,time){
  if(!player.weapons)return;
  for(const id of Object.keys(player.weaponCd))player.weaponCd[id]-=dt;
  player.weaponFx=player.weaponFx.filter(f=>(f.life-=dt)>0);

  const missile=player.weapons.missile;
  if(missile>0&&player.weaponCd.missile<=0&&enemies.length){
    const t=nearest(player,enemies);if(t){const a=Math.atan2(t.y-player.y,t.x-player.x),speed=260+missile*28;bullets.push({kind:"missile",x:player.x,y:player.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:5+missile*.4,life:4,pierce:0,damage:42+missile*23,turn:4.5+missile*.45});player.weaponCd.missile=Math.max(.8,2.6-missile*.28)}
  }

  const arc=player.weapons.arc;
  if(arc>0&&player.weaponCd.arc<=0&&enemies.length){
    const hit=[],used=new Set();let origin=player;const chains=Math.min(6,1+arc);
    for(let i=0;i<chains;i++){const t=nearest(origin,enemies,used);if(!t)break;const dx=t.x-origin.x,dy=t.y-origin.y;if(Math.hypot(dx,dy)>(i?190:330))break;used.add(t);hit.push({x:t.x,y:t.y});t.hp-=28+arc*15;t.flash=.09;origin=t}
    if(hit.length){player.weaponFx.push({kind:"arc",points:[{x:player.x,y:player.y},...hit],life:.16,max:.16});player.weaponCd.arc=Math.max(.7,2.35-arc*.22)}
  }

  const nova=player.weapons.nova;
  if(nova>0&&player.weaponCd.nova<=0){
    const radius=110+nova*28,damage=34+nova*22;for(const e of enemies){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<radius){e.hp-=damage*(1-d/radius*.45);e.flash=.1}}
    for(let i=0;i<18+nova*3;i++){const a=Math.random()*Math.PI*2,s=radius*(.5+Math.random()*.5);particles.push({x:player.x,y:player.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35,max:.35,kind:"nova",size:2+Math.random()*2})}
    player.weaponFx.push({kind:"nova",x:player.x,y:player.y,radius,life:.32,max:.32});player.weaponCd.nova=Math.max(1.8,5.2-nova*.48)
  }

  const mines=player.weapons.mines;
  if(mines>0&&player.weaponCd.mines<=0){
    bullets.push({kind:"mine",x:player.x,y:player.y,vx:0,vy:0,r:7+mines,life:8+mines,pierce:Math.min(2,mines-1),damage:48+mines*26,phase:time});player.weaponCd.mines=Math.max(1.2,3.4-mines*.35)
  }

  const beam=player.weapons.beam;
  if(beam>0&&player.weaponCd.beam<=0&&enemies.length){
    const t=nearest(player,enemies);if(t){const dx=t.x-player.x,dy=t.y-player.y,l=Math.max(1,Math.hypot(dx,dy)),range=500+beam*45,end={x:player.x+dx/l*range,y:player.y+dy/l*range},width=12+beam*4,damage=52+beam*28;for(const e of enemies){if(distToSegment(e,player,end)<e.r+width)e.hp-=damage}player.weaponFx.push({kind:"beam",a:{x:player.x,y:player.y},b:end,width,life:.2,max:.2});player.weaponCd.beam=Math.max(1.1,4.1-beam*.38)}
  }
}

export function updateWeaponProjectiles(bullets,enemies,dt){
  for(const b of bullets){if(b.kind!=="missile")continue;const t=nearest(b,enemies);if(!t)continue;const speed=Math.max(1,Math.hypot(b.vx,b.vy)),current=Math.atan2(b.vy,b.vx),desired=Math.atan2(t.y-b.y,t.x-b.x);let delta=((desired-current+Math.PI*3)%(Math.PI*2))-Math.PI;const next=current+Math.max(-b.turn*dt,Math.min(b.turn*dt,delta));b.vx=Math.cos(next)*speed;b.vy=Math.sin(next)*speed}
}

export function drawWeaponFx(ctx,player){
  for(const f of player.weaponFx||[]){const alpha=Math.max(0,f.life/f.max);ctx.save();ctx.globalAlpha=alpha;if(f.kind==="arc"){ctx.strokeStyle="#b9f7ff";ctx.shadowColor="#78eaff";ctx.shadowBlur=18;ctx.lineWidth=3;ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke()}else if(f.kind==="nova"){ctx.strokeStyle="#d69cff";ctx.shadowColor="#b675ff";ctx.shadowBlur=22;ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,f.radius*(1.1-alpha*.1),0,Math.PI*2);ctx.stroke()}else if(f.kind==="beam"){ctx.strokeStyle="#7ffcff";ctx.shadowColor="#7ffcff";ctx.shadowBlur=26;ctx.lineWidth=f.width*alpha;ctx.beginPath();ctx.moveTo(f.a.x,f.a.y);ctx.lineTo(f.b.x,f.b.y);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(1,f.width*.18);ctx.stroke()}ctx.restore()}
}
