import * as pc from "playcanvas";
import { LOGIN_DISTANCE } from "./cinematics";

// Small OBJ reader for the credited MIT CrystalClock model. Preserves its six
// broad sides, bevel, UVs and authored face normals without a second 3D engine.
export function crystalMesh(device, source) {
  const vertices = [], normals = [], uv = [];
  const positions = [], outputNormals = [], outputUv = [];
  for (const line of source.split(/\r?\n/)) {
    const [type, ...parts] = line.trim().split(/\s+/);
    if (type === "v") vertices.push(parts.map(Number));
    if (type === "vn") normals.push(parts.map(Number));
    if (type === "vt") uv.push(parts.map(Number));
    if (type === "f") {
      for (let j = 1; j < parts.length - 1; j++) {
        for (const corner of [parts[0], parts[j], parts[j + 1]]) {
          const [v, t, n] = corner.split("/").map(Number);
          const p = vertices[v - 1];
          // Uniform scale preserves the reference asset's width-to-length ratio.
          positions.push(p[0] * 1.05, (p[1] - 5) * 1.05, p[2] * 1.05);
          outputNormals.push(...normals[n - 1]);
          outputUv.push(...uv[t - 1]);
        }
      }
    }
  }
  const mesh = new pc.Mesh(device);
  mesh.setPositions(positions);
  mesh.setNormals(outputNormals);
  mesh.setUvs(0, outputUv);
  const indices=Array.from({length:positions.length/3},(_,i)=>i);
  mesh.setVertexStream(pc.SEMANTIC_TANGENT,pc.calculateTangents(positions,outputNormals,outputUv,indices),4);
  mesh.update();
  return mesh;
}

// Fitted to the early, front-facing pose in the local PS2 menu recording.
// Radius / half-length places the inner and outer caps at the reference distances.
export const CRYSTAL_LAYOUT = {
  radius:12.3,
  center:[0,0,-112],
  rootEuler:[-7,-10,-3],
  screenCenter:[5/12,.491],
};
export function crystalPlacement(index) {
  const angle=-index*Math.PI/6;
  const radial=new pc.Quat().setFromEulerAngles(0,0,-index*30);
  const twist=new pc.Quat().setFromEulerAngles(0,15,0);
  // Twist around the shaft's own Y axis FIRST, then place it on its radial spoke.
  // Euler(0,15,angle) applies these in the other order and tips shafts off-axis.
  return {
    position:[-Math.sin(angle)*CRYSTAL_LAYOUT.radius,Math.cos(angle)*CRYSTAL_LAYOUT.radius,0],
    rotation:new pc.Quat().mul2(radial,twist),
  };
}
export const WORLD_FOV=45;
const MENU_POSE = [0,0,30.6];
export const WORLD_POSES = {
  login: [0,.06,LOGIN_DISTANCE], dashboard: MENU_POSE, projects: MENU_POSE,
  audits: MENU_POSE, skills: MENU_POSE, journey: MENU_POSE, system: MENU_POSE,
};
export function shortestAngle(current, target) {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current));
}
export function navigationPulse(seconds) {
  return seconds >= 0 && seconds < .64 ? Math.sin(Math.PI * seconds / .64) : 0;
}
