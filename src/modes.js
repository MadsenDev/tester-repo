export const MODES=[
  {id:"campaign",name:"CAMPAIGN",desc:"Cross five sectors and survive ten minutes.",unlock:"Available",minWins:0},
  {id:"endless",name:"ENDLESS",desc:"No finish line. Pressure keeps climbing until you break.",unlock:"Win once",minWins:1},
  {id:"bossrush",name:"BOSS RUSH",desc:"No swarm. Chain bosses with short recovery windows.",unlock:"Win twice",minWins:2}
];
const PLAYGROUND={id:"playground",name:"PLAYGROUND",desc:"Disposable build laboratory. No progression, no finish line.",unlock:"Workbench",minWins:0};
const labLaunch=()=>{try{return sessionStorage.getItem("orbital-playground-launch")==="1"}catch{return false}};
export function unlockedModes(stats){const modes=MODES.filter(m=>(stats.wins||0)>=m.minWins);return labLaunch()?[...modes,PLAYGROUND]:modes}
export function modeById(id){return id==="playground"?PLAYGROUND:MODES.find(m=>m.id===id)||MODES[0]}
export function objectiveFor(id){return id==="campaign"?"SURVIVE TO 10:00":id==="endless"?"SURVIVE AS LONG AS POSSIBLE":id==="playground"?"TEST BUILD // NO RECORDS":"DEFEAT THE NEXT BOSS"}
export function runLimit(id){return id==="campaign"?600:Infinity}
export function allowsRegularEnemies(id){return id!=="bossrush"}
export function bossInterval(id){return id==="bossrush"?12:id==="playground"?Infinity:60}
function playgroundBuild(){try{return JSON.parse(localStorage.getItem("orbital-playground-build-v1")||"{}")||{}}catch{return{}}}
function applyPlaygroundBuild(player){
  const b=playgroundBuild();player.maxHp=1000;player.hp=1000;player.regen=Math.max(player.regen,80);player.armor=Math.max(player.armor,.75);player.magnet*=1.6;
  if(b.multishot)player.shots=Math.max(player.shots,3);if(b.pierce)player.pierce=Math.max(player.pierce,3);if(b.size)player.bulletSize*=1.65;if(b.crit)player.crit=Math.max(player.crit,.4);if(b.bullet)player.bulletSpeed*=1.5;
  for(const id of ["missile","arc","nova","mines","beam"])if(b[id])player.weapons[id]=5;player.playgroundBuild={...b};return player
}
export function preparePlayerForMode(player,id){if(id==="playground")return applyPlaygroundBuild(player);if(id!=="bossrush")return player;player.maxHp+=35;player.hp=player.maxHp;player.damage*=1.22;player.fireRate*=.82;player.magnet*=1.4;player.weapons.missile=1;player.weapons.arc=1;return player}
function activeBossArena(){const a=globalThis.__orbitalBossArena;return a&&performance.now()-a.at<140?a:null}
export function spawnPressure(id,time){if(id==="bossrush")return 0;if(id==="playground")return .48;const arena=activeBossArena();if(arena?.suppressRegulars){const ratio=arena.hpRatio??1;if(ratio>.35)return .05;if(ratio>.12)return .16;return .45}if(arena?.summoner)return arena.burst?2.15:.055;if(id==="endless")return 1+Math.max(0,time-600)/420;return 1}
