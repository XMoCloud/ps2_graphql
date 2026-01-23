import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, setToken, isAuthenticated } from "../lib/auth";
import PS2Background from "./PS2Background.js";
import { Triangle, Circle, Cross, Square, FloatingSymbols } from "./PS2Symbols.js";
import { playDashboardLoop } from "../lib/sound";

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStartup, setShowStartup] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);
  const [showDeathSequence, setShowDeathSequence] = useState(false);
  const [deathLoopActive, setDeathLoopActive] = useState(false);
  const [deathStartVisible, setDeathStartVisible] = useState(false);
  const deathStartRef = useRef(null);
  const deathLoopRef = useRef(null);
  const deathAudioRef = useRef(null);
  const hoverAudioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const [showSuccessTransition, setShowSuccessTransition] = useState(false);
  const transitionTimeoutRef = useRef(null);

  const extractErrorMessage = (rawMessage) => {
    if (!rawMessage) return "Login failed. Please check your credentials.";
    try {
      const parsed = JSON.parse(rawMessage);
      if (parsed?.error) {
        return parsed.error;
      }
    } catch {}
    return rawMessage;
  };

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
      return;
    }

    const v = videoRef.current;

    // Try to autoplay with audio. If it fails, mark autoplayBlocked so we
    // show a 'click to start' overlay using the PsOld font.
    const tryAutoplay = async () => {
      if (!v) return;
      v.muted = false;
      try {
        await v.play();
        setAutoplayBlocked(false);
      } catch (err) {
        setAutoplayBlocked(true);
      }
    };

    // Delay slightly to ensure element is rendered
    const t = setTimeout(tryAutoplay, 50);

    return () => clearTimeout(t);
  }, [navigate]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      setFadeOut(true);
      setTimeout(() => setShowStartup(false), 400);
    };

    v.addEventListener("ended", handleEnded);
    return () => v.removeEventListener("ended", handleEnded);
  }, []);

  // setup audio elements for hover and click sounds
  useEffect(() => {
    hoverAudioRef.current = new Audio('/ps2_assets/ps2_hover.mp3');
    hoverAudioRef.current.preload = 'auto';
    hoverAudioRef.current.volume = 0.5;

    clickAudioRef.current = new Audio('/ps2_assets/ps2_click.mp3');
    clickAudioRef.current.preload = 'auto';
    clickAudioRef.current.volume = 0.7;

    deathAudioRef.current = new Audio('/ps2_assets/ps2_death_sound.mp3');
    deathAudioRef.current.preload = 'auto';
    deathAudioRef.current.loop = true;
    deathAudioRef.current.volume = 0.9;

    return () => {
      hoverAudioRef.current = null;
      clickAudioRef.current = null;
      if (deathAudioRef.current) {
        deathAudioRef.current.pause();
        deathAudioRef.current = null;
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showDeathSequence) {
      if (deathAudioRef.current) {
        deathAudioRef.current.pause();
        deathAudioRef.current.currentTime = 0;
      }
      if (deathStartRef.current) {
        deathStartRef.current.pause();
        deathStartRef.current.currentTime = 0;
      }
      if (deathLoopRef.current) {
        deathLoopRef.current.pause();
        deathLoopRef.current.currentTime = 0;
      }
      setDeathLoopActive(false);
      setDeathStartVisible(false);
      return;
    }

    const startVideo = deathStartRef.current;
    if (startVideo) {
      startVideo.currentTime = 0;
      startVideo.play().catch(() => {});
    }
    setDeathStartVisible(true);

    if (deathAudioRef.current) {
      deathAudioRef.current.currentTime = 0;
      deathAudioRef.current.play().catch(() => {});
    }
  }, [showDeathSequence]);

  useEffect(() => {
    if (!deathLoopActive) {
      if (deathLoopRef.current) {
        deathLoopRef.current.pause();
        deathLoopRef.current.currentTime = 0;
      }
      return;
    }

    const loopVideo = deathLoopRef.current;
    if (loopVideo) {
      loopVideo.currentTime = 0;
      loopVideo.play().catch(() => {});
    }
  }, [deathLoopActive]);

  const stopDeathSequence = () => {
    setShowDeathSequence(false);
    setDeathLoopActive(false);
    if (deathAudioRef.current) {
      deathAudioRef.current.pause();
      deathAudioRef.current.currentTime = 0;
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

  const triggerDeathSequence = () => {
    setShowDeathSequence(true);
    setDeathLoopActive(false);
    setDeathStartVisible(true);
  };

  const playHover = () => {
    try {
      const a = hoverAudioRef.current;
      if (!a) return;
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch {}
  };

  const playClick = () => {
    try {
      const a = clickAudioRef.current;
      if (!a) return;
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    stopDeathSequence();

    try {
      const token = await signIn(identifier, password);
      setToken(token);
      stopDeathSequence();
      setShowSuccessTransition(true);
      playDashboardLoop();
      transitionTimeoutRef.current = setTimeout(() => {
        navigate("/dashboard", { state: { fromLogin: true } });
      }, 350);
    } catch (err) {
      setError(extractErrorMessage(err?.message));
      triggerDeathSequence();
    } finally {
      setLoading(false);
    }
  };

  const labelColorClass = showDeathSequence ? "text-red-300" : "text-muted-foreground";
  const headingClass = showDeathSequence ? "text-red-400" : "text-primary";
  const subheadingClass = showDeathSequence ? "text-red-200/80" : "text-muted-foreground";

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-700 ${showDeathSequence ? 'bg-red-950 death-mode' : 'bg-black'}`}>
      <PS2Background />
      <div
        className={`absolute inset-0 pointer-events-none ps2-wallpaper transition-opacity duration-700 ${showDeathSequence ? 'opacity-0' : 'opacity-10'}`}
        style={{ zIndex: 15 }}
      />
      <div className="absolute inset-0 z-20 pointer-events-none">
        <FloatingSymbols variant={showDeathSequence ? "death" : "default"} />
      </div>

      {showSuccessTransition && <div className="route-transition-overlay route-transition-overlay--closing" />}

      {showDeathSequence && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 death-overlay" />
          {deathStartVisible && (
            <video
              ref={deathStartRef}
              src="/ps2_assets/ps2_death_start.mp4"
              className="death-video"
              playsInline
              muted
              onEnded={() => {
                setDeathStartVisible(false);
                setDeathLoopActive(true);
              }}
            />
          )}
          {deathLoopActive && (
            <video
              ref={deathLoopRef}
              src="/ps2_assets/ps2_death_loop.mp4"
              className="death-video"
              playsInline
              muted
              loop
            />
          )}
        </div>
      )}

      <div className="relative z-30 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Triangle size={24} className={showDeathSequence ? "text-red-400" : "text-ps2-triangle"} />
            <Circle size={24} className={showDeathSequence ? "text-red-300" : "text-ps2-circle"} />
            <Cross size={24} className={showDeathSequence ? "text-red-500" : "text-ps2-cross"} />
            <Square size={24} className={showDeathSequence ? "text-red-400" : "text-ps2-square"} />
          </div>
          <h1 className={`psold-font text-3xl sm:text-4xl md:text-5xl font-bold ps2-heading ps2-glow-text whitespace-nowrap ${headingClass}`}>
            PS2 GraphQL
          </h1>
          <p className={`zrnic-font text-base mt-2 ${subheadingClass}`}>Sign in to view your stats</p>
        </div>

        <div className={`ps2-card p-8 ${showDeathSequence ? 'ps2-card-death' : ''}`} style={{ transitionProperty: 'opacity, transform' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className={`block zrnic-font text-sm uppercase tracking-wider ${labelColorClass}`}>
                Username or Email
              </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={`ps2-input zrnic-font ${showDeathSequence ? 'ps2-input-death' : ''}`}
                  placeholder="Enter your username or email"
                  required
                  autoComplete="username"
                  onMouseEnter={playHover}
                  onFocus={playClick}
                />
            </div>

            <div className="space-y-2">
              <label className={`block zrnic-font text-sm uppercase tracking-wider ${labelColorClass}`}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`ps2-input zrnic-font ${showDeathSequence ? 'ps2-input-death' : ''}`}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                onMouseEnter={playHover}
                onFocus={playClick}
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-white text-sm zrnic-font tracking-wide animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`ps2-button w-full disabled:opacity-50 disabled:cursor-not-allowed ${showDeathSequence ? 'ps2-button-death' : ''}`}
              onMouseEnter={playHover}
              onMouseDown={playClick}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 psold-font uppercase tracking-widest">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 psold-font uppercase tracking-widest">
                  <Cross size={16} />
                  Sign In
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground zrnic-font">Use your Reboot01 credentials to login</p>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-8 opacity-40">
          <Triangle size={20} className={showDeathSequence ? "text-red-400" : "text-ps2-triangle"} />
          <Circle size={20} className={showDeathSequence ? "text-red-300" : "text-ps2-circle"} />
          <Cross size={20} className={showDeathSequence ? "text-red-500" : "text-ps2-cross"} />
          <Square size={20} className={showDeathSequence ? "text-red-400" : "text-ps2-square"} />
        </div>
      </div>

      {/* Startup overlay — rendered above the login UI so the page can load behind it */}
      {showStartup && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
          <video
            ref={videoRef}
            src="/ps2_assets/ps2_startup.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            preload="auto"
          />

          {autoplayBlocked && (
            <div
              onClick={async () => {
                const v = videoRef.current;
                if (!v) return;
                try {
                  v.muted = false;
                  await v.play();
                  setAutoplayBlocked(false);
                } catch (err) {
                  setAutoplayBlocked(true);
                }
              }}
              className="relative z-10 flex flex-col items-center justify-center w-full h-full cursor-pointer"
              style={{ background: "#000" }}
            >
              <div className="text-white text-center">
                <h1 className="psold-font text-4xl">click to start</h1>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Login;
