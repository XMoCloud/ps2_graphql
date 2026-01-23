const audioRefs = {
  dashboard: null,
  hover: null,
  click: null,
  logout: null,
};

const createAudio = (src, { loop = false, volume = 1 } = {}) => {
  if (typeof window === "undefined") {
    return null;
  }

  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  return audio;
};

const playSfx = (key, src, options) => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!audioRefs[key]) {
    audioRefs[key] = createAudio(src, options);
  }

  const audio = audioRefs[key];
  if (!audio) {
    return null;
  }

  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}

  return audio;
};

export const playDashboardLoop = () => {
  if (!audioRefs.dashboard) {
    audioRefs.dashboard = createAudio("/ps2_assets/ps2_waves_loop.mp3", { loop: true, volume: 0.6 });
  }

  const audio = audioRefs.dashboard;
  if (!audio) {
    return null;
  }

  if (audio.paused) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  return audio;
};

export const stopDashboardLoop = () => {
  const audio = audioRefs.dashboard;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  audioRefs.dashboard = null;
};

export const playHoverSound = () => playSfx("hover", "/ps2_assets/ps2_hover.mp3", { volume: 0.45 });

export const playClickSound = () => playSfx("click", "/ps2_assets/ps2_click.mp3", { volume: 0.65 });

export const playLogoutSound = () => playSfx("logout", "/ps2_assets/ps2_logout.mp3", { volume: 0.75 });
