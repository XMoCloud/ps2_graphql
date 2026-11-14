// Measured from the supplied 60 fps recording and reference behavior.
export const MEMORY_FADE_MS = 1700;
export const SAVE_STAGGER_MS = 250;
export const SAVE_REVEAL_MS = 300;
export const DETAIL_ENTER_MS = 400;
export const SAVES_PER_PAGE = 12;

export function saveAppearance(item) {
  const hash = [...item.name].reduce((n, char) => (n * 31 + char.charCodeAt(0)) >>> 0, 7);
  const hue = hash % 360;
  // The same hue paints both sides of the save and its detail environment.
  return { hue, theme: `hsl(${hue} 72% 14%)`, light: `hsl(${hue} 62% 23%)` };
}
