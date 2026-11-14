import * as pc from "playcanvas";

export function createGlassEnvironment(device) {
  const size = 128,
    texture = new pc.Texture(device, {
      name: "Central blue cloud reflections",
      cubemap: true,
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
      magFilter: pc.FILTER_LINEAR,
    });
  const directions = [
    (u, v) => [1, -v, -u],
    (u, v) => [-1, -v, u],
    (u, v) => [u, 1, v],
    (u, v) => [u, -1, -v],
    (u, v) => [u, -v, 1],
    (u, v) => [-u, -v, -1],
  ];
  const dot = (d, l) =>
    Math.max(0, (d[0] * l[0] + d[1] * l[1] + d[2] * l[2]) / Math.hypot(...l));
  for (let face = 0; face < 6; face++) {
    const pixels = texture.lock({ face });
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let d = directions[face](
          ((x + 0.5) / size) * 2 - 1,
          ((y + 0.5) / size) * 2 - 1,
        );
        const length = Math.hypot(...d);
        d = d.map((v) => v / length);
        const haze = dot(d, [-0.3, 0.4, 0.9]) ** 2;
        const curls=.55+.20*Math.sin(d[0]*19+Math.sin(d[1]*13)*2)+.15*Math.cos(d[1]*24-d[2]*9);
        const core = dot(d, [0, 0, 1]) ** 8*curls;
        const i = (y * size + x) * 4;
        // Blue cloud reflection; no white studio strips or ambient self-glow.
        const color = [.008+haze*.12+core*.48,
          .015+haze*.24+core*.74, .040+haze*.48+core*1.1];
        pixels[i] = Math.min(255, color[0] * 255);
        pixels[i + 1] = Math.min(255, color[1] * 255);
        pixels[i + 2] = Math.min(255, color[2] * 255);
        pixels[i + 3] = 255;
      }
    texture.unlock();
  }
  return texture;
}

// Scene refraction and direct colored-light reflections share the same world
// coordinates. A static environment alone cannot reflect the moving lasers.
export function createGlassMaterial(environment,normalMap) {
  const m=new pc.ShaderMaterial({uniqueName:"PS2 optical cube",attributes:{
    aPosition:pc.SEMANTIC_POSITION,aNormal:pc.SEMANTIC_NORMAL,aUv:pc.SEMANTIC_TEXCOORD0},
    vertexGLSL:`
attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;
uniform mat4 matrix_model;uniform mat4 matrix_viewProjection;
varying vec3 world;varying vec3 normal;varying vec2 uv;
varying vec3 localPoint;varying vec3 localNormal;
void main(){vec4 p=matrix_model*vec4(aPosition,1.);world=p.xyz;
normal=normalize(mat3(matrix_model)*aNormal);uv=aUv;
localPoint=aPosition;localNormal=aNormal;
gl_Position=matrix_viewProjection*p;}`,
    fragmentGLSL:`
precision highp float;
uniform sampler2D uSceneColorMap;uniform sampler2D normalMap;
uniform samplerCube reflectionMap;
uniform sampler2D menuEnvironment;uniform float menuEnvironmentEncoding;
uniform mat4 matrix_view;uniform mat4 matrix_model;uniform mat4 matrix_viewProjection;
uniform mat4 worldToCube;uniform float refractionDepth;
uniform vec3 eye;uniform vec2 viewport;uniform vec3 cloudCenter;
uniform vec3 laserPositions[4];uniform vec3 laserColors[4];
uniform vec3 orbPositions[7];uniform float orbGain;
uniform float uGain;uniform float errorAmount;
varying vec3 world;varying vec3 normal;varying vec2 uv;
varying vec3 localPoint;varying vec3 localNormal;
vec3 linearColor(vec3 c){return pow(max(c,vec3(0.)),vec3(2.2));}
vec3 environmentReflection(vec3 direction){
 vec2 lookup=vec2(atan(direction.z,direction.x)/6.2831853+.5,
   acos(clamp(direction.y,-1.,1.))/3.14159265);
 vec4 texel=texture2D(menuEnvironment,lookup);
 vec3 light=texel.rgb;
 if(menuEnvironmentEncoding>.5&&menuEnvironmentEncoding<1.5) light*=exp2(texel.a*255.-128.);
 if(menuEnvironmentEncoding<.5) light=linearColor(light);
 return light/(light+vec3(2.));
}
// Trace both interfaces of the solid cube. A normal-offset screen sample alone
// gives every face the same flat tint, especially against the dark menu fog.
vec3 exitCube(vec3 origin,vec3 ray,out vec3 face){
 vec3 safeRay=mix(vec3(-1.),vec3(1.),step(vec3(0.),ray))*max(abs(ray),vec3(.0001));
 vec3 steps=(sign(safeRay)*.5-origin)/safeRay;
 float distance=min(steps.x,min(steps.y,steps.z));
 face=steps.x<=steps.y&&steps.x<=steps.z ? vec3(sign(ray.x),0.,0.)
   : steps.y<=steps.z ? vec3(0.,sign(ray.y),0.) : vec3(0.,0.,sign(ray.z));
 return origin+ray*max(0.,distance);
}
void main(){
 vec3 V=normalize(eye-world);
 vec3 micro=texture2D(normalMap,uv).rgb*2.-1.;
 vec3 N=normalize(normal+vec3(micro.xy*.025,0.));
 float facing=clamp(abs(dot(N,V)),0.,1.);
 float fresnel=.07+.72*pow(1.-facing,3.);
 vec2 screen=gl_FragCoord.xy/viewport;
 vec3 viewNormal=normalize(mat3(matrix_view)*N);
 vec2 bend=viewNormal.xy*(.020+.016*(1.-facing));
 if(orbGain>.001){
  vec3 incident=normalize(mat3(worldToCube)*(-V));
  vec3 inside=refract(incident,normalize(localNormal),1./1.46);
  vec3 face;
  vec3 exitPoint=exitCube(localPoint+inside*.001,inside,face);
  vec3 outgoing=refract(inside,-face,1.46);
  // A side face can internally reflect once before the ray leaves the glass.
  if(dot(outgoing,outgoing)<.001){
   inside=reflect(inside,face);
   exitPoint=exitCube(exitPoint+inside*.001,inside,face);
   outgoing=refract(inside,-face,1.46);
  }
  if(dot(outgoing,outgoing)>.001){
   vec3 exitWorld=(matrix_model*vec4(exitPoint,1.)).xyz;
   vec3 direction=normalize(mat3(matrix_model)*outgoing);
   vec3 directionView=mat3(matrix_view)*direction;
   float exitDepth=(matrix_view*vec4(exitWorld,1.)).z;
   float travel=max(0.,(-refractionDepth-exitDepth)/min(-.06,directionView.z));
   vec4 projected=matrix_viewProjection*vec4(exitWorld+direction*travel,1.);
   vec2 opticalUv=projected.xy/max(.001,projected.w)*.5+.5;
   bend=mix(bend,clamp(opticalUv-screen,vec2(-.22),vec2(.22)),orbGain);
  }
 }
 vec2 sampleUv=clamp(screen+bend,vec2(.001),vec2(.999));
 vec2 dispersion=bend*mix(.025,.002,orbGain);
 vec3 transmitted=vec3(texture2D(uSceneColorMap,clamp(sampleUv+dispersion,vec2(.001),vec2(.999))).r,
 texture2D(uSceneColorMap,sampleUv).g,texture2D(uSceneColorMap,clamp(sampleUv-dispersion,vec2(.001),vec2(.999))).b);
 transmitted*=vec3(.97,.985,1.);
 vec3 R=reflect(-V,N);
 vec3 reflected=linearColor(textureCube(reflectionMap,R).rgb);
 // Account glass shares the crystals' HDR lighting. Its neutral highlights
 // reveal the bevels without painting a constant blue layer over every face.
 if(orbGain>.001) reflected=mix(reflected,environmentReflection(R)*vec3(.70,.84,1.)*.7,orbGain);
 vec3 L=normalize(cloudCenter-world);
 float reach=1./(1.+dot(cloudCenter-world,cloudCenter-world)*.00022);
 reflected+=linearColor(vec3(.18,.35,.77))*pow(max(0.,dot(R,L)),5.)*reach;
 vec3 color=mix(transmitted,reflected,.07+fresnel*.65);
 color+=linearColor(vec3(.055,.075,.12))*(.20+.60*max(0.,dot(N,L)))*reach;
 for(int i=0;i<4;i++){
  vec3 delta=laserPositions[i]-world;
  float attenuation=1./(1.+dot(delta,delta)*.009);
  vec3 H=normalize(normalize(delta)+V);
  float spec=pow(max(0.,dot(N,H)),88.);
  color+=linearColor(laserColors[i])*attenuation*spec*.32;
 }
 // About glass reflects the actual clock positions, including their converging
 // fan motion. A broad blue lobe surrounds a small white reflection; the
 // refracted lobe appears through the opposite face as the cube tumbles.
 if(orbGain>.001){
  vec3 T=refract(-V,N,1./1.46);
  vec3 orbital=vec3(0.);
  for(int i=0;i<7;i++){
   vec3 delta=orbPositions[i]-world, direction=normalize(delta);
   float attenuation=1./(1.+dot(delta,delta)*.006);
   float alignment=max(0.,dot(R,direction));
   float halo=pow(alignment,4.);
   float glint=pow(alignment,36.);
   float through=pow(max(0.,dot(T,direction)),28.);
   orbital+=attenuation*(linearColor(vec3(.16,.53,1.))*halo*.48
     +vec3(.72,.91,1.)*glint*1.05+linearColor(vec3(.12,.38,.85))*through*.28);
  }
  color+=orbGain*orbital/(vec3(1.)+orbital)*.9;
 }
 float edge=pow(1.-facing,2.);
 vec3 deathGlass=vec3(color.r*.95+color.b*.75,color.g*.24,color.b*.22);
 deathGlass+=linearColor(vec3(.32,.075,.10))*(.18+max(0.,dot(N,L))*.65+edge*.45)*reach;
 color=mix(color,deathGlass,errorAmount);
 gl_FragColor=vec4(color*uGain,1.);
}`});
  m.name="PS2 refractive blue glass";m.blendType=pc.BLEND_NORMAL;
  m.depthWrite=true;m.cull=pc.CULLFACE_BACK;
  m.setParameter("reflectionMap",environment);m.setParameter("normalMap",normalMap);
  m.setParameter("menuEnvironment",normalMap);m.setParameter("menuEnvironmentEncoding",0);
  m.setParameter("eye",[0,0,-60]);m.setParameter("viewport",[1280,800]);
  m.setParameter("cloudCenter",[0,0,-112]);m.setParameter("uGain",0);m.setParameter("errorAmount",0);
  m.setParameter("worldToCube",pc.Mat4.IDENTITY.data);m.setParameter("refractionDepth",30.6);
  m.setParameter("laserPositions[0]",new Float32Array(12));m.setParameter("laserColors[0]",new Float32Array([.18,1,.08,1,.1,.5,1,.02,.08,.58,.22,1]));
  m.setParameter("orbPositions[0]",new Float32Array(21));m.setParameter("orbGain",0);
  m.update();return m;
}

export function createGlassNormal(device) {
  const size = 128,
    t = new pc.Texture(device, {
      name: "Optical glass surface",
      width: size,
      height: size,
      format: pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
      magFilter: pc.FILTER_LINEAR,
      addressU: pc.ADDRESS_REPEAT,
      addressV: pc.ADDRESS_REPEAT,
    });
  const bytes = t.lock();
  const height = (x, y) =>
    Math.sin(x * 0.074 + Math.sin(y * 0.043) * 2) * 0.5 +
    Math.sin(y * 0.098 + x * 0.032) * 0.35;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 2.8,
        ny = (height(x, y - 1) - height(x, y + 1)) * 2.8;
      const length = Math.hypot(nx, ny, 1),
        p = (y * size + x) * 4;
      bytes[p] = ((nx / length) * 0.5 + 0.5) * 255;
      bytes[p + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      bytes[p + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      bytes[p + 3] = 255;
    }
  t.unlock();
  return t;
}

export function createGlassCube(device) {
  // Micro bevels provide actual surfaces for grazing light to catch. The body stays a cube.
  const bevel = 0.018,
    inner = 0.5 - bevel,
    axis = [-0.5, -inner, inner, 0.5];
  const faces = [
    [
      [1, 0, 0],
      [0, 0, -1],
      [0, 1, 0],
    ],
    [
      [-1, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, -1],
    ],
    [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    [
      [0, 0, 1],
      [1, 0, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, -1],
      [-1, 0, 0],
      [0, 1, 0],
    ],
  ];
  const positions = [],
    normals = [],
    uvs = [],
    indices = [];
  faces.forEach(([n, u, v], face) => {
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const p = n.map((a, i) => a * 0.5 + u[i] * axis[x] + v[i] * axis[y]);
        const base = p.map((a) => Math.max(-inner, Math.min(inner, a)));
        const delta = p.map((a, i) => a - base[i]),
          length = Math.hypot(...delta);
        const normal = delta.map((a) => a / length);
        positions.push(...base.map((a, i) => a + normal[i] * bevel));
        normals.push(...normal);
        uvs.push(axis[x] + 0.5, axis[y] + 0.5);
      }
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < 3; x++) {
        const a = face * 16 + y * 4 + x;
        indices.push(a, a + 1, a + 4, a + 1, a + 5, a + 4);
      }
  });
  const mesh = new pc.Mesh(device);
  mesh.setPositions(positions);
  mesh.setNormals(normals);
  mesh.setUvs(0, uvs);
  mesh.setIndices(indices);
  mesh.update();
  return mesh;
}
