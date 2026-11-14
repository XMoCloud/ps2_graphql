import { describe,it,expect } from "vitest";
import { clockOrbit,menuDirection,smokeSpeed,smokeTravelDistance,rotationTravelDistance,crystalRotation } from "./menuMotion";
import { WORLD_POSES } from "./worldGeometry";

describe("smoke navigation",()=>{
  it("uses tab order, with no travel pulse when entering from login",()=>{
    expect(menuDirection("dashboard","audits")).toBe(1);
    expect(menuDirection("skills","projects")).toBe(-1);
    expect(menuDirection("projects","projects")).toBe(0);
    expect(menuDirection("login","dashboard")).toBe(0);
  });
  it("keeps slow forward flow and finishes either rush after one second",()=>{
    expect(smokeSpeed(2,1)).toBe(1.4);
    expect(smokeSpeed(0,1)).toBe(1.4);
    expect(smokeSpeed(.5,1)).toBeGreaterThan(10);
    expect(smokeSpeed(.5,-1)).toBeLessThan(-10);
    expect(smokeSpeed(1,1)).toBe(1.4);
    expect(smokeSpeed(1,-1)).toBe(1.4);
  });
  it("retains travelled distance instead of snapping the cloud back",()=>{
    expect(smokeTravelDistance(0,1)).toBe(0);
    expect(smokeTravelDistance(1,1)).toBeCloseTo(8);
    expect(smokeTravelDistance(5,1)).toBe(smokeTravelDistance(1,1));
    expect(smokeTravelDistance(1,1)+smokeTravelDistance(1,-1)).toBeCloseTo(0);
  });
  it("keeps one camera pose for all account tabs",()=>{
    const poses=["dashboard","projects","audits","skills","journey","system"].map(k=>WORLD_POSES[k]);
    poses.forEach(pose=>expect(pose).toEqual(poses[0]));
  });
});

describe("crystal rotation",()=>{
  it("tilts the whole ring through depth over multiple reference frames",()=>{
    const start=crystalRotation(0),edge=crystalRotation(12),later=crystalRotation(24);
    expect(edge[1]-start[1]).toBeCloseTo(90);
    expect(later[1]-start[1]).toBeCloseTo(180);
  });
  it("retains the extra turn after a short tab burst, without resetting phase",()=>{
    expect(rotationTravelDistance(0)).toBe(0);
    expect(rotationTravelDistance(.225)).toBeCloseTo(6);
    expect(rotationTravelDistance(.45)).toBeCloseTo(12);
    expect(rotationTravelDistance(10)).toBeCloseTo(12);
    expect(crystalRotation(3,12)[1]-crystalRotation(3)[1]).toBeCloseTo(12);
  });
});

describe("clock light fan",()=>{
  const point=(i,second)=>{
    const out={set(x,y,z){return [x,y,z];}};
    return clockOrbit(i,new Date(2026,10,13,12,10,second),out);
  };
  const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  it("converges at the minute boundary and then fans out",()=>{
    expect(distance(point(0,0),point(6,0))).toBeLessThan(.05);
    expect(distance(point(0,5),point(6,5))).toBeGreaterThan(6.7);
  });
  it("keeps every light on the same spatial ring through its rotations",()=>{
    for(const seconds of [0,5,17,31,59]) for(let i=0;i<7;i++) {
      const [x,y,z]=point(i,seconds);
      expect(Math.hypot(x,y,z+112)).toBeCloseTo(3.4,2);
    }
  });
});
