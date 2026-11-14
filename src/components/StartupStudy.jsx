import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StartupScene from "./StartupScene";
import { STARTUP_DURATION, titleOpacity } from "../experience/startup/timeline";
import "./startup.css";
import "./startup-study.css";

export default function StartupStudy() {
  const [time, setTime] = useState(() =>
      Math.max(
        0,
        Math.min(
          new URLSearchParams(location.search).has("t")
            ? Number(new URLSearchParams(location.search).get("t")) || 0
            : 1.5,
          STARTUP_DURATION,
        ),
      ),
    ),
    [playing, setPlaying] = useState(false),
    [overlay, setOverlay] = useState(false),
    [wireframe, setWireframe] = useState(false),
    [stats, setStats] = useState(null),
    [error, setError] = useState("");
  const video = useRef(null),
    clock = useRef(time);
  clock.current = time;
  useEffect(() => {
    const v = video.current;
    if (playing) {
      v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
      v.currentTime = time;
    }
  }, [playing, time]);
  useEffect(() => {
    if (!playing) return;
    let frame;
    const tick = () => {
      setTime(video.current.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const seek = (t) => {
    setPlaying(false);
    setTime(t);
  };
  return (
    <div className="startup-study">
      <header>
        <div>
          <p>PS2 / STARTUP RECONSTRUCTION</p>
          <h1>One timeline. Two views.</h1>
        </div>
        <Link to="/">Return to site ↗</Link>
      </header>
      <p className="study-intro">
        Compare the real-time PlayCanvas scene with your original recording.
        Pause, scrub, or overlay both views to inspect the match.
      </p>
      <div
        className={`startup-comparison ${overlay ? "comparison-overlay" : ""}`}
      >
        <section className="reconstruction-pane">
          <h2>PLAYCANVAS / REAL-TIME 3D</h2>
          <div className="startup-frame">
            <StartupScene
              clock={() => clock.current}
              active={playing}
              wireframe={wireframe}
              onReady={setStats}
              onError={(e) => setError(e.message)}
            />
            <div
              className="study-credit"
              style={{ opacity: titleOpacity(time) }}
            >
              <span>Sony Computer Entertainment</span>
            </div>
          </div>
        </section>
        <section className="reference-pane">
          <h2>REFERENCE / LOCAL VIDEO</h2>
          <div className="startup-frame">
            <video
              ref={video}
              src="/ps2_assets/ps2_startup.mp4"
              preload="auto"
              playsInline
              onLoadedMetadata={() => {
                video.current.currentTime = time;
              }}
              onEnded={() => setPlaying(false)}
            />
          </div>
        </section>
      </div>
      <div className="study-transport">
        <button
          disabled={!stats}
          onClick={() => {
            if (time >= STARTUP_DURATION - 0.05) seek(0);
            setPlaying(!playing);
          }}
        >
          {playing ? "Ⅱ Pause" : "▶ Play with sound"}
        </button>
        <input
          type="range"
          aria-label="Startup timestamp"
          min="0"
          max={STARTUP_DURATION}
          step={1 / 30}
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <output>
          {time.toFixed(2)} / {STARTUP_DURATION.toFixed(2)} s
        </output>
      </div>
      <div className="study-tools">
        <div>
          {[0.5, 1.5, 2.5, 3, 3.5, 3.75, 4.25].map((t) => (
            <button key={t} onClick={() => seek(t)}>
              {t.toFixed(2)} s
            </button>
          ))}
        </div>
        <div>
          <button aria-pressed={overlay} onClick={() => setOverlay(!overlay)}>
            Overlay comparison
          </button>
          <button
            aria-pressed={wireframe}
            onClick={() => setWireframe(!wireframe)}
          >
            Glass cube wireframe
          </button>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <footer>
        {stats
          ? `${stats.engine} · ${stats.cubes} glass cubes · ${stats.pillars} rectangular pillars · ${stats.fogVolumes} smoke volume (${stats.volumeSteps} steps) · ${stats.lightTrails} persistent trails`
          : "Preparing the 3D scene…"}
        <span>Reference: ps2_startup.mp4 · 1920 × 1080 · 30 fps</span>
      </footer>
    </div>
  );
}
