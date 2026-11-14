import * as pc from "playcanvas";
import {
  cameraAt,
  cubeAngles,
  cubeProjection,
  lightAt,
  laserWorldAt,
  CUBES,
  VERTICAL_FOV,
  VIRTUAL_ASPECT,
  clamp,
  smooth,
} from "./timeline";
import * as shaders from "./shaders";
import { pillarField, startupVisibility } from "./pillars";
import { arrivalCamera, portalCamera } from "./cinematics";
import { referenceCrystal } from "./referenceClock";
import { installSceneFrame } from "./SceneFrame";
import { renderPixelRatio } from "./renderQuality";
import { DEATH_DISTANCE,DEATH_CLOUD,deathCubePose } from './failureScene';
import { clockOrbit, smokeTravelDistance, smokeSpeed, rotationTravelDistance, crystalRotation, SMOKE_DRIFT } from "./menuMotion";
import { crystalMesh, crystalPlacement, CRYSTAL_LAYOUT, WORLD_FOV, WORLD_POSES, shortestAngle, navigationPulse } from "./worldGeometry";
import {
  createGlassEnvironment,
  createGlassMaterial,
  createGlassNormal,
  createGlassCube,
} from "./glassLighting";

function densityTexture(device) {
  // A 3D value-noise lookup: G stores the next Z slice of R. Bilinear XY
  // plus interpolated Z provides a continuous volume rather than skewed sheets.
  const size=128, values=new Uint8Array(size*size), data=new Uint8Array(size*size*4);
  let seed=43217;
  for(let i=0;i<values.length;i++) {
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    values[i]=seed>>>24;
  }
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const p=(y*size+x)*4;
    data[p]=values[y*size+x];
    data[p+1]=values[((y+17)%size)*size+(x+37)%size];
    data[p+2]=data[p]; data[p+3]=255;
  }
  const texture=new pc.Texture(device,{width:size,height:size,format:pc.PIXELFORMAT_RGBA8,
    mipmaps:false,minFilter:pc.FILTER_LINEAR,magFilter:pc.FILTER_LINEAR,
    addressU:pc.ADDRESS_REPEAT,addressV:pc.ADDRESS_REPEAT});
  texture.lock().set(data);texture.unlock();
  return texture;
}

export function createStartup(canvas) {
  // AppBase loads only the systems this sequence uses. No physics, audio, input or particles runtime.
  const device = new pc.WebglGraphicsDevice(canvas, {
    alpha: false,
    antialias: true,
    powerPreference: "high-performance",
  });
  const options = new pc.AppOptions();
  options.graphicsDevice = device;
  options.componentSystems = [
    pc.RenderComponentSystem,
    pc.CameraComponentSystem,
    pc.LightComponentSystem,
  ];
  options.resourceHandlers = [pc.TextureHandler];
  const app = new pc.AppBase(canvas);
  app.init(options);
  app.autoRender = false;
  const density = densityTexture(device),
    materials = [],
    meshes = [];
  const box = pc.createBox(device),
    plane = pc.createPlane(device);
  meshes.push(box, plane);
  const material = (
    name,
    fragment,
    { blend = pc.BLEND_NONE, cull = pc.CULLFACE_BACK, depthWrite = true } = {},
  ) => {
    const type =
      fragment === shaders.pillar
        ? "pillar"
        : fragment === shaders.fog
          ? "fog"
          : fragment === shaders.clockLight ? "clock-light" : "light";
    const m = new pc.ShaderMaterial({
      uniqueName: `PS2Startup-${type}`,
      vertexGLSL: fragment === shaders.fog ? shaders.fogVertex : fragment===shaders.pillar ? shaders.pillarVertex : shaders.vertex,
      fragmentGLSL: fragment,
      attributes: {
        aPosition: pc.SEMANTIC_POSITION,
        aNormal: pc.SEMANTIC_NORMAL,
        aUv0: pc.SEMANTIC_TEXCOORD0,
        aUv1: pc.SEMANTIC_TEXCOORD1,
        aColor:pc.SEMANTIC_COLOR,
      },
    });
    m.blendType = blend;
    m.cull = cull;
    m.depthWrite = depthWrite;
    m.setParameter("density", density);
    m.setParameter("clock", 0);
    m.setParameter("uGain", 0);
    materials.push(m);
    return m;
  };
  const entity = (name, mesh, mat, position, scale, order = 0) => {
    const e = new pc.Entity(name),
      instance = new pc.MeshInstance(mesh, mat, e);
    instance.drawOrder = order;
    e.addComponent("render", {
      meshInstances: [instance],
      castShadows: false,
      receiveShadows: false,
    });
    e.setPosition(...position);
    e.setLocalScale(...scale);
    app.root.addChild(e);
    return e;
  };
  const camera = new pc.Entity("PS2 reference camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(0, 0, 0),
    fov: VERTICAL_FOV,
    nearClip: 0.2,
    farClip: 400,
    aspectRatioMode: pc.ASPECT_MANUAL,
    aspectRatio: VIRTUAL_ASPECT,
  });
  app.root.addChild(camera);
  camera.camera.toneMapping = pc.TONEMAP_ACES;
  const worldLayer = app.scene.layers.getLayerByName("World");
  worldLayer.transparentSortMode = pc.SORTMODE_MANUAL;
  // Capture atmosphere before drawing glass, so glass refracts the actual animated scene.
  const atmosphere = new pc.Layer({
    name: "Startup fog",
    transparentSortMode: pc.SORTMODE_MANUAL,
  });
  app.scene.layers.insertOpaque(atmosphere, 0);
  app.scene.layers.insertTransparent(atmosphere, 1);
  camera.camera.layers = [...camera.camera.layers, atmosphere.id];
  const optical=installSceneFrame(app,camera.camera);
  const glassEnvironment = createGlassEnvironment(device);
  const glassNormal = createGlassNormal(device);
  const glassMesh = createGlassCube(device);
  meshes.push(glassMesh);
  // Every key is inside the visible blue cloud; no off-camera studio lights.
  const cloudLights = [[0, 3, -102], [-7, -3, -117], [8, 5, -129]].map((position, i) => {
    const e = new pc.Entity(`Cloud illumination ${i}`);
    e.addComponent("light", {type: "omni", color: new pc.Color(.27,.46,1),
      intensity: i === 0 ? 5 : 2.4, range: 76, castShadows: false,
      falloffMode: pc.LIGHTFALLOFF_LINEAR});
    e.setPosition(...position);
    app.root.addChild(e);
    return e;
  });

  // The entire static lattice shares one draw. Face colors and depth gradients
  // are vertex attributes, rather than 108 materials and submissions per frame.
  const field=pillarField(), pillarPositions=[],pillarNormals=[],pillarUvs=[],pillarColumns=[],pillarColors=[],pillarIndices=[];
  const bp=[],bn=[],bu=[],bi=[];
  box.getPositions(bp);box.getNormals(bn);box.getUvs(0,bu);box.getIndices(bi);
  for(const {x,y,front,depth,width,color,clarity} of field) {
    const offset=pillarPositions.length/3;
    for(let i=0;i<bp.length/3;i++) {
      pillarPositions.push(bp[i*3]*width+x,bp[i*3+1]*width+y,bp[i*3+2]*depth+front-depth/2);
      pillarNormals.push(bn[i*3],bn[i*3+1],bn[i*3+2]);
      pillarUvs.push(bu[i*2],bu[i*2+1]);pillarColumns.push(front,depth);pillarColors.push(...color,clarity);
    }
    bi.forEach(i=>pillarIndices.push(i+offset));
  }
  const pillarMesh=new pc.Mesh(device);
  pillarMesh.setPositions(pillarPositions);pillarMesh.setNormals(pillarNormals);
  pillarMesh.setUvs(0,pillarUvs);pillarMesh.setUvs(1,pillarColumns);pillarMesh.setColors(pillarColors);
  pillarMesh.setIndices(pillarIndices);pillarMesh.update();meshes.push(pillarMesh);
  const pillars = [field].map(() => {
    const m=material("Memory pillar lattice",shaders.pillar,{blend:pc.BLEND_NORMAL,depthWrite:true});
    const e=entity("Memory pillars",pillarMesh,m,[0,0,0],[1,1,1],20);
    e.render.layers=[atmosphere.id];
    return {entity:e,material:m};
  });
  const fogMaterial = material("Smoke volume", shaders.fog, {
    cull: pc.CULLFACE_NONE, depthWrite: false,
  });
  fogMaterial.depthTest = false;
  const volume = entity("Bounded blue smoke volume", plane, fogMaterial,
    [0, 0, 0], [1, 1, 1], 10);
  volume.render.layers = [atmosphere.id];
  // Its vertex shader draws a screen triangle/quad; the source plane is not in world space.
  volume.render.meshInstances[0].cull = false;
  let textureReady = false, referenceReady=false, introReady=false, cloudTexture=density;
  const loadReferenceTexture=(name,url,uniform,done) => {
    const asset=new pc.Asset(name,"texture",{url});
    fogMaterial.setParameter(uniform,density);
    asset.ready(()=>{asset.resource.addressU=asset.resource.addressV=pc.ADDRESS_REPEAT;
      fogMaterial.setParameter(uniform,asset.resource);
      if(uniform==="startupSmoke") cloudTexture=asset.resource;
      done();app.renderNextFrame=true;});
    asset.on("error",()=>{done();app.renderNextFrame=true;});
    app.assets.add(asset);app.assets.load(asset);
  };
  loadReferenceTexture("CrystalClock original tunnel noise","/experience/crystal-clock/noise.png","referenceNoise",()=>referenceReady=true);
  loadReferenceTexture("PS2 intro smoke detail","/experience/ps2-smoke.webp","startupSmoke",()=>introReady=true);
  const controller = new AbortController();
  let disposed = false;
  const crystalRoot = new pc.Entity("PS2 crystal clock");
  crystalRoot.setPosition(...CRYSTAL_LAYOUT.center);
  app.root.addChild(crystalRoot);
  const crystals = [];
  fetch("/experience/crystal-clock/prism.obj", {signal: controller.signal})
    .then(r => { if (!r.ok) throw new Error("Crystal mesh unavailable"); return r.text(); })
    .then(source => {
      if (disposed) return;
      const mesh = crystalMesh(device, source);
      meshes.push(mesh);
      for (let i = 0; i < 12; i++) {
        const placement=crystalPlacement(i);
        const m=referenceCrystal(device,glassNormal,i);
        // A cached mesh can arrive between update and render on a fast GPU.
        // Bind all samplers before adding its first visible MeshInstance.
        m.setParameter("ccEnvironment",optical.glass.environment);
        m.setParameter("ccEnvironmentEncoding",optical.glass.encoding);
        m.setParameter("ccCloud",cloudTexture);
        const e = entity(`Clock crystal ${i}`, mesh, m,
          placement.position, [1,1,1], 35+i);
        crystalRoot.addChild(e);
        e.setLocalRotation(placement.rotation);
        crystals.push({entity:e, material:m});
      }
      textureReady = true;
      app.renderNextFrame = true;
      const surface=new pc.Asset("CrystalClock glass normals","texture",{
        url:"/experience/crystal-clock/normal.jpg",
      });
      surface.ready(() => {
        if (disposed) return;
        surface.resource.addressU=surface.resource.addressV=pc.ADDRESS_REPEAT;
        crystals.forEach(({material}) => { material.setParameter("normalMap",surface.resource); material.update(); });
        app.renderNextFrame=true;
      });
      app.assets.add(surface);
      app.assets.load(surface);
    })
    .catch(() => { if (!disposed) textureReady = true; });
  const cubeMaterials = [];
  const cubes = CUBES.map(({ position, index }) => {
    const m = createGlassMaterial(glassEnvironment,glassNormal);
    m.update();
    cubeMaterials.push(m);
    return entity(
      `Glass cube ${index + 1}`,
      glassMesh,
      m,
      position,
      [3.6, 3.6, 3.6],
      30 + index,
    );
  });

  const colors = {
    green: [0.18, 1, 0.08],
    pink: [1, 0.1, 0.5],
    red: [1, 0.02, 0.08],
    violet: [0.58, 0.22, 1],
    ...Object.fromEntries(Array.from({length:7},(_,i)=>[`clock${i}`,[.4,.72,1]])),
  };
  const lights = Object.entries(colors).map(([name, color], i) => {
    const m = material(`light-${name}`, name.startsWith("clock") ? shaders.clockLight : shaders.light, {
      blend: pc.BLEND_ADDITIVEALPHA,
      cull: pc.CULLFACE_NONE,
      depthWrite: false,
    });
    m.depthTest = !name.startsWith("clock");
    m.setParameter("tint", color);
    const head = entity(
      `${name} light`,
      plane,
      m,
      [0, 0, 0],
      [0.7, 1, 0.7],
      50 + i,
    );
    if (!name.startsWith("clock")) head.addComponent("light", {
      type: "omni",
      color: new pc.Color(...color),
      intensity: 1.2,
      range: 10,
      falloffMode: pc.LIGHTFALLOFF_INVERSESQUARED,
      castShadows: false,
    });
    const trailMat = new pc.ShaderMaterial({
      uniqueName: "PS2Startup-light-ribbon",
      vertexGLSL: name.startsWith("clock") ? shaders.clockTrailVertex : shaders.trailVertex,
      fragmentGLSL: shaders.trailFragment,
      attributes: {
        aPosition: pc.SEMANTIC_POSITION,
        aColor: pc.SEMANTIC_COLOR,
      },
    });
    trailMat.blendType = pc.BLEND_ADDITIVEALPHA;
    trailMat.cull = pc.CULLFACE_NONE;
    trailMat.depthWrite=false;trailMat.depthTest=!name.startsWith("clock");
    materials.push(trailMat);
    const mesh = new pc.Mesh(device);
    mesh.clear(true, true);
    meshes.push(mesh);
    const count = 72,
      positions = new Float32Array(count * 2 * 3),
      rgba = new Float32Array(count * 2 * 4),
      indices = [];
    for (let j = 0; j < count; j++) {
      if(name.startsWith("clock")) positions.set([j/(count-1),-1,0,j/(count-1),1,0],j*6);
      for (let k = 0; k < 2; k++) {
        const p = (j * 2 + k) * 4;
        rgba[p] = color[0];
        rgba[p + 1] = color[1];
        rgba[p + 2] = color[2];
        rgba[p + 3] = (1 - j / count) ** 2 * 0.6;
      }
      if (j < count - 1) {
        const a = j * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    mesh.setPositions(positions);
    mesh.setColors(rgba);
    mesh.setIndices(indices);
    mesh.update();
    const ribbon = entity(
      `${name} persistent light trail`,
      mesh,
      trailMat,
      [0, 0, 0],
      [1, 1, 1],
      44 + i,
    );
    if(!name.startsWith("clock")) {
      head.render.layers=[atmosphere.id];
      ribbon.render.layers=[atmosphere.id];
    }
    if(name.startsWith("clock")) {
      ribbon.render.meshInstances[0].cull=false;
      trailMat.setParameter("clockIndex",Number(name.slice(5)));
      trailMat.setParameter("timeOfDay",0);
      trailMat.setParameter("viewer",[0,0,-82]);
    }
    return { name, head, mat: m, ribbon, trailMat, mesh, positions, count };
  });

  const tangent=new pc.Vec3(), view=new pc.Vec3(), side=new pc.Vec3();
  const p0 = new pc.Vec3(), p1 = new pc.Vec3(), q = new pc.Quat(), rot = new pc.Quat();
  const orbit = { a: 0, e: .06, r: 35 };
  let previousMode = "startup", lastWall = performance.now(), menuBlend = 0, failureBlend=0;
  let colorGrab=false;
  let smokeExtra=0,rotationExtra=0, previousRotationDistance=0, travelId=-1, previousTravelDistance=0, skipTravel=false;
  let lastSmokeSpeed=.7, lastSmokeDepth=0, lastCrystalPhase=-10;
  const clockEpoch=Date.now();
  const cloudCenter = [0, 0, -112];
  function update(seconds, { motion = true, wireframe = false, mode = "startup",
    arrival = 10, navigation = 10, navigationTarget="menu", navigationStage="",entryAge=10, orbitOffset = [0,0], sceneError = false,
    travel = {id:0,age:10,direction:0} } = {}) {
    const isWorld = mode !== "startup";
    // Retain the capture until red glass has finished fading on Retry.
    const needsGrab=!isWorld || mode==="login" || sceneError || failureBlend>.001;
    if(needsGrab!==colorGrab) {
      optical.frame.rendering.sceneColorMap=needsGrab;
      colorGrab=needsGrab;
      optical.frame.update();
    }
    const now = performance.now();
    // Damping follows elapsed wall time even when a frame is expensive. Capping
    // it to 50 ms stretches a 0.6 s transition into several seconds at low FPS.
    const dt = Math.min(1, Math.max(.001, (now - lastWall) / 1000));
    lastWall = now;
    const state = cameraAt(motion ? seconds : Math.min(seconds, 2.35));
    const visibility = startupVisibility(seconds);
    const fade = visibility.blocks;
    const arrivalState=arrivalCamera(arrival,mode === "login");
    const portal=portalCamera(navigation,navigationTarget === "login",entryAge,navigationStage);
    const reveal = isWorld ? arrivalState.reveal : 1;
    failureBlend+=(Number(sceneError)-failureBlend)*(motion ? 1-Math.exp(-dt*11) : 1);
    const exposure = isWorld ? reveal : fade;
    const pulse = isWorld && motion ? navigationPulse(navigation) : 0;
    const center = new pc.Vec3(...cloudCenter);
    if (!isWorld) {
      camera.camera.aspectRatio = VIRTUAL_ASPECT;
      camera.camera.fov=VERTICAL_FOV;
      camera.setPosition(0, 0, state.z);
      camera.setEulerAngles(0, 0, state.roll*180/Math.PI);
    } else {
      camera.camera.aspectRatio = device.width / device.height;
      camera.camera.fov=WORLD_FOV;
      const pose = WORLD_POSES[mode] || WORLD_POSES.dashboard;
      const ease = motion ? 1 - Math.exp(-dt * 10) : 1;
      // Only the target changes on navigation; never reset the current pose or clock.
      if (previousMode === "startup" && arrival > 2) {
        orbit.a = pose[0]; orbit.e = pose[1]; orbit.r = pose[2];
      }
      orbit.a += (shortestAngle(orbit.a, pose[0] + orbitOffset[0]) - orbit.a) * ease;
      orbit.e += (pose[1] + orbitOffset[1] - orbit.e) * ease;
      orbit.r += (pose[2] - orbit.r) * ease;
      let distance=orbit.r;
      let roll=mode === "login" ? -16+seconds*.85 : 0;
      if (motion && arrival<1.18) {
        distance=arrivalState.distance;
        roll+=arrivalState.roll;
      }
      if (motion && portal.active) {
        if (portal.approaching) {
          distance=orbit.r+(5-orbit.r)*portal.approach;
          roll+=portal.approach*48;
        } else {
          distance=portal.distance;
          roll+=portal.roll;
        }
      }
      distance+=(DEATH_DISTANCE-distance)*failureBlend;
      roll*=1-failureBlend;
      const a = (orbit.a + (motion && mode === "login" ? Math.sin(seconds * .075) * .025 : 0))*(1-failureBlend);
      const elevation=orbit.e*(1-failureBlend);
      camera.setPosition(Math.sin(a)*Math.cos(elevation)*distance,
        Math.sin(elevation)*distance,-112+Math.cos(a)*Math.cos(elevation)*distance);
      const viewHeight=2*distance*Math.tan(WORLD_FOV*Math.PI/360);
      const focusX=(.5-CRYSTAL_LAYOUT.screenCenter[0])*viewHeight*camera.camera.aspectRatio;
      const focusY=(CRYSTAL_LAYOUT.screenCenter[1]-.5)*viewHeight;
      camera.lookAt(new pc.Vec3(center.x+focusX*menuBlend,focusY*menuBlend,center.z));
      camera.rotateLocal(0,0,roll);

    }
    previousMode = mode;
    menuBlend += ((isWorld && mode !== "login" ? 1 : 0) - menuBlend) * (motion ? 1-Math.exp(-dt*10) : 1);
    if (travel.id !== travelId) {
      travelId=travel.id;
      previousTravelDistance=0;
      previousRotationDistance=0;
      skipTravel=!motion;
    }
    if (!motion) skipTravel=true;
    if (isWorld && motion && !skipTravel) {
      const distance=smokeTravelDistance(travel.age,travel.direction);
      smokeExtra+=distance-previousTravelDistance;
      previousTravelDistance=distance;
      const turn=rotationTravelDistance(travel.age);
      rotationExtra+=turn-previousRotationDistance;
      previousRotationDistance=turn;
    }
    lastSmokeDepth=seconds*(isWorld && mode!=="login" ? SMOKE_DRIFT : .7)+(isWorld ? smokeExtra : 0);
    lastSmokeSpeed=isWorld && mode!=="login" && !skipTravel ? smokeSpeed(travel.age,travel.direction) : .7;
    const rayScale = Math.tan((isWorld ? WORLD_FOV : VERTICAL_FOV)*Math.PI/360);
    fogMaterial.setParameter("eye", camera.getPosition().toArray());
    fogMaterial.setParameter("rayRight", camera.right.clone().mulScalar(rayScale*camera.camera.aspectRatio).toArray());
    fogMaterial.setParameter("rayUp", camera.up.clone().mulScalar(rayScale).toArray());
    fogMaterial.setParameter("rayForward", camera.forward.toArray());
    fogMaterial.setParameter("cloudCenter", cloudCenter);
    fogMaterial.setParameter("crystalWorld", menuBlend);
    fogMaterial.setParameter("worldStage",isWorld ? 1 : 0);
    fogMaterial.setParameter("smokeDepth",lastSmokeDepth);
    fogMaterial.setParameter("voidCenter",CRYSTAL_LAYOUT.center);
    fogMaterial.setParameter("cloudRadius", isWorld ? [28,22,42].map((n,i)=>n+(DEATH_CLOUD[i]-n)*failureBlend) : [32,27,39]);
    fogMaterial.setParameter("clock",seconds);
    fogMaterial.setParameter("errorAmount",failureBlend);
    // The blocks are lit at t=0 independently of the smoke's gentle appearance.
    const fogExposure = isWorld ? reveal*(1.+pulse*.1) : visibility.smoke*1.08;
    fogMaterial.setParameter("uGain", fogExposure);
    cloudLights.forEach((e,i) => {
      e.light.intensity = (i === 0 ? 3.8+menuBlend : 2.1) * exposure;
      e.light.color = sceneError ? new pc.Color(.8,.08,.12)
        : new pc.Color(.27+menuBlend*.28,.46+menuBlend*.26,1);
    });
    const toWorld = (x, y, target, distance = 40) =>
      camera.camera.screenToWorld(x*device.width, y*device.height, distance,
        target, device.width, device.height);
    cubes.forEach((cube, i) => {
      cube.enabled = exposure > .0001 && (!isWorld || mode==="login" || failureBlend>.01) && (i<2 || failureBlend<.999);
      if(!cube.enabled) return;
      if (!isWorld) {
        const [x,y,width] = cubeProjection(i, motion ? seconds : 0);
        const distance = Math.max(8, Math.abs(CUBES[i].position[2]-state.z));
        toWorld(x,y,p0,distance);
        cube.setPosition(p0);
        const edge = width*2*distance*rayScale*VIRTUAL_ASPECT;
        cube.setLocalScale(edge,edge,edge);
        cube.setEulerAngles(...cubeAngles(i,motion ? seconds : 0));
      } else {
        const a=i*Math.PI*2/5+seconds*.035;
        const login=[Math.cos(a)*13,Math.sin(a)*8,-104+Math.sin(a*1.7)*6];
        const death=deathCubePose(i%2,motion ? seconds : 0);
        cube.setPosition(...login.map((n,j)=>n+(death.position[j]-n)*failureBlend));
        const baseSize=1.6+(i%3)*.30,size=baseSize+(death.size-baseSize)*failureBlend;
        cube.setLocalScale(size,size,size);
        const rotation=[i*17+seconds*1.5,i*23+seconds*2.2,seconds*.8];
        cube.setEulerAngles(...rotation.map((n,j)=>n+(death.rotation[j]-n)*failureBlend));
      }
      const m=cubeMaterials[i];
      m.setParameter("uGain",exposure*(i<2 ? 1 : 1-failureBlend));
      m.setParameter("eye",camera.getPosition().toArray());
      m.setParameter("viewport",[device.width,device.height]);
      m.setParameter("errorAmount",failureBlend);
      cube.render.meshInstances[0].renderStyle=wireframe?pc.RENDERSTYLE_WIREFRAME:pc.RENDERSTYLE_SOLID;
    });
    const pillarVisibility = isWorld && mode === "login" ? reveal*(1-failureBlend) : 0;
    pillars.forEach(({entity, material, baseZ}) => {
      entity.enabled=pillarVisibility>.0001;
      if(!entity.enabled) return;
      material.setParameter("visibility",pillarVisibility);
      material.setParameter("clock",seconds);
      material.setParameter("fogExposure",fogExposure);
      material.setParameter("errorAmount",failureBlend);
      material.setParameter("cloudCenter",cloudCenter);
      material.setParameter("uGain",exposure);
    });
    crystalRoot.enabled = isWorld && mode !== "login" && reveal > .001;
    const crystalAngles=crystalRotation(seconds,rotationExtra);
    lastCrystalPhase=crystalAngles[1];
    crystalRoot.setEulerAngles(...crystalAngles);
    const pointPositions=new Float32Array(21);
    for(let i=0;i<7;i++) {
      clockOrbit(i,new Date(clockEpoch+seconds*1000),p0);
      pointPositions.set(p0.toArray(),i*3);
    }
    crystals.forEach(({material})=> {
      material.setParameter("uGain",reveal*menuBlend);
      material.setParameter("viewPos",camera.getPosition().toArray());
      material.setParameter("ccOrbPositions[0]",pointPositions);
      material.setParameter("ccViewport",[device.width,device.height]);
      material.setParameter("ccEnvironment",optical.glass.environment);
      material.setParameter("ccEnvironmentEncoding",optical.glass.encoding);
      material.setParameter("ccCloud",cloudTexture);
    });
    function worldLight(name, time, output) {
      if (name.startsWith("clock")) {
        return clockOrbit(Number(name.slice(5)),new Date(clockEpoch+time*1000),output);
      }
      const index=Object.keys(colors).indexOf(name), a=time*.27+index*Math.PI*.5;
      // Deep elliptical orbits surround the UI, rather than being stuck to screen pixels.
      return output.set(Math.cos(a)*24, Math.sin(a)*13,
        -103+Math.sin(a*1.3+index)*17);
    }
    for (const l of lights) {
      const clockLight=l.name.startsWith("clock");
      if (clockLight && (!isWorld || menuBlend < .001)) {
        l.head.enabled=l.ribbon.enabled=false;
        continue;
      }
      const sourceColor=colors[l.name];
      l.mat.setParameter("tint", sourceColor.map((v,i)=>(v+([.4,.72,1][i]-v)*menuBlend)*(1-failureBlend)+[1,.025,.06][i]*failureBlend));
      const sample = isWorld ? {alpha: reveal} : lightAt(l.name,seconds);
      if (isWorld) worldLight(l.name,seconds,p0);
      else laserWorldAt(l.name,seconds,p0);
      l.head.setPosition(p0);
      q.setFromEulerAngles(90,0,0);
      rot.mul2(camera.getRotation(),q);
      l.head.setRotation(rot);
      const gain=sample.alpha*exposure*(clockLight ? menuBlend : 1-menuBlend)*(1-failureBlend);
      l.gain=gain;
      // Explicit visibility also prevents any additive RGB surviving the final black frame.
      l.head.enabled=gain>.0001;
      l.ribbon.enabled=gain>.0001;
      if (l.head.light) { l.head.light.intensity=gain*2.4;l.head.light.range=30; }
      l.mat.setParameter("uGain",gain);
      l.trailMat.setParameter("uGain",gain*(clockLight ? .75 : .65));
      const radius=isWorld ? clockLight ? 3.6 : 1.25 : 2.1;
      l.head.setLocalScale(radius,1,radius);
      if (!l.ribbon.enabled) continue;
      if(clockLight) {
        const stamp=new Date(clockEpoch+seconds*1000);
        l.trailMat.setParameter("timeOfDay",stamp.getHours()*3600+stamp.getMinutes()*60+stamp.getSeconds()+stamp.getMilliseconds()/1000);
        l.trailMat.setParameter("viewer",camera.getPosition().toArray());
        continue;
      }
      for(let j=0;j<l.count;j++) {
        const t=isWorld ? seconds-j*(clockLight ? .014 : .035) : Math.max(.25,seconds-j*.015);
        if (isWorld) {
          worldLight(l.name,t,p0); worldLight(l.name,t-.025,p1);
        } else {
          laserWorldAt(l.name,t,p0);laserWorldAt(l.name,t-.025,p1);
        }
        tangent.sub2(p0,p1); view.sub2(camera.getPosition(),p0);
        side.cross(tangent,view).normalize().mulScalar((isWorld ? clockLight ? .020 : .025 : .035)*(1-j/l.count));
        const offset=j*6;
        l.positions.set([p0.x-side.x,p0.y-side.y,p0.z-side.z,
          p0.x+side.x,p0.y+side.y,p0.z+side.z],offset);
      }
      l.mesh.setPositions(l.positions);
      l.mesh.update();
    }
    const laserPositions=new Float32Array(12),laserColors=new Float32Array(12);
    lights.filter(l=>!l.name.startsWith("clock")).forEach((l,i)=>{
      laserPositions.set(l.head.getPosition().toArray(),i*3);
      laserColors.set(colors[l.name].map(c=>c*l.gain),i*3);
    });
    cubeMaterials.forEach(m=>{
      m.setParameter("laserPositions[0]",laserPositions);
      m.setParameter("laserColors[0]",laserColors);
    });
    app.renderNextFrame = true;
  }
  function resize(width, height) {
    device.maxPixelRatio = renderPixelRatio(width,height,devicePixelRatio);
    device.resizeCanvas(width, height);
    update(lastTime, lastOptions);
  }
  let lastTime = 0,
    lastOptions = {};
  return {
    app,
    get ready() {
      return textureReady && referenceReady && introReady && optical.glass.ready;
    },
    resize,
    render(seconds, options = {}) {
      lastTime = options.mode && options.mode !== "startup" ? Math.max(0, seconds) : clamp(seconds, 0, 4.533334);
      lastOptions = options;
      update(lastTime, options);
    },
    start() {
      app.start();
    },
    dispose() {
      disposed = true;
      controller.abort();
      optical.dispose();
      app.destroy();
    },
    stats() {
      const projected=camera.camera.worldToScreen(new pc.Vec3(...CRYSTAL_LAYOUT.center),
        new pc.Vec3(),device.width,device.height);
      return {
        engine: "PlayCanvas",
        cubes: cubes.length,
        visibleCubes:cubes.filter(c=>c.enabled).length,
        pillars: field.length,
        visiblePillars: pillars.some(p => p.entity.enabled) ? field.length : 0,
        visibleCrystals: crystalRoot.enabled ? crystals.length : 0,
        fogVolumes: 1,
        volumeSteps: 20,
        crystals: crystals.length,
        lightTrails: 4,
        clockLights: 7,
        opticalSurfaces:optical.glass.count,
        renderWidth:device.width,
        renderHeight:device.height,
        opticalEnvironment:optical.glass.environment===optical.glass.fallback ? "fallback" : "Poly Haven Studio Small 08",
        clockTrails:lights.filter(l=>l.name.startsWith("clock") && l.ribbon.enabled).length,
        cameraRoll:camera.getEulerAngles().z,
        errorAmount:failureBlend,
        smokeSpeed:lastSmokeSpeed,
        smokeDepth:lastSmokeDepth,
        camera:camera.getPosition().toArray().map(n=>n.toFixed(3)).join(","),
        crystalPose:crystalRoot.getEulerAngles().toArray().map(n=>n.toFixed(3)).join(","),
        crystalPhase:lastCrystalPhase,
        clockCenter:[projected.x/device.width,projected.y/device.height],
      };
    },
  };
}
