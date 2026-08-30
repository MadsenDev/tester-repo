const EVOLUTIONS=new Set(["SUNFALL ARRAY","STORM CROWN","SUPERNOVA HEART","VOID ANCHORS","PRISM JUDGEMENT"]);
const choices=document.querySelector("#choices");

function splitDetail(button){
  const small=button.querySelector("small");
  if(!small||small.dataset.structured==="1")return;
  const text=small.textContent.trim();
  const marker=text.includes(" Synergy: ")?" Synergy: ":text.includes(" Evolution: ")?" Evolution: ":null;
  if(!marker)return;
  const [primary,...rest]=text.split(marker);
  if(!rest.length)return;
  small.textContent="";
  const main=document.createElement("span");
  main.className="upgrade-description";
  main.textContent=primary;
  const detail=document.createElement("em");
  detail.className="upgrade-synergy";
  detail.textContent=`${marker.trim()} ${rest.join(marker)}`;
  small.append(main,detail);
  small.dataset.structured="1";
}

function tagChoices(){
  for(const button of choices?.querySelectorAll(".choice")||[]){
    const name=button.querySelector("b")?.textContent?.trim();
    button.classList.toggle("evolution-choice",EVOLUTIONS.has(name));
    splitDetail(button);
  }
}
if(choices)new MutationObserver(tagChoices).observe(choices,{childList:true,subtree:true});
tagChoices();
