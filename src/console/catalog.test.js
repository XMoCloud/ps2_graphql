import { describe, expect, it } from "vitest";
import {
  learningItems,
  memoryCards,
  questGroups,
  monthlySeries,
  auditState,
  skillRows,
  projectTeams,
} from "./catalog";
import { graphqlPages } from "../lib/graphql";
const root = "/bahrain/bh-module/piscine-rust";
const record = (id, path, grade, type = "exercise") => ({
  id,
  objectId: 17,
  path,
  grade,
  createdAt: `2026-04-${String(id).padStart(2, "0")}T10:00:00Z`,
  object: { id: 17, name: "same exercise", type },
});
describe("memory card records", () => {
  it("merges reissued main-project names and retains their unique history",()=>{
    const old=record(1,"/bahrain/bh-module/graphql-old",0,"project");
    old.object={id:17,name:" GraphQL ",type:"project"};
    const current={...record(2,"/bahrain/bh-module/graphql",1.2,"project"),objectId:18,object:{id:18,name:"graphql",type:"project"}};
    const cards=memoryCards({results:[old,current,old],allProgress:[],allTransactions:[],events:[]});
    expect(cards[0].items).toHaveLength(1);
    expect(cards[0].passed).toBe(1);
    expect(cards[0].items[0].history).toHaveLength(2);
    expect(cards[0].items[0].passed).toBe(true);
    expect(cards[0].items[0].path).toBe(current.path);
  });
  it("assigns console slots Main, Go, JavaScript, Rust independent of enrollment order", () => {
    const cards=memoryCards({events:[root,"/bahrain/bh-module/piscine-js","/bahrain/bh-piscine"]
      .map((path,i)=>({id:4-i,event:{path}}))});
    expect(cards.map(c=>c.short)).toEqual(["MODULE","GO","JS","RUST"]);
  });
  it("attaches only this project's teams, deduplicates membership rows and preserves captain roles", () => {
    const item = record(1, "/bahrain/bh-module/social-network", 1, "project");
    const group = {
      id: 11, objectId: 17, path: item.path, captainId: 2,
      members: [
        { userId: 2, user: { login: "teammate", firstName: "Team", lastName: "Mate" } },
        { userId: 3, user: null },
        { userId: 2, user: { login: "teammate", firstName: "Team", lastName: "Mate" } },
      ],
    };
    const teams = projectTeams(item, [
      { group }, { group },
      { group: { ...group, id: 12, path: root + "/social-network" } },
      { group: { ...group, id: 13, objectId: 999 } },
    ]);
    expect(teams).toHaveLength(1);
    expect(teams[0].members).toEqual([
      { id: 2, login: "teammate", name: "Team Mate", captain: true },
      { id: 3, login: null, name: "", captain: false },
    ]);
    expect(projectTeams(item, [])).toEqual([]);
  });
  it("keeps checkpoint and quest contexts separate and retains a pass before a later failure", () => {
    const path = root + "/quest-01/same";
    const items = learningItems({
      results: [
        record(1, path, 1),
        record(2, path, 0.4),
        record(3, root + "/checkpoint-01/same", 0.5),
      ],
      allProgress: [],
      allTransactions: [{ ...record(4, path), type: "xp", amount: 850 }],
    });
    expect(items).toHaveLength(2);
    const item = items.find((r) => r.path === path);
    expect(item.passed).toBe(true);
    expect(item.grade).toBe(0.4);
    expect(item.xp).toBe(850);
    expect(item.attempts).toBe(2);
    expect(items.find((r) => r.path.includes("checkpoint")).passed).toBe(false);
  });
  it("discovers piscines from enrollment even with no earned XP and excludes exam containers", () => {
    const data = {
      results: [
        record(1, root + "/checkpoint-01", 1, "exam"),
        record(2, root + "/checkpoint-01/same", 1),
      ],
      allProgress: [],
      allTransactions: [],
      events: [
        { level: 21, event: { path: root } },
        { level: 0, event: { path: "/bahrain/bh-piscine" } },
      ],
    };
    const cards = memoryCards(data);
    expect(cards).toHaveLength(3);
    const rust = cards.find((c) => c.root === root);
    expect(rust.items).toHaveLength(1);
    expect(rust.level).toBe(21);
    expect(rust.xp).toBe(0);
    const groups = questGroups(rust);
    expect(groups[0].name).toBe("checkpoint-01");
    expect(groups[0].items).toHaveLength(1);
  });
  it("uses a progression grade when an audited project has no result table rows", () => {
    const [item] = learningItems({
      results: [],
      allProgress: [record(1, "/bahrain/bh-module/filler", 1.2, "project")],
      allTransactions: [],
    });
    expect(item.passed).toBe(true);
    expect(item.grade).toBe(1.2);
    expect(item.attempts).toBe(0);
  });
  it("assigns course completion XP to its module event without double counting it inside a piscine", () => {
    const course = {
      ...record(1, root),
      type: "xp",
      amount: 390000,
      event: { path: "/bahrain/bh-module" },
    };
    const exercise = {
      ...record(2, root + "/quest-01/same"),
      type: "xp",
      amount: 500,
      event: { path: root },
    };
    const cards = memoryCards({
      results: [],
      allTransactions: [course, exercise],
      events: [],
    });
    expect(cards[0].xp).toBe(390000);
    expect(cards.find((c) => c.root === root).xp).toBe(500);
  });
});
describe("status data integrity", () => {
  it("passes account scope on every page, including a server-capped final page", async () => {
    const seen = [];
    await graphqlPages(
      "query",
      "audit",
      async (_, variables) => {
        seen.push(variables);
        return { audit: variables.offset === 0 ? [{ id: 5 }] : [] };
      },
      { userId: 123 },
    );
    expect(seen).toEqual([
      { userId: 123, limit: 500, offset: 0 },
      { userId: 123, limit: 500, offset: 1 },
    ]);
  });
  it("keeps empty months visible and does not count future records", () => {
    const series = monthlySeries(
      [
        { createdAt: "2026-01-05", type: "up", amount: 100 },
        { createdAt: "2026-03-01", type: "down", amount: 50 },
        { createdAt: "2027-01-01", type: "up", amount: 900 },
      ],
      ["up", "down"],
      3,
      new Date("2026-03-10"),
    );
    expect(series.map((r) => [r.up, r.down])).toEqual([
      [100, 0],
      [0, 0],
      [0, 50],
    ]);
  });
  it("distinguishes graded zeroes from ungraded expired assignments", () => {
    expect(auditState({ grade: 0 })).toBe("Not passed");
    expect(
      auditState(
        { grade: null, endAt: "2020-01-01" },
        Date.parse("2026-01-01"),
      ),
    ).toBe("Closed · no grade");
    expect(
      auditState(
        { grade: null, endAt: "2027-01-01" },
        Date.parse("2026-01-01"),
      ),
    ).toBe("Awaiting grade");
  });
  it("does not present curriculum metadata as a programming language", () => {
    expect(
      skillRows({
        skills: [
          { type: "skill_curriculum-objectives-completed", amount: 55 },
          { type: "skill_go", amount: 55 },
        ],
      }).map((r) => r.name),
    ).toEqual(["Go"]);
  });
});
