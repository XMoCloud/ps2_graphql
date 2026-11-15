import React,{useEffect,useRef} from "react";
import {drawMemoryCard,frontTexture,rearTexture} from "./memoryCardRenderer";

export default function MemoryCardModel({card,number}){
  const stage=useRef(null),canvas=useRef(null);
  useEffect(()=>{
    const button=stage.current.closest("button"),image=canvas.current;
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const textures={front:frontTexture(card,number)};
    let live=true,frame=0,hovering=false,focused=false,active=false,angle=0,lift=0,from=0,fromLift=0,start=0;
    const paint=()=>drawMemoryCard(image,textures,angle,lift);
    const size=()=>{const dpr=Math.min(window.devicePixelRatio || 1,2);image.width=200*dpr;image.height=250*dpr;paint();};
    size();rearTexture(card).then(rear=>{if(live){textures.rear=rear;paint();}}).catch(()=>{});
    const tick=now=>{
      if(!live)return;
      if(active){angle=from+(now-start)/6000*360;lift=fromLift+(12-fromLift)*(1-Math.cos((now-start)/6000*Math.PI*2))/2;}
      else{const t=Math.min(1,(now-start)/450),ease=(1-t)**3;angle=from*ease;lift=fromLift*ease;}
      paint();
      frame=(active || now-start<450) ? requestAnimationFrame(tick) : 0;
    };
    const update=()=>{
      const next=(hovering || focused) && !reduced?.matches;
      if(next===active)return;
      active=next;cancelAnimationFrame(frame);from=((angle+180)%360+360)%360-180;fromLift=lift;start=performance.now();
      if(reduced?.matches){angle=0;lift=0;paint();return;}
      frame=requestAnimationFrame(tick);
    };
    const enter=()=>{hovering=true;update();},leave=()=>{hovering=false;focused=false;update();};
    const focus=()=>{focused=button.matches(":focus-visible");update();},blur=()=>{focused=false;update();};
    button.addEventListener("pointerenter",enter);button.addEventListener("pointerleave",leave);button.addEventListener("focus",focus);button.addEventListener("blur",blur);
    reduced?.addEventListener("change",update);window.addEventListener("resize",size);
    return ()=>{live=false;cancelAnimationFrame(frame);button.removeEventListener("pointerenter",enter);button.removeEventListener("pointerleave",leave);button.removeEventListener("focus",focus);button.removeEventListener("blur",blur);reduced?.removeEventListener("change",update);window.removeEventListener("resize",size);};
  },[card.id,card.short,card.color,number]);
  return <span ref={stage} className="card-model-stage" aria-hidden="true"><span className="card-model-shadow"/><span className="card-selection-glow"/><canvas ref={canvas} className="card-mesh" width="400" height="500"/></span>;
}
