const mark=(p,id)=>{p.passives??={};p.passives[id]=(p.passives[id]||0)+1};
const evolve=(p,id)=>{p.weaponEvolved??={};p.weaponEvolved[id]=true};
const levelWeapon=(p,id)=>{p.weapons[id]=Math.min(5,(p.weapons[id]||0)+1)};
const evolved=(p,id)=>!!p.weaponEvolved?.[id];
const ready=(p,weapon,passive)=>p.weapons?.[weapon]>=5&&(p.passives?.[passive]||0)>=2&&!evolved(p,weapon);
const recipes={
 missile:{evolution:"SUNFALL ARRAY",passive:"Heavy Payload II"},
 arc:{evolution:"STORM CROWN",passive:"Lucky Circuit II"},
 nova:{evolution:"SUPERNOVA HEART",passive:"Reinforced Hull II"},
 mines:{evolution:"VOID ANCHORS",passive:"Gravity Well II"},
 beam:{evolution:"PRISM JUDGEMENT",passive:"Rail Accelerators II"}
};
const weaponDesc=(p,id,name)=>{const level=p.weapons?.[id]||0,r=recipes[id],base=level>0?`${name} to level ${Math.min(5,level+1)}.`:`Unlock ${name}.`;return`${base} Evolution: ${r.evolution} with ${r.passive}.`};
const passiveDesc=(base,evolution,weapon)=>`${base} Synergy: ${weapon} V + this II evolves into ${evolution}.`;

export const UPGRADES=[
 {id:"firerate",name:"Overclock",desc:"Fire 18% faster.",apply:p=>{p.fireRate*=.82;mark(p,"firerate")}},
 {id:"damage",name:"Hot Core",desc:"+35% blaster damage.",apply:p=>{p.damage*=1.35;mark(p,"damage")}},
 {id:"speed",name:"Vector Thrusters",desc:"+16% movement speed.",apply:p=>{p.speed*=1.16;mark(p,"speed")}},
 {id:"multishot",name:"Forked Signal",desc:"+1 blaster projectile per volley.",apply:p=>{p.shots=Math.min(7,p.shots+1);mark(p,"multishot")}},
 {id:"pierce",name:"Phase Rounds",desc:"Blaster projectiles pierce +1 enemy.",apply:p=>{p.pierce++;mark(p,"pierce")}},
 {id:"health",name:"Reinforced Hull",desc:passiveDesc("+25 max HP and heal 25.","SUPERNOVA HEART","Nova Core"),apply:p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25);mark(p,"health")}},
 {id:"magnet",name:"Gravity Well",desc:passiveDesc("+35% XP pickup radius.","VOID ANCHORS","Grav Mines"),apply:p=>{p.magnet*=1.35;mark(p,"magnet")}},
 {id:"bullet",name:"Rail Accelerators",desc:passiveDesc("+22% blaster projectile speed.","PRISM JUDGEMENT","Prism Lance"),apply:p=>{p.bulletSpeed*=1.22;mark(p,"bullet")}},
 {id:"regen",name:"Repair Nanites",desc:"Regenerate 0.4 HP/s.",apply:p=>{p.regen+=.4;mark(p,"regen")}},
 {id:"crit",name:"Lucky Circuit",desc:passiveDesc("+8% blaster critical hit chance.","STORM CROWN","Arc Conductor"),apply:p=>{p.crit=Math.min(.55,p.crit+.08);mark(p,"crit")}},
 {id:"size",name:"Heavy Payload",desc:passiveDesc("+20% blaster projectile size.","SUNFALL ARRAY","Seeker Rack"),apply:p=>{p.bulletSize*=1.2;mark(p,"size")}},
 {id:"armor",name:"Reactive Plating",desc:"Take 10% less damage.",apply:p=>{p.armor=Math.min(.6,p.armor+.1);mark(p,"armor")}},
 {id:"dash",name:"Slipstream",desc:"Brief speed burst after taking damage.",apply:p=>{p.dashBoost+=.18;mark(p,"dash")}},
 {id:"xp",name:"Signal Harvest",desc:"+20% XP gained.",apply:p=>{p.xpGain*=1.2;mark(p,"xp")}},
 {id:"orbit",name:"Guardian Orbit",desc:"+1 damaging orbital drone.",apply:p=>{p.orbitals=Math.min(5,p.orbitals+1);mark(p,"orbit")},available:p=>p.orbitals<5},
 {id:"missile",name:"Seeker Rack",descFor:p=>weaponDesc(p,"missile","homing missiles"),apply:p=>levelWeapon(p,"missile"),available:p=>(p.weapons?.missile||0)<5},
 {id:"arc",name:"Arc Conductor",descFor:p=>weaponDesc(p,"arc","chain lightning"),apply:p=>levelWeapon(p,"arc"),available:p=>(p.weapons?.arc||0)<5},
 {id:"nova",name:"Nova Core",descFor:p=>weaponDesc(p,"nova","radial shockwave"),apply:p=>levelWeapon(p,"nova"),available:p=>(p.weapons?.nova||0)<5},
 {id:"mines",name:"Grav Mines",descFor:p=>weaponDesc(p,"mines","proximity mines"),apply:p=>levelWeapon(p,"mines"),available:p=>(p.weapons?.mines||0)<5},
 {id:"beam",name:"Prism Lance",descFor:p=>weaponDesc(p,"beam","piercing beam"),apply:p=>levelWeapon(p,"beam"),available:p=>(p.weapons?.beam||0)<5},
 {id:"evo-missile",name:"SUNFALL ARRAY",desc:"EVOLUTION · Seeker Rack V + Heavy Payload II. Launch a three-missile hunting salvo.",apply:p=>evolve(p,"missile"),available:p=>ready(p,"missile","size")},
 {id:"evo-arc",name:"STORM CROWN",desc:"EVOLUTION · Arc Conductor V + Lucky Circuit II. Longer, harder chain lightning with extra jumps.",apply:p=>evolve(p,"arc"),available:p=>ready(p,"arc","crit")},
 {id:"evo-nova",name:"SUPERNOVA HEART",desc:"EVOLUTION · Nova Core V + Reinforced Hull II. Detonates two concentric shockwaves.",apply:p=>evolve(p,"nova"),available:p=>ready(p,"nova","health")},
 {id:"evo-mines",name:"VOID ANCHORS",desc:"EVOLUTION · Grav Mines V + Gravity Well II. Larger, longer-lived mines with brutal impact power.",apply:p=>evolve(p,"mines"),available:p=>ready(p,"mines","magnet")},
 {id:"evo-beam",name:"PRISM JUDGEMENT",desc:"EVOLUTION · Prism Lance V + Rail Accelerators II. Fires a triple beam fan through the entire formation.",apply:p=>evolve(p,"beam"),available:p=>ready(p,"beam","bullet")}
];

export function randomChoices(player,n=3){
 const evolutions=UPGRADES.filter(u=>u.id.startsWith("evo-")&&(!u.available||u.available(player)));
 const normal=UPGRADES.filter(u=>!u.id.startsWith("evo-")&&(!u.available||u.available(player)));
 const pool=evolutions.length?[...evolutions,...normal.sort(()=>Math.random()-.5)]:normal.sort(()=>Math.random()-.5);
 return pool.slice(0,n).map(u=>({...u,desc:u.descFor?u.descFor(player):u.desc}));
}
