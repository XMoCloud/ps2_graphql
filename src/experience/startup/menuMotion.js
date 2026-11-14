const clamp01 = n => Math.max(0,Math.min(1,n));
export const SMOKE_DRIFT = 1.4;
export const MENU_ORDER = ["dashboard","projects","audits","skills"];

export function menuDirection(from,to) {
  const a=MENU_ORDER.indexOf(from), b=MENU_ORDER.indexOf(to);
  return a<0 || b<0 ? 0 : Math.sign(b-a);
}

// Integrating this pulse, rather than changing a shader's clock multiplier,
// keeps cloud positions continuous when the speed changes or clicks interrupt.
export function smokeTravelDistance(age,direction) {
  const t=clamp01(age);
  return direction*16*(t/2-Math.sin(2*Math.PI*t)/(4*Math.PI));
}
export function smokeSpeed(age,direction) {
  const pulse=age>=0 && age<1 ? Math.sin(Math.PI*age)**2 : 0;
  return SMOKE_DRIFT+direction*16*pulse;
}

// Integral of a brief speed pulse. Keep its completed angle on every click so
// even interrupted bursts accelerate the current rotation without a pose reset.
export function rotationTravelDistance(age) {
  const t=clamp01(age/.45);
  return 12*(t-Math.sin(t*Math.PI*2)/(Math.PI*2));
}

export function crystalRotation(seconds,extra=0) {
  return [-7+Math.sin(seconds*.16)*9,-10+seconds*7.5+extra,-3+seconds*.45];
}

// Clock-like seven-point fan on one precessing ring. The points periodically
// converge and separate, unlike seven independently offset ellipse animations.
// Derived from the observed clock behavior, with our own vector rotations.
export function clockOrbit(index,date,output) {
  const second=date.getSeconds()+date.getMilliseconds()/1000;
  const minute=date.getMinutes(), hour=date.getHours()%12;
  const phase=second*index*Math.PI/30, radius=3.4;
  let x=radius*Math.cos(phase), y=radius*Math.sin(phase), z=index*.0075;
  const clockAngle=Math.PI/2-(hour+minute/60+second/3600)*Math.PI/6;
  let c=Math.cos(clockAngle),s=Math.sin(clockAngle);
  [x,y]=[x*c-y*s,x*s+y*c];
  const tilts=[Math.PI/2,Math.PI*7/6,0];
  const tilt=tilts[minute%3]+(tilts[(minute+1)%3]-tilts[minute%3])*second/60;
  c=Math.cos(second*Math.PI/2+tilt);s=Math.sin(second*Math.PI/2+tilt);
  [y,z]=[y*c-z*s,y*s+z*c];
  c=Math.cos(-second*Math.PI);s=Math.sin(-second*Math.PI);
  return output.set(x*c-y*s,x*s+y*c,z-112);
}
