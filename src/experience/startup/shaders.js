import { displayToLinear } from "./referenceClock";
export const vertex = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv0;
uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
varying vec2 uv;
varying vec3 world;
varying vec3 normal;
void main(void) {
  uv=aUv0;
  vec4 p=matrix_model*vec4(aPosition,1.);
  world=p.xyz;
  normal=normalize(mat3(matrix_model)*aNormal);
  gl_Position=matrix_viewProjection*p;
}`;

// Bounded 3D volume for startup/login; a cheaper analytic tunnel for the menu.
// No intersecting XY sheets, fluid simulation or full-screen blur pyramid.
export const fogVertex = `
attribute vec3 aPosition;
attribute vec2 aUv0;
varying vec2 uv;
void main(void) {
  uv=aUv0;
  gl_Position=vec4(aPosition.x*2.,aPosition.z*2.,.999,1.);
}`;
export const fog = `
precision highp float;
${displayToLinear}
varying vec2 uv;
uniform sampler2D density;
uniform float clock;
uniform float uGain;
uniform vec3 eye;
uniform vec3 rayRight;
uniform vec3 rayUp;
uniform vec3 rayForward;
uniform vec3 cloudCenter;
uniform vec3 cloudRadius;
uniform float crystalWorld;
uniform float smokeDepth;
uniform vec3 voidCenter;
uniform float errorAmount;
uniform float worldStage;
uniform sampler2D referenceNoise;
uniform sampler2D startupSmoke;
float noise3(vec3 p) {
  vec3 cell=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  vec2 lookup=cell.xy+vec2(37.,17.)*cell.z+f.xy;
  vec2 slices=texture2D(density,(lookup+.5)/128.).rg;
  return mix(slices.r,slices.g,f.z);
}
// Analytic adaptation of rrtry/CrystalClock's MIT tunnel shader. The original
// noise texture, palette and point-light falloff produce the reference look.
vec3 referenceTunnel(vec3 rd) {
  vec3 axis=normalize(voidCenter-eye);
  float axial=dot(rd,axis);
  vec3 radial=rd-axis*axial;
  vec3 ray=normalize(axis*axial+radial*1.69);
  axial=dot(ray,axis);radial=ray-axis*axial;
  float d=min(240.,20./max(.0001,length(radial)));
  float depth=d*axial;
  if(depth<0.) return vec3(0.);
  vec3 right=normalize(cross(axis,vec3(0.,1.,0.)));
  vec3 up=cross(right,axis);
  float angle=atan(dot(radial,up),dot(radial,right))/6.2831853+.5;
  vec2 coord=vec2(angle+clock*.004,depth/100.+smokeDepth*.008);
  // Broad advected cloud banks, with the original tunnel texture contributing
  // fine variation. A single high-frequency texture otherwise forms radial ribs.
  // Advect the banks towards the viewer along the tunnel axis. The previous
  // slow +Z texture offset read as almost stationary behind the crystal ring.
  vec3 cloud=ray*d+axis*smokeDepth*1.25;
  float bank=noise3(cloud*.11)*.48+noise3(cloud*.30+7.)*.33+noise3(cloud*.78-4.)*.19;
  float n=mix(smoothstep(.25,.78,bank),texture2D(referenceNoise,fract(coord)).r,.06);
  float t=smoothstep(.10,.90,n);
  vec3 purple=mix(vec3(.33,.24,.43),vec3(.12,.08,.21),t);
  vec3 blue=mix(vec3(.10,.16,.36)*1.25,vec3(.035,.065,.19),t);
  vec3 palette=mix(blue,purple,crystalWorld);
  palette=mix(palette,mix(vec3(.48,.012,.025),vec3(.20,.002,.006),t),errorAmount);
  float lighting=(.1+20./d)/(1.+.007*d+.0002*d*d);
  // Smooth extinction replaces the finite cylinder's abrupt black opening.
  float fade=exp(-d*.009);
  // Calibrated in display space against the supplied menu video, not a global
  // camera exposure (which would also wash out the crystal reflections).
  vec3 calibration=mix(vec3(1.65,1.65,1.8),vec3(1.10,1.08,1.12),crystalWorld);
  return palette*lighting*fade*calibration+vec3(.010,.009,.019)*crystalWorld;
}
void main(void) {
  vec2 screen=uv*2.-1.;
  vec3 rd=normalize(rayForward+screen.x*rayRight-screen.y*rayUp);
  vec3 distantVeil=vec3(.006,.012,.035)*step(.5,worldStage)*(1.-crystalWorld)*(1.-errorAmount);
  if(worldStage>.5 && crystalWorld>.999) {
    gl_FragColor=vec4(ps2Linear(referenceTunnel(rd)*uGain),1.);return;
  }
  // A hollow viewing cone keeps the entire depth behind the clock clear.
  // Clearing just a small sphere would still show distant smoke through its center.
  vec3 toClock=voidCenter-eye;
  float clockDistance=length(toClock);
  vec3 clockAxis=toClock/clockDistance;
  float along=dot(rd,clockAxis);
  float clockRadius=length(rd-clockAxis*along)*clockDistance/max(.01,along);
  // Density tapers continuously all the way to the center: no hard black disk.
  float clearCore=1.-exp(-pow(clockRadius/9.5,2.1));
  float atmosphere=mix(1.,clearCore,crystalWorld);
  if(atmosphere<.0001) { gl_FragColor=vec4(0.,0.,0.,1.); return; }
  vec3 ro=(eye-cloudCenter)/cloudRadius;
  vec3 direction=rd/cloudRadius;
  float a=dot(direction,direction), b=dot(ro,direction);
  float h=b*b-a*(dot(ro,ro)-1.);
  if(h<=0.) { gl_FragColor=vec4(ps2Linear(distantVeil*uGain),1.); return; }
  float nearT=max(0.,(-b-sqrt(h))/a), farT=(-b+sqrt(h))/a;
  float steps=worldStage>.5 ? 16. : 20.;
  float stepT=max(0.,farT-nearT)/steps;
  float transmittance=1.;
  vec3 radiance=vec3(0.);
  for(int i=0;i<20;i++) {
    if(float(i)>=steps) break;
    vec3 p=eye+rd*(nearT+(float(i)+.5)*stepT);
    vec3 local=(p-cloudCenter)/cloudRadius;
    float edge=1.-smoothstep(.30,1.,length(local));
    // Advect towards the viewer and expand from the core: a slow outward flow.
    vec3 flow=(p-cloudCenter)/(1.+.10*sin(clock*.10));
    flow.z-=smokeDepth;
    // Translate a coherent volume. Subtracting an unbounded radial offset
    // folded the field across its origin after a few minutes (spoked rays).
    flow.xy+=vec2(sin(clock*.13),cos(clock*.11))*.75;
    // Long density structures along Z retain the visible wisps while rays
    // pass through them; isotropic noise averaged into a uniform blue glow.
    float coarse=noise3(flow*vec3(.13,.13,.028));
    float shaped=(texture2D(startupSmoke,flow.xy*.032+vec2(.5+clock*.007,.5)).r*.75
      +texture2D(startupSmoke,flow.yz*.027+vec2(.5,.5+clock*.005)).r*.25);
    float n=coarse*.5+sqrt(shaped)*.5;
    float clump=smoothstep(.23,.67,n);
    float amount=(.0001+pow(clump,2.)*.11)*edge*atmosphere;
    float opacity=1.-exp(-amount*stepT);
    float core=exp(-dot(local*vec3(1.5,1.5,.7),local*vec3(1.5,1.5,.7))*2.);
    vec3 blue=mix(vec3(.001,.002,.008),vec3(.10,.16,.46),pow(core,1.5));
    vec3 purple=mix(vec3(.012,.008,.028),vec3(.078,.045,.15),core);
    blue=mix(blue,purple,crystalWorld*.82);
    vec3 deathRim=mix(vec3(.014,.007,.006),vec3(.09,.025,.030),clump);
    vec3 deathCore=mix(vec3(.20,.018,.052),vec3(.80,.20,.39),pow(core,2.5));
    blue=mix(blue,mix(deathRim,deathCore,pow(core,1.8)),errorAmount);
    blue*=.06+pow(clump,1.4)*1.5+pow(shaped,1.6)*4.;
    radiance+=transmittance*opacity*blue;
    transmittance*=1.-opacity;
  }
  // Preserve the supplied smoke's curled structure in the light field as well
  // as density. Integrating density alone smoothed the wisps into a blue wash.
  vec3 focus=eye+rd*max(0.,dot(cloudCenter-eye,rd));
  vec2 wisp=(focus.xy-cloudCenter.xy)*.028;
  vec2 drift=vec2(sin(clock*.037),cos(clock*.031))*.035;
  vec2 flowUv=wisp+drift;
  float curls=texture2D(startupSmoke,flowUv+vec2(.5,.5)).r*.75
    +texture2D(startupSmoke,flowUv*.72+vec2(.35,.58)-drift*.6).r*.25;
  radiance*=(.18+smoothstep(.025,.58,curls)*1.65)*(worldStage>.5 ? .55 : .22);
  if(worldStage>.5) radiance=mix(radiance,referenceTunnel(rd),crystalWorld);
  gl_FragColor=vec4(ps2Linear((radiance+distantVeil)*uGain),1.);
}`;

export const pillarVertex=vertex.replace("attribute vec2 aUv0;",`attribute vec2 aUv0;
attribute vec2 aUv1;
attribute vec4 aColor;
varying float front;
varying float columnDepth;
varying vec3 capColor;
varying float columnClarity;`)
  .replace("uv=aUv0;", "uv=aUv0;front=aUv1.x;columnDepth=aUv1.y;capColor=aColor.rgb;columnClarity=aColor.a;");
export const pillar = `
precision highp float;
${displayToLinear}
varying vec2 uv;
varying vec3 world;
varying vec3 normal;
uniform float uGain;
varying float front;
varying float columnDepth;
uniform vec3 cloudCenter;
uniform float visibility;
varying vec3 capColor;
varying float columnClarity;
uniform sampler2D density;
uniform float clock;
uniform float errorAmount;
void main(void) {
  // Smooth blue-grey face gradients, like the reference's CSS cuboids.
  // There is deliberately no noisy image or smoke texture on these surfaces.
  float endFade=clamp((world.z-front+columnDepth)/columnDepth,0.,1.);
  float cap=step(.9,abs(normal.z));
  vec3 toLight=cloudCenter-world;
  float attenuation=1./(1.+dot(toLight,toLight)*.0012);
  float face=.84+max(0.,dot(normal,normalize(toLight)))*attenuation*.16;
  vec3 tone=normal.y>.5 ? vec3(.27,.32,.48) : normal.y<-.5 ? vec3(.10,.14,.26) : vec3(.18,.23,.40);
  // Broad light emitted by the central cloud: pale caps, cooler recessed sides.
  // Spatial falloff keeps the far corners slate instead of lighting everything equally.
  float cloudLight=exp(-dot(world.xy,world.xy)/400.)*(.65+.35*exp(-toLight.z*toLight.z/500.));
  float facing=.35+.65*max(0.,dot(normal,normalize(toLight)));
  vec3 litCap=mix(vec3(.075,.10,.19),vec3(.98,1.,1.12),clamp(cloudLight*1.65,0.,1.));
  litCap*=.78+capColor*vec3(.30,.29,.23);
  tone=mix(tone,litCap,cap);
  tone+=vec3(.04,.10,.27)*cloudLight*facing*(1.-cap);
  float gradient=mix(pow(endFade,1.65),1.,cap);
  float border=1.-smoothstep(.0,.018,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
  vec3 color=tone*face*mix(.12+.88*pow(endFade,1.8),1.,cap);
  color+=vec3(.025,.07,.12)*border*gradient*attenuation;
  // Haze changes reflected light, never the short columns' surface opacity.
  // Depth writes make the caps and shafts correctly hide geometry behind them.
  float distant=1.-step(.99,columnClarity);
  float mist=texture2D(density,world.xy*.018+vec2(clock*.003,world.z*.006)).r;
  vec3 distantLight=color*(.55+.45*columnClarity);
  vec3 blueMist=vec3(.018,.035,.085)*(.8+.2*mist);
  color=mix(color,mix(distantLight,blueMist,.38+.22*mist),distant);
  color=mix(color,vec3(dot(color,vec3(.3,.5,.2))*.8,.006,.012),errorAmount);
  float surfaceAlpha=mix(.92*mix(pow(endFade,1.15)*.90,.95,cap),1.,distant);
  gl_FragColor=vec4(ps2Linear(color*uGain),visibility*surfaceAlpha);
}`;

export const light = `
precision highp float;
${displayToLinear}
varying vec2 uv;
uniform vec3 tint;
uniform float uGain;
void main(void) {
  vec2 p=(uv-.5)*2.;
  float r=length(p);
  float halo=exp(-r*r*6.5)*.4;
  float core=exp(-r*r*110.);
  float flare=exp(-p.y*p.y*700.-p.x*p.x*12.)*.20;
  float mask=1.-smoothstep(.65,1.,r);
  gl_FragColor=vec4(ps2Linear((tint*(halo+flare)+vec3(core))*uGain*mask),mask);
}`;

export const clockLight = `
precision highp float;
${displayToLinear}
varying vec2 uv;
uniform float uGain;
void main(void) {
  float r=length((uv-.5)*2.);
  float core=1.-smoothstep(.08,.14,r);
  float whiteBloom=exp(-r*r*55.)*.9;
  float cyanHalo=exp(-r*r*13.)*.68;
  float blueHalo=exp(-r*r*3.5)*.28;
  vec3 light=vec3(core+whiteBloom)+vec3(0.,.8,1.)*cyanHalo+vec3(0.,.20,1.)*blueHalo;
  float mask=1.-smoothstep(.80,1.,r);
  gl_FragColor=vec4(ps2Linear(light*uGain*mask),mask);
}`;

export const trailVertex = `
attribute vec3 aPosition;
attribute vec4 aColor;
uniform mat4 matrix_viewProjection;
varying vec4 color;
void main(void) {color=aColor;gl_Position=matrix_viewProjection*vec4(aPosition,1.);}`;
export const trailFragment = `
precision highp float;
${displayToLinear}
varying vec4 color;
uniform float uGain;
void main(void) {gl_FragColor=vec4(ps2Linear(color.rgb*uGain),color.a);}`;

// Static ribbon vertices carry (history fraction, side). Orbit evaluation lives
// on the GPU, avoiding 1,008 Date/vector operations and buffer uploads per frame.
export const clockTrailVertex=`
attribute vec3 aPosition;
attribute vec4 aColor;
uniform mat4 matrix_viewProjection;
uniform float timeOfDay;
uniform float clockIndex;
uniform vec3 viewer;
varying vec4 color;
vec3 orbit(float time) {
  float second=mod(time,60.);
  float minute=mod(floor(time/60.),60.);
  float hour=mod(floor(time/3600.),12.);
  float phase=second*clockIndex*3.14159265/30.;
  vec3 p=vec3(cos(phase)*3.4,sin(phase)*3.4,clockIndex*.0075);
  float a=1.57079633-(hour+minute/60.+second/3600.)*.52359878;
  float c=cos(a),s=sin(a);p.xy=mat2(c,s,-s,c)*p.xy;
  float m=mod(minute,3.);
  float tilt=m<.5 ? 1.57079633 : m<1.5 ? 3.66519143 : 0.;
  float next=m<.5 ? 3.66519143 : m<1.5 ? 0. : 1.57079633;
  a=second*1.57079633+mix(tilt,next,second/60.);
  c=cos(a);s=sin(a);p.yz=mat2(c,s,-s,c)*p.yz;
  a=-second*3.14159265;c=cos(a);s=sin(a);p.xy=mat2(c,s,-s,c)*p.xy;
  return p+vec3(0.,0.,-112.);
}
void main() {
  float age=aPosition.x;
  vec3 p=orbit(timeOfDay-age*1.15),previous=orbit(timeOfDay-age*1.15-.025);
  vec3 side=normalize(cross(p-previous,viewer-p));
  p+=side*aPosition.y*.045*(1.-age);
  color=aColor;
  gl_Position=matrix_viewProjection*vec4(p,1.);
}`;
