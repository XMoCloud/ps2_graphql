import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate, useLocation } from "react-router-dom";
import Experience, { useExperience } from "./Experience";
import { fadeDashboardLoop, startDashboardLoop, stopDashboardLoop, playStartupSound, playPostStartupSound, prepareLoginLoop, fadeLoginLoop, fadeErrorSound } from "../lib/sound";
import { STARTUP_DURATION } from "./startup/timeline";
import { PORTAL_COMMIT_MS, PORTAL_ENTER_MS } from "./startup/cinematics";
vi.mock("../lib/auth", () => ({ isAuthenticated: () => false }));
vi.mock("../lib/sound", () => ({ configureSound: vi.fn(), fadeDashboardLoop: vi.fn(), startDashboardLoop: vi.fn(), stopDashboardLoop: vi.fn(), playStartupSound: vi.fn(), playPostStartupSound: vi.fn(), stopStartupSound: vi.fn(), prepareLoginLoop:vi.fn(), fadeLoginLoop:vi.fn(), stopLoginLoop:vi.fn(), fadeErrorSound:vi.fn(), stopErrorSound: vi.fn() }));
function Probe() {
  const e = useExperience(), navigate = useNavigate(), location = useLocation();
  return <><output>{location.pathname}:{e.phase}:{e.navigation}</output>
    <button onClick={e.startBoot}>Start boot</button>
    <button onClick={e.finishBoot}>Finish boot</button>
    <button onClick={() => { e.setSceneError(false); e.beginAccountAmbience(); e.navigateWorld(() => navigate("/preview/dashboard"), "menu"); }}>Accepted login</button>
    <button onClick={() => e.setWorldObscured(true)}>Open memory</button>
    <button onClick={() => e.setWorldObscured(false)}>Close memory</button>
    <button onClick={() => e.setSceneError(true)}>Invalid login</button>
    <button onClick={() => e.setSceneError(false)}>Clear error</button>
    <button onClick={() => navigate("/preview/about")}>About</button>
    <button onClick={() => e.navigateWorld(() => navigate("/"), "login")}>Logout</button></>;
}
const mount = path => render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Experience><Probe /></Experience></MemoryRouter>);
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); vi.stubGlobal("matchMedia", () => ({ matches: false })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("experience ambience and exit", () => {
  it("keeps account ambience active when opening About", () => {
    sessionStorage.setItem("ps2-booted", "1"); mount("/preview/dashboard");
    const stops = stopDashboardLoop.mock.calls.length;
    fireEvent.click(screen.getByText("About"));
    expect(screen.getByRole("status").textContent).toBe("/preview/about:ready:");
    expect(stopDashboardLoop).toHaveBeenCalledTimes(stops);
    expect(fadeDashboardLoop).toHaveBeenLastCalledWith(true, 1700);
  });
  it("plays the post-startup cue once at login arrival, including duplicate finish events", () => {
    mount("/");
    fireEvent.click(screen.getByText("Start boot"));
    expect(playPostStartupSound).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(STARTUP_DURATION*1000));
    expect(playPostStartupSound).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toBe("/:ready:");
    fireEvent.click(screen.getByText("Finish boot"));
    expect(playPostStartupSound).toHaveBeenCalledTimes(1);
  });
  it("starts the login loop at startup arrival without starting the dashboard waves", () => {
    mount("/");
    fireEvent.click(screen.getByText("Start boot"));
    expect(prepareLoginLoop).toHaveBeenCalledTimes(1);
    expect(fadeLoginLoop).not.toHaveBeenCalledWith(true,1000);
    act(()=>vi.advanceTimersByTime(STARTUP_DURATION*1000));
    expect(screen.getByRole("status").textContent).toBe("/:ready:");
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(true,1000);
    expect(fadeDashboardLoop).not.toHaveBeenCalled();
    expect(stopDashboardLoop).toHaveBeenCalled();
  });
  it("fades ambience across memory menus and returns to login without rebooting", () => {
    sessionStorage.setItem("ps2-booted", "1"); mount("/preview/dashboard");
    expect(fadeDashboardLoop).toHaveBeenLastCalledWith(true, 1700);
    fireEvent.click(screen.getByText("Open memory"));
    expect(fadeDashboardLoop).toHaveBeenLastCalledWith(false, 1700);
    fireEvent.click(screen.getByText("Close memory"));
    expect(fadeDashboardLoop).toHaveBeenLastCalledWith(true, 1700);
    fireEvent.click(screen.getByText("Logout"));
    expect(fadeDashboardLoop).toHaveBeenLastCalledWith(false,1000);
    expect(prepareLoginLoop).toHaveBeenCalledTimes(1);
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(false,1000);
    act(() => vi.advanceTimersByTime(PORTAL_COMMIT_MS));
    expect(screen.getByRole("status").textContent).toBe("/:ready:entering");
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(true,1000);
    act(() => vi.advanceTimersByTime(PORTAL_ENTER_MS));
    expect(screen.getByRole("status").textContent).toBe("/:ready:");
    expect(playStartupSound).not.toHaveBeenCalled();
    expect(playPostStartupSound).not.toHaveBeenCalled();
  });
  it("starts waves at accepted login and keeps them uninterrupted through both camera stages", () => {
    sessionStorage.setItem("ps2-booted", "1"); mount("/");
    const stops = stopDashboardLoop.mock.calls.length;
    fireEvent.click(screen.getByText("Accepted login"));
    expect(startDashboardLoop).toHaveBeenCalledTimes(1);
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(false,1000);
    expect(screen.getByRole("status").textContent).toBe("/:ready:leaving");
    expect(stopDashboardLoop).toHaveBeenCalledTimes(stops);
    act(() => vi.advanceTimersByTime(PORTAL_COMMIT_MS));
    expect(screen.getByRole("status").textContent).toBe("/preview/dashboard:ready:entering");
    act(() => vi.advanceTimersByTime(PORTAL_ENTER_MS));
    expect(stopDashboardLoop).toHaveBeenCalledTimes(stops);
    expect(fadeDashboardLoop).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Open memory"));
    expect(fadeDashboardLoop).toHaveBeenLastCalledWith(false, 1700);
    fireEvent.click(screen.getByText("Close memory"));
    expect(fadeDashboardLoop).toHaveBeenLastCalledWith(true, 1700);
  });
  it("crossfades to the death screen and stays silent for a successful login from that screen",()=>{
    sessionStorage.setItem("ps2-booted","1");mount("/");
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(true,1000);
    fireEvent.click(screen.getByText("Invalid login"));
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(false,1000);
    expect(fadeErrorSound).toHaveBeenLastCalledWith(true,1000);
    fireEvent.click(screen.getByText("Clear error"));
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(true,1000);
    expect(fadeErrorSound).toHaveBeenLastCalledWith(false,1000);
    fireEvent.click(screen.getByText("Invalid login"));
    const plays=fadeLoginLoop.mock.calls.filter(([audible])=>audible).length;
    fireEvent.click(screen.getByText("Accepted login"));
    expect(fadeLoginLoop).toHaveBeenLastCalledWith(false,1000);
    expect(fadeErrorSound).toHaveBeenLastCalledWith(false,1000);
    expect(startDashboardLoop).toHaveBeenCalledTimes(1);
    act(()=>vi.advanceTimersByTime(PORTAL_COMMIT_MS+PORTAL_ENTER_MS));
    expect(fadeLoginLoop.mock.calls.filter(([audible])=>audible)).toHaveLength(plays);
  });
});
