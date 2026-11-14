import { describe, expect, it } from "vitest";
import { ABOUT_CUBE_COUNT, aboutComposition, aboutCubePose } from "./aboutScene";
import { readFileSync } from "node:fs";
import { Mat4, Quat, Vec3 } from "playcanvas";
import { crystalPlacement, CRYSTAL_LAYOUT, WORLD_FOV, WORLD_POSES } from "./worldGeometry";

describe("About scene composition", () => {
  it("tumbles the five cubes independently without moving their anchors", () => {
    const turns = [];
    for (let i = 0; i < ABOUT_CUBE_COUNT; i++) {
      const before = aboutCubePose(i, 10, 1.6), after = aboutCubePose(i, 11, 1.6);
      expect(after.screen).toEqual(before.screen);
      expect(after.depth).toBe(before.depth);
      turns.push(after.rotation.map((n, axis) => Math.sign(n - before.rotation[axis])).join(","));
    }
    expect(new Set(turns).size).toBe(5);
    expect(turns).toEqual(["1,1,0", "-1,1,1", "1,-1,1", "1,0,-1", "0,-1,1"]);
  });
  it("retains the normal camera framing on desktop and phones", () => {
    for (const aspect of [.46, 1.6, 32/9]) {
      expect(aboutComposition(aspect).screenCenter).toEqual(CRYSTAL_LAYOUT.screenCenter);
      expect(aboutComposition(aspect).distance).toBe(WORLD_POSES.dashboard[2]);
    }
  });
  it("leaves screen space between tumbling cubes on phones and ultrawide screens", () => {
    const lens = Math.tan(WORLD_FOV*Math.PI/360);
    for (const aspect of [.4, .46, .9, 1.33, 1.6, 21/9, 32/9]) {
      const { distance, screenCenter } = aboutComposition(aspect);
      const height = 2*distance*lens;
      const view = new Mat4().setLookAt(new Vec3(0,0,distance),
        new Vec3((.5-screenCenter[0])*height*aspect,(screenCenter[1]-.5)*height,0),Vec3.UP).invert();
      for (let seconds=0; seconds<=16; seconds+=.25) {
        const boxes = Array.from({length:ABOUT_CUBE_COUNT}, (_,i) => {
          const {screen,depth,rotation,size} = aboutCubePose(i,seconds,aspect);
          const center = new Vec3((screen[0]-.5)*2*lens*aspect,(.5-screen[1])*2*lens,-1).normalize().mulScalar(depth);
          const turn = new Quat().setFromEulerAngles(...rotation);
          const points = Array.from({length:8}, (_,corner) => {
            const offset = new Vec3(...[0,1,2].map(axis=>((corner>>axis)&1 ? .5 : -.5)*size));
            const p = view.transformVector(turn.transformVector(offset)).add(center);
            return [.5+p.x/(-p.z*2*lens*aspect),.5-p.y/(-p.z*2*lens)];
          });
          return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
            top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
        });
        for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++) {
          const a=boxes[i], b=boxes[j];
          const gapX=Math.max(b.left-a.right,a.left-b.right)*aspect;
          const gapY=Math.max(b.top-a.bottom,a.top-b.bottom);
          expect(Math.max(gapX,gapY), `aspect ${aspect}, time ${seconds}, pair ${i}/${j}`).toBeGreaterThan(0);
        }
      }
    }
  });
  it("keeps the cubes in front of the full rotating asset on phones and ultrawide screens", () => {
    const vertices = readFileSync("public/experience/crystal-clock/prism.obj", "utf8")
      .split(/\r?\n/).filter(line => line.startsWith("v ")).map(line => line.split(/\s+/).slice(1).map(Number));
    let radius = 0;
    for (let i = 0; i < 12; i++) {
      const { position, rotation } = crystalPlacement(i);
      for (const [x,y,z] of vertices) {
        const vertex = rotation.transformVector(new Vec3(x*1.05, (y-5)*1.05, z*1.05)).add(new Vec3(...position));
        radius = Math.max(radius, vertex.length());
      }
    }
    for (const aspect of [.4, .46, .9, 1.33, 1.6, 16/9, 21/9, 32/9]) {
      const { distance, screenCenter } = aboutComposition(aspect);
      const height = 2*distance*Math.tan(WORLD_FOV*Math.PI/360);
      const eye = new Vec3(0,0,distance);
      const forward = new Vec3((.5-screenCenter[0])*height*aspect,(screenCenter[1]-.5)*height,0).sub(eye).normalize();
      const centerDepth = forward.dot(eye.mulScalar(-1));
      const nearestCrystal = centerDepth - radius;
      for (let i = 0; i < ABOUT_CUBE_COUNT; i++) {
        const cube = aboutCubePose(i, 10, aspect);
        expect(cube.depth + cube.size*Math.sqrt(3)/2).toBeLessThan(nearestCrystal - 1);
      }
    }
    // Depth clearance also holds during the application's other camera moves.
    for (const centerDepth of [28, 40, 60, 80, 100]) {
      const cube = aboutCubePose(0, 10, .46, centerDepth);
      expect(cube.depth + cube.size*Math.sqrt(3)/2).toBeLessThan(centerDepth-radius-1);
    }
  });
});
