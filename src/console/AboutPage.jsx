import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { playBackSound, playClickSound, playHoverSound, playOpenSound } from "../lib/sound";
import { useExperience } from "../experience/Experience";
import { ABOUT_ENTER_MS, ABOUT_EXIT_MS } from "../experience/startup/aboutMotion";

export function AboutEntry({ to, returnTo }) {
  return createPortal(<Link className="about-entry" to={to} state={{ returnTo }} aria-label="About this project"
    onMouseEnter={playHoverSound} onClick={playOpenSound}>
    <img src="/ps2_assets/ps2_logo.png" alt="" aria-hidden="true" />
  </Link>, document.body);
}

export default function AboutPage({ backTo }) {
  const navigate = useNavigate(), title = useRef(null), resetCopy = useRef();
  const { motion, aboutLeaving, setAboutLeaving, aboutExitAt } = useExperience();
  const exitTimer = useRef(), closing = useRef(false);
  const [copied, setCopied] = useState(false), [copyFailed, setCopyFailed] = useState(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    playBackSound();
    if (!motion) { navigate(backTo); return; }
    aboutExitAt.current = performance.now();
    setAboutLeaving(true);
    exitTimer.current = setTimeout(() => navigate(backTo), ABOUT_EXIT_MS);
  }, [motion, backTo, navigate, setAboutLeaving, aboutExitAt]);
  useEffect(() => () => { clearTimeout(exitTimer.current); setAboutLeaving(false); }, [setAboutLeaving]);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    const back = event => {
      if (!["Escape", "Backspace"].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      event.preventDefault(); close();
    };
    window.addEventListener("keydown", back);
    return () => { window.removeEventListener("keydown", back); clearTimeout(resetCopy.current); };
  }, [close]);
  const copyDiscord = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText("xmo2");
      setCopied(true); setCopyFailed(false);
      clearTimeout(resetCopy.current);
      resetCopy.current = setTimeout(() => setCopied(false), 2200);
    } catch { setCopyFailed(true); }
  };
  return <main className={`about-page ${aboutLeaving ? "about-is-closing" : ""}`}
    style={{ "--about-enter": `${ABOUT_ENTER_MS}ms`, "--about-exit": `${ABOUT_EXIT_MS}ms` }}>
    <section className="about-copy" aria-labelledby="about-title">
      <h1 ref={title} tabIndex={-1} id="about-title">About Me</h1>
      <p>Hi, I’m Muhannad. I built this PS2-inspired GraphQL dashboard to bring a little PlayStation nostalgia to my Reboot01 journey.</p>
      <p>I hope you enjoy exploring it as much as I enjoyed creating it.</p>
      <p className="about-invitation">Try my other project, <a href="https://xmocloud.github.io/Osu-Lazer-web/" target="_blank" rel="noopener noreferrer"
        onMouseEnter={playHoverSound} onClick={playOpenSound}>osu! web</a>, or say hello on Discord.</p>
      <button className="about-discord" onMouseEnter={playHoverSound} onClick={copyDiscord} aria-label="Copy Discord handle xmo2">Discord <span>xmo2</span></button>
      <span className="about-copy-feedback" role="status">{copied ? "Discord handle copied" : copyFailed ? "Discord username: xmo2" : ""}</span>
    </section>
    <Link className="about-back" to={backTo} aria-disabled={aboutLeaving || undefined} onMouseEnter={playHoverSound}
      onClick={event => { event.preventDefault(); close(); }}>Back</Link>
  </main>;
}
