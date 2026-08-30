const overlay=document.querySelector("#overlay");
const liveButton=document.querySelector("#returnToMenu");
const gameoverButton=document.querySelector("#gameoverMenu");
const victoryButton=document.querySelector("#victoryMenu");

function atCommandDeck(){return overlay?.classList.contains("show")&&!document.body.classList.contains("gameplay-modal")}
function goHome(confirmAbandon=false){
  if(confirmAbandon&&!confirm("Abandon this run and return to the command deck?"))return;
  location.reload();
}

liveButton?.addEventListener("click",()=>goHome(!atCommandDeck()));
gameoverButton?.addEventListener("click",()=>goHome(false));
victoryButton?.addEventListener("click",()=>goHome(false));

function sync(){if(liveButton)liveButton.hidden=atCommandDeck()||document.body.classList.contains("gameplay-modal")}
const observer=new MutationObserver(sync);
observer.observe(document.body,{attributes:true,attributeFilter:["class"]});
if(overlay)observer.observe(overlay,{attributes:true,attributeFilter:["class"]});
sync();
