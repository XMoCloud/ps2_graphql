import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AboutPage, { AboutEntry } from "./AboutPage";
import { playBackSound } from "../lib/sound";
import { ABOUT_EXIT_MS } from "../experience/startup/aboutMotion";

vi.mock("../lib/sound", () => ({ playBackSound: vi.fn(), playClickSound: vi.fn(), playHoverSound: vi.fn(), playOpenSound: vi.fn() }));
const experience = vi.hoisted(() => ({ motion: true, aboutLeaving: false, aboutExitAt: { current: 0 }, setAboutLeaving: vi.fn() }));
vi.mock("../experience/Experience", () => ({ useExperience: () => experience }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); vi.useRealTimers(); });
const mount = () => render(<MemoryRouter initialEntries={["/about"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
  <Route path="/about" element={<AboutPage backTo="/projects" />} />
  <Route path="/projects" element={<h1>Project menu restored</h1>} />
</Routes></MemoryRouter>);

describe("About page", () => {
  it("links the project name and copies the supplied Discord handle", async () => {
    const writeText = vi.fn().mockResolvedValue();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    try {
      mount();
      expect(screen.getByRole("link", { name: "osu! web" }).getAttribute("href")).toBe("https://xmocloud.github.io/Osu-Lazer-web/");
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy Discord handle xmo2" })));
      expect(writeText).toHaveBeenCalledWith("xmo2");
      expect(screen.getByRole("status").textContent).toBe("Discord handle copied");
    } finally { vi.unstubAllGlobals(); }
  });
  it("finishes shrinking before returning with Back or Escape, and ignores repeat exits", () => {
    vi.useFakeTimers();
    mount(); fireEvent.click(screen.getByRole("link", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "About Me" })).toBeTruthy();
    act(() => vi.advanceTimersByTime(ABOUT_EXIT_MS-1));
    expect(screen.queryByRole("heading", { name: "Project menu restored" })).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("heading", { name: "Project menu restored" })).toBeTruthy();
    cleanup(); mount(); fireEvent.keyDown(window, { key: "Escape" }); fireEvent.keyDown(window, { key: "Escape" });
    act(() => vi.advanceTimersByTime(ABOUT_EXIT_MS));
    expect(screen.getByRole("heading", { name: "Project menu restored" })).toBeTruthy();
    expect(playBackSound).toHaveBeenCalledTimes(2);
  });
  it("exposes a labeled, keyboard-accessible corner entry", () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AboutEntry to="/about" returnTo="/skills" /></MemoryRouter>);
    const entry = screen.getByRole("link", { name: "About this project" });
    expect(entry.getAttribute("href")).toBe("/about");
    expect(entry.parentElement).toBe(document.body);
    expect(entry.textContent).toBe("");
    expect(entry.querySelector("img").getAttribute("src")).toBe("/ps2_assets/ps2_logo.png");
  });
});
