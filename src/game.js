import {AudioSystem} from "./audio.js";
import {clamp,dist2,spawnEnemy,particle} from "./entities.js";
import {randomChoices} from "./upgrades.js";

const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
const ui={overlay:document.querySelector("#overlay"),menu:document.querySelector("#menu"),levelup:document.querySelector("#levelup"),gameover:document.querySelector("#gameover"),fatal:document.querySelector("#fatal"),fatalMessage:document.querySelector("#fatalMessage"),choices:document.querySelector("#choices"),hp:document.querySelector("#hp"),level:document.querySelector("#level"),time:document.querySelector("#time"),score:document.querySelector("#score"),hpBar:document.querySelector("#hpBar"),xpBar:document.querySelector("#xpBar"),best:document.querySelector("#best"),finalScore:document.querySelector("#finalScore")};
const audio=new AudioSystem(),keys=new Set();
const touch={active:false,startX:0,startY:0,dx:0,dy:0};
let W=innerWidth,H=innerHeight,dpr=1,last=0,state="menu",time=0,score=0,nextBoss=60,spawnTimer=0,shake=0;
let player,enemies=[],bullets=[],gems=[],particles=[];
ui.best.textContent=localStorage.getItem("orbital-best")||0;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener("resize",resize);resize();
addEventListener("keydown",e=>{const k=e.key.toLowerCase();keys.add(k);if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();if(k==="p"&&state==="playing")state="paused";else if(k==="p"&&state==="paused")state="playing";if(k==="m")audio.toggle()});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener("pointerdown",e=>{if(state!=="playing"||e.pointerType==="mouse")return;touch.active=true;touch.startX=e.clientX;touch.startY=e.clientY;touch.dx=0;touch.dy=0;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener("pointermove",e=>{if(!touch.active)return;const dx=e.clientX-touch.startX,dy=e.clientY-touch.startY,l=Math.hypot(dx,dy);if(l>4){const m=Math.min(1,l/55);touch.dx=dx/l*m;touch.dy=dy/l*m}else{touch.dx=0;touch.dy=0}});
function stopTouch(){touch.active=false;touch.dx=0;touch.dy=0}
canvas.addEventListener("pointerup",stopTouch);canvas.addEventListener("pointercancel",stopTouch);
document.querySelector("#start").onclick=()=>start();
document.querySelector("#restart").onclick=()=>start();
document.querySelector("#fatalRestart")?.addEventListener("click",()=>location.reload());

function freshPlayer(){return{x:W/2,y:H/2,r:11,hp:100,maxHp:100,speed:245,fireRate:.42,fireCd:0,damage:18,shots:1,pierce:0,bulletSpeed:520,bulletSize:4,magnet:110,regen:0,crit:.05,armor:0,dashBoost:0,xpGain:1,orbitals:0,invuln:0,boost:0,level:1,xp:0,nextXp:35}}
function showFatal(error){state="fatal";stopTouch();console.error(error);if(!ui.fatal)return;ui.menu.classList.add("hidden");ui.levelup.classList.add("hidden");ui.gameover.classList.add("hidden");ui.fatal.classList.remove("hidden");ui.fatalMessage.textContent=(error?.stack||error?.message||String(error)).slice(0,1800);ui.overlay.classList.add("show")}
function start(){try{try{audio.ensure()}catch(err){console.warn("Audio unavailable",err)}player=freshPlayer();enemies=[];bullets=[];gems=[];particles=[];time=score=spawnTimer=0;nextBoss=60;shake=0;stopTouch();state="playing";ui.overlay.classList.remove("show");ui.menu.classList.add("hidden");ui.gameover.classList.add("hidden");ui.levelup.classList.add("hidden");ui.fatal?.classList.add("hidden");update(1/60);render()}catch(error){showFatal(error)}}
function end(){state="gameover";stopTouch();const best=Math.max(score,+(localStorage.getItem("orbital-best")||0));localStorage.setItem("orbital-best",best);ui.best.textContent=best;ui.finalScore.textContent=Math.floor(score);ui.overlay.classList.add("show");ui.gameover.classList.remove("hidden")}
function levelUp(){state="levelup";stopTouch();audio.level();ui.overlay.classList.add("show");ui.levelup.classList.remove("hidden");ui.choices.innerHTML="";for(const u of randomChoices()){const b=document.createElement("button");b.className="choice";b.innerHTML="<b>"+u.name+"</b><small>"+u.desc+"</small>";b.onclick=()=>{u.apply(player);ui.levelup.classList.add("hidden");ui.overlay.classList.remove("show");state="playing"};ui.choices.appendChild(b)}}
function nearest(){let best=null,bd=Infinity;for(const e of enemies){const d=dist2(player,e);if(d<bd){bd=d;best=e}}return best}
function shoot(){const t=nearest();if(!t)return;const base=Math.atan2(t.y-player.y,t.x-player.x);for(let i=0;i<player.shots;i++){const spread=(i-(player.shots-1)/2)*.14,a=base+spread;bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*player.bulletSpeed,vy:Math.sin(a)*player.bulletSpeed,r:player.bulletSize,life:1.8,pierce:player.pierce,damage:player.damage*(Math.random()<player.crit?2:1)})}audio.shot()}
function update(dt){
  if(state!=="playing")return;
  time+=dt;score+=dt*10;player.invuln=Math.max(0,player.invuln-dt);player.boost=Math.max(0,player.boost-dt);player.hp=Math.min(player.maxHp,player.hp+player.regen*dt);
  let dx=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0),dy=(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);if(!dx&&!dy&&touch.active){dx=touch.dx;dy=touch.dy}if(dx||dy){const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}}const sp=player.speed*(player.boost>0?1+player.dashBoost:1);player.x=clamp(player.x+dx*sp*dt,20,W-20);player.y=clamp(player.y+dy*sp*dt,70,H-20);
  player.fireCd-=dt;if(player.fireCd<=0){shoot();player.fireCd=player.fireRate}
  const rate=Math.max(.12,.7-time*.004);spawnTimer-=dt;while(spawnTimer<=0){enemies.push(spawnEnemy(W,H,time,false));spawnTimer+=rate}
  if(time>=nextBoss){enemies.push(spawnEnemy(W,H,time,true));nextBoss+=60;audio.boss();shake=12}
  for(const e of enemies){e.flash=Math.max(0,e.flash-dt);e.phase+=dt;const a=Math.atan2(player.y-e.y,player.x-e.x);e.px=e.x;e.py=e.y;e.x+=Math.cos(a)*e.s*dt;e.y+=Math.sin(a)*e.s*dt;if(dist2(player,e)<(player.r+e.r)**2&&player.invuln<=0){player.hp-=e.d*(1-player.armor);player.invuln=.55;player.boost=.65;shake=8;audio.hurt();for(let i=0;i<10;i++)particles.push(particle(player.x,player.y,"hurt"));if(player.hp<=0)end()}}
  for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const e of enemies){if(e.hp<=0)continue;if(dist2(b,e)<(b.r+e.r)**2){e.hp-=b.damage;e.flash=.06;b.pierce--;audio.hit();for(let i=0;i<3;i++)particles.push(particle(b.x,b.y));if(b.pierce<0){b.life=0;break}}}}
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.hp<=0){score+=e.boss?700:20+e.v;const n=e.boss?14:1;for(let j=0;j<n;j++)gems.push({x:e.x+(Math.random()-.5)*20,y:e.y+(Math.random()-.5)*20,v:e.boss?24:e.v,r:e.boss?5:4});for(let j=0;j<(e.boss?32:9);j++)particles.push(particle(e.x,e.y,e.boss?"boss":"spark"));enemies.splice(i,1)}}
  bullets=bullets.filter(b=>b.life>0&&b.x>-40&&b.y>-40&&b.x<W+40&&b.y<H+40);
  for(let i=gems.length-1;i>=0;i--){const g=gems[i],d=Math.sqrt(dist2(player,g));if(d<player.magnet){const k=Math.max(.1,1-d/player.magnet),a=Math.atan2(player.y-g.y,player.x-g.x);g.x+=Math.cos(a)*(140+420*k)*dt;g.y+=Math.sin(a)*(140+420*k)*dt}if(d<player.r+8){player.xp+=g.v*player.xpGain;audio.xp();gems.splice(i,1);while(player.xp>=player.nextXp){player.xp-=player.nextXp;player.level++;player.nextXp=Math.floor(player.nextXp*1.28+8);levelUp();break}}}
  for(let o=0;o<player.orbitals;o++){const a=time*2.1+o*Math.PI*2/player.orbitals,ox=player.x+Math.cos(a)*42,oy=player.y+Math.sin(a)*42;for(const e of enemies)if(dist2({x:ox,y:oy},e)<(8+e.r)**2)e.hp-=28*dt}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt}particles=particles.filter(p=>p.life>0);shake=Math.max(0,shake-30*dt)
  updateUI()
}
function updateUI(){ui.hp.textContent=Math.max(0,Math.ceil(player.hp));ui.level.textContent=player.level;ui.time.textContent=String(Math.floor(time/60)).padStart(2,"0")+":"+String(Math.floor(time%60)).padStart(2,"0");ui.score.textContent=Math.floor(score);ui.hpBar.style.width=(player.hp/player.maxHp*100)+"%";ui.xpBar.style.width=(player.xp/player.nextXp*100)+"%"}
function polygon(x,y,r,n,rot=0){ctx.beginPath();for(let i=0;i<n;i++){const a=rot+i*Math.PI*2/n,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}
function render(){
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);const sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake;ctx.translate(sx,sy);
  ctx.fillStyle="#050b13";ctx.fillRect(-20,-20,W+40,H+40);
  ctx.strokeStyle="rgba(65,184,220,.07)";ctx.lineWidth=1;const grid=48,ox=(-time*8)%grid,oy=(-time*4)%grid;for(let x=ox;x<W;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=oy;y<H;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  for(const g of gems){ctx.save();ctx.translate(g.x,g.y);ctx.rotate(time*2);ctx.shadowBlur=12;ctx.shadowColor="#7bf5ff";ctx.fillStyle="#7bf5ff";polygon(0,0,g.r,4,Math.PI/4);ctx.fill();ctx.restore()}
  for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(time*.6+e.phase);ctx.shadowBlur=e.boss?25:12;ctx.shadowColor=e.boss?"#ff537d":"#ff8a5c";ctx.fillStyle=e.flash>0?"#fff":e.boss?"#ff3f71":"#ff7f50";polygon(0,0,e.r,e.boss?8:(e.r>16?6:5),.2);ctx.fill();if(e.boss){ctx.strokeStyle="#ffd3df";ctx.lineWidth=2;polygon(0,0,e.r+9,8,time);ctx.stroke()}ctx.restore();if(e.hp<e.hpMax){ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(e.x-e.r,e.y-e.r-10,e.r*2,3);ctx.fillStyle="#ff5f82";ctx.fillRect(e.x-e.r,e.y-e.r-10,e.r*2*(e.hp/e.hpMax),3)}}
  for(const b of bullets){ctx.shadowBlur=10;ctx.shadowColor="#a8f6ff";ctx.fillStyle="#baf8ff";ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;
  if(player){for(let o=0;o<player.orbitals;o++){const a=time*2.1+o*Math.PI*2/player.orbitals,x=player.x+Math.cos(a)*42,y=player.y+Math.sin(a)*42;ctx.fillStyle="#fff1a8";ctx.shadowBlur=14;ctx.shadowColor="#ffd95a";polygon(x,y,7,4,time);ctx.fill()}ctx.shadowBlur=0;ctx.save();ctx.translate(player.x,player.y);ctx.rotate(time*.8);ctx.shadowBlur=22;ctx.shadowColor=player.invuln>0?"#fff":"#72e9ff";ctx.fillStyle=player.invuln>0&&Math.floor(time*20)%2?"#fff":"#78ebff";polygon(0,0,player.r,3,-Math.PI/2);ctx.fill();ctx.strokeStyle="#d9fbff";ctx.lineWidth=2;polygon(0,0,player.r+7,6,time*-1.5);ctx.stroke();ctx.restore()}
  for(const p of particles){const a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.fillStyle=p.kind==="hurt"?"#ff557c":p.kind==="boss"?"#ffd36f":"#95efff";ctx.fillRect(p.x,p.y,p.size,p.size)}ctx.globalAlpha=1;
  ctx.restore();
  if(state==="paused"){ctx.fillStyle="rgba(1,5,10,.55)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="800 36px system-ui";ctx.fillText("PAUSED",W/2,H/2)}
}
function frame(ts){const dt=Math.min(.033,(ts-last)/1000||0);last=ts;try{update(dt);render()}catch(error){showFatal(error)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
