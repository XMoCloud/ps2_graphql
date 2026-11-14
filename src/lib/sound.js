const tracks = new Map();
const sources = {
  menu_select: "/experience/audio/menu-hover.mp3",
  menu_open: "/experience/audio/menu-open.mp3",
  menu_confirm: "/experience/audio/menu-confirm.mp3",
  logout: "/experience/audio/menu-back.mp3",
  post_startup: "/ps2_assets/post-startup-effect.mp3",
};
let audioContext;
// Decode short cues once, unlocked in the submit/start gesture. Unlike starting
// a fresh HTMLAudio after an asynchronous sign-in, this survives autoplay rules.
const decoded = new Map(),
  decoding = new Map();
const voices = new Map();
function cueBuffer(name) {
  if (!audioContext || !sources[name]) return;
  if (!decoding.has(name))
    decoding.set(
      name,
      fetch(sources[name])
        .then((r) => r.arrayBuffer())
        .then((b) => audioContext.decodeAudioData(b))
        .then((b) => {
          decoded.set(name, b);
          return b;
        })
        .catch(() => null),
    );
  return decoding.get(name);
}
export function unlockAudio() {
  try {
    if (!audioContext)
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume().catch(() => {});
    Object.keys(sources).forEach(cueBuffer);
  } catch {}
}
let enabled = true,
  master = 0.45;
let wavesLevel = 0, wavesWanted = false, wavesFadeTimer;
const paused = new Set();
const trackLevel = name => name === "waves_loop" ? wavesLevel : 1;
function mediaTrack(name, gain, loop = false) {
  if (!tracks.has(name)) {
    const audio = new Audio(sources[name] || `/ps2_assets/ps2_${name}.mp3`);
    audio.loop = loop;
    audio.preload = loop ? "none" : "auto";
    tracks.set(name, { audio, gain });
  }
  const item = tracks.get(name);
  item.gain = gain;
  return item;
}
function play(name, gain, loop = false) {
  if (
    !loop &&
    sources[name] &&
    enabled &&
    audioContext?.state === "running" &&
    decoded.has(name)
  ) {
    voices.get(name)?.source.stop();
    const source = audioContext.createBufferSource(),
      volume = audioContext.createGain();
    source.buffer = decoded.get(name);
    volume.gain.value = master * gain;
    source.connect(volume);
    volume.connect(audioContext.destination);
    source.start();
    const voice = { source, volume, gain };
    voices.set(name, voice);
    source.onended = () => {
      source.disconnect();
      volume.disconnect();
      if (voices.get(name) === voice) voices.delete(name);
    };
    return source;
  }
  const item = mediaTrack(name, gain, loop);
  item.audio.muted = !enabled;
  item.audio.volume = master * item.gain * trackLevel(name);
  if (!enabled) return item.audio;
  if (!loop) item.audio.currentTime = 0;
  item.audio.play().catch(() => {});
  return item.audio;
}
export function configureSound(on, volume) {
  enabled = on;
  master = Math.max(0, Math.min(1, volume));
  tracks.forEach(({ audio, gain }, name) => {
    audio.muted = !on;
    audio.volume = master * gain * trackLevel(name);
  });
  voices.forEach(({ volume, gain }) => {
    volume.gain.value = on ? master * gain : 0;
  });
  if (on && wavesWanted && !document.hidden) tracks.get("waves_loop")?.audio.play().catch(() => {});
}
// The ambience has a transport independent of its volume. Pausing for a memory
// card preserves currentTime; only ending the account session rewinds it.
export function fadeDashboardLoop(audible, duration = 1700) {
  if (wavesWanted === audible && wavesFadeTimer) return;
  clearTimeout(wavesFadeTimer);
  wavesFadeTimer = undefined;
  wavesWanted = audible;
  const target = audible ? 1 : 0;
  if (!audible && !tracks.has("waves_loop")) return;
  const audio = audible ? play("waves_loop", 0.55, true) : tracks.get("waves_loop").audio;
  paused.delete(audio);
  const from = wavesLevel, started = Date.now();
  const step = () => {
    const t = duration <= 0 ? 1 : Math.min(1, (Date.now() - started) / duration);
    const ease = t * t * (3 - 2 * t);
    wavesLevel = from + (target - from) * ease;
    audio.volume = master * .55 * wavesLevel;
    if (t < 1) wavesFadeTimer = setTimeout(step, 32);
    else {
      wavesFadeTimer = undefined;
      if (!audible) { audio.pause(); paused.delete(audio); }
    }
  };
  if (Math.abs(target - from) < .0001) {
    if (!audible) audio.pause();
    return audio;
  }
  step();
  return audio;
}
export function prepareDashboardLoop() {
  if (tracks.has("waves_loop")) return;
  const { audio } = mediaTrack("waves_loop", .55, true);
  audio.preload = "auto";
  audio.load();
}
// Accepted sign-in starts at the configured gain in the same event turn.
// Memory menus continue to use fadeDashboardLoop and its preserved transport.
export function startDashboardLoop() {
  clearTimeout(wavesFadeTimer);
  wavesFadeTimer = undefined;
  wavesWanted = true;
  wavesLevel = 1;
  const audio = play("waves_loop", .55, true);
  paused.delete(audio);
  return audio;
}
export const stopDashboardLoop = () => {
  clearTimeout(wavesFadeTimer);
  wavesFadeTimer = undefined;
  wavesWanted = false;
  wavesLevel = 0;
  const item = tracks.get("waves_loop");
  if (item) {
    paused.delete(item.audio);
    item.audio.pause();
    item.audio.currentTime = 0;
    item.audio.volume = 0;
  }
};
export const playStartupSound = () => {
  unlockAudio();
  return play("startup_sound", 1);
};
export const playPostStartupSound = () => play("post_startup", 1);
export const stopStartupSound = () => {
  const item = tracks.get("startup_sound");
  if (item) {
    item.audio.pause();
    item.audio.currentTime = 0;
  }
};
let lastHover = 0;
export const playHoverSound = () => {
  if (performance.now() - lastHover > 110) {
    lastHover = performance.now();
    play("menu_select", 0.48);
  }
};
export const playClickSound = () => {
  unlockAudio();
  return play("menu_confirm", 0.7);
};
export const playOpenSound = () => play("menu_open", 0.7);
export const playLoginSound = () => {
  const pending = cueBuffer("menu_open");
  if (pending) pending.then(() => play("menu_open", 0.7));
  else play("menu_open", 0.7);
};
export const playBackSound = () => play("logout", 0.65);
export const playLogoutSound = () => play("logout", 0.7);
export const stopErrorSound = () => {
  const item = tracks.get("death_sound");
  if (item) {
    paused.delete(item.audio);
    item.audio.pause();
    item.audio.currentTime = 0;
  }
};
export const playErrorSound = () => {
  const audio = play("death_sound", 0.8, true);
  paused.delete(audio);
  return audio;
};
function onVisibilityChange() {
  tracks.forEach(({ audio }, name) => {
    if (document.hidden && !audio.paused) {
      paused.add(audio);
      audio.pause();
    } else if (!document.hidden && paused.has(audio)) {
      if (enabled && audio.loop && (name !== "waves_loop" || wavesWanted)) audio.play().catch(() => {});
      paused.delete(audio);
    }
  });
}
document.addEventListener("visibilitychange", onVisibilityChange);
if (import.meta.hot) import.meta.hot.dispose(() => {
  clearTimeout(wavesFadeTimer);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  tracks.forEach(({ audio }) => audio.pause());
  voices.forEach(({ source }) => { try { source.stop(); } catch {} });
  audioContext?.close().catch(() => {});
});
