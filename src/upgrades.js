const levelWeapon=(p,id)=>{p.weapons[id]=Math.min(5,(p.weapons[id]||0)+1)};
const weaponDesc=(p,id,name)=>p.weapons?.[id]>0?`${name} to level ${Math.min(5,p.weapons[id]+1)}.`:`Unlock ${name}.`;

export const UPGRADES=[
 {id:"firerate",name:"Overclock",desc:"Fire 18% faster.",apply:p=>p.fireRate*=.82},
 {id:"damage",name:"Hot Core",desc:"+35% blaster damage.",apply:p=>p.damage*=1.35},
 {id:"speed",name:"Vector Thrusters",desc:"+16% movement speed.",apply:p=>p.speed*=1.16},
 {id:"multishot",name:"Forked Signal",desc:"+1 blaster projectile per volley.",apply:p=>p.shots=Math.min(7,p.shots+1)},
 {id:"pierce",name:"Phase Rounds",desc:"Blaster projectiles pierce +1 enemy.",apply:p=>p.pierce++},
 {id:"health",name:"Reinforced Hull",desc:"+25 max HP and heal 25.",apply:p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25)}},
 {id:"magnet",name:"Gravity Well",desc:"+35% XP pickup radius.",apply:p=>p.magnet*=1.35},
 {id:"bullet",name:"Rail Accelerators",desc:"+22% blaster projectile speed.",apply:p=>p.bulletSpeed*=1.22},
 {id:"regen",name:"Repair Nanites",desc:"Regenerate 0.4 HP/s.",apply:p=>p.regen+=.4},
 {id:"crit",name:"Lucky Circuit",desc:"+8% blaster critical hit chance.",apply:p=>p.crit=Math.min(.55,p.crit+.08)},
 {id:"size",name:"Heavy Payload",desc:"+20% blaster projectile size.",apply:p=>p.bulletSize*=1.2},
 {id:"armor",name:"Reactive Plating",desc:"Take 10% less damage.",apply:p=>p.armor=Math.min(.6,p.armor+.1)},
 {id:"dash",name:"Slipstream",desc:"Brief speed burst after taking damage.",apply:p=>p.dashBoost+=.18},
 {id:"xp",name:"Signal Harvest",desc:"+20% XP gained.",apply:p=>p.xpGain*=1.2},
 {id:"orbit",name:"Guardian Orbit",desc:"+1 damaging orbital drone.",apply:p=>p.orbitals=Math.min(5,p.orbitals+1),available:p=>p.orbitals<5},
 {id:"missile",name:"Seeker Rack",descFor:p=>weaponDesc(p,"missile","homing missiles"),apply:p=>levelWeapon(p,"missile"),available:p=>(p.weapons?.missile||0)<5},
 {id:"arc",name:"Arc Conductor",descFor:p=>weaponDesc(p,"arc","chain lightning"),apply:p=>levelWeapon(p,"arc"),available:p=>(p.weapons?.arc||0)<5},
 {id:"nova",name:"Nova Core",descFor:p=>weaponDesc(p,"nova","radial shockwave"),apply:p=>levelWeapon(p,"nova"),available:p=>(p.weapons?.nova||0)<5},
 {id:"mines",name:"Grav Mines",descFor:p=>weaponDesc(p,"mines","proximity mines"),apply:p=>levelWeapon(p,"mines"),available:p=>(p.weapons?.mines||0)<5},
 {id:"beam",name:"Prism Lance",descFor:p=>weaponDesc(p,"beam","piercing beam"),apply:p=>levelWeapon(p,"beam"),available:p=>(p.weapons?.beam||0)<5}
];

export function randomChoices(player,n=3){
 const pool=UPGRADES.filter(u=>!u.available||u.available(player));
 return pool.sort(()=>Math.random()-.5).slice(0,n).map(u=>({...u,desc:u.descFor?u.descFor(player):u.desc}));
}
