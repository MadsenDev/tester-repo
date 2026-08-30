const EVOLUTIONS=new Set(["SUNFALL ARRAY","STORM CROWN","SUPERNOVA HEART","VOID ANCHORS","PRISM JUDGEMENT"]);
const choices=document.querySelector("#choices");
function tagChoices(){
  for(const button of choices?.querySelectorAll(".choice")||[]){
    const name=button.querySelector("b")?.textContent?.trim();
    button.classList.toggle("evolution-choice",EVOLUTIONS.has(name));
  }
}
if(choices)new MutationObserver(tagChoices).observe(choices,{childList:true,subtree:true});
tagChoices();
