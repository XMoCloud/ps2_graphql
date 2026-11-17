import React from "react";
import { useExperience } from "../experience/Experience";
import "./startup.css";
export default function Startup() {
  const { phase, renderer, startBoot, finishBoot, setRenderer, worldReady: ready, worldError } =
    useExperience();
  const error = worldError ? "The 3D world could not initialize." : "";
  if (phase === "ready") return null;
  return (
    <div className={`boot-screen boot-${phase} playcanvas-startup`}>
      {phase === "prompt" ? (
        <div className="boot-prompt">
          <span className="boot-mark psold-font">PS2</span>

          <button
            className="boot-start"
            onClick={startBoot}
            disabled={!ready || Boolean(error)}
          >
            <span>×</span> {ready ? "Start system" : "Preparing system…"}
          </button>

          {error && (
            <><p role="status" className="startup-error">{error}</p>
              <button className="text-control" onClick={() => { setRenderer("assets"); finishBoot(); }}>Use original background</button></>
          )}
        </div>
      ) : (
        <>
          {renderer !== "assets" && <div className="boot-wordmark">
            <span className="startup-credit">Sony Computer Entertainment</span>
          </div>}
        </>
      )}
    </div>
  );
}
