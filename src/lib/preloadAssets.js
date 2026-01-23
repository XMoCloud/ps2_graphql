const assetPaths = [
  "/ps2_assets/ps2_hover.mp3",
  "/ps2_assets/ps2_click.mp3",
  "/ps2_assets/ps2_logout.mp3",
  "/ps2_assets/ps2_death_sound.mp3",
  "/ps2_assets/ps2_waves_loop.mp3",
  "/ps2_assets/ps2_menu_loop.mp4",
  "/ps2_assets/ps2_death_start.mp4",
  "/ps2_assets/ps2_death_loop.mp4",
  "/ps2_assets/ps2_startup.mp4",
  "/ps2_assets/ps2_logo.png",
  "/ps2_assets/ps2_default_bg.png",
];

let preloadStarted = false;
const retainedElements = [];

const createPreloader = (src) => {
  if (src.endsWith(".mp3")) {
    const audio = new Audio();
    audio.src = src;
    audio.preload = "auto";
    audio.load();
    return audio;
  }

  if (src.endsWith(".mp4")) {
    const video = document.createElement("video");
    video.src = src;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.load();
    return video;
  }

  const img = new Image();
  img.src = src;
  return img;
};

export const preloadStaticAssets = () => {
  if (typeof window === "undefined" || preloadStarted) {
    return;
  }

  preloadStarted = true;

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => {
      assetPaths.forEach((src) => {
        try {
          const element = createPreloader(src);
          if (element) {
            retainedElements.push(element);
          }
        } catch {
          /* noop */
        }
      });
    });
    return;
  }

  assetPaths.forEach((src) => {
    try {
      const element = createPreloader(src);
      if (element) {
        retainedElements.push(element);
      }
    } catch {
      /* noop */
    }
  });
};
