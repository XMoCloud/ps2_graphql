import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PS2Background from "./PS2Background.js";
import { Triangle, Circle, Cross, Square, FloatingSymbols } from "./PS2Symbols.js";

const NotFound = () => {
  const deathStartRef = useRef(null);
  const deathLoopRef = useRef(null);
  const deathAudioRef = useRef(null);
  const [deathLoopActive, setDeathLoopActive] = useState(false);
  const [deathStartVisible, setDeathStartVisible] = useState(true);

  useEffect(() => {
    const audio = new Audio("/ps2_assets/ps2_death_sound.mp3");
    audio.loop = true;
    audio.volume = 0.9;
    deathAudioRef.current = audio;

    audio.play().catch(() => {});

    const startVideo = deathStartRef.current;
    if (startVideo) {
      startVideo.currentTime = 0;
      startVideo.play().catch(() => {});
      const handleEnd = () => {
        setDeathStartVisible(false);
        setDeathLoopActive(true);
      };
      startVideo.addEventListener("ended", handleEnd);
      return () => {
        startVideo.removeEventListener("ended", handleEnd);
      };
    }

    return () => {};
  }, []);

  useEffect(() => {
    if (deathLoopActive && deathLoopRef.current) {
      deathLoopRef.current.currentTime = 0;
      deathLoopRef.current.play().catch(() => {});
    }
  }, [deathLoopActive]);

  useEffect(() => {
    return () => {
      if (deathAudioRef.current) {
        deathAudioRef.current.pause();
        deathAudioRef.current.currentTime = 0;
        deathAudioRef.current = null;
      }
      if (deathStartRef.current) {
        deathStartRef.current.pause();
        deathStartRef.current.currentTime = 0;
      }
      if (deathLoopRef.current) {
        deathLoopRef.current.pause();
        deathLoopRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-red-950 text-white death-mode">
      <PS2Background />
      <FloatingSymbols variant="death" />

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 death-overlay" />
        {deathStartVisible && (
          <video
            ref={deathStartRef}
            className="death-video"
            src="/ps2_assets/ps2_death_start.mp4"
            playsInline
            muted
          />
        )}
        {deathLoopActive && (
          <video
            ref={deathLoopRef}
            className="death-video"
            src="/ps2_assets/ps2_death_loop.mp4"
            playsInline
            muted
            loop
          />
        )}
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="relative mb-10">
          <h1 className="font-orbitron text-[150px] md:text-[200px] font-black text-red-900 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="font-orbitron text-6xl md:text-8xl font-bold text-red-400 ps2-glow-text animate-pulse">
              DISC ERROR
            </h2>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8 opacity-70">
          <Triangle size={32} className="text-red-500" />
          <Circle size={32} className="text-red-400" />
          <Cross size={32} className="text-red-600 animate-pulse" />
          <Square size={32} className="text-red-500" />
        </div>

        <div className="ps2-card p-8 max-w-xl mx-auto ps2-card-death animate-fade-in-scale">
          <h3 className="font-orbitron text-2xl text-red-200 mb-4">Fatal Error: 0x404</h3>
          <p className="font-rajdhani text-red-200/80 mb-6">
            The requested reality could not be located. The system has switched to death mode to protect your data.
          </p>
          <Link to="/" className="ps2-button ps2-button-death inline-flex items-center justify-center gap-2">
            <Cross size={16} />
            Return Home
          </Link>
        </div>

        <p className="mt-10 font-rajdhani text-sm text-red-200 animate-pulse">
          Press <span className="text-red-400">✕</span> to respawn
        </p>
      </div>
    </div>
  );
};

export default NotFound;
