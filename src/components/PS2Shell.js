import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PS2Background from "./PS2Background.js";
import PS2AmbientLayer from "./PS2AmbientLayer.js";

const PS2Shell = () => {
  const location = useLocation();
  const [fadeState, setFadeState] = useState("fade-in");

  useEffect(() => {
    setFadeState("fade-out");
    const timeout = setTimeout(() => setFadeState("fade-in"), 400);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PS2Background />
      <PS2AmbientLayer />
      <div className={`ps2-shell-content ${fadeState}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default PS2Shell;
