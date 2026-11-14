import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MemoryBrowser from "./MemoryBrowser";
import { SAMPLE } from "./data";

vi.mock("../experience/Experience", () => ({ useExperience: () => ({ motion: true, setWorldObscured: vi.fn(), setMemoryAudioSuspended: vi.fn() }) }));
vi.mock("../lib/sound", () => ({ playOpenSound: vi.fn(), playBackSound: vi.fn(), playHoverSound: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
const mount = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MemoryBrowser data={SAMPLE} /></MemoryRouter>);
const tick = milliseconds => act(() => { vi.advanceTimersByTime(milliseconds); });

describe("memory browser transitions", () => {
  it("commits only at black, reads saves in sequence, then restores selection after closing details", () => {
    mount();
    const card = screen.getByRole("button", { name: /Main projects/ });
    fireEvent.click(card); fireEvent.click(card);
    tick(1699);
    expect(document.querySelector("dialog").open).toBe(false);
    tick(1);
    expect(document.querySelector("dialog").open).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Now Loading...");
    expect(screen.getByRole("button", { name: "View social-network, Passed" }).disabled).toBe(true);
    expect(document.querySelectorAll(".save-icon-reveal")).toHaveLength(12);
    tick(3300);
    expect(screen.queryByRole("status")).toBeNull();
    const save = screen.getByRole("button", { name: "View social-network, Passed" });
    fireEvent.mouseEnter(save);
    expect(document.activeElement).toBe(save);
    fireEvent.click(save);
    expect(screen.getByRole("heading", { name: "social-network" })).toBeTruthy();
    expect(screen.getByText("@player_two")).toBeTruthy();
    fireEvent.click(document.querySelector(".memory-detail-back"));
    tick(399);
    expect(document.querySelector(".save-detail-layer")).toBeTruthy();
    tick(1);
    expect(document.querySelector(".save-detail-layer")).toBeNull();
    expect(document.activeElement.getAttribute("aria-label")).toBe("View social-network, Passed");
  });
  it("cancels pending transitions and restores page scrolling when unmounted", () => {
    const view = mount();
    fireEvent.click(screen.getByRole("button", { name: /Main projects/ }));
    tick(1700);
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });
  it("keeps loaded folder icons until the card is closed, then reads them again on re-entry", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /JavaScript piscine/ }));
    tick(1700); tick(1700);
    fireEvent.click(screen.getByRole("button", { name: "Open quest-01, 3 exercises" }));
    tick(650); tick(1050);
    fireEvent.click(document.querySelector(".memory-back"));
    tick(650);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelectorAll(".save-browser-item.is-loaded")).toHaveLength(4);
    tick(650);
    fireEvent.click(document.querySelector(".memory-back"));
    tick(1700); tick(1700);
    fireEvent.click(screen.getByRole("button", { name: /JavaScript piscine/ }));
    tick(1700);
    expect(screen.getByRole("status").textContent).toBe("Now Loading...");
    expect(document.querySelectorAll(".save-browser-item.is-loaded")).toHaveLength(0);
  });
});
