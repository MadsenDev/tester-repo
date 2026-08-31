const mark=(p,id)=>{p.passives??={};p.passives[id]=(p.passives[id]||0)+1};
const rank=(p,id)=>p.passives?.[id]||0;
const capped=(id,max=5)=>p=>rank(p,id)<max;
const trait=(id,name,desc,apply,{rarity="COMMON",max=5,requires=null}={})=>({id,name,desc,rarity,apply:p=>{apply(p);mark(p,id)},available:p=>rank(p,id)<max&&(!requires||requires(p))});
const has=(p,...ids)=>ids.every(id=>rank(p,id)>0);
const transform=(id,name,desc,requires,apply)=>({id,name,desc,rarity:"TRANSFORM",transform:true,apply:p=>{apply(p);mark(p,id)},available:p=>rank(p,id)===0&&requires(p)});

export const UPGRADES=[
 trait("firerate","Overclock","Fire 16% faster.",p=>p.fireRate*=.84),
 trait("damage","Hot Core","+28% blaster damage.",p=>p.damage*=1.28),
 trait("speed","Vector Thrusters","+15% movement speed.",p=>p.speed*=1.15,{max:4}),
 trait("multishot","Forked Signal","Add another blaster round to each volley. Enables FORK interactions.",p=>p.shots=Math.min(7,p.shots+1),{rarity:"UNCOMMON",max:6}),
 trait("pierce","Phase Rounds","Rounds pierce +1 target. Enables PIERCE interactions.",p=>p.pierce++,{rarity:"UNCOMMON",max:5}),
 trait("size","Heavy Payload","+18% projectile size and +8% damage. Enables PAYLOAD interactions.",p=>{p.bulletSize*=1.18;p.damage*=1.08},{rarity:"UNCOMMON",max:4}),
 trait("bullet","Rail Accelerators","+24% projectile velocity. Enables VELOCITY interactions.",p=>p.bulletSpeed*=1.24,{max:4}),
 trait("crit","Lucky Circuit","+8% critical chance. Enables CRIT interactions.",p=>p.crit=Math.min(.6,p.crit+.08),{rarity:"UNCOMMON",max:5}),
 trait("missile","Guidance Kernel","Blaster rounds steer toward visible targets. Enables SEEK interactions.",()=>{}, {rarity:"RARE",max:1}),
 trait("arc","Arc Imprint","Blaster impacts discharge chain lightning. Enables ARC interactions.",()=>{}, {rarity:"RARE",max:1}),
 trait("nova","Nova Imprint","Blaster impacts emit damaging shockwaves. Enables NOVA interactions.",()=>{}, {rarity:"RARE",max:1}),
 trait("mines","Gravity Anchor","Heavy phase builds can leave delayed gravity detonations. Enables ANCHOR interactions.",()=>{}, {rarity:"RARE",max:1}),
 trait("beam","Prism Imprint","Blaster impacts project short damaging energy lanes. Enables PRISM interactions.",()=>{}, {rarity:"RARE",max:1}),
 trait("health","Reinforced Hull","+25 max HP and heal 25.",p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25)},{max:4}),
 trait("magnet","Gravity Well","+32% XP pickup radius.",p=>p.magnet*=1.32,{max:4}),
 trait("regen","Repair Nanites","Regenerate 0.4 HP/s.",p=>p.regen+=.4,{max:4}),
 trait("armor","Reactive Plating","Take 9% less damage.",p=>p.armor=Math.min(.55,p.armor+.09),{max:5}),
 trait("dash","Slipstream","Taking damage grants a stronger escape burst.",p=>p.dashBoost+=.18,{max:4}),
 trait("xp","Signal Harvest","+18% XP gained.",p=>p.xpGain*=1.18,{max:4}),
 trait("orbit","Guardian Orbit","Add a defensive orbital drone.",p=>p.orbitals=Math.min(5,p.orbitals+1),{rarity:"UNCOMMON",max:5}),
 trait("glass","Glass Reactor","+42% damage, but lose 12 max HP.",p=>{p.damage*=1.42;p.maxHp=Math.max(35,p.maxHp-12);p.hp=Math.min(p.hp,p.maxHp)},{rarity:"RARE",max:3}),
 trait("cadence","Pulse Loader","Every blaster volley gets faster at the cost of 8% projectile damage.",p=>{p.fireRate*=.76;p.damage*=.92},{rarity:"RARE",max:3}),
 trait("stability","Gyro Stabilizer","+14% damage and +12% projectile speed.",p=>{p.damage*=1.14;p.bulletSpeed*=1.12},{max:4}),
 transform("transform-storm","STORM PROTOCOL","TRANSFORMATION · FORK + SEEK + ARC. Guided volleys become a branching electrical storm.",p=>has(p,"multishot","missile","arc"),p=>{p.shots=Math.min(7,p.shots+1);p.crit=Math.min(.6,p.crit+.06)}),
 transform("transform-recursive","RECURSIVE VIOLENCE","TRANSFORMATION · FORK + PIERCE + SEEK + ARC. Lethal rounds reproduce into inherited guided children.",p=>has(p,"multishot","pierce","missile","arc"),p=>{p.pierce++;p.damage*=1.12}),
 transform("transform-horizon","EVENT HORIZON","TRANSFORMATION · PAYLOAD + NOVA + ANCHOR + PIERCE. Final impacts seed delayed gravity detonations.",p=>has(p,"size","nova","mines","pierce"),p=>{p.bulletSize*=1.15;p.damage*=1.12}),
 transform("transform-critical-mass","CRITICAL MASS","TRANSFORMATION · PAYLOAD + CRIT + NOVA. Critical shockwaves fragment into inherited child rounds.",p=>has(p,"size","crit","nova"),p=>p.crit=Math.min(.65,p.crit+.08)),
 transform("transform-rail-prism","RAIL PRISM","TRANSFORMATION · VELOCITY + PIERCE + PRISM. High-speed piercing hits carve extended energy lanes.",p=>has(p,"bullet","pierce","beam"),p=>p.bulletSpeed*=1.18)
];

const weight=u=>u.rarity==="COMMON"?7:u.rarity==="UNCOMMON"?5:u.rarity==="RARE"?2:1;
const weightedShuffle=pool=>pool.map(u=>({u,k:Math.random()**(1/weight(u))})).sort((a,b)=>b.k-a.k).map(x=>x.u);
export function randomChoices(player,n=3){
 const available=UPGRADES.filter(u=>!u.available||u.available(player));
 const transforms=available.filter(u=>u.transform);
 const normal=available.filter(u=>!u.transform);
 const chosen=[];
 if(transforms.length)chosen.push(transforms[Math.floor(Math.random()*transforms.length)]);
 for(const u of weightedShuffle(normal))if(chosen.length<n&&!chosen.some(c=>c.id===u.id))chosen.push(u);
 return chosen.slice(0,n).map(u=>({...u,desc:`${u.rarity} · ${u.desc}`}));
}
