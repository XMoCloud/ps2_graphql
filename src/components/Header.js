import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { removeToken } from "../lib/auth";
import { stopDashboardLoop, playHoverSound, playClickSound, playLogoutSound } from "../lib/sound";

const Header = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompactNav, setIsCompactNav] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 880 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const shouldCompact = window.innerWidth <= 880;
      setIsCompactNav(shouldCompact);
      if (!shouldCompact) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    playLogoutSound();
    removeToken();
    stopDashboardLoop();
    navigate("/");
  };

  const handleBrandClick = (event) => {
    if (isCompactNav) {
      event.preventDefault();
      setIsMenuOpen((prev) => !prev);
      playClickSound();
    } else {
      playClickSound();
    }
  };

  return (
    <header className="relative z-50 border-b border-border bg-card/50 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-4 group"
            onClick={handleBrandClick}
            aria-expanded={isCompactNav ? isMenuOpen : undefined}
            aria-controls={isCompactNav ? "ps2-mobile-menu" : undefined}
          >
            <img
              src="/ps2_assets/ps2_logo.png"
              alt="PS2 logo"
              className="w-12 h-12 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            />
            <span className="psold-font text-white text-2xl tracking-[0.4em] uppercase max-[570px]:hidden">
              GraphQL
            </span>
          </Link>

          <nav className="flex items-center gap-6 max-[880px]:hidden">
            <Link
              to="/dashboard"
              className={`zrnic-font text-base uppercase tracking-[0.3em] transition-colors hover:text-primary ${
                location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
              }`}
              onMouseEnter={playHoverSound}
              onFocus={playHoverSound}
              onClick={playClickSound}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`zrnic-font text-base uppercase tracking-[0.3em] transition-colors hover:text-primary ${
                location.pathname === "/projects" ? "text-primary" : "text-muted-foreground"
              }`}
              onMouseEnter={playHoverSound}
              onFocus={playHoverSound}
              onClick={playClickSound}
            >
              Projects
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right max-[1025px]:hidden">
                <p className="psold-font text-sm text-primary uppercase tracking-[0.2em]">{user.login}</p>
                <p className="text-xs text-muted-foreground">ID: {user.id}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              onMouseEnter={playHoverSound}
              onFocus={playHoverSound}
              className="px-4 py-2 rounded border border-destructive/30 text-destructive text-sm psold-font uppercase tracking-[0.3em] hover:bg-destructive/10 hover:border-destructive/60 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {isCompactNav && (
        <>
          <div
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${
              isMenuOpen ? "opacity-100 pointer-events-auto bg-background/70" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            id="ps2-mobile-menu"
            className={`absolute left-0 right-0 top-full px-6 transition-all duration-300 ease-out z-50 ${
              isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="bg-gradient-to-br from-[#040b2a]/95 via-[#021131]/95 to-[#01061a]/95 border border-primary/40 rounded-xl shadow-[0_10px_40px_rgba(15,97,255,0.25)] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <p className="psold-font uppercase tracking-[0.3em] text-sm text-muted-foreground">Navigation</p>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-primary transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 divide-y divide-white/5">
                <Link
                  to="/dashboard"
                  className={`flex items-center justify-between px-5 py-4 uppercase tracking-[0.3em] text-sm zrnic-font transition-colors ${
                    location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                  } hover:text-primary`}
                  onClick={() => {
                    playClickSound();
                    setIsMenuOpen(false);
                  }}
                  onMouseEnter={playHoverSound}
                  onFocus={playHoverSound}
                >
                  Dashboard
                  <span className="text-xs text-muted-foreground">/01</span>
                </Link>
                <Link
                  to="/projects"
                  className={`flex items-center justify-between px-5 py-4 uppercase tracking-[0.3em] text-sm zrnic-font transition-colors ${
                    location.pathname === "/projects" ? "text-primary" : "text-muted-foreground"
                  } hover:text-primary`}
                  onClick={() => {
                    playClickSound();
                    setIsMenuOpen(false);
                  }}
                  onMouseEnter={playHoverSound}
                  onFocus={playHoverSound}
                >
                  Projects
                  <span className="text-xs text-muted-foreground">/02</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
