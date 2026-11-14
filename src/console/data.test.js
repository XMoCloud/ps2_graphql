import { describe, expect, it } from "vitest";
import { projectLibrary } from "./data";
const result = (id, objectId, path, grade, createdAt) => ({
  id,
  objectId,
  path,
  grade,
  createdAt,
  object: { name: "same-name" },
});
describe("project library", () => {
  it("keeps different object identities and contexts separate", () => {
    const projects = [
      result(1, 5, "/one", 1, "2026-01-01"),
      result(2, 6, "/one", 1, "2026-01-02"),
      result(3, 5, "/two", 1, "2026-01-03"),
    ];
    const library = projectLibrary({
      projects,
      transactions: [{ objectId: 5, path: "/one", amount: 100 }],
    });
    expect(library).toHaveLength(3);
    expect(library.find((p) => p.objectId === 5 && p.path === "/one").xp).toBe(
      100,
    );
    expect(library.filter((p) => p.xp === 0)).toHaveLength(2);
  });
  it("preserves a pass before a later fail and removes repeated source rows", () => {
    const pass = result(1, 5, "/one", 1, "2026-01-01"),
      fail = result(2, 5, "/one", 0.5, "2026-02-01");
    const [project] = projectLibrary({
      projects: [pass, fail, pass],
      transactions: [],
    });
    expect(project.history).toHaveLength(2);
    expect(project.grade).toBe(0.5);
    expect(project.history.some((p) => p.grade >= 1)).toBe(true);
  });
});
