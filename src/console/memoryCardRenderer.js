// A tiny projected box mesh drawn into one canvas. Keeping the six opaque faces
// in one surface avoids CSS preserve-3d/backface compositing flashes over WebGL.
const W=142,H=198,D=16,SCALE=3;
const brandTextures=new Map();
function surface(){const canvas=document.createElement("canvas");canvas.width=W*SCALE;canvas.height=H*SCALE;const ctx=canvas.getContext("2d");ctx.scale(SCALE,SCALE);return {canvas,ctx};}
export function frontTexture(card,number){
  const {canvas,ctx}=surface(), gradient=ctx.createLinearGradient(0,0,W,H);
  gradient.addColorStop(0,"#34383e");gradient.addColorStop(.5,"#22262c");gradient.addColorStop(1,"#2b2f35");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#646b76";ctx.strokeRect(.5,.5,W-1,H-1);
  ctx.strokeStyle="#151a21";ctx.lineWidth=3;ctx.strokeRect(3,3,W-6,H-6);
  ctx.strokeStyle="#51565e";ctx.lineWidth=.7;ctx.strokeRect(4,4,W-8,H-8);
  ctx.fillStyle="#171d24";ctx.fillRect(15,9,W-30,19);
  for(let x=15;x<W-15;x+=5){ctx.fillStyle="#525860";ctx.fillRect(x+2,10,1,17);ctx.fillStyle="#30363e";ctx.fillRect(x+3,10,2,17);}
  ctx.textAlign="center";ctx.fillStyle="#9298a0";ctx.font="bold 9px Arial";ctx.letterSpacing="1px";ctx.fillText("MEMORY CARD",W/2,46);
  ctx.letterSpacing="-1px";ctx.font="34px Arial";ctx.fillStyle="#a9afb8";ctx.fillText("128",W/2-8,87);
  ctx.letterSpacing="0px";ctx.font="10px Arial";ctx.fillText("MB",W/2+31,89);
  ctx.font="italic 10px Arial";ctx.fillStyle="#777f8c";ctx.fillText("MagicGate",W/2,103);
  const label=ctx.createLinearGradient(13,119,129,162);label.addColorStop(0,"#30343a");label.addColorStop(1,"#24272c");ctx.fillStyle=label;ctx.fillRect(13,119,W-26,43);
  ctx.fillStyle=card.color;ctx.globalAlpha=.6;ctx.fillRect(13,119,W-26,1);ctx.globalAlpha=1;
  ctx.fillStyle="#bdc2ca";ctx.font="12px Arial";ctx.letterSpacing="1px";ctx.fillText(card.short,W/2,139);
  ctx.fillStyle="#91969d";ctx.font="6px Arial";ctx.letterSpacing=".3px";ctx.fillText(`REBOOT01 / ${String(number+1).padStart(2,"0")}`,W/2,151);
  for(const x of [16,W-43]){ctx.fillStyle="#171e26";ctx.fillRect(x,H-22,27,10);ctx.fillStyle="#000";ctx.fillRect(x,H-22,27,1);ctx.fillStyle="#64707c";ctx.fillRect(x,H-12,27,.5);}
  return canvas;
}
export async function rearTexture(card){
  const brand=card.id==="module" ? "reboot01" : card.short==="JS" ? "javascript" : card.short==="RUST" ? "rust" : "go";
  if(brandTextures.has(brand)) return brandTextures.get(brand);
  const task=(async()=>{
    const {canvas,ctx}=surface(),gradient=ctx.createLinearGradient(0,0,W,H);gradient.addColorStop(0,"#252930");gradient.addColorStop(1,"#171c23");ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#565c64";ctx.strokeRect(.5,.5,W-1,H-1);
    const image=new Image();image.src=`/experience/brands/${brand}.${brand==="reboot01" ? "png" : "svg"}`;await image.decode();
    const mark=document.createElement("canvas");mark.width=image.naturalWidth;mark.height=image.naturalHeight;const mc=mark.getContext("2d");mc.drawImage(image,0,0);
    const pixels=mc.getImageData(0,0,mark.width,mark.height);
    for(let i=0;i<pixels.data.length;i+=4){if(brand==="reboot01")pixels.data[i+3]*=Math.max(0,Math.min(1,(pixels.data[i]*2-255)/255));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=232;}
    mc.putImageData(pixels,0,0);
    const width=brand==="reboot01" ? 112 : brand==="go" ? 94 : 78,height=width*mark.height/mark.width;
    ctx.drawImage(mark,(W-width)/2,(H-height)/2,width,height);
    ctx.fillStyle="#848b98";ctx.textAlign="center";ctx.font="6px Arial";ctx.fillText(`${card.id==="module" ? "REBOOT01" : card.short} · MEMORY CARD`,W/2,H-20);
    return canvas;
  })();brandTextures.set(brand,task);return task;
}
const radians=n=>n*Math.PI/180;
function rotate([x,y,z],turn){
  let c=Math.cos(turn),s=Math.sin(turn);[x,z]=[x*c+z*s,z*c-x*s];
  c=Math.cos(radians(-2));s=Math.sin(radians(-2));[x,y]=[x*c-y*s,x*s+y*c];
  c=Math.cos(radians(-23));s=Math.sin(radians(-23));[x,z]=[x*c+z*s,z*c-x*s];
  c=Math.cos(radians(-7));s=Math.sin(radians(-7));return [x,y*c-z*s,y*s+z*c];
}
const box=[[-W/2,-H/2,D/2],[W/2,-H/2,D/2],[W/2,H/2,D/2],[-W/2,H/2,D/2],[-W/2,-H/2,-D/2],[W/2,-H/2,-D/2],[W/2,H/2,-D/2],[-W/2,H/2,-D/2]];
const faces=[{ids:[0,1,2,3],normal:[0,0,1],texture:"front"},{ids:[5,4,7,6],normal:[0,0,-1],texture:"rear"},
  {ids:[4,0,3,7],normal:[-1,0,0],color:"#333943"},{ids:[1,5,6,2],normal:[1,0,0],color:"#151b22"},
  {ids:[4,5,1,0],normal:[0,-1,0],color:"#424952"},{ids:[3,2,6,7],normal:[0,1,0],color:"#141a22"}];
function silhouette(points){
  const ordered=[...points].sort((a,b)=>a[0]-b[0] || a[1]-b[1]);
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half=rows=>{const edge=[];for(const point of rows){while(edge.length>1 && cross(edge.at(-2),edge.at(-1),point)<=0)edge.pop();edge.push(point);}return edge.slice(0,-1);};
  return [...half(ordered),...half([...ordered].reverse())];
}
function triangle(ctx,image,src,dst){
  const [a,b,c]=dst,[[u0,v0],[u1,v1],[u2,v2]]=src;
  const determinant=u0*(v1-v2)+u1*(v2-v0)+u2*(v0-v1);
  if(!determinant)return;
  const affine=(p0,p1,p2)=>[(p0*(v1-v2)+p1*(v2-v0)+p2*(v0-v1))/determinant,(p0*(u2-u1)+p1*(u0-u2)+p2*(u1-u0))/determinant,(p0*(u1*v2-u2*v1)+p1*(u2*v0-u0*v2)+p2*(u0*v1-u1*v0))/determinant];
  const [aa,cc,ee]=affine(a[0],b[0],c[0]),[bb,dd,ff]=affine(a[1],b[1],c[1]);
  // Overlap adjacent texture tiles by a fraction of a pixel, preventing seams
  // from antialiased clip edges without changing the underlying projected mesh.
  const center=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3];
  const padded=dst.map(p=>{const dx=p[0]-center[0],dy=p[1]-center[1],length=Math.hypot(dx,dy);return [p[0]+dx/length*.35,p[1]+dy/length*.35];});
  ctx.save();ctx.beginPath();padded.forEach((p,i)=>i ? ctx.lineTo(...p) : ctx.moveTo(...p));ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,ee,ff);ctx.drawImage(image,0,0);ctx.restore();
}
export function drawMemoryCard(canvas,textures,angle=0,lift=0){
  const ctx=canvas.getContext("2d"),dpr=canvas.width/200,turn=radians(angle);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,200,250);
  const project=p=>{const [x,y,z]=rotate(p,turn),scale=750/(750-z);return [100+x*scale,112+y*scale-lift];};
  // Shadow the actual rotating silhouette, rather than a rectangular UI tile.
  // Drawing it into the card surface avoids another CSS filter/compositor layer.
  ctx.save();ctx.beginPath();silhouette(box.map(project)).forEach((point,index)=>index ? ctx.lineTo(...point) : ctx.moveTo(...point));ctx.closePath();
  ctx.shadowColor="#000c";ctx.shadowBlur=10*dpr;ctx.shadowOffsetY=3*dpr;
  ctx.fillStyle="#000";ctx.strokeStyle="#000b";ctx.lineWidth=2.5;ctx.fill();ctx.stroke();ctx.restore();
  const visible=faces.filter(face=>{const n=rotate(face.normal,turn),p=rotate(box[face.ids[0]],turn);return n[0]*-p[0]+n[1]*-p[1]+n[2]*(750-p[2])>0;})
    .sort((a,b)=>a.ids.reduce((n,i)=>n+rotate(box[i],turn)[2],0)-b.ids.reduce((n,i)=>n+rotate(box[i],turn)[2],0));
  for(const face of visible){
    const quad=face.ids.map(i=>project(box[i]));ctx.beginPath();quad.forEach((p,i)=>i ? ctx.lineTo(...p) : ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=face.color || "#22262c";ctx.fill();
    const texture=textures[face.texture];
    if(texture){
      const points=face.ids.map(i=>box[i]);
      const at=(u,v)=>project(points[0].map((n,k)=>n+(points[1][k]-n)*u+(points[3][k]-n)*v));
      // Four subdivisions keep lettering perspective-correct with very little work.
      for(let x=0;x<4;x++)for(let y=0;y<4;y++){
        const u=x/4,v=y/4,U=(x+1)/4,V=(y+1)/4,sw=texture.width,sh=texture.height;
        triangle(ctx,texture,[[u*sw,v*sh],[U*sw,v*sh],[U*sw,V*sh]],[at(u,v),at(U,v),at(U,V)]);
        triangle(ctx,texture,[[u*sw,v*sh],[U*sw,V*sh],[u*sw,V*sh]],[at(u,v),at(U,V),at(u,V)]);
      }
    }
    ctx.beginPath();quad.forEach((p,i)=>i ? ctx.lineTo(...p) : ctx.moveTo(...p));ctx.closePath();ctx.strokeStyle="#626b764d";ctx.lineWidth=.65;ctx.stroke();
  }
}
