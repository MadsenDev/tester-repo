const nearest=(origin,enemies,exclude=new Set())=>{let best=null,bd=Infinity;for(const e of enemies){if(e.hp<=0||e.targetable===false||exclude.has(e))continue;const dx=e.x-origin.x,dy=e.y-origin.y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e}}return best};
const distToSegment=(p,a,b)=>{const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y,c1=vx*wx+vy*wy,c2=vx*vx+vy*vy,t=c2?Math.max(0,Math.min(1,c1/c2)):0,dx=p.x-(a.x+t*vx),dy=p.y-(a.y+t*vy);return Math.hypot(dx,dy)};

export function initWeapons(player){
  player.weapons={missile:0,arc:0,nova:0,mines:0,beam:0};
  player.weaponEvolved={missile:false,arc:false,nova:false,mines:false,beam:false};
  player.passives={};
  player.weaponCd={missile:0,arc:0,nova:0,mines:0,beam:0};
  player.weaponFx=[];
}

export function weaponLabel(player){
  if(!player)return "BLASTER ONLY";
  const names={missile:"SEEKER",arc:"ARC",nova:"NOVA",mines:"MINES",beam:"BEAM"};
  const evoNames={missile:"SUNFALL",arc:"STORM CROWN",nova:"SUPERNOVA",mines:"VOID ANCHORS",beam:"JUDGEMENT"};
  const active=Object.entries(player.weapons||{}).filter(([,level])=>level>0).map(([id,level])=>player.weaponEvolved?.[id]?`${evoNames[id]} ★`:`${names[id]} ${level}`);
  return active.length?active.join(" · "):"BLASTER ONLY";
}

export function updateWeapons(player,dt,enemies,bullets,particles,time){
  if(!player?.weapons)return;
  for(const id of Object.keys(player.weaponCd))player.weaponCd[id]-=dt;
  player.weaponFx=player.weaponFx.filter(f=>(f.life-=dt)>0);

  const missile=player.weapons.missile,evoMissile=player.weaponEvolved?.missile;
  if(missile>0&&player.weaponCd.missile<=0&&enemies.length){
    const t=nearest(player,enemies);if(t){const base=Math.atan2(t.y-player.y,t.x-player.x),speed=260+missile*28,count=evoMissile?3:1;for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*(evoMissile?.22:0);bullets.push({kind:"missile",evolved:evoMissile,x:player.x,y:player.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:(5+missile*.4)*(evoMissile?1.12:1),life:4,pierce:evoMissile?1:0,damage:(42+missile*23)*(evoMissile?.72:1),turn:4.5+missile*.45})}player.weaponCd.missile=Math.max(.68,2.6-missile*.28-(evoMissile?.15:0))}
  }

  const arc=player.weapons.arc,evoArc=player.weaponEvolved?.arc;
  if(arc>0&&player.weaponCd.arc<=0&&enemies.length){
    const hit=[],used=new Set();let origin=player;const chains=Math.min(evoArc?9:6,1+arc+(evoArc?3:0)),damage=(28+arc*15)*(evoArc?1.35:1);
    for(let i=0;i<chains;i++){const t=nearest(origin,enemies,used);if(!t)break;const dx=t.x-origin.x,dy=t.y-origin.y;if(Math.hypot(dx,dy)>(i?(evoArc?245:190):(evoArc?390:330)))break;used.add(t);hit.push({x:t.x,y:t.y});t.hp-=damage;t.flash=.09;origin=t}
    if(hit.length){if(evoArc&&hit[0]){const first=[...enemies].find(e=>e.targetable!==false&&Math.abs(e.x-hit[0].x)<1&&Math.abs(e.y-hit[0].y)<1);if(first)first.hp-=damage*.45}player.weaponFx.push({kind:"arc",evolved:evoArc,points:[{x:player.x,y:player.y},...hit],life:evoArc?.22:.16,max:evoArc?.22:.16});player.weaponCd.arc=Math.max(evoArc?.52:.7,2.35-arc*.22-(evoArc?.12:0))}
  }

  const nova=player.weapons.nova,evoNova=player.weaponEvolved?.nova;
  if(nova>0&&player.weaponCd.nova<=0){
    const radius=110+nova*28,damage=34+nova*22;for(const e of enemies){if(e.targetable===false)continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<radius){e.hp-=damage*(1-d/radius*.45);e.flash=.1}if(evoNova&&d<radius*.62){e.hp-=damage*.72;e.flash=.13}}
    for(let i=0;i<18+nova*3+(evoNova?14:0);i++){const a=Math.random()*Math.PI*2,s=radius*(.5+Math.random()*.5);particles.push({x:player.x,y:player.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35,max:.35,kind:"nova",size:2+Math.random()*2})}
    player.weaponFx.push({kind:"nova",evolved:evoNova,x:player.x,y:player.y,radius,life:evoNova?.42:.32,max:evoNova?.42:.32});player.weaponCd.nova=Math.max(evoNova?1.45:1.8,5.2-nova*.48-(evoNova?.25:0))
  }

  const mines=player.weapons.mines,evoMines=player.weaponEvolved?.mines;
  if(mines>0&&player.weaponCd.mines<=0){
    const count=evoMines?2:1;for(let i=0;i<count;i++){const a=time*2+i*Math.PI;bullets.push({kind:"mine",evolved:evoMines,x:player.x+Math.cos(a)*12*i,y:player.y+Math.sin(a)*12*i,vx:evoMines?Math.cos(a)*12:0,vy:evoMines?Math.sin(a)*12:0,r:(7+mines)*(evoMines?1.45:1),life:8+mines+(evoMines?5:0),pierce:evoMines?5:Math.min(2,mines-1),damage:(48+mines*26)*(evoMines?1.35:1),phase:time})}player.weaponCd.mines=Math.max(evoMines?.9:1.2,3.4-mines*.35-(evoMines?.2:0))
  }

  const beam=player.weapons.beam,evoBeam=player.weaponEvolved?.beam;
  if(beam>0&&player.weaponCd.beam<=0&&enemies.length){
    const t=nearest(player,enemies);if(t){const dx=t.x-player.x,dy=t.y-player.y,l=Math.max(1,Math.hypot(dx,dy)),base=Math.atan2(dy,dx),range=500+beam*45,width=12+beam*4,damage=(52+beam*28)*(evoBeam?.72:1),count=evoBeam?3:1;for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*(evoBeam?.11:0),end={x:player.x+Math.cos(a)*range,y:player.y+Math.sin(a)*range};for(const e of enemies){if(e.targetable!==false&&distToSegment(e,player,end)<e.r+width)e.hp-=damage}player.weaponFx.push({kind:"beam",evolved:evoBeam,a:{x:player.x,y:player.y},b:end,width:evoBeam?width*.85:width,life:evoBeam?.25:.2,max:evoBeam?.25:.2})}player.weaponCd.beam=Math.max(evoBeam?.82:1.1,4.1-beam*.38-(evoBeam?.22:0))}
  }
}

export function updateWeaponProjectiles(bullets,enemies,dt){
  for(const b of bullets){if(b.kind!=="missile")continue;const t=nearest(b,enemies);if(!t)continue;const speed=Math.max(1,Math.hypot(b.vx,b.vy)),current=Math.atan2(b.vy,b.vx),desired=Math.atan2(t.y-b.y,t.x-b.x);const delta=((desired-current+Math.PI*3)%(Math.PI*2))-Math.PI,next=current+Math.max(-b.turn*dt,Math.min(b.turn*dt,delta));b.vx=Math.cos(next)*speed;b.vy=Math.sin(next)*speed}
}

export function drawWeaponFx(ctx,player){
  if(!player)return;
  for(const f of player.weaponFx||[]){const alpha=Math.max(0,f.life/f.max);ctx.save();ctx.globalAlpha=alpha;if(f.kind==="arc"){ctx.strokeStyle=f.evolved?"#fff3a6":"#b9f7ff";ctx.shadowColor=f.evolved?"#ffe36a":"#78eaff";ctx.shadowBlur=f.evolved?26:18;ctx.lineWidth=f.evolved?4:3;ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke()}else if(f.kind==="nova"){ctx.strokeStyle=f.evolved?"#fff1a6":"#d69cff";ctx.shadowColor=f.evolved?"#ffe06a":"#b675ff";ctx.shadowBlur=f.evolved?30:22;ctx.lineWidth=f.evolved?6:5;ctx.beginPath();ctx.arc(f.x,f.y,f.radius*(1.1-alpha*.1),0,Math.PI*2);ctx.stroke();if(f.evolved){ctx.globalAlpha=alpha*.72;ctx.beginPath();ctx.arc(f.x,f.y,f.radius*.62*(1.08-alpha*.08),0,Math.PI*2);ctx.stroke()}}else if(f.kind==="beam"){ctx.strokeStyle=f.evolved?"#fff0a6":"#7ffcff";ctx.shadowColor=f.evolved?"#ffe26f":"#7ffcff";ctx.shadowBlur=f.evolved?32:26;ctx.lineWidth=f.width*alpha;ctx.beginPath();ctx.moveTo(f.a.x,f.a.y);ctx.lineTo(f.b.x,f.b.y);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(1,f.width*.18);ctx.stroke()}ctx.restore()}
}
