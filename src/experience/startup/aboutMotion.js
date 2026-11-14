export const ABOUT_ENTER_MS = 600;
export const ABOUT_EXIT_MS = 450;
const ease = progress => {
  const t = Math.max(0, Math.min(1, progress));
  return t*t*(3-2*t);
};
export function aboutCubeScale(entryAge, exitAge = -1) {
  if (exitAge < 0) return ease(entryAge*1000/ABOUT_ENTER_MS);
  // Back can be pressed during the slower reveal. Shrink from the scale at
  // that moment instead of jumping to full size before closing.
  const initialScale = ease((entryAge-exitAge)*1000/ABOUT_ENTER_MS);
  return initialScale*(1-ease(exitAge*1000/ABOUT_EXIT_MS));
}
