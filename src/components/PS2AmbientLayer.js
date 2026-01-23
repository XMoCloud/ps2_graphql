import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { playDashboardLoop } from "../lib/sound";
import { isAuthenticated } from "../lib/auth";

let sharedMenuVideo = null;

const getSharedMenuVideo = () => {
  if (sharedMenuVideo) {
    return sharedMenuVideo;
  }

  const video = document.createElement("video");
  video.src = "/ps2_assets/ps2_menu_loop.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.className = "dashboard-menu-video";
  sharedMenuVideo = video;
  return sharedMenuVideo;
};

const PS2AmbientLayer = () => {
  const containerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated()) {
      playDashboardLoop();
    }
  }, [location.pathname]);

  useEffect(() => {
    const resumeAudio = () => {
      if (isAuthenticated()) {
        playDashboardLoop();
      }
    };

    window.addEventListener("click", resumeAudio, { passive: true });
    window.addEventListener("keydown", resumeAudio, { passive: true });
    window.addEventListener("touchstart", resumeAudio, { passive: true });

    return () => {
      window.removeEventListener("click", resumeAudio);
      window.removeEventListener("keydown", resumeAudio);
      window.removeEventListener("touchstart", resumeAudio);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const video = getSharedMenuVideo();

    if (!container.contains(video)) {
      container.appendChild(video);
    }

    video.play().catch(() => {});

    return () => {
      if (container.contains(video)) {
        container.removeChild(video);
      }
    };
  }, [location.pathname]);

  return (
    <div className="dashboard-video-layer" ref={containerRef} />
  );
};

export default PS2AmbientLayer;
