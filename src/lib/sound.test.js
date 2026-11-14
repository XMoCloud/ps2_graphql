import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
let sound, audios, listener;
beforeEach(async () => {
  vi.useFakeTimers(); vi.resetModules(); audios = [];
  vi.stubGlobal("Audio", class {
    constructor(src) { this.src = src; this.paused = true; this.currentTime = 0; this.volume = 1; this.playVolumes = []; audios.push(this); }
    play = vi.fn(() => { this.playVolumes.push(this.volume); this.paused = false; return Promise.resolve(); });
    pause = vi.fn(() => { this.paused = true; });
    load = vi.fn();
  });
  const events = vi.spyOn(document, "addEventListener");
  sound = await import("./sound");
  listener = events.mock.calls.find(([name]) => name === "visibilitychange")?.[1];
  events.mockRestore();
  sound.configureSound(true, .45);
});
afterEach(() => {
  sound.stopDashboardLoop();
  sound.stopErrorSound();
  document.removeEventListener("visibilitychange", listener);
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
});
describe("waves ambience transport", () => {
  it("keeps the louder death ambience playing until the error is cleared", () => {
    const audio=sound.playErrorSound();
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBeCloseTo(.45*.8);
    vi.advanceTimersByTime(15000);
    expect(audio.paused).toBe(false);
    const hidden=vi.spyOn(document,"hidden","get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    const plays=audio.play.mock.calls.length;
    sound.stopErrorSound();
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(plays);
  });
  it("uses the supplied post-startup cue as a one-shot", () => {
    sound.playPostStartupSound();
    const audio=audios[0];
    expect(audio.src).toBe("/ps2_assets/post-startup-effect.mp3");
    expect(audio.loop).toBe(false);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.volume).toBeCloseTo(.45);
  });
  it("prepares silently and starts accepted-login ambience at full configured gain without a fade", () => {
    sound.prepareDashboardLoop(); sound.prepareDashboardLoop();
    expect(audios).toHaveLength(1);
    const audio = audios[0];
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(audio.play).not.toHaveBeenCalled();
    sound.startDashboardLoop();
    expect(audio.playVolumes).toEqual([.45 * .55]);
    expect(audio.paused).toBe(false);
    expect(audio.volume).toBeCloseTo(.45 * .55);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("fades to silence, pauses at the current position, then resumes from that position", () => {
    sound.fadeDashboardLoop(true, 1000);
    const audio = audios[0];
    expect(audio.volume).toBe(0);
    vi.advanceTimersByTime(1050);
    expect(audio.volume).toBeCloseTo(.45 * .55);
    audio.currentTime = 17.25;
    sound.fadeDashboardLoop(false, 1000);
    vi.advanceTimersByTime(500);
    expect(audio.volume).toBeGreaterThan(0);
    expect(audio.volume).toBeLessThan(.45 * .55);
    vi.advanceTimersByTime(550);
    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(17.25);
    sound.fadeDashboardLoop(true, 1000);
    expect(audio.currentTime).toBe(17.25);
    expect(audio.paused).toBe(false);
    vi.advanceTimersByTime(1050);
    expect(audio.volume).toBeCloseTo(.45 * .55);
    sound.stopDashboardLoop();
    expect(audio.currentTime).toBe(0);
  });
  it("reverses an interrupted fade without a gain jump and honors the master volume", () => {
    sound.fadeDashboardLoop(true, 1000);
    vi.advanceTimersByTime(500);
    const audio = audios[0], level = audio.volume;
    sound.fadeDashboardLoop(false, 1000);
    expect(audio.volume).toBeCloseTo(level);
    sound.configureSound(true, .9);
    expect(audio.volume).toBeCloseTo(level * 2);
    vi.advanceTimersByTime(1050);
    expect(audio.paused).toBe(true);
  });
  it("does not restart suspended memory-menu ambience on tab visibility or unmute", () => {
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    sound.fadeDashboardLoop(true, 0);
    const audio = audios[0];
    hidden.mockReturnValue(true); document.dispatchEvent(new Event("visibilitychange"));
    sound.fadeDashboardLoop(false, 1000);
    vi.advanceTimersByTime(1050);
    const plays = audio.play.mock.calls.length;
    hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange"));
    sound.configureSound(true, .45);
    expect(audio.play.mock.calls.length).toBe(plays);
    expect(audio.paused).toBe(true);
  });
});
