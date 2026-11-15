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
      <h1>404</h1>
      <Link className="outline-button" to="/dashboard">
        Return to overview
      </Link>
    </main>
  );
}
