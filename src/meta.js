const SETTINGS_KEY="orbital-settings-v1";
const STATS_KEY="orbital-stats-v1";
const DEFAULT_SETTINGS={difficulty:"normal",shake:true,sound:true,ship:"strider",mode:"campaign"};
const DEFAULT_STATS={runs:0,wins:0,kills:0,best:0};
export function loadSettings(){try{return{...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}}catch{return{...DEFAULT_SETTINGS}}}
export function saveSettings(settings){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}
export function loadStats(){try{return{...DEFAULT_STATS,...JSON.parse(localStorage.getItem(STATS_KEY)||"{}")}}catch{return{...DEFAULT_STATS}}}
export function recordRun({won,kills,score}){const stats=loadStats();stats.runs++;if(won)stats.wins++;stats.kills+=kills;stats.best=Math.max(stats.best,Math.floor(score));localStorage.setItem(STATS_KEY,JSON.stringify(stats));return stats}
export function resetStats(){localStorage.setItem(STATS_KEY,JSON.stringify(DEFAULT_STATS));return{...DEFAULT_STATS}}
export function difficultyConfig(id){return id==="chill"?{spawn:.84,damage:.82,score:.85}:id==="intense"?{spawn:1.22,damage:1.25,score:1.35}:{spawn:1,damage:1,score:1}}
