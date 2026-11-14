export const MODULE_ROOT = "/bahrain/bh-module";
export const sum = (rows) =>
  rows.reduce((n, r) => n + Number(r.amount || 0), 0);
export const byTime = (a, b) =>
  (a.createdAt || "").localeCompare(b.createdAt || "");
export const titleOf = (r) =>
  r.object?.name || r.path?.split("/").filter(Boolean).at(-1) || "Untitled";
export function piscineRoot(path = "") {
  const parts = path.split("/").filter(Boolean);
  const index = parts.findIndex(
    (p) => p === "bh-piscine" || p.startsWith("piscine-"),
  );
  return index < 0 ? null : "/" + parts.slice(0, index + 1).join("/");
}
export const piscineName = (root) =>
  root.endsWith("/bh-piscine")
    ? "Go piscine"
    : { js: "JavaScript piscine", rust: "Rust piscine", go: "Go piscine" }[
        root.split("piscine-").at(-1)
      ] || root.split("/").at(-1).replace("piscine-", "") + " piscine";
const identity = (r) =>
  `${r.objectId ?? r.object?.id ?? titleOf(r)}:${r.path || ""}`;

// A project name alone is ambiguous across module/piscine/checkpoint records.
// Only attach teams from this exact save context and object identity.
export function projectTeams(item, memberships = []) {
  const teams = new Map();
  for (const row of memberships) {
    const group = row.group;
    const objectId = item.objectId ?? item.object?.id;
    if (!group || group.path !== item.path) continue;
    if (group.objectId != null && objectId != null && String(group.objectId) !== String(objectId)) continue;
    if (teams.has(group.id)) continue;
    const members = new Map();
    for (const member of group.members || []) {
      const id = member.userId ?? member.user?.id;
      if (id == null) continue;
      members.set(String(id), {
        id,
        login: member.user?.login || null,
        name: [member.user?.firstName, member.user?.lastName].filter(Boolean).join(" "),
        captain: String(id) === String(group.captainId),
      });
    }
    teams.set(group.id, { ...group, members: [...members.values()] });
  }
  return [...teams.values()].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""),
  );
}

// Merge sources by object AND full path. The same exercise may appear in a
// quest and a checkpoint; result attempts are never mistaken for unique saves.
export function learningItems(data) {
  const records = new Map();
  const add = (r, source) => {
    const key = identity(r);
    if (!records.has(key))
      records.set(key, {
        ...r,
        key,
        name: titleOf(r),
        history: [],
        progress: [],
        xp: 0,
      });
    const item = records.get(key);
    if (source === "result") item.history.push(r);
    if (source === "progress") item.progress.push(r);
    if (source === "xp") item.xp += Number(r.amount || 0);
    if (
      (r.updatedAt || r.createdAt || "") >
      (item.updatedAt || item.createdAt || "")
    ) {
      item.updatedAt = r.updatedAt || r.createdAt;
      item.createdAt = r.createdAt;
    }
    if (r.object?.type) item.object = r.object;
  };
  (data.results || data.projects || []).forEach((r) => add(r, "result"));
  (data.allProgress || data.progress || []).forEach((r) => add(r, "progress"));
  (data.allTransactions || data.transactions || [])
    .filter((r) => !r.type || r.type === "xp")
    .forEach((r) => add(r, "xp"));
  return [...records.values()]
    .map((item) => {
      const graded = [...item.history, ...item.progress]
        .filter((r) => r.grade != null)
        .sort(byTime);
      const passed = graded.some((r) => r.grade >= 1);
      return {
        ...item,
        grade: graded.at(-1)?.grade ?? null,
        passed,
        status: passed ? "Passed" : graded.length ? "Not passed" : "Ungraded",
        attempts: item.history.length,
        teams: projectTeams(item, data.groups),
        root: piscineRoot(item.path),
        quest: item.path?.split("/").slice(0, -1).at(-1),
      };
    })
    .sort((a, b) =>
      (b.updatedAt || b.createdAt || "").localeCompare(
        a.updatedAt || a.createdAt || "",
      ),
    );
}
export function memoryCards(data) {
  const items = learningItems(data);
  const main = items.filter(
    (r) =>
      r.path?.startsWith(MODULE_ROOT + "/") &&
      !r.root &&
      (r.object?.type === "project" ||
        r.history.some((h) => h.type === "user_audit") ||
        !r.object?.type),
  );
  const roots = new Set(
    [
      ...items.map((r) => r.root),
      ...(data.events || []).map((r) => piscineRoot(r.event?.path)),
    ].filter(Boolean),
  );
  const cards = [
    {
      id: "module",
      name: "Main projects",
      short: "MODULE",
      color: "#4765b6",
      items: main,
      root: MODULE_ROOT,
    },
    // Console slot order is intentional; event IDs/enrollment order vary.
    ...[...roots].sort((a,b)=>{
      const rank=root=>root.endsWith("bh-piscine") || root.endsWith("piscine-go") ? 0
        : root.endsWith("piscine-js") ? 1 : root.endsWith("piscine-rust") ? 2 : 3;
      return rank(a)-rank(b) || a.localeCompare(b);
    }).map((root) => ({
      id: root,
      name: piscineName(root),
      short: root.endsWith("bh-piscine")
        ? "GO"
        : root.split("piscine-").at(-1).toUpperCase(),
      color: root.endsWith("rust")
        ? "#7c5299"
        : root.endsWith("js")
          ? "#7350aa"
          : "#5264a3",
      root,
      // Piscine root is a course milestone, not one of its exercises.
      items: items.filter(
        (r) =>
          r.root === root &&
          r.path !== root &&
          !["quest", "piscine", "checkpoint", "exam"].includes(r.object?.type),
      ),
    })),
  ];
  return cards.map((c) => ({
    ...c,
    xp: sum(
      (data.allTransactions || data.transactions || []).filter(
        (t) =>
          (!t.type || t.type === "xp") &&
          (c.id === "module"
            ? t.event?.path === MODULE_ROOT ||
              (!t.event && !piscineRoot(t.path))
            : t.event?.path === c.root ||
              (!t.event && piscineRoot(t.path) === c.root)),
      ),
    ),
    level: (data.events || []).find((r) => r.event?.path === c.root)?.level,
    passed: c.items.filter((r) => r.passed).length,
  }));
}
export function questGroups(card) {
  if (card.id === "module") return card.items;
  const groups = new Map();
  card.items.forEach((item) => {
    const rest = item.path.slice(card.root.length + 1).split("/");
    const name = rest.length > 1 ? rest[0] : "Other exercises";
    if (!groups.has(name))
      groups.set(name, { key: name, name, items: [], isQuest: true });
    groups.get(name).items.push(item);
  });
  return [...groups.values()]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((g) => ({
      ...g,
      xp: g.items.reduce((n, r) => n + r.xp, 0),
      passed: g.items.every((r) => r.passed),
      updatedAt: g.items
        .map((r) => r.updatedAt || r.createdAt)
        .filter(Boolean)
        .sort()
        .at(-1),
    }));
}
export function monthlySeries(
  rows,
  keys = ["xp"],
  months = 12,
  now = new Date(),
) {
  const buckets = new Map();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    buckets.set(key, {
      month: key,
      label: d.toLocaleDateString(undefined, {
        month: "short",
        timeZone: "UTC",
      }),
      ...Object.fromEntries(keys.map((k) => [k, 0])),
    });
  }
  rows.forEach((r) => {
    if (Date.parse(r.createdAt) > now.getTime()) return;
    const row = buckets.get(r.createdAt?.slice(0, 7));
    if (!row) return;
    const key = keys.includes(r.series || r.type)
      ? r.series || r.type
      : keys[0];
    row[key] += Number(r.amount ?? 1);
  });
  return [...buckets.values()];
}
export const technicalSkills = [
  "prog",
  "algo",
  "front-end",
  "back-end",
  "tcp",
  "stats",
  "sys-admin",
  "game",
  "ai",
  "cloud",
  "cybersecurity",
  "blockchain",
  "mobile",
];
export const skillName = (key) =>
  ({
    js: "JavaScript",
    go: "Go",
    prog: "Programming",
    algo: "Algorithms",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    "front-end": "Front end",
    "back-end": "Back end",
    docker: "Docker",
    unix: "Unix",
    rust: "Rust",
    graphql: "GraphQL",
    tcp: "Networking",
  })[key] || key;
export function skillRows(data) {
  return (data.skills || [])
    .filter(
      (s) => !s.type.includes("curriculum") && s.type.startsWith("skill_"),
    )
    .map((s) => ({
      ...s,
      key: s.type.slice(6),
      name: skillName(s.type.slice(6)),
    }))
    .sort((a, b) => b.amount - a.amount);
}
export function auditState(row, now = Date.now()) {
  if (row.grade != null) return row.grade >= 1 ? "Passed" : "Not passed";
  return row.endAt && Date.parse(row.endAt) < now
    ? "Closed · no grade"
    : "Awaiting grade";
}
