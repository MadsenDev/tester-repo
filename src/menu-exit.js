const overlay=document.querySelector("#overlay");
const liveButton=document.querySelector("#returnToMenu");
const gameoverButton=document.querySelector("#gameoverMenu");
const victoryButton=document.querySelector("#victoryMenu");

function inGameplayModal(){return overlay?.classList.contains("gameplay-modal")}
function atCommandDeck(){return overlay?.classList.contains("show")&&!inGameplayModal()}
function goHome(){location.reload()}

liveButton?.addEventListener("click",event=>{
  event.preventDefault();event.stopPropagation();
  window.dispatchEvent(new CustomEvent("orbital:pause-request"));
});
gameoverButton?.addEventListener("click",goHome);
victoryButton?.addEventListener("click",goHome);

function sync(){if(liveButton)liveButton.hidden=atCommandDeck()||inGameplayModal()}
const observer=new MutationObserver(sync);
if(overlay)observer.observe(overlay,{attributes:true,attributeFilter:["class"]});
sync();
