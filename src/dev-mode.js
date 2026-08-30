const DEV_KEY="orbital-dev-godmode";
const BEST_KEY="orbital-best";
const nativeSetItem=Storage.prototype.setItem;

function active(){return localStorage.getItem(DEV_KEY)==="1"}

Storage.prototype.setItem=function(key,value){
  if(this===localStorage&&key===BEST_KEY&&active())return;
  return nativeSetItem.call(this,key,value);
};

const badge=document.createElement("div");
badge.id="devGodModeBadge";
badge.textContent="DEV // GODMODE // RECORDS OFF";
Object.assign(badge.style,{position:"fixed",left:"50%",bottom:"max(16px, env(safe-area-inset-bottom))",transform:"translateX(-50%)",zIndex:"9999",padding:"7px 10px",border:"1px solid rgba(255,224,106,.65)",borderRadius:"999px",background:"rgba(20,15,4,.86)",color:"#ffe06a",font:"800 10px system-ui",letterSpacing:".12em",pointerEvents:"none",boxShadow:"0 0 18px rgba(255,224,106,.2)",display:"none",whiteSpace:"nowrap"});
document.body.appendChild(badge);

function refresh(){badge.style.display=active()?"block":"none"}
function toggle(){nativeSetItem.call(localStorage,DEV_KEY,active()?"0":"1");refresh();if(navigator.vibrate)navigator.vibrate(active()?[35,35,70]:35)}
refresh();

let taps=[];
addEventListener("click",event=>{
  const trigger=event.target.closest("#menu .eyebrow");
  if(!trigger)return;
  const now=performance.now();
  taps=taps.filter(t=>now-t<3000);taps.push(now);
  if(taps.length>=7){taps=[];toggle()}
});

let code="";
addEventListener("keydown",event=>{
  if(event.key.length!==1)return;
  code=(code+event.key.toLowerCase()).slice(-5);
  if(code==="iddqd"){code="";toggle()}
});
