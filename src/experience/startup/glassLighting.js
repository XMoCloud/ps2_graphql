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
void main(){vec4 p=matrix_model*vec4(aPosition,1.);world=p.xyz;
normal=normalize(mat3(matrix_model)*aNormal);uv=aUv;
gl_Position=matrix_viewProjection*p;}`,
    fragmentGLSL:`
precision highp float;
uniform sampler2D uSceneColorMap;uniform sampler2D normalMap;
uniform samplerCube reflectionMap;
uniform vec3 eye;uniform vec2 viewport;uniform vec3 cloudCenter;
uniform vec3 laserPositions[4];uniform vec3 laserColors[4];
uniform float uGain;uniform float errorAmount;
varying vec3 world;varying vec3 normal;varying vec2 uv;
vec3 linearColor(vec3 c){return pow(max(c,vec3(0.)),vec3(2.2));}
void main(){
 vec3 V=normalize(eye-world);
 vec3 micro=texture2D(normalMap,uv).rgb*2.-1.;
 vec3 N=normalize(normal+vec3(micro.xy*.025,0.));
 float facing=clamp(abs(dot(N,V)),0.,1.);
 float fresnel=.07+.72*pow(1.-facing,3.);
 vec2 screen=gl_FragCoord.xy/viewport;
 vec2 bend=N.xy*(.020+.016*(1.-facing));
 vec2 sampleUv=clamp(screen+bend,vec2(.001),vec2(.999));
 vec3 transmitted=vec3(texture2D(uSceneColorMap,sampleUv+bend*.025).r,
 texture2D(uSceneColorMap,sampleUv).g,texture2D(uSceneColorMap,sampleUv-bend*.025).b);
 transmitted*=vec3(.97,.985,1.);
 vec3 R=reflect(-V,N);
 vec3 reflected=linearColor(textureCube(reflectionMap,R).rgb);
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
 color=mix(color,vec3(color.r*.8+color.b*.8,color.g*.04,color.b*.06),errorAmount);
 gl_FragColor=vec4(color*uGain,1.);
}`});
  m.name="PS2 refractive blue glass";m.blendType=pc.BLEND_NORMAL;
  m.depthWrite=true;m.cull=pc.CULLFACE_BACK;
  m.setParameter("reflectionMap",environment);m.setParameter("normalMap",normalMap);
  m.setParameter("eye",[0,0,-60]);m.setParameter("viewport",[1280,800]);
  m.setParameter("cloudCenter",[0,0,-112]);m.setParameter("uGain",0);m.setParameter("errorAmount",0);
  m.setParameter("laserPositions[0]",new Float32Array(12));m.setParameter("laserColors[0]",new Float32Array([.18,1,.08,1,.1,.5,1,.02,.08,.58,.22,1]));
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
