import React, { useEffect, useRef } from "react";
import { useExperience } from "../experience/Experience";

// Original footage is the recovery background if live 3D cannot initialize.
// Only one video decodes at a time, with no PlayCanvas scene mounted behind it.
export default function AssetWorld({ mode }) {
  const e = useExperience(), video = useRef(null);
  const boot = e.phase === "boot";
  const source = boot ? "ps2_startup.mp4" : e.sceneError ? "ps2_death_loop.mp4"
    : e.phase === "ready" && mode !== "login" ? "ps2_menu_loop.mp4" : null;
  useEffect(() => { e.setWorldReady(true); }, [e.renderer]);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const sync = () => {
      if (!document.hidden && (boot || e.motion)) node.play().catch(() => {});
      else node.pause();
    };
    sync(); document.addEventListener("visibilitychange", sync);
    return () => { document.removeEventListener("visibilitychange", sync); node.pause(); };
  }, [source, boot, e.motion]);
  return <div className="asset-world" data-renderer="assets" aria-hidden="true">
    {source && <video key={source} ref={video} src={`/ps2_assets/${source}`}
      muted playsInline loop={!boot} preload="auto"
      onEnded={boot ? e.finishBoot : undefined} />}
  </div>;
}
