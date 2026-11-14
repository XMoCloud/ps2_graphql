import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useExperience } from "../experience/Experience";
import { isAuthenticated, removeToken } from "../lib/auth";
import {
  playClickSound,
  playHoverSound,
  playLogoutSound,
  stopDashboardLoop,
} from "../lib/sound";
import { useAccount } from "./data";
import DashboardPage from "./DashboardPage";
import MemoryBrowser from "./MemoryBrowser";
import { AuditPage, SkillsPage } from "./StatusPages";
import { MenuPrompts } from "./ConsoleKeys";
import AboutPage, { AboutEntry } from "./AboutPage";

const sections = [
  ["dashboard", "Overview"],
  ["projects", "Projects"],
  ["audits", "Audits"],
  ["skills", "Skills"],
];
export function Brand() {
  return (
    <span className="system-brand">
      <span className="psold-font">PS2</span>
      <span className="brand-name">Reboot01</span>
    </span>
  );
}
function ConsoleClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <time className="console-datetime console-date" aria-label="Local date" dateTime={`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`}>
        {now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })}
      </time>
      <time className="console-datetime console-time" aria-label="Local time" dateTime={now.toISOString()}>
        {now.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })}
      </time>
    </>
  );
}
export default function ConsoleApp() {
  const location = useLocation(),
    navigate = useNavigate(),
    e = useExperience();
  const preview = import.meta.env.DEV && location.pathname.startsWith("/preview"),
    base = preview ? "/preview" : "";
  const key =
      location.pathname.replace("/preview", "").split("/")[1] || "dashboard",
    section = sections.find((s) => s[0] === key) || sections[0];
  const { data, loading, errors, refresh } = useAccount(preview),
    heading = useRef(null),
    leaving = useRef(false);
  useEffect(() => {
    e.setExplore(false);
    e.setSceneError(false);
    if (!document.activeElement?.closest(".console-navigation"))
      heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [key]);
  if (!preview && !isAuthenticated()) return <Navigate to="/" replace />;
  const leave = () => {
    if (e.navigation || leaving.current) return;
    leaving.current = true;
    playLogoutSound();
    stopDashboardLoop();
    e.navigateWorld(() => {
      if (!preview) removeToken();
      navigate("/");
    }, "login");
  };
  if (key === "about") {
    const allowed = sections.map(([id]) => `${base}/${id}`);
    const backTo = allowed.includes(location.state?.returnTo) ? location.state.returnTo : `${base}/dashboard`;
    return <AboutPage backTo={backTo} />;
  }
  return (
    <div
      className={`console-app status-console section-${key} ${preview ? "is-preview" : ""}`}
    >
      <header className="console-topbar">
        <div className="console-topbar-inner">
          <Link className="console-brand-link" to={`${base}/dashboard`} aria-label="Overview">
            <Brand />
          </Link>
          <ConsoleClock />
          <nav
            className="console-navigation"
            aria-label="Main menu"
            onKeyDown={(event) => {
              if (
                ![
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                ].includes(event.key)
              )
                return;
              event.preventDefault();
              const links = [...event.currentTarget.querySelectorAll("a")],
                current = links.indexOf(document.activeElement);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? links.length - 1
                    : (current +
                        (["ArrowRight", "ArrowDown"].includes(event.key)
                          ? 1
                          : -1) +
                        links.length) %
                      links.length;
              links[next].focus();
              links[next].click();
            }}
          >
            {sections.map(([id, label]) => (
              <Link
                key={id}
                to={`${base}/${id}`}
                className={`console-nav-item ${key === id ? "selected" : ""}`}
                aria-current={key === id ? "page" : undefined}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                <span className="nav-label">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="console-account-actions">
            <span className="account-label" title={data.user?.login}>
              {preview ? "Sample account" : data.user?.login || "Connecting"}
            </span>
            <button className="text-control exit-control" disabled={Boolean(e.navigation)} onClick={leave}>
              {preview ? "Exit preview" : "Log out"}
            </button>
          </div>
        </div>
      </header>
      <main className="console-content" key={key}>
        <div className="page-title">
          <h1 ref={heading} tabIndex={-1}>
            {section[1]}
          </h1>
        </div>
        {errors.length > 0 && (
          <div className="data-warning" role="status">
            Could not load: {errors.join(", ")}.{" "}
            <button onClick={refresh}>Retry</button>
            <Link to="/">Sign in again</Link>
          </div>
        )}
        {loading ? (
          <div role="status" className="loading-console">
            <span />
            Reading your memory cards…
          </div>
        ) : (
          <>
            {key === "dashboard" && <DashboardPage data={data} base={base} />}
            {key === "projects" && <MemoryBrowser data={data} />}
            {key === "audits" && <AuditPage data={data} />}
            {key === "skills" && <SkillsPage data={data} />}
          </>
        )}
      </main>
      <MenuPrompts />
      <AboutEntry to={`${base}/about`} returnTo={location.pathname} />
    </div>
  );
}
