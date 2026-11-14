import { describe,it,expect } from "vitest";
import { Vec3 } from "playcanvas";
import { crystalPlacement } from "./worldGeometry";

describe("reference crystal placement",()=>{
  it("keeps every twisted shaft on its radial spoke and in the clock plane",()=>{
    for(let i=0;i<12;i++) {
      const {position,rotation}=crystalPlacement(i);
      const radial=new Vec3(...position).normalize();
      const shaft=rotation.transformVector(new Vec3(0,1,0)).normalize();
      expect(shaft.dot(radial)).toBeCloseTo(1,6);
      expect(shaft.z).toBeCloseTo(0,6);
      // The inner and outer caps must remain collinear with the clock center.
      const inner=new Vec3(...position).sub(shaft.clone().mulScalar(5.25));
      expect(new Vec3().cross(inner,radial).length()).toBeLessThan(.000001);
    }
  });
});
