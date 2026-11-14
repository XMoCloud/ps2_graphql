import React, { useEffect, useRef } from "react";
import { createStartup } from "../experience/startup/createStartup";

export default function StartupScene({
  clock,
  active = false,
  motion = true,
  wireframe = false,
  options,
  fps = 60,
  onReady,
  onError,
}) {
  const canvas = useRef(null),
    current = useRef(null);
  current.current = {
    clock,
    active,
    motion,
    wireframe,
    onReady,
    onError,
    options,
    fps,
  };
  useEffect(() => {
    let scene,
      last = -1,
      ready = false;
    let renderedAt = -1000;
    let frames = 0;
    try {
      scene = createStartup(canvas.current);
      const resize = () => {
        if (!canvas.current?.parentElement) return;
        const rect = canvas.current.parentElement.getBoundingClientRect();
        scene.resize(Math.max(rect.width, 1), Math.max(rect.height, 1));
        last = -1;
      };
      const observer = new ResizeObserver(resize);
      observer.observe(canvas.current.parentElement);
      scene.app.on("update", () => {
        if (document.hidden || !canvas.current) return;
        const s = current.current,
          t = s.clock(),
          options = s.options?.() || {},
          now = performance.now(),
          fps = typeof s.fps === "function" ? s.fps() : s.fps;
        if (fps <= 0) return;
        if (now - renderedAt < 1000 / fps - 0.5) return;
        const signature = `${t.toFixed(5)}:${s.motion}:${s.wireframe}:${options.mode}:${options.orbitOffset}:${options.sceneError}`;
        if (last !== signature) {
          scene.render(t, {
            motion: s.motion,
            wireframe: s.wireframe,
            ...options,
          });
          const stats = scene.stats();
          canvas.current.dataset.renderedFrames = String(++frames);
          canvas.current.dataset.pillars = String(stats.visiblePillars);
          canvas.current.dataset.crystals = String(stats.visibleCrystals);
          canvas.current.dataset.cubes = String(stats.visibleCubes);
          canvas.current.dataset.rotationPhase = stats.crystalPhase.toFixed(3);
          canvas.current.dataset.smokeSpeed = stats.smokeSpeed.toFixed(3);
          canvas.current.dataset.smokeDepth = stats.smokeDepth.toFixed(3);
          canvas.current.dataset.camera = stats.camera;
          canvas.current.dataset.crystalPose = stats.crystalPose;
          canvas.current.dataset.clockCenter = stats.clockCenter
            .map((n) => n.toFixed(5))
            .join(",");
          canvas.current.dataset.clockTrails = String(stats.clockTrails);
          canvas.current.dataset.cameraRoll = stats.cameraRoll.toFixed(3);
          canvas.current.dataset.errorAmount = stats.errorAmount.toFixed(3);
          canvas.current.dataset.opticalSurfaces = String(
            stats.opticalSurfaces,
          );
          canvas.current.dataset.opticalEnvironment = stats.opticalEnvironment;
          canvas.current.dataset.renderSize = `${stats.renderWidth}x${stats.renderHeight}`;
          last = signature;
          renderedAt = now;
        }
      });
      scene.app.on("frameend", () => {
        if (!ready && canvas.current && scene.ready) {
          ready = true;
          canvas.current.dataset.ready = "true";
          current.current.onReady?.(scene.stats());
        }
      });
      resize();
      scene.start();
      return () => {
        observer.disconnect();
        scene.dispose();
      };
    } catch (error) {
      scene?.dispose();
      current.current.onError?.(error);
    }
  }, []);
  return (
    <canvas
      ref={canvas}
      className="startup-canvas"
      aria-label="Animated PS2 world: blue smoke, memory pillars and glass crystals"
    />
  );
}
