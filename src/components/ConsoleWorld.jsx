import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useExperience } from "../experience/Experience";
import { menuDirection } from "../experience/startup/menuMotion";
import { ABOUT_ENTER_MS } from "../experience/startup/aboutMotion";
import AssetWorld from "./AssetWorld";
const StartupScene = lazy(() => import("./StartupScene"));

export default function ConsoleWorld() {
  const e = useExperience(),
    location = useLocation();
  const time = useRef(0),
    last = useRef(performance.now()),
    offset = useRef([0, 0]);
  const drag = useRef(null),
    host = useRef(null);
  const mode =
    location.pathname.replace("/preview", "").split("/")[1] || "login";
  const previousMode = useRef(mode),
    modeAt = useRef(performance.now()),
    aboutTransitionAt = useRef(-10000),
    travel = useRef({ id: 0, at: -10000, direction: 0 });
  useLayoutEffect(() => {
    modeAt.current = performance.now();
    if (mode === "about" || previousMode.current === "about") aboutTransitionAt.current = modeAt.current;
    const direction = menuDirection(previousMode.current, mode);
    if (direction)
      travel.current = {
        id: travel.current.id + 1,
        at: performance.now(),
        direction,
      };
    previousMode.current = mode;
  }, [mode, e.phase]);
  useEffect(() => {
    if (!e.explore) offset.current = [0, 0];
  }, [e.explore]);
  return (
    <>
      <div
        ref={host}
        className={`console-world ${e.explore ? "world-explore" : ""} ${e.sceneError ? "world-error" : ""} ${e.worldObscured ? "world-obscured" : ""}`}
        data-world-mode={e.phase === "boot" ? "startup" : mode}
        data-fallback={e.worldError || undefined}
        onPointerDown={(event) => {
          if (!e.explore) return;
          drag.current = [event.clientX, event.clientY];
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current || !e.explore) return;
          offset.current = [
            offset.current[0] + (event.clientX - drag.current[0]) * 0.007,
            Math.max(
              -0.7,
              Math.min(
                0.7,
                offset.current[1] + (event.clientY - drag.current[1]) * 0.005,
              ),
            ),
          ];
          drag.current = [event.clientX, event.clientY];
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {e.renderer === "assets" ? (
          <AssetWorld mode={mode} />
        ) : (
          <Suspense fallback={null}>
            <StartupScene
              motion={e.motion}
              clock={() => {
                const now = performance.now(),
                  dt = Math.min(0.1, (now - last.current) / 1000);
                last.current = now;
                if (e.phase === "boot") return (now - e.bootAt.current) / 1000;
                if (e.motion && !document.hidden) time.current += dt;
                return e.phase === "prompt" ? 0 : time.current;
              }}
              options={() => ({
                mode: e.phase === "ready" ? mode : "startup",
                modeAge: (performance.now()-modeAt.current)/1000,
                aboutExitAge: e.aboutLeaving ? (performance.now()-e.aboutExitAt.current)/1000 : -1,
                arrival: e.motion
                  ? (performance.now() - e.readyAt.current) / 1000
                  : 10,
                navigation: (performance.now() - e.navigationAt.current) / 1000,
                navigationTarget: e.navigationTarget.current,
                navigationStage: e.navigation,
                entryAge:
                  e.navigation === "entering"
                    ? (performance.now() - e.navigationCommitAt.current) / 1000
                    : -1,
                travel: {
                  id: travel.current.id,
                  direction: travel.current.direction,
                  age: (performance.now() - travel.current.at) / 1000,
                },
                orbitOffset: offset.current,
                sceneError: e.sceneError,
              })}
              fps={() =>
                e.worldObscured
                  ? 0
                  : e.phase === "boot" ||
                      e.explore ||
                      e.aboutLeaving ||
                      performance.now() - aboutTransitionAt.current < ABOUT_ENTER_MS + 100 ||
                      performance.now() - travel.current.at < 1100 ||
                      performance.now() - e.readyAt.current < 1500 ||
                      performance.now() - e.navigationAt.current < 1200
                    ? 60
                    : 30
              }
              onReady={() => e.setWorldReady(true)}
              onError={() => {
                e.setWorldError(true);
                e.setWorldReady(false);
              }}
            />
          </Suspense>
        )}
      </div>
      <div
        aria-hidden="true"
        className={`world-curtain travel-${e.navigation || "idle"}`}
      />
    </>
  );
}
