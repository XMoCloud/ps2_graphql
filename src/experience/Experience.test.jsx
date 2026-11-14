import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate, useLocation } from "react-router-dom";
import Experience, { useExperience } from "./Experience";
import { fadeDashboardLoop, startDashboardLoop, stopDashboardLoop, playStartupSound } from "../lib/sound";
import { PORTAL_COMMIT_MS, PORTAL_ENTER_MS } from "./startup/cinematics";
vi.mock("../lib/auth", () => ({ isAuthenticated: () => false }));
vi.mock("../lib/sound", () => ({ configureSound: vi.fn(), fadeDashboardLoop: vi.fn(), startDashboardLoop: vi.fn(), stopDashboardLoop: vi.fn(), playStartupSound: vi.fn(), stopStartupSound: vi.fn() }));
function Probe() {
  const e = useExperience(), navigate = useNavigate(), location = useLocation();
  return <><output>{location.pathname}:{e.phase}:{e.navigation}</output>
    <button onClick={e.finishBoot}>Finish boot</button>
    <button onClick={() => { e.beginAccountAmbience(); e.navigateWorld(() => navigate("/preview/dashboard"), "menu"); }}>Accepted login</button>
    <button onClick={() => e.setWorldObscured(true)}>Open memory</button>
    <button onClick={() => e.setWorldObscured(false)}>Close memory</button>
    <button onClick={() => e.navigateWorld(() => navigate("/"), "login")}>Logout</button></>;
}
const mount = path => render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Experience><Probe /></Experience></MemoryRouter>);
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); vi.stubGlobal("matchMedia", () => ({ matches: false })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("experience ambience and exit", () => {
  it("keeps login silent when startup finishes", () => {
    mount("/"); fireEvent.click(screen.getByText("Finish boot"));
    expect(screen.getByRole("status").textContent).toBe("/:ready:");
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
    act(() => vi.advanceTimersByTime(PORTAL_COMMIT_MS));
    expect(screen.getByRole("status").textContent).toBe("/:ready:entering");
    act(() => vi.advanceTimersByTime(PORTAL_ENTER_MS));
    expect(screen.getByRole("status").textContent).toBe("/:ready:");
    expect(playStartupSound).not.toHaveBeenCalled();
  });
  it("starts waves at accepted login and keeps them uninterrupted through both camera stages", () => {
    sessionStorage.setItem("ps2-booted", "1"); mount("/");
    const stops = stopDashboardLoop.mock.calls.length;
    fireEvent.click(screen.getByText("Accepted login"));
    expect(startDashboardLoop).toHaveBeenCalledTimes(1);
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
});
