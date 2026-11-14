// Five-cube stagger measured from the supplied PS2 configuration screenshot.
// Rotation follows the persistent scene clock; entering About never resets it.
import { CRYSTAL_LAYOUT, WORLD_FOV, WORLD_POSES } from "./worldGeometry";
const lens = Math.tan(WORLD_FOV * Math.PI / 360);
const CUBES = [
  { screen: [.308, .228], mobile: [.31, .065], period: 14, turns: [1, 1, 0], phase: 17 },
  { screen: [.120, .370], mobile: [.13, .15], period: 11, turns: [-1, 1, 1], phase: 63 },
  { screen: [.322, .502], mobile: [.32, .23], period: 12, turns: [1, -1, 1], phase: 82 },
  { screen: [.132, .642], mobile: [.14, .31], period: 16, turns: [1, 0, -1], phase: 31 },
  { screen: [.308, .770], mobile: [.31, .39], period: 13, turns: [0, -1, 1], phase: 108 },
];
export const ABOUT_CUBE_COUNT = CUBES.length;
export function aboutComposition(aspect) {
  // About adds foreground cubes to the existing world, without reframing it.
  const screenCenter = CRYSTAL_LAYOUT.screenCenter;
  const distance = WORLD_POSES.dashboard[2];
  const centerDepth = distance / Math.hypot(1,
    (.5-screenCenter[0])*2*lens*aspect, (screenCenter[1]-.5)*2*lens);
  // The rotating asset fits inside an 18.5-unit sphere. Put every cube entirely
  // in front of that envelope, including on ultrawide screens.
  const cubeDepth = Math.min(6.5, Math.max(1, centerDepth-18.5)*.55);
  return { screenCenter, distance, cubeDepth };
}
export function aboutCubePose(index, seconds, aspect, currentCenterDepth = Infinity) {
  const cube = CUBES[index];
  const { cubeDepth } = aboutComposition(aspect);
  const depth = Math.min(cubeDepth, Math.max(1, currentCenterDepth-18.5)*.55);
  const phase = seconds * 360 / cube.period + cube.phase;
  const screen = aspect < .9 ? cube.mobile : cube.screen;
  const sizeAspect = Math.min(aspect, 1.6);
  const rayLength = width => Math.hypot(1,(screen[0]-.5)*2*lens*width,(screen[1]-.5)*2*lens);
  const perspective = rayLength(sizeAspect)/rayLength(aspect);
  return {
    screen,
    depth,
    rotation: cube.turns.map((turn, axis) => phase * turn + [12, 23, 7][axis]),
    // Preserve apparent height on oblique ultrawide rays as well as limiting
    // width-based growth. The reference screen positions remain unchanged.
    size: (aspect < .9 ? .085 : .068) * 2 * depth * lens * sizeAspect * perspective,
  };
}
