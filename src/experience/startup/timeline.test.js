import { describe, it, expect } from "vitest";
import {
  cameraAt,
  cubeProjection,
  cubeAngles,
  lightAt,
  laserWorldAt,
  titleOpacity,
  STARTUP_DURATION,
} from "./timeline";

describe("startup timeline", () => {
  it("renders the same pose when scrubbing backwards or replaying", () => {
    const snapshot = (t) => ({
      camera: cameraAt(t),
      cubes: Array.from({ length: 5 }, (_, i) => [
        cubeProjection(i, t),
        cubeAngles(i, t),
      ]),
      green: lightAt("green", t),
    });
    const first = snapshot(1.5);
    snapshot(4);
    snapshot(0);
    snapshot(3.75);
    expect(snapshot(1.5)).toEqual(first);
  });
  it("keeps the measured green light at its recorded position", () => {
    const point = lightAt("green", 1.5);
    expect(Math.abs(point.x - 0.226567) * 1920).toBeLessThan(1);
    expect(Math.abs(point.y - 0.626186) * 1080).toBeLessThan(1);
  });
  it("accelerates late and fades fully by the end of the recording", () => {
    const early = Math.abs(cameraAt(1.5).z - cameraAt(1).z);
    const late = Math.abs(cameraAt(3.5).z - cameraAt(3).z);
    expect(late).toBeGreaterThan(early * 10);
    expect(cameraAt(0).exposure).toBe(0);
    expect(cameraAt(STARTUP_DURATION).exposure).toBe(0);
    expect(titleOpacity(0.8)).toBe(0);
    expect(titleOpacity(2)).toBe(1);
    expect(titleOpacity(3.3)).toBe(0);
  });
  it("has finite poses across the complete sequence, including its endpoints", () => {
    for (let t = 0; t <= STARTUP_DURATION; t += 1 / 30) {
      expect(Number.isFinite(cameraAt(t).z)).toBe(true);
      for (let i = 0; i < 5; i++) {
        expect(cubeProjection(i, t).every(Number.isFinite)).toBe(true);
        expect(cubeProjection(i, t)[2]).toBeGreaterThan(0);
      }
    }
  });
});

describe("startup laser depth and close pass",()=>{
  const point=(name,t)=>laserWorldAt(name,t,{set(x,y,z){return [x,y,z];}});
  it("continues red and pink through the pass instead of bouncing",()=>{
    for(let t=1;t<2.6;t+=1/60) {
      expect(lightAt("pink",t+.01).x).toBeGreaterThan(lightAt("pink",t).x);
      expect(lightAt("red",t+.01).x).toBeLessThan(lightAt("red",t).x);
    }
  });
  it("gives close screen crossings different world depths",()=>{
    const a=point("pink",1.5),b=point("red",1.5);
    expect(Math.abs(a[2]-b[2])).toBeGreaterThan(15);
    expect(Math.hypot(...a.map((n,i)=>n-b[i]))).toBeGreaterThan(15);
  });
  it("keeps continuous finite world trails while the camera flies past",()=>{
    for(const name of ["green","pink","red","violet"]) {
      for(let t=.3;t<4;t+=1/60) {
        const a=point(name,t),b=point(name,t+.001);
        expect(a.every(Number.isFinite)).toBe(true);
        expect(Math.hypot(...a.map((n,i)=>n-b[i]))).toBeLessThan(1);
      }
    }
  });
});
