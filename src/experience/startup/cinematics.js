import { clamp, smooth } from "./timeline";

export const PORTAL_COMMIT_MS=520;
export const PORTAL_DURATION_MS=1120;
export const PORTAL_ENTER_MS=600;
export const LOGIN_DISTANCE=37;
export const easeOut=t=>1-(1-clamp(t))**3;

export function arrivalCamera(age,login=true) {
  const progress=easeOut(age/1.18);
  return {
    distance:login ? 5+(LOGIN_DISTANCE-5)*progress : 52-21.4*progress,
    roll:login ? 112*(1-progress) : -12*(1-progress),
    reveal:smooth(.03,.48,age),
  };
}

export function portalCamera(age,login=false,entryAge=age-.56,stage="") {
  const approach=clamp(age/.46)**3;
  const enter=easeOut(entryAge/.56);
  return {
    approaching:stage ? stage === "leaving" : age<.52,
    approach,
    distance:login ? 5+(LOGIN_DISTANCE-5)*enter : 52-21.4*enter,
    roll:login ? 95*(1-enter) : -12*(1-enter),
    black:smooth(.25,.46,age)*(1-smooth(.59,.98,age)),
    active:Boolean(stage) || age>=0 && age<1.12,
  };
}
