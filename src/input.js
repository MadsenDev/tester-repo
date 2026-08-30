export function createInput(canvas,{getState,onPauseToggle,onMute}){
  const keys=new Set();
  const touch={active:false,startX:0,startY:0,dx:0,dy:0};

  addEventListener("keydown",e=>{
    const k=e.key.toLowerCase();
    keys.add(k);
    if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();
    if(k==="p")onPauseToggle();
    if(k==="m")onMute();
  });
  addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));

  canvas.addEventListener("pointerdown",e=>{
    if(getState()!=="playing"||e.pointerType==="mouse")return;
    touch.active=true;touch.startX=e.clientX;touch.startY=e.clientY;touch.dx=0;touch.dy=0;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove",e=>{
    if(!touch.active)return;
    const dx=e.clientX-touch.startX,dy=e.clientY-touch.startY,l=Math.hypot(dx,dy);
    if(l>4){const m=Math.min(1,l/55);touch.dx=dx/l*m;touch.dy=dy/l*m}else{touch.dx=0;touch.dy=0}
  });

  const stopTouch=()=>{touch.active=false;touch.dx=0;touch.dy=0};
  canvas.addEventListener("pointerup",stopTouch);
  canvas.addEventListener("pointercancel",stopTouch);

  return {
    stopTouch,
    movement(){
      let dx=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
      let dy=(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0);
      if(!dx&&!dy&&touch.active){dx=touch.dx;dy=touch.dy}
      if(dx||dy){const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}}
      return {dx,dy};
    }
  };
}
