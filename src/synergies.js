const active=(p,id)=>(p.passives?.[id]||0)>0||(p.weapons?.[id]||0)>0;
export function blasterTraits(player){
 const fork=active(player,"multishot"),pierce=active(player,"pierce"),payload=active(player,"size"),crit=active(player,"crit"),velocity=active(player,"bullet"),seek=active(player,"missile"),arc=active(player,"arc"),nova=active(player,"nova"),anchor=active(player,"mines"),prism=active(player,"beam");
 return{fork,pierce,payload,crit,velocity,seek,arc,nova,anchor,prism,
  forkedGuidance:fork&&seek,criticalConduction:crit&&arc,massDriver:payload&&velocity,phaseDischarge:pierce&&nova,prismaticPhase:pierce&&prism,
  seekingStorm:fork&&seek&&arc,criticalMass:payload&&crit&&nova,railPrism:velocity&&pierce&&prism,
  recursiveViolence:fork&&pierce&&seek&&arc,eventHorizon:payload&&nova&&anchor&&pierce};
}
export function decorateBlaster(bullet,player,index=0){
 const traits=blasterTraits(player);bullet.traits=traits;bullet.generation=0;bullet.seek=traits.seek;bullet.turn=traits.recursiveViolence?7.5:traits.forkedGuidance?6:4.2;bullet.arc=traits.arc;bullet.nova=traits.nova;bullet.prism=traits.prism;bullet.anchor=traits.anchor;bullet.critHit=bullet.damage>player.damage*1.5;
 if(traits.massDriver){bullet.damage*=1.22;bullet.knockback=28}
 if(traits.criticalConduction&&bullet.critHit)bullet.arcPower=1.65;
 if(traits.phaseDischarge)bullet.phaseCharge=0;
 if(traits.criticalMass&&bullet.critHit)bullet.novaPower=1.55;
 if(traits.railPrism)bullet.prismPower=1.4;
 if(traits.recursiveViolence){bullet.retarget=true;bullet.inherit=true}
 if(traits.eventHorizon)bullet.eventHorizon=true;
 return bullet
}
const nearest=(b,enemies,exclude=new Set())=>{let best=null,bd=Infinity;for(const e of enemies){if(e.hp<=0||e.targetable===false||exclude.has(e)||b.hit?.has(e))continue;const dx=e.x-b.x,dy=e.y-b.y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e}}return best};
function chainArc(b,first,enemies,fx){const used=new Set([first]);let origin=first;const count=b.traits?.seekingStorm?4:2,damage=b.damage*.28*(b.arcPower||1);const points=[{x:b.x,y:b.y},{x:first.x,y:first.y}];for(let i=0;i<count;i++){const t=nearest(origin,enemies,used);if(!t||Math.hypot(t.x-origin.x,t.y-origin.y)>180)break;used.add(t);t.hp-=damage;t.flash=.08;points.push({x:t.x,y:t.y});origin=t}if(points.length>2)fx.push({kind:"arc",points,life:.13,max:.13,synergy:true})}
function novaImpact(b,e,enemies,fx){const power=b.novaPower||1,radius=(b.eventHorizon?92:58)*power,damage=b.damage*.32*power;for(const t of enemies){if(t===e||t.hp<=0||t.targetable===false)continue;const d=Math.hypot(t.x-e.x,t.y-e.y);if(d<radius){t.hp-=damage*(1-d/radius*.55);t.flash=.07}}fx.push({kind:"nova",x:e.x,y:e.y,radius,life:.2,max:.2,synergy:true})}
function prismImpact(b,e,enemies,fx){const speed=Math.hypot(b.vx,b.vy)||1,dx=b.vx/speed,dy=b.vy/speed,range=130*(b.prismPower||1),width=5*(b.prismPower||1),end={x:e.x+dx*range,y:e.y+dy*range};for(const t of enemies){if(t===e||t.hp<=0||t.targetable===false)continue;const vx=end.x-e.x,vy=end.y-e.y,wx=t.x-e.x,wy=t.y-e.y,c2=vx*vx+vy*vy,q=c2?Math.max(0,Math.min(1,(vx*wx+vy*wy)/c2)):0;if(Math.hypot(t.x-(e.x+q*vx),t.y-(e.y+q*vy))<t.r+width)t.hp-=b.damage*.24*(b.prismPower||1)}fx.push({kind:"beam",a:{x:e.x,y:e.y},b:end,width,life:.11,max:.11,synergy:true})}
export function updateSynergyProjectile(b,enemies,dt){if(b.kind!=="blaster"||!b.seek)return;const t=nearest(b,enemies);if(!t)return;const speed=Math.max(1,Math.hypot(b.vx,b.vy)),current=Math.atan2(b.vy,b.vx),desired=Math.atan2(t.y-b.y,t.x-b.x),delta=((desired-current+Math.PI*3)%(Math.PI*2))-Math.PI,next=current+Math.max(-b.turn*dt,Math.min(b.turn*dt,delta));b.vx=Math.cos(next)*speed;b.vy=Math.sin(next)*speed}
export function onSynergyHit(b,e,{enemies,weaponFx}){if(b.kind!=="blaster"||!b.traits)return;if(b.arc)chainArc(b,e,enemies,weaponFx);if(b.nova)novaImpact(b,e,enemies,weaponFx);if(b.prism)prismImpact(b,e,enemies,weaponFx);if(b.phaseCharge!=null){b.phaseCharge++;b.damage*=1.035}if(b.knockback){const d=Math.max(1,Math.hypot(e.x-b.x,e.y-b.y));e.x+=((e.x-b.x)/d)*b.knockback;e.y+=((e.y-b.y)/d)*b.knockback}if(b.eventHorizon&&b.pierce<0){weaponFx.push({kind:"nova",x:e.x,y:e.y,radius:125,life:.32,max:.32,synergy:true})}}
export function synergyLabel(player){const t=blasterTraits(player),names=[];if(t.recursiveViolence)names.push("RECURSIVE VIOLENCE");else if(t.seekingStorm)names.push("SEEKING STORM");else{if(t.forkedGuidance)names.push("FORKED GUIDANCE");if(t.criticalConduction)names.push("CRITICAL CONDUCTION")}if(t.eventHorizon)names.push("EVENT HORIZON");if(t.criticalMass)names.push("CRITICAL MASS");if(t.railPrism)names.push("RAIL PRISM");return names.join(" · ")}
