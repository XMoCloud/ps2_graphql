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
  vec3 reflected=environment(reflect(-V,N));
  vec3 refracted=environment(refract(-V,N,1./1.46));
  vec3 color=ps2Linear(ccDiffuse)*(.52+.48*max(0.,dot(N,normalize(vec3(-.6,.8,1.)))));
  // Deep tinted body, bright bevels and broad reflections reveal the six facets.
  color+=reflected*ps2Linear(vec3(.48,.40,.78))*(.24+fresnel*.55);
  color+=refracted*ps2Linear(ccDiffuse)*.35;
  float cloud=texture2D(ccCloud,fract(vUv*.14+reflect(-V,N).xy*.32+.5)).r;
  color+=ps2Linear(ccDiffuse)*cloud*.55;
  color+=ps2Linear(vec3(.52,.43,.78))*pow(1.-facing,1.3)*.45;
  // One glass material for every crystal. Cyan comes from a broad world-space
  // blue light/reflection, so the bright facets migrate as the ring rotates.
  vec3 key=normalize(vec3(-.78,.48,.54));
  float keySpec=pow(max(0.,dot(reflect(-V,N),key)),7.);
  float keyDiffuse=max(0.,dot(N,key));
  color=mix(color,ps2Linear(vec3(.20,.59,.72)),clamp(keySpec*.72+keyDiffuse*.08,0.,.85));
  for(int i=0;i<7;i++) {
    vec3 L=ccOrbPositions[i]-vWorld;
    float attenuation=1./(1.+dot(L,L)*.020);
    vec3 H=normalize(normalize(L)+V);
    float spec=pow(max(0.,dot(N,H)),18.);
    float transmittedGlow=pow(max(0.,dot(-N,normalize(L))),2.)*.055;
    color+=ps2Linear(vec3(.34,.65,1.))*attenuation*(spec*.55+max(0.,dot(N,normalize(L)))*.18+transmittedGlow);
  }
  color*=1.-vCap*.60;
  gl_FragColor=vec4(color*uGain,.74*uGain);
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
