import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, signIn, setToken } from "../lib/auth";
import {
  playClickSound,
  playLoginSound,
  prepareDashboardLoop,
  unlockAudio,
  playHoverSound,
  stopDashboardLoop,
} from "../lib/sound";
import { useExperience } from "../experience/Experience";
import { GlassSurface, ConsoleButton } from "../console/ConsoleGlass";
import { ConsoleKey } from "../console/ConsoleKeys";

export default function Login() {
  const navigate = useNavigate(),
    e = useExperience();
  const [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (isAuthenticated()) navigate("/dashboard", { replace: true });
    return () => {
      e.setSceneError(false);
    };
  }, [navigate]);
  const submit = async (event) => {
    event.preventDefault();
    if (busy || e.navigation) return;
    setBusy(true);
    setError("");
    unlockAudio();
    prepareDashboardLoop();
    playClickSound();
    try {
      const token = await signIn(identifier, password);
      setToken(token);
      e.setSceneError(false);
      e.beginAccountAmbience();
      playLoginSound();
      e.navigateWorld(() => navigate("/dashboard"), "menu");
    } catch (err) {
      let message = err.message;
      try {
        message = JSON.parse(message).error || message;
      } catch {}
      if ([400, 401, 403].includes(err.status)) {
        setError(message || "The username or password is incorrect.");
        setPassword("");
        stopDashboardLoop();
        e.setSceneError(true);
        requestAnimationFrame(() => document.getElementById("password")?.focus());
      } else setError(message || "Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className={`login-page ${e.arrivalActive ? "is-arriving" : ""} ${e.sceneError ? "is-error" : ""}`}
    >
      <div className="login-layout">
        <div className="login-intro">
          <div className="login-wordmark psold-font" aria-label="PlayStation 2">
            PS2
          </div>
          <p className="login-product">Reboot01</p>
        </div>
        <GlassSurface
          as="main"
          radius={30}
          refract={52}
          className="login-form-area"
        >
          <h1>Sign in</h1>
          <form onSubmit={submit}>
            <div className="login-field">
              <label htmlFor="identifier">Username or email</label>
              <GlassSurface
                as="div"
                radius={14}
                refract={22}
                blur={0.6}
                className="login-input-wrap"
              >
                <input
                  id="identifier"
                  autoComplete="username"
                  required
                  onPointerEnter={playHoverSound}
                  onPointerDown={playClickSound}
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    setError("");
                  }}
                  placeholder="Your Reboot01 username"
                />
              </GlassSurface>
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <GlassSurface
                as="div"
                radius={14}
                refract={22}
                blur={0.6}
                className="login-input-wrap"
              >
                <input
                  id="password"
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  required
                  onPointerEnter={playHoverSound}
                  onPointerDown={playClickSound}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onMouseEnter={playHoverSound}
                  onClick={() => { playClickSound(); setShowPassword(!showPassword); }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </GlassSurface>
            </div>
            {error && (
              <p role="alert" id="login-error" className="login-error-message">
                {error}
              </p>
            )}
            <ConsoleButton
              className="connect-button"
              disabled={busy || Boolean(e.navigation)}
              onMouseEnter={playHoverSound}
              type="submit"
            >
              <ConsoleKey decorative>ENTER</ConsoleKey>
              {busy ? "Connecting..." : "Sign in"}
            </ConsoleButton>
          </form>
        </GlassSurface>
      </div>
    </div>
  );
}
