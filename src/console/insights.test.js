import { describe, it, expect } from "vitest";
import { summarizeAccount } from "./insights";
import { graphqlPages } from "../lib/graphql";
const empty = { transactions: [], projects: [], audits: [], skills: [] };
describe("account summaries", () => {
  it("compares adjacent periods without counting future events or the boundary twice", () => {
    const now = new Date("2026-11-13T00:00:00Z");
    const data = {
      ...empty,
      transactions: [
        { id: 1, amount: 100, createdAt: "2026-10-14T00:00:00Z" },
        { id: 2, amount: 50, createdAt: "2026-10-13T23:59:59Z" },
        { id: 3, amount: 900, createdAt: "2026-11-14T00:00:00Z" },
      ],
    };
    const summary = summarizeAccount(data, 30, now);
    expect(summary.earned).toBe(100);
    expect(summary.prior).toBe(50);
    expect(summary.change).toBe(100);
  });
  it("excludes ungraded evaluations and never invents growth from a zero baseline", () => {
    const summary = summarizeAccount({
      ...empty,
      projects: [
        { id: 1, grade: null, createdAt: "2026-10-01" },
        { id: 2, grade: 1, createdAt: "2026-10-02" },
        { id: 3, grade: 0.8, createdAt: "2026-10-03" },
      ],
    });
    expect(summary.graded).toBe(2);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.change).toBeNull();
  });
});
describe("complete GraphQL history", () => {
  it("continues past a server page cap smaller than requested", async () => {
    const offsets = [];
    const request = async (q, { offset }) => {
      offsets.push(offset);
      return {
        transaction: [{ id: 1 }, { id: 2 }, { id: 3 }].slice(
          offset,
          offset + 2,
        ),
      };
    };
    const data = await graphqlPages("query", "transaction", request);
    expect(data.transaction).toHaveLength(3);
    expect(offsets).toEqual([0, 2, 3]);
  });
  it("fails explicitly when a server repeats pages instead of silently duplicating records", async () => {
    await expect(
      graphqlPages("query", "result", async () => ({ result: [{ id: 1 }] })),
    ).rejects.toThrow("Records changed");
  });
});
