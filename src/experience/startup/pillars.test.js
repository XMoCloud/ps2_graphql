import { describe, it, expect } from "vitest";
import { startupVisibility, pillarField } from "./pillars";
import { navigationPulse, shortestAngle } from "./worldGeometry";

describe("startup and world transitions", () => {
  it("fills the rolled view with short, hazed columns while keeping the main lattice aligned", () => {
    const all = pillarField(), main = all.filter(p => p.clarity === 1), distant = all.filter(p => p.clarity < 1);
    expect(main).toHaveLength(108);
    expect(distant.length).toBeGreaterThan(100);
    expect(distant.every(p => p.depth < 10 && p.front < -140 && p.clarity >= .4 && p.clarity < .55)).toBe(true);
    expect(Math.max(...distant.map(p => p.y))).toBeGreaterThan(40);
    expect(new Set(all.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)).size).toBe(all.length);
  });
  it("shows glass immediately and never exposes login pillars in the startup", () => {
    expect(startupVisibility(0).blocks).toBe(1);
    expect(startupVisibility(0).pillars).toBe(0);
    expect(startupVisibility(3.3).pillars).toBe(0);
    expect(startupVisibility(3.8).pillars).toBe(0);
    for(let t=0;t<4.54;t+=1/60) expect(startupVisibility(t).pillars).toBe(0);
  });
  it("fades the startup glass and smoke fully to black", () => {
    expect(startupVisibility(4.5)).toEqual({blocks:0,smoke:0,pillars:0});
  });
  it("takes the short camera path across the angle boundary and ends the travel pulse", () => {
    const current = Math.PI-.1, target = -Math.PI+.1;
    expect(shortestAngle(current,target)-current).toBeCloseTo(.2);
    expect(navigationPulse(0)).toBe(0);
    expect(navigationPulse(.32)).toBe(1);
    expect(navigationPulse(.64)).toBe(0);
  });
});
