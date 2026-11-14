// Load only small interaction sounds; scenes and ambience load when needed.
let started = false;
export function preloadStaticAssets() {
  if (started || typeof window === "undefined") return;
  started = true;
  for (const source of [
    "/experience/audio/menu-hover.mp3",
    "/experience/audio/menu-confirm.mp3",
    "/experience/audio/menu-open.mp3",
    "/experience/audio/menu-back.mp3",
  ]) {
    const audio = new Audio(source);
    audio.preload = "auto";
  }
}
