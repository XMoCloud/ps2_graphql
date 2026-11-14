import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useExperience } from "../experience/Experience";
export default function NotFound() {
  const e = useExperience();
  useEffect(() => {
    e.setSceneError(true);
    return () => e.setSceneError(false);
  }, []);
  return (
    <main className="not-found">
      <p className="eyebrow">SYSTEM / DISC ERROR</p>
      <h1>404</h1>
      <h2>This world could not be found.</h2>
      <p>The page may have moved. Your journey is still here.</p>
      <Link className="outline-button" to="/dashboard">
        × Return to overview
      </Link>
    </main>
  );
}
