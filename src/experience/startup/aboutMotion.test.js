import { describe, expect, it } from "vitest";
import { aboutCubeScale } from "./aboutMotion";

describe("PS2 cube reveal", () => {
  it("eases in over 600 ms and finishes shrinking after 450 ms", () => {
    expect(aboutCubeScale(0)).toBe(0);
    expect(aboutCubeScale(.15)).toBeLessThan(.25);
    expect(aboutCubeScale(.3)).toBeCloseTo(.5);
    expect(aboutCubeScale(.6)).toBe(1);
    expect(aboutCubeScale(5,0)).toBe(1);
    expect(aboutCubeScale(5,.225)).toBeCloseTo(.5);
    expect(aboutCubeScale(5,.45)).toBe(0);
  });
  it("closes an interrupted reveal without popping to full size", () => {
    const before = aboutCubeScale(.15);
    expect(aboutCubeScale(.15,0)).toBeCloseTo(before);
    expect(aboutCubeScale(.25,.10)).toBeLessThan(before);
    expect(aboutCubeScale(.60,.45)).toBe(0);
  });
});
