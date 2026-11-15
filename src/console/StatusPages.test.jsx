import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AuditPage } from "./StatusPages";

vi.mock("./Charts", async (original) => ({
  ...await original(),
  ExchangeChart: () => null,
}));
vi.mock("./InsightCharts", () => ({ AuditBalanceChart:()=>null, AuditOutcomeChart:()=>null }));
afterEach(cleanup);

describe("Audit balance target", () => {
  it("keeps the chosen ratio selected and updates its credit calculation", () => {
    render(<AuditPage data={{ up: 1500, down: 2000, audits: [], auditsGiven: [], auditsReceived: [] }} />);
    const select = screen.getByRole("combobox", { name: "Target ratio" });
    const panel = within(screen.getByRole("heading", { name: "Balance target" }).closest("section"));

    for (const [ratio, credit] of [["2.0", "2.5 kB"], ["1.5", "1.5 kB"], ["1.2", "0.9 kB"], ["1.0", "0.5 kB"]]) {
      const option = within(select).getByRole("option", { name: ratio });
      fireEvent.change(select, { target: { value: option.value } });
      expect(select.selectedOptions[0].textContent).toBe(ratio);
      expect(panel.getByText(credit)).toBeTruthy();
      expect(panel.getByText(`Additional given credit to reach ${ratio}, assuming received credit stays the same.`)).toBeTruthy();
    }
  });
});
