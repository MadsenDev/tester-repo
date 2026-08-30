import {AudioSystem} from "./audio.js";
import {clamp,dist2,spawnEnemy,particle} from "./entities.js";
import {randomChoices} from "./upgrades.js";
import {initWeapons,updateWeapons,updateWeaponProjectiles,weaponLabel} from "./weapons.js";
import {createInput} from "./input.js";
import {moveEnemy} from "./enemy-ai.js";
import {renderScene} from "./render.js";

const RUN_LENGTH=600;
const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d");
const ui={overlay:document.querySelector("#overlay"),menu:document.querySelector("#menu"),levelup:document.querySelector("#levelup"),gameover:document.querySelector("#gameover"),victory:document.querySelector("#victory"),fatal:document.querySelector("#fatal"),fatalMessage:document.querySelector("#fatalMessage"),choices:document.querySelector("#choices"),hp:document.querySelector("#hp"),level:document.querySelector("#level"),time:document.querySelector("#time"),score:document.querySelector("#score"),hpBar:document.querySelector("#hpBar"),xpBar:document.querySelector("#xpBar"),combo:document.querySelector("#combo"),arsenal:document.querySelector("#arsenal"),best:document.querySelector("#best"),finalScore:document.querySelector("#finalScore"),victoryScore:document.querySelector("#victoryScore")};
const audio=new AudioSystem();
let W=innerWidth,H=innerHeight,dpr=1,last=0,state="menu";
let time=0,score=0,nextBoss=60,spawnTimer=0,shake=0,combo=0,comboTimer=0,kills=0;
let player,enemies=[],bullets=[],enemyBullets=[],gems=[],particles=[],powerups=[];
ui.best.textContent=Math.floor(Number(localStorage.getItem("orbital-best")||0));

const input=createInput(canvas,{
  getState:()=>state,
  onPauseToggle:()=>{if(state==="playing")state="paused";else if(state==="paused")state="playing"},
  onMute:()=>audio.toggle()
});

function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener("resize",resize);resize();
document.querySelector("#start").onclick=()=>start();document.querySelector("#restart").onclick=()=>start();document.querySelector("#victoryRestart").onclick=()=>start();document.querySelector("#fatalRestart")?.addEventListener("click",()=>location.reload());

function freshPlayer(){return{x:W/2,y:H/2,r:11,hp:100,maxHp:100,speed:245,fireRate:.42,fireCd:0,damage:18,shots:1,pierce:0,bulletSpeed:520,bulletSize:4,magnet:110,regen:0,crit:.05,armor:0,dashBoost:0,xpGain:1,orbitals:0,invuln:0,boost:0,level:1,xp:0,nextXp:35,overdrive:0}}
function hidePanels(){ui.menu.classList.add("hidden");ui.levelup.classList.add("hidden");ui.gameover.classList.add("hidden");ui.victory.classList.add("hidden");ui.fatal?.classList.add("hidden")}
function start(){try{try{audio.ensure()}catch(err){console.warn("Audio unavailable",err)}player=freshPlayer();initWeapons(player);enemies=[];bullets=[];enemyBullets=[];gems=[];particles=[];powerups=[];time=0;score=0;spawnTimer=0;nextBoss=60;shake=0;combo=0;comboTimer=0;kills=0;input.stopTouch();hidePanels();state="playing";ui.overlay.classList.remove("show");updateUI();update(1/60);render()}catch(error){showFatal(error)}}
function finish(victory=false){if(state!=="playing")return;state=victory?"victory":"gameover";input.stopTouch();const rounded=Math.floor(score),best=Math.max(rounded,Number(localStorage.getItem("orbital-best")||0));localStorage.setItem("orbital-best",best);ui.best.textContent=best;hidePanels();ui.overlay.classList.add("show");if(victory){ui.victoryScore.textContent=rounded;ui.victory.classList.remove("hidden");audio.level()}else{ui.finalScore.textContent=rounded;ui.gameover.classList.remove("hidden")}}
function showFatal(error){state="fatal";input.stopTouch();console.error(error);if(!ui.fatal)return;hidePanels();ui.fatal.classList.remove("hidden");ui.fatalMessage.textContent=(error?.stack||error?.message||String(error)).slice(0,1800);ui.overlay.classList.add("show")}
function levelUp(){state="levelup";input.stopTouch();audio.level();ui.overlay.classList.add("show");ui.levelup.classList.remove("hidden");ui.choices.innerHTML="";for(const u of randomChoices(player)){const b=document.createElement("button");b.className="choice";b.innerHTML="<b>"+u.name+"</b><small>"+u.desc+"</small>";b.onclick=()=>{u.apply(player);ui.levelup.classList.add("hidden");ui.overlay.classList.remove("show");state="playing";updateUI()};ui.choices.appendChild(b)}}
function nearest(){let best=null,bd=Infinity;for(const e of enemies){const d=dist2(player,e);if(d<bd){bd=d;best=e}}return best}
function shoot(){const t=nearest();if(!t)return;const base=Math.atan2(t.y-player.y,t.x-player.x);for(let i=0;i<player.shots;i++){const spread=(i-(player.shots-1)/2)*.14,a=base+spread;bullets.push({kind:"blaster",x:player.x,y:player.y,vx:Math.cos(a)*player.bulletSpeed,vy:Math.sin(a)*player.bulletSpeed,r:player.bulletSize,life:1.8,pierce:player.pierce,damage:player.damage*(Math.random()<player.crit?2:1)})}audio.shot()}
function hurt(amount){if(player.invuln>0||state!=="playing")return;player.hp-=amount*(1-player.armor);player.invuln=.55;player.boost=.65;shake=8;combo=0;comboTimer=0;audio.hurt();for(let i=0;i<10;i++)particles.push(particle(player.x,player.y,"hurt"));if(player.hp<=0)finish(false)}
function awardKill(e){kills++;combo=comboTimer>0?combo+1:1;comboTimer=2.8;const multiplier=1+Math.min(combo,30)*.03;score+=(e.boss?700:20+e.v)*multiplier;const n=e.boss?16:1;for(let j=0;j<n;j++)gems.push({x:e.x+(Math.random()-.5)*24,y:e.y+(Math.random()-.5)*24,v:e.boss?24:e.v,r:e.boss?5:4});const burst=e.boss?36:e.elite?16:9;for(let j=0;j<burst;j++)particles.push(particle(e.x,e.y,e.boss?"boss":"spark"));const powerChance=e.boss?1:e.elite?.2:.045;if(Math.random()<powerChance){const kinds=["repair","pulse","overdrive"];powerups.push({x:e.x,y:e.y,kind:kinds[Math.floor(Math.random()*kinds.length)],r:9,life:14,phase:Math.random()*6.28})}}
function collectPowerup(p){if(p.kind==="repair")player.hp=Math.min(player.maxHp,player.hp+32);else if(p.kind==="pulse"){enemyBullets=[];for(const e of enemies)e.hp-=Math.max(80,player.damage*4);shake=14;for(let i=0;i<30;i++)particles.push(particle(player.x,player.y,"boss"))}else if(p.kind==="overdrive")player.overdrive=Math.max(player.overdrive,8);audio.level()}

function update(dt){
  if(state!=="playing")return;
  time+=dt;if(time>=RUN_LENGTH){time=RUN_LENGTH;updateUI();finish(true);return}
  score+=dt*10;comboTimer=Math.max(0,comboTimer-dt);if(comboTimer===0)combo=0;
  player.invuln=Math.max(0,player.invuln-dt);player.boost=Math.max(0,player.boost-dt);player.overdrive=Math.max(0,player.overdrive-dt);player.hp=Math.min(player.maxHp,player.hp+player.regen*dt);

  const {dx,dy}=input.movement();
  const sp=player.speed*(player.boost>0?1+player.dashBoost:1);
  player.x=clamp(player.x+dx*sp*dt,20,W-20);player.y=clamp(player.y+dy*sp*dt,78,H-20);

  player.fireCd-=dt;if(player.fireCd<=0){shoot();player.fireCd=player.fireRate*(player.overdrive>0?.55:1)}
  updateWeapons(player,dt,enemies,bullets,particles,time);updateWeaponProjectiles(bullets,enemies,dt);

  const rate=Math.max(.11,.7-time*.00092);spawnTimer-=dt;
  while(spawnTimer<=0){enemies.push(spawnEnemy(W,H,time,false));spawnTimer+=rate}
  if(time>=nextBoss){enemies.push(spawnEnemy(W,H,time,true));nextBoss+=60;audio.boss();shake=12}

  for(const e of enemies){e.flash=Math.max(0,e.flash-dt);e.phase+=dt;e.px=e.x;e.py=e.y;moveEnemy(e,dt,{player,enemyBullets,particles,time,onShake:v=>shake=Math.max(shake,v)});if(dist2(player,e)<(player.r+e.r)**2)hurt(e.d)}
  for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.hit??=new Set();for(const e of enemies){if(e.hp<=0||b.hit.has(e))continue;if(dist2(b,e)<(b.r+e.r)**2){b.hit.add(e);e.hp-=b.damage;e.flash=.06;b.pierce--;audio.hit();for(let i=0;i<(b.kind==="missile"?8:3);i++)particles.push(particle(b.x,b.y,b.kind==="missile"?"boss":"spark"));if(b.pierce<0){b.life=0;break}}}}
  for(const b of enemyBullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(dist2(player,b)<(player.r+b.r)**2){b.life=0;hurt(b.damage)}}
  for(let i=enemies.length-1;i>=0;i--){if(enemies[i].hp<=0){awardKill(enemies[i]);enemies.splice(i,1)}}

  bullets=bullets.filter(b=>b.life>0&&b.x>-50&&b.y>-50&&b.x<W+50&&b.y<H+50);
  enemyBullets=enemyBullets.filter(b=>b.life>0&&b.x>-70&&b.y>-70&&b.x<W+70&&b.y<H+70);

  for(let i=gems.length-1;i>=0;i--){const g=gems[i],d=Math.sqrt(dist2(player,g));if(d<player.magnet){const k=Math.max(.1,1-d/player.magnet),a=Math.atan2(player.y-g.y,player.x-g.x);g.x+=Math.cos(a)*(140+420*k)*dt;g.y+=Math.sin(a)*(140+420*k)*dt}if(d<player.r+8){player.xp+=g.v*player.xpGain;audio.xp();gems.splice(i,1);if(player.xp>=player.nextXp){player.xp-=player.nextXp;player.level++;player.nextXp=Math.floor(player.nextXp*1.28+8);levelUp();break}}}
  for(let i=powerups.length-1;i>=0;i--){const p=powerups[i];p.life-=dt;p.phase+=dt*2;if(dist2(player,p)<(player.r+p.r+8)**2){collectPowerup(p);powerups.splice(i,1)}else if(p.life<=0)powerups.splice(i,1)}
  for(let o=0;o<player.orbitals;o++){const a=time*2.1+o*Math.PI*2/player.orbitals,ox=player.x+Math.cos(a)*42,oy=player.y+Math.sin(a)*42;for(const e of enemies)if(dist2({x:ox,y:oy},e)<(8+e.r)**2)e.hp-=28*dt}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt}
  particles=particles.filter(p=>p.life>0);shake=Math.max(0,shake-30*dt);updateUI();
}

function updateUI(){if(!player)return;ui.hp.textContent=Math.max(0,Math.ceil(player.hp));ui.level.textContent=player.level;ui.time.textContent=String(Math.floor(time/60)).padStart(2,"0")+":"+String(Math.floor(time%60)).padStart(2,"0");ui.score.textContent=Math.floor(score);ui.hpBar.style.width=(player.hp/player.maxHp*100)+"%";ui.xpBar.style.width=(player.xp/player.nextXp*100)+"%";const mult=1+Math.min(combo,30)*.03;ui.combo.textContent="COMBO x"+mult.toFixed(2);ui.combo.classList.toggle("hot",combo>=3);if(ui.arsenal)ui.arsenal.textContent=weaponLabel(player)}
function render(){renderScene(ctx,{dpr,W,H},{time,shake,state,player,enemies,bullets,enemyBullets,gems,particles,powerups})}
function frame(ts){const dt=Math.min(.033,(ts-last)/1000||0);last=ts;try{update(dt);render()}catch(error){showFatal(error)}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
