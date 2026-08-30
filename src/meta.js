import {awardCore} from "./core.js";
const SETTINGS_KEY="orbital-settings-v1";
const STATS_KEY="orbital-stats-v1";
const DEV_KEY="orbital-dev-godmode";
const DEFAULT_SETTINGS={difficulty:"normal",shake:true,sound:true,ship:"strider",mode:"campaign"};
const DEFAULT_STATS={runs:0,wins:0,kills:0,best:0};
export function loadSettings(){try{return{...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}}catch{return{...DEFAULT_SETTINGS}}}
export function saveSettings(settings){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}
export function loadStats(){try{return{...DEFAULT_STATS,...JSON.parse(localStorage.getItem(STATS_KEY)||"{}")}}catch{return{...DEFAULT_STATS}}}
export function isDevMode(){return localStorage.getItem(DEV_KEY)==="1"}
export function recordRun({won,kills,score}){const stats=loadStats();if(isDevMode())return stats;stats.runs++;if(won)stats.wins++;stats.kills+=kills;stats.best=Math.max(stats.best,Math.floor(score));localStorage.setItem(STATS_KEY,JSON.stringify(stats));const runShards=1+Math.min(3,Math.floor(kills/175));awardCore({bosses:runShards-1,victory:won});return stats}
export function resetStats(){localStorage.setItem(STATS_KEY,JSON.stringify(DEFAULT_STATS));return{...DEFAULT_STATS}}
export function difficultyConfig(id){if(isDevMode())return{spawn:1,damage:0,score:1};return id==="chill"?{spawn:.92,damage:.9,score:.9}:id==="intense"?{spawn:1.38,damage:1.35,score:1.45}:{spawn:1.12,damage:1.08,score:1.08}}
