import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";
import { STARTUP_DURATION } from "./startup/timeline";
import { PORTAL_COMMIT_MS, PORTAL_ENTER_MS } from "./startup/cinematics";
import {
  configureSound,
  fadeDashboardLoop,
  startDashboardLoop,
  prepareLoginLoop,
  fadeLoginLoop,
  stopLoginLoop,
  playStartupSound,
  playPostStartupSound,
  stopStartupSound,
  stopDashboardLoop,
  fadeErrorSound,
  stopErrorSound,
} from "../lib/sound";
import { ExperienceContext as Context } from "./context";
export { useExperience } from "./context";
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export default function Experience({ children }) {
  const location = useLocation();
  const [phase, setPhase] = useState(() => {
    try {
      return sessionStorage.getItem("ps2-booted") || isAuthenticated()
        ? "ready"
        : "prompt";
    } catch {
      return "prompt";
    }
  });
  const [sound, setSound] = useState(() => read("ps2-sound", true));
  const [volume, setVolume] = useState(() => read("ps2-volume", 0.45));
  const [motion, setMotion] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [explore, setExplore] = useState(false);
  const [worldObscured, setWorldObscured] = useState(false);
  const [memoryAudioSuspended, setMemoryAudioSuspended] = useState(false);
  const [aboutLeaving, setAboutLeaving] = useState(false);
  const aboutExitAt = useRef(-10000);
  const acceptedAccountAmbience = useRef(false);
  // New material revision restores live 3D even for the previous fallback default.
  const [renderer, setRenderer] = useState(() => read("ps2-renderer-v2", "3d"));
  useEffect(() => {
    try {
      localStorage.setItem("ps2-renderer-v2", JSON.stringify(renderer));
    } catch {}
    setWorldError(false);
  }, [renderer]);
  const [sceneError, setSceneError] = useState(false);
  const [selectedProject, setSelectedProject] = useState(0);
  const [worldReady, setWorldReady] = useState(false);
  const [worldError, setWorldError] = useState(false);
  const [navigation, setNavigation] = useState("");
  const [arrivalActive, setArrivalActive] = useState(false);
  const bootAt = useRef(0),
    readyAt = useRef(-10000),
    navigationAt = useRef(-10000),
    navigationTarget = useRef("menu"),
    navigationCommitAt = useRef(-10000),
    navigationTimers = useRef([]),
    navigationLock = useRef(false),
    bootRunning = useRef(false),
    timer = useRef(),
    arrivalTimer = useRef();
  const finishBoot = () => {
    const completedStartup = bootRunning.current;
    bootRunning.current = false;
    clearTimeout(timer.current);
    stopStartupSound();
    readyAt.current = performance.now();
    if (location.pathname === "/" && !isAuthenticated() && !sceneError) {
      fadeLoginLoop(true, 1000);
      if (completedStartup) playPostStartupSound();
    }
    clearTimeout(arrivalTimer.current);
    setArrivalActive(true);
    arrivalTimer.current = setTimeout(() => setArrivalActive(false), 1400);
    try {
      sessionStorage.setItem("ps2-booted", "1");
    } catch {
      /* optional */
    }
    setPhase("ready");
  };
  const startBoot = () => {
    clearTimeout(timer.current);
    clearTimeout(arrivalTimer.current);
    setArrivalActive(false);
    setExplore(false);
    bootAt.current = performance.now();
    bootRunning.current = true;
    stopDashboardLoop();
    stopLoginLoop();
    stopErrorSound();
    configureSound(sound, volume);
    prepareLoginLoop();
    playStartupSound();
    setPhase("boot");
    timer.current = setTimeout(finishBoot, STARTUP_DURATION * 1000);
  };
  const navigateWorld = (commit, target = "menu") => {
    if (navigationLock.current) return;
    if (target === "login") prepareLoginLoop();
    navigationTimers.current.forEach(clearTimeout);
    if (!motion) {
      commit();
      return;
    }
    navigationLock.current = true;
    clearTimeout(arrivalTimer.current);
    setArrivalActive(false);
    navigationAt.current = performance.now();
    navigationTarget.current = target;
    navigationCommitAt.current = -10000;
    setExplore(false);
    setNavigation("leaving");
    navigationTimers.current = [
      setTimeout(() => {
        // A busy frame can delay a CSS animation's first paint. Finish the
        // outgoing curtain before changing routes so content always commits black.
        document
          .querySelector(".world-curtain")
          ?.getAnimations()
          .forEach((animation) => animation.finish());
        navigationCommitAt.current = performance.now();
        commit();
        setNavigation("entering");
        navigationTimers.current.push(
          setTimeout(() => {
            navigationLock.current = false;
            setNavigation("");
          }, PORTAL_ENTER_MS),
        );
      }, PORTAL_COMMIT_MS),
    ];
  };
  useEffect(() => {
    document.documentElement.dataset.experiencePhase = phase;
  }, [phase]);
  useEffect(() => {
    document.documentElement.dataset.worldNavigation = navigation;
  }, [navigation]);
  useEffect(() => {
    fadeErrorSound(sceneError && phase === "ready", 1000);
  }, [sceneError, phase]);
  const accountRoute = /^\/(?:preview\/)?(?:dashboard|projects|audits|skills|about)\/?$/.test(location.pathname);
  const accountActive = accountRoute && (location.pathname.startsWith("/preview/") || isAuthenticated());
  const beginAccountAmbience = () => {
    acceptedAccountAmbience.current = true;
    fadeLoginLoop(false, 1000);
    startDashboardLoop();
  };
  useEffect(() => {
    const enteringAccount = navigation && navigationTarget.current === "menu";
    const loginActive = location.pathname === "/" && !isAuthenticated();
    fadeLoginLoop(loginActive && phase === "ready" && !sceneError && !enteringAccount && !acceptedAccountAmbience.current, 1000);
  }, [location.pathname, phase, sceneError, navigation]);
  useEffect(() => {
    // Keep the accepted-login sound running during the outgoing login camera
    // and incoming account camera, without resetting its volume or transport.
    if (acceptedAccountAmbience.current && navigationTarget.current === "menu" && phase === "ready" && !sceneError) {
      if (accountActive && !navigation) acceptedAccountAmbience.current = false;
      if (!worldObscured && !memoryAudioSuspended) return;
      acceptedAccountAmbience.current = false;
    }
    if (!accountActive || phase !== "ready" || sceneError || navigation === "leaving") {
      acceptedAccountAmbience.current = false;
      if (phase === "ready" && !sceneError && navigation && navigationTarget.current === "login") fadeDashboardLoop(false, 1000);
      else stopDashboardLoop();
    } else {
      fadeDashboardLoop(!(worldObscured || memoryAudioSuspended), 1700);
    }
  }, [accountActive, phase, worldObscured, memoryAudioSuspended, sceneError, navigation]);
  useEffect(() => {
    configureSound(sound, volume);
    try {
      localStorage.setItem("ps2-sound", JSON.stringify(sound));
      localStorage.setItem("ps2-volume", JSON.stringify(volume));
    } catch {
      /* optional */
    }
  }, [sound, volume]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(arrivalTimer.current);
      navigationTimers.current.forEach(clearTimeout);
      stopStartupSound();
      stopLoginLoop();
      stopErrorSound();
      stopDashboardLoop();
    },
    [],
  );
  return (
    <Context.Provider
      value={{
        phase,
        renderer,
        setRenderer,
        bootAt,
        readyAt,
        navigationAt,
        navigationTarget,
        navigationCommitAt,
        navigation,
        arrivalActive,
        navigateWorld,
        worldReady,
        setWorldReady,
        worldError,
        setWorldError,
        startBoot,
        finishBoot,
        sound,
        setSound,
        volume,
        setVolume,
        motion,
        setMotion,
        explore,
        worldObscured,
        setWorldObscured,
        setMemoryAudioSuspended,
        aboutLeaving,
        setAboutLeaving,
        aboutExitAt,
        beginAccountAmbience,
        setExplore,
        sceneError,
        setSceneError,
        selectedProject,
        setSelectedProject,
      }}
    >
      {children}
    </Context.Provider>
  );
}
