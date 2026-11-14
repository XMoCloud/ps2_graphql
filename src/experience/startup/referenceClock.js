// CrystalClock shader adaptation, MIT, copyright 2025 rrtry.
// Full notice: public/experience/crystal-clock/LICENSE.txt.
import * as pc from "playcanvas";



export const displayToLinear=`
vec3 ps2Linear(vec3 c) {
  return mix(c/12.92,pow((max(c,vec3(0.))+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));
}`;

const vertex=`
attribute vec3 vertexPosition;
attribute vec2 vertexTexCoord;
attribute vec3 vertexNormal;
attribute vec4 vertexTangent;
uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying float vCap;
void main() {
  vec4 p=matrix_model*vec4(vertexPosition,1.);
  vWorld=p.xyz;vUv=vertexTexCoord;
  vCap=step(.98,abs(vertexNormal.y));
  vNormal=normalize(mat3(matrix_model)*vertexNormal);
  vTangent=normalize(mat3(matrix_model)*vertexTangent.xyz);
  vBitangent=cross(vNormal,vTangent)*vertexTangent.w;
  gl_Position=matrix_viewProjection*p;
}`;
const fragment=`
precision highp float;
uniform sampler2D normalMap;
uniform sampler2D ccEnvironment;
uniform sampler2D ccCloud;
uniform float ccEnvironmentEncoding;
uniform float uGain;
uniform vec3 viewPos;
uniform vec3 ccDiffuse;
uniform vec3 ccOrbPositions[7];
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying float vCap;
${displayToLinear}
vec3 environment(vec3 direction) {
  vec2 uv=vec2(atan(direction.z,direction.x)/6.2831853+.5,acos(clamp(direction.y,-1.,1.))/3.14159265);
  vec4 texel=texture2D(ccEnvironment,uv);
  vec3 color=texel.rgb;
  if(ccEnvironmentEncoding>.5 && ccEnvironmentEncoding<1.5) color*=exp2(texel.a*255.-128.);
  if(ccEnvironmentEncoding<.5) color=pow(color,vec3(2.2));
  return color/(color+vec3(2.));
}
void main() {
  vec3 V=normalize(viewPos-vWorld);
  vec3 micro=texture2D(normalMap,vUv*1.4).xyz*2.-1.;
  // Correct tangent-to-world basis: normal, view and all lights share one space.
  vec3 N=normalize(vNormal+mat3(vTangent,vBitangent,vNormal)*vec3(micro.xy*.035,0.));
  float facing=abs(dot(N,V));
  float fresnel=.055+.76*pow(1.-facing,3.);
  vec3 R=reflect(-V,N), T=refract(-V,N,1./1.46);
  vec3 reflected=environment(R), refracted=environment(T);
  vec3 color=ps2Linear(ccDiffuse)*(.28+.38*max(0.,dot(N,normalize(vec3(-.6,.8,1.)))));
  // The video alternates nearly black interior faces with blue-white bevels.
  // Neutral specular light stays separate from violet absorption, so a bright
  // reflected source can turn a face silver instead of merely lighter purple.
  color+=reflected*ps2Linear(vec3(.60,.73,1.))*(.14+fresnel*1.4);
  color+=refracted*ps2Linear(vec3(.25,.34,.68))*(.15+.34*(1.-facing));
  float cloud=texture2D(ccCloud,fract(vUv*.14+R.xy*.32+.5)).r;
  color+=ps2Linear(ccDiffuse)*cloud*.24;
  color+=ps2Linear(vec3(.36,.43,.74))*pow(1.-facing,2.)*.22;
  // Shared world lighting, never an index-specific cyan material. Its textured
  // reflection migrates across the six broad faces during the complete turn.
  vec3 key=normalize(vec3(-.40,-.55,.74));
  float keyAlignment=max(0.,dot(R,key));
  float keySpec=pow(keyAlignment,12.);
  color+=ps2Linear(vec3(.23,.67,.85))*keySpec*(.8+cloud*1.2);
  color+=vec3(.38,.65,.82)*pow(keyAlignment,48.)*.35;
  color*=1.-vCap*.30;
  for(int i=0;i<7;i++) {
    vec3 L=ccOrbPositions[i]-vWorld;
    float attenuation=1./(1.+dot(L,L)*.014);
    vec3 direction=normalize(L);
    float alignment=max(0.,dot(R,direction));
    float spec=pow(alignment,42.);
    float halo=pow(alignment,9.);
    float transmitted=pow(max(0.,dot(T,direction)),20.);
    color+=attenuation*(vec3(.78,.94,1.)*spec*1.35
      +ps2Linear(vec3(.18,.58,1.))*halo*.32
      +ps2Linear(vec3(.16,.39,.83))*transmitted*.22);
  }
  gl_FragColor=vec4(color*uGain,(.68+fresnel*.22)*uGain);
}`;

export function referenceCrystal(device,normalTexture,index) {
  const m=new pc.ShaderMaterial({uniqueName:"CrystalClock-MIT-reference",vertexGLSL:vertex,fragmentGLSL:fragment,
    attributes:{vertexPosition:pc.SEMANTIC_POSITION,vertexTexCoord:pc.SEMANTIC_TEXCOORD0,
      vertexNormal:pc.SEMANTIC_NORMAL,vertexTangent:pc.SEMANTIC_TANGENT}});
  m.blendType=pc.BLEND_NORMAL;
  m.cull=pc.CULLFACE_BACK;m.depthWrite=true;
  m.setParameter("normalMap",normalTexture);
  const color=[.145,.065,.34];
  m.setParameter("ccAmbient",color);m.setParameter("ccDiffuse",color);
  m.setParameter("ccSpecular",[.45,.65,1]);m.setParameter("ccShininess",28);
  m.setParameter("ccDirection",[0,0,-1]);
  m.setParameter("ccDirAmbient",[.5,.5,.5]);m.setParameter("ccDirDiffuse",[.8,.8,.8]);
  m.setParameter("ccDirSpecular",[.08,.12,.25]);
  m.setParameter("ccOrbPositions[0]",new Float32Array(21));
  m.setParameter("ccViewport",[1280,800]);
  m.setParameter("ccTransmission",[.22,.08,.63]);
  m.setParameter("viewPos",[0,0,-82]);m.setParameter("uGain",0);
  m.update();return m;
}
