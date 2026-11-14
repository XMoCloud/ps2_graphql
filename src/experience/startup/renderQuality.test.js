import { describe,it,expect } from "vitest";
import { renderPixelRatio } from "./renderQuality";
describe("standard render resolution",()=>{
  it("preserves native desktop and 4K geometry resolution",()=>{
    expect(renderPixelRatio(2560,1440,1)).toBe(1);
    expect(renderPixelRatio(3840,2160,1)).toBe(1);
    expect(renderPixelRatio(1920,1080,2)).toBe(2);
  });
  it("bounds very large high-DPI buffers",()=>{
    const r=renderPixelRatio(3840,2160,2);
    expect(3840*2160*r*r).toBeCloseTo(8300000);
  });
});
