import * as pc from "playcanvas";

// One scene compositor and one shared reflection environment.
export function installSceneFrame(app,camera) {
  const frame=new pc.CameraFrame(app,camera);
  // Preserve dark gradients until display conversion; RGBA8 linear storage
  // visibly posterizes the purple fog and light halos.
  frame.rendering.renderFormats=[pc.PIXELFORMAT_RG11B10F,pc.PIXELFORMAT_RGBA16F,pc.PIXELFORMAT_RGBA8];
  frame.rendering.toneMapping=pc.TONEMAP_LINEAR;
  frame.rendering.sceneColorMap=false;frame.rendering.samples=4;
  frame.bloom.intensity=0;
  const fallback=new pc.Texture(app.graphicsDevice,{width:1,height:1,format:pc.PIXELFORMAT_RGBA8,mipmaps:false});
  fallback.lock().set([60,80,120,255]);fallback.unlock();
  const glass={environment:fallback,fallback,encoding:0,ready:false,
    count:0};
  const asset=new pc.Asset("Poly Haven Studio Small 08 (CC0)","texture",{url:"/experience/studio-small-08-1k.hdr"});
  asset.ready(()=>{
    glass.environment=asset.resource;
    glass.encoding=asset.resource.encoding==="rgbe" ? 1 : asset.resource.encoding==="linear" ? 2 : 0;
    glass.ready=true;app.renderNextFrame=true;
  });
  asset.on("error",()=>{glass.ready=true;app.renderNextFrame=true;});
  app.assets.add(asset);app.assets.load(asset);frame.update();
  return {frame,glass,dispose:()=>{fallback.destroy();frame.destroy();}};
}
