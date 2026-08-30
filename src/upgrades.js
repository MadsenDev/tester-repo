export const UPGRADES=[
 {id:"firerate",name:"Overclock",desc:"Fire 18% faster.",apply:p=>p.fireRate*=.82},
 {id:"damage",name:"Hot Core",desc:"+35% projectile damage.",apply:p=>p.damage*=1.35},
 {id:"speed",name:"Vector Thrusters",desc:"+16% movement speed.",apply:p=>p.speed*=1.16},
 {id:"multishot",name:"Forked Signal",desc:"+1 projectile per volley.",apply:p=>p.shots=Math.min(7,p.shots+1)},
 {id:"pierce",name:"Phase Rounds",desc:"Projectiles pierce +1 enemy.",apply:p=>p.pierce++},
 {id:"health",name:"Reinforced Hull",desc:"+25 max HP and heal 25.",apply:p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25)}},
 {id:"magnet",name:"Gravity Well",desc:"+35% XP pickup radius.",apply:p=>p.magnet*=1.35},
 {id:"bullet",name:"Rail Accelerators",desc:"+22% projectile speed.",apply:p=>p.bulletSpeed*=1.22},
 {id:"regen",name:"Repair Nanites",desc:"Regenerate 0.4 HP/s.",apply:p=>p.regen+=.4},
 {id:"crit",name:"Lucky Circuit",desc:"+8% critical hit chance.",apply:p=>p.crit=Math.min(.55,p.crit+.08)},
 {id:"size",name:"Heavy Payload",desc:"+20% projectile size.",apply:p=>p.bulletSize*=1.2},
 {id:"armor",name:"Reactive Plating",desc:"Take 10% less damage.",apply:p=>p.armor=Math.min(.6,p.armor+.1)},
 {id:"dash",name:"Slipstream",desc:"Brief speed burst after taking damage.",apply:p=>p.dashBoost+=.18},
 {id:"xp",name:"Signal Harvest",desc:"+20% XP gained.",apply:p=>p.xpGain*=1.2},
 {id:"orbit",name:"Guardian Orbit",desc:"+1 damaging orbital drone.",apply:p=>p.orbitals=Math.min(5,p.orbitals+1)}
];
export function randomChoices(n=3){return [...UPGRADES].sort(()=>Math.random()-.5).slice(0,n)}
