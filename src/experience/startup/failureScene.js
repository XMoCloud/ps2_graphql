// Fitted to the local death-start/death-loop clips: two wine-red glass blocks
// circling a small pink core, within a mostly black frame. No pillar field.
export const DEATH_DISTANCE=58;
export const DEATH_CLOUD=[16,11,16];
export function deathCubePose(index,seconds){
  const angle=seconds*.12+index*Math.PI+.9;
  return {position:[Math.cos(angle)*5.5,Math.sin(angle)*4.6,-112+(index?-2.5:2.5)],
    size:index?4.8:6.2,rotation:[-20+seconds*3.5,30+seconds*5,seconds*1.8+index*20]};
}
