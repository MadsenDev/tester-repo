export const MODES=[
  {id:"campaign",name:"CAMPAIGN",desc:"Cross five sectors and survive ten minutes.",unlock:"Available",minWins:0},
  {id:"endless",name:"ENDLESS",desc:"No finish line. Pressure keeps climbing until you break.",unlock:"Win once",minWins:1},
  {id:"bossrush",name:"BOSS RUSH",desc:"No swarm. Chain bosses with short recovery windows.",unlock:"Win twice",minWins:2}
];
export function unlockedModes(stats){return MODES.filter(m=>(stats.wins||0)>=m.minWins)}
export function modeById(id){return MODES.find(m=>m.id===id)||MODES[0]}
export function objectiveFor(id){return id==="campaign"?"SURVIVE TO 10:00":id==="endless"?"SURVIVE AS LONG AS POSSIBLE":"DEFEAT THE NEXT BOSS"}
export function runLimit(id){return id==="campaign"?600:Infinity}
export function allowsRegularEnemies(id){return id!=="bossrush"}
export function bossInterval(id){return id==="bossrush"?12:60}
export function preparePlayerForMode(player,id){if(id!=="bossrush")return player;player.maxHp+=35;player.hp=player.maxHp;player.damage*=1.22;player.fireRate*=.82;player.magnet*=1.4;player.weapons.missile=1;player.weapons.arc=1;return player}
export function spawnPressure(id,time){if(id==="endless")return 1+Math.max(0,time-600)/420;if(id==="bossrush")return 0;return 1}
