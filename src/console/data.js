import { useCallback, useEffect, useState } from "react";
import { graphqlQuery, graphqlPages } from "../lib/graphql";
import { getUserIdFromToken } from "../lib/auth";
import { ACCOUNT_QUERIES } from "./queries";
import { MODULE_ROOT, byTime } from "./catalog";
export const xp = (n) =>
  n == null
    ? "—"
    : n >= 1e6
      ? `${(n / 1e6).toFixed(2)} MB`
      : `${(n / 1000).toFixed(1)} kB`;
export const date = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
function createSampleAccount() {
  const names = [
    "graphql",
    "social-network",
    "mini-framework",
    "bomberman-dom",
    "wget",
    "smart-road",
    "filler",
    "lem-in",
    "ascii-art-web",
    "groupie-tracker",
    "push-swap",
    "my-ls",
  ];
  const SAMPLE = {
    user: {
      login: "player_one",
      firstName: "Player",
      lastName: "One",
      createdAt: "2025-02-10",
      id: "DEMO",
    },
    level: 34,
    transactions: names
      .map((name, i) => ({
        id: i + 1,
        objectId: i + 1,
        amount: [
          96000, 480000, 145000, 319000, 290000, 75250, 105000, 81037, 74000,
          68000, 64000, 54000,
        ][i],
        createdAt: new Date(Date.UTC(2026, 10 - i, 5 + i)).toISOString(),
        object: { id: i + 1, name },
        path: `/bahrain/bh-module/${name}`,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    projects: names.map((name, i) => ({
      id: i + 1,
      objectId: i + 1,
      grade: i === 5 ? 0.7 : i === 9 ? 0.8 : 1 + (i % 4) * 0.12,
      createdAt: new Date(Date.UTC(2026, 10 - i, 5 + i)).toISOString(),
      object: { id: i + 1, name },
      path: `/bahrain/bh-module/${name}`,
    })),
    skills: [
      ["go", 65],
      ["js", 58],
      ["html", 50],
      ["css", 46],
      ["sql", 42],
      ["docker", 28],
      ["prog", 63],
      ["algo", 48],
      ["front-end", 57],
      ["back-end", 52],
      ["rust", 40], ["unix", 22], ["graphql", 26], ["tcp", 35],
      ["game", 32], ["ai", 24], ["sys-admin", 18],
    ].map(([type, amount]) => ({ type: `skill_${type}`, amount })),
    up: 2450000,
    down: 1780000,
    audits: Array.from({ length: 16 }, (_, i) => ({
      id: i,
      type: i % 3 ? "up" : "down",
      amount: 60000 + i * 17000,
      createdAt: new Date(
        Date.UTC(2026, 3 + Math.floor(i / 2), 3 + i),
      ).toISOString(),
    })),
  };
  SAMPLE.progress = SAMPLE.projects.slice(0, 5).map((p, i) => ({
    ...p,
    updatedAt: p.createdAt,
    grade: i === 0 ? null : p.grade,
    object: { ...p.object, type: "project" },
  }));
  SAMPLE.totalXP = SAMPLE.transactions.reduce((n, t) => n + t.amount, 0);
  SAMPLE.events = [
    { id: 1, eventId:400, level: 34, event: { path: MODULE_ROOT } },
    ...[
      "/bahrain/bh-piscine",
      `${MODULE_ROOT}/piscine-js`,
      `${MODULE_ROOT}/piscine-rust`,
    ].map((root, i) => ({ id: i + 2, level: 18 + i * 3, event: { path: root } })),
  ];
  SAMPLE.allTransactions = SAMPLE.transactions.map((r) => ({
    ...r,
    type: "xp",
    event: { path: MODULE_ROOT },
  }));
  SAMPLE.allProgress = [...SAMPLE.progress];
  SAMPLE.allProgress.push(...SAMPLE.events.slice(1).map((r,i) => ({
    id:9000+i, objectId:9000+i, path:r.event.path, grade:1, isDone:true,
    createdAt:"2026-01-01", object:{id:9000+i,name:r.event.path.split('/').at(-1),type:"piscine"},
  })));
  SAMPLE.results = SAMPLE.projects.map((r) => ({ ...r, type: "user_audit" }));
  SAMPLE.events.slice(1).forEach((event, pi) => {
    const exercises = [
      "hello-world",
      "variables",
      "strings",
      "loops",
      "slices",
      "sorting",
      "maps",
      "recursion",
      "functions",
      "pointers",
      "interfaces",
      "final-challenge",
    ];
    exercises.forEach((name, i) => {
      const id = 1000 + pi * 100 + i,
        path = `${event.event.path}/quest-${String(Math.floor(i / 3) + 1).padStart(2, "0")}/${name}`;
      const r = {
        id,
        objectId: id,
        path,
        grade: i % 7 === 0 ? 0.6 : 1,
        createdAt: new Date(Date.UTC(2025, pi * 3, i + 1)).toISOString(),
        object: { id, name, type: "exercise" },
      };
      SAMPLE.results.push({ ...r, type: "tester" });
      SAMPLE.allProgress.push({ ...r, isDone: true, updatedAt: r.createdAt });
      SAMPLE.allTransactions.push({
        ...r,
        type: "xp",
        amount: 700 + i * 350,
        event: event.event,
      });
    });
  });
  SAMPLE.allTransactions.push(...SAMPLE.audits);
  SAMPLE.allTransactions.push(
    ...SAMPLE.skills.flatMap((skill, index) =>
      [0.3, 0.7, 1].map((fraction, step) => ({
        id: 3000 + index * 10 + step,
        type: skill.type,
        amount: Math.round(skill.amount * fraction),
        createdAt: new Date(
          Date.UTC(2026, 2 + step * 4, index % 10 + 1),
        ).toISOString(),
      })),
    ),
  );
  SAMPLE.allXP = SAMPLE.allTransactions
    .filter((r) => r.type === "xp")
    .reduce((n, r) => n + r.amount, 0);
  SAMPLE.auditsGiven = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    grade: i > 20 ? null : i % 5 ? 1 : 0.5,
    createdAt: new Date(
      Date.UTC(2026, Math.floor(i / 2), 2 + (i % 20)),
    ).toISOString(),
    endAt: "2026-12-20",
    group: { path: `${MODULE_ROOT}/${names[i % names.length]}` },
  }));
  SAMPLE.auditsReceived = SAMPLE.auditsGiven.map((r, i) => ({
    ...r,
    id: i + 100,
    grade: i % 6 ? 1 : 0.7,
  }));
  SAMPLE.groups = names.map((name, i) => ({
    id: 5000 + i,
    group: {
      id: 5000 + i,
      objectId: i + 1,
      path: `${MODULE_ROOT}/${name}`,
      captainId: "DEMO",
      status: "finished",
      createdAt: SAMPLE.projects[i].createdAt,
      updatedAt: SAMPLE.projects[i].createdAt,
      object: { attrs: { language: i < 4 ? "JavaScript" : "Go", groupMin: 1, groupMax: i === 1 ? 3 : 1 } },
      members: [
        { userId: "DEMO", user: { login: "player_one", firstName: "Player", lastName: "One" } },
        ...(i === 1 ? [
          { userId: "DEMO2", user: { login: "player_two", firstName: "Player", lastName: "Two" } },
          { userId: "DEMO3", user: { login: "player_three", firstName: "Player", lastName: "Three" } },
        ] : []),
      ],
    },
  }));
  SAMPLE.communityUsers = Array.from({length:160}, (_,i) => ({
    id:i+1,userId:i+1,eventId:[100,200,300,400][i%4],level:(i*17)%72,userAuditRatio:Math.round(((i*13)%260))/100,
  }));
  SAMPLE.communityUsers[0]={id:1,userId:"DEMO",eventId:400,level:34,userAuditRatio:SAMPLE.up/SAMPLE.down};
  SAMPLE.communityCohorts=[1,2,3,4].map(n=>({id:n,name:`Cohort${n}`,description:`Module #${n*100}`}));
  return SAMPLE;
}
// Development previews and tests keep fixtures out of the production bundle.
export const SAMPLE = import.meta.env.DEV ? createSampleAccount() : null;
const initial = {
  user: null,
  level: null,
  transactions: [],
  projects: [],
  skills: [],
  up: null,
  down: null,
  totalXP: null,
  audits: [],
  progress: [],
  allProgress: [],
  allTransactions: [],
  results: [],
  events: [],
  auditsGiven: [],
  auditsReceived: [],
  groups: [],
  allXP: null,
  communityUsers: [],
  communityCohorts: [],
};
export function useAccount(preview = false) {
  preview = import.meta.env.DEV && preview;
  const [data, setData] = useState(preview ? SAMPLE : initial),
    [loading, setLoading] = useState(!preview),
    [errors, setErrors] = useState([]);
  const refresh = useCallback(async () => {
    if (preview) {
      setData(SAMPLE);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrors([]);
    const userId = Number(getUserIdFromToken());
    if (!Number.isInteger(userId) || userId <= 0) {
      setErrors(["Session"]);
      setLoading(false);
      return;
    }
    const queries = [
      ["Community distribution", ACCOUNT_QUERIES.community, "event_user",
        d => ({ communityUsers: d.event_user })],
      ["Cohort definitions", ACCOUNT_QUERIES.cohorts, "label",
        d => ({ communityCohorts: d.label })],
      [
        "Profile",
        ACCOUNT_QUERIES.profile,
        null,
        (d) => ({
          user: d.user[0],
          events: d.event_user,
          level:
            d.event_user.find((r) => r.event?.path === MODULE_ROOT)?.level ??
            null,
          totalXP: d.moduleXP.aggregate.sum.amount || 0,
          allXP: d.allXP.aggregate.sum.amount || 0,
          up: d.user[0]?.totalUp ?? 0,
          down: d.user[0]?.totalDown ?? 0,
        }),
      ],
      [
        "XP & skills",
        ACCOUNT_QUERIES.transactions,
        "transaction",
        (d) => {
          const rows = d.transaction.sort(byTime),
            skills = new Map();
          rows
            .filter((r) => r.type.startsWith("skill_"))
            .forEach((r) => {
              if ((skills.get(r.type)?.amount ?? -1) < r.amount)
                skills.set(r.type, r);
            });
          return {
            allTransactions: rows,
            transactions: rows.filter(
              (r) => r.type === "xp" && r.event?.path === MODULE_ROOT,
            ),
            audits: rows.filter((r) => ["up", "down"].includes(r.type)),
            skills: [...skills.values()],
          };
        },
      ],
      [
        "Progression",
        ACCOUNT_QUERIES.progress,
        "progress",
        (d) => ({
          allProgress: d.progress,
          progress: d.progress.filter((r) =>
            r.path.startsWith(MODULE_ROOT + "/"),
          ),
        }),
      ],
      [
        "Results",
        ACCOUNT_QUERIES.results,
        "result",
        (d) => ({
          results: d.result,
          projects: d.result.filter(
            (r) =>
              r.type === "user_audit" && r.path.startsWith(MODULE_ROOT + "/"),
          ),
        }),
      ],
      [
        "Audits given",
        ACCOUNT_QUERIES.given,
        "audit",
        (d) => ({ auditsGiven: d.audit }),
      ],
      [
        "Audits received",
        ACCOUNT_QUERIES.received,
        "audit",
        (d) => ({ auditsReceived: d.audit }),
      ],
      [
        "Groups",
        ACCOUNT_QUERIES.groups,
        "group_user",
        (d) => ({ groups: d.group_user }),
      ],
    ];
    const result = await Promise.allSettled(
      queries.map(async ([label, query, collection, parse]) => {
        const variables = [ACCOUNT_QUERIES.community,ACCOUNT_QUERIES.cohorts].includes(query) ? {} : { userId };
        const response = collection
          ? await graphqlPages(query, collection, graphqlQuery, variables)
          : await graphqlQuery(query, variables);
        return parse(response);
      }),
    );
    const next = { ...initial },
      failed = [];
    result.forEach((r, i) => {
      if (r.status === "fulfilled") Object.assign(next, r.value);
      else failed.push(queries[i][0]);
    });
    setData(next);
    setErrors(failed);
    setLoading(false);
  }, [preview]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, loading, errors, refresh };
}
export function projectLibrary(data) {
  const map = new Map();
  const seen = new Set();
  data.projects.forEach((p) => {
    if (p.id != null && seen.has(p.id)) return;
    if (p.id != null) seen.add(p.id);
    const key = `${p.objectId ?? p.object?.id ?? p.object?.name}:${p.path ?? ""}`;
    if (!map.has(key)) map.set(key, { ...p, key, history: [], xp: 0 });
    const item = map.get(key);
    item.history.push(p);
    if (p.createdAt > item.createdAt)
      Object.assign(item, { grade: p.grade, createdAt: p.createdAt });
  });
  data.transactions.forEach((t) => {
    const item = [...map.values()].find(
      (p) =>
        (p.objectId ?? p.object?.id) === (t.objectId ?? t.object?.id) &&
        p.path === t.path,
    );
    if (item) item.xp += t.amount;
  });
  return [...map.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
