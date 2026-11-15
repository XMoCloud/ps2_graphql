import { byTime, monthlySeries, piscineRoot, titleOf, uniqueModuleProjects } from "./catalog";

export const preciseXP = value => {
  const n = Number(value) || 0, magnitude = Math.abs(n);
  return magnitude >= 1e6 ? `${(n/1e6).toFixed(2)} MB` : `${(n/1000).toFixed(2)} kB`;
};
export const exactXP = value => `${Number(value || 0).toLocaleString()} XP`;

export function projectOutcomes(items) {
  const projects = uniqueModuleProjects(items);
  const counts = { passed: 0, failed: 0, ungraded: 0, projects: projects.length };
  const graded = rows => rows.filter(row => row.grade != null && Number.isFinite(Number(row.grade)));
  for (const project of projects) {
    // Progress rows describe complete project attempts. Result rows can mirror
    // those grades, so use them only when no graded progress is available.
    const progress = graded(project.progress), results = graded(project.history);
    const attempts = progress.length ? progress : results.length ? results : graded([project]);
    if (!attempts.length) counts.ungraded++;
    for (const attempt of attempts) counts[attempt.grade >= 1 ? "passed" : "failed"]++;
  }
  return counts;
}
export function completedPiscines(data) {
  return new Set([...(data.allProgress || []), ...(data.results || [])]
    .filter(r => r.grade >= 1 && r.path && r.path === piscineRoot(r.path))
    .map(r => r.path)).size;
}
export function projectXPBreakdown(transactions) {
  const seen = new Set(), projects = new Map();
  for (const row of transactions) {
    if (row.type && row.type !== "xp" || !Number.isFinite(Number(row.amount))) continue;
    if (row.id != null && seen.has(row.id)) continue;
    if (row.id != null) seen.add(row.id);
    const key = `${row.objectId ?? row.object?.id ?? ""}:${row.path || titleOf(row)}`;
    if (!projects.has(key)) projects.set(key, { key, name: titleOf(row), amount: 0 });
    projects.get(key).amount += Number(row.amount);
  }
  return [...projects.values()].filter(row=>row.amount !== 0).sort((a,b) => b.amount-a.amount || a.name.localeCompare(b.name));
}
const levelRanges = [[0,5,"0–4"],[5,10,"5–9"],[10,15,"10–14"],[15,20,"15–19"],
  [20,30,"20–29"],[30,40,"30–39"],[40,50,"40–49"],[50,Infinity,"50+"]];
const ratioRanges = [[0,.5,"< 0.5"],[.5,1,"0.5–1"],[1,1.5,"1–1.5"],[1.5,2,"1.5–2"],[2,Infinity,"2+"]];
export function cohortOptions(labels = []) {
  const cohorts = new Map();
  for (const label of labels) {
    // Avoid misleading malformed labels such as "Cohort 31uag". Official
    // cohort labels identify their module event in the description.
    const name = label.name?.match(/^cohort[\s-]*(\d+)(?:$|[\s-])/i);
    const event = label.description?.match(/(?:module|event)\s*#(\d+)/i);
    if (!name || !event) continue;
    const number = Number(name[1]);
    if (!cohorts.has(number)) cohorts.set(number,{id:String(number),name:`Cohort ${number}`,eventIds:[]});
    const ids = cohorts.get(number).eventIds, eventId = Number(event[1]);
    if (!ids.includes(eventId)) ids.push(eventId);
  }
  return [...cohorts.values()].sort((a,b)=>Number(a.id)-Number(b.id));
}
export function studentCohort(cohorts, users, userId, events = []) {
  const enrollment = users.find(r=>String(r.userId)===String(userId));
  const eventId = enrollment?.eventId ?? events.find(r=>r.event?.path==="/bahrain/bh-module")?.eventId;
  return cohorts.find(c=>c.eventIds.includes(Number(eventId))) || null;
}
export function communityDistribution(enrollments, metric, currentValue) {
  const people = new Map();
  for (const row of enrollments) {
    if (row.userId == null) continue;
    const previous = people.get(row.userId);
    if (!previous || row.level > previous.level || row.level === previous.level && row.id > previous.id)
      people.set(row.userId, row);
  }
  const ranges = metric === "ratio" ? ratioRanges : levelRanges;
  const field = metric === "ratio" ? "userAuditRatio" : "level";
  const rows = ranges.map(([min,max,name]) => ({ min,max,name,count:0,
    isYou: currentValue != null && currentValue >= min && currentValue < max }));
  for (const person of people.values()) {
    const value = person[field];
    if (value == null || !Number.isFinite(Number(value)) || value < 0) continue;
    const bucket = rows.find(row => value >= row.min && value < row.max);
    if (bucket) bucket.count++;
  }
  return rows;
}
export function skillGains(transactions, skills, days = 90, now = new Date()) {
  const end = now.getTime(), start = end-days*86400000;
  return skills.map(skill => {
    let before = 0, after = 0;
    for (const row of transactions) {
      if (row.type !== skill.type || !Number.isFinite(Number(row.amount))) continue;
      const stamp = Date.parse(row.createdAt);
      if (stamp > end || !Number.isFinite(stamp)) continue;
      after = Math.max(after, row.amount);
      if (stamp < start) before = Math.max(before, row.amount);
    }
    return { ...skill, gain: after-before, before, after };
  }).filter(row => row.gain > 0).sort((a,b) => b.gain-a.gain || a.name.localeCompare(b.name));
}
export function skillHistory(transactions, skills, now = new Date()) {
  const types = new Set(skills.map(s => s.type)), best = {}, dates = new Map();
  for (const row of transactions.filter(r => types.has(r.type) && Date.parse(r.createdAt) <= now.getTime()).sort(byTime)) {
    best[row.type] = Math.max(best[row.type] || 0, row.amount);
    dates.set(row.createdAt.slice(0,10), { date: row.createdAt.slice(0,10), ...best });
  }
  return [...dates.values()];
}
export function auditBalanceHistory(transactions, up, down, now = new Date()) {
  const rows = transactions.filter(r => ["up","down"].includes(r.type) && Date.parse(r.createdAt) <= now.getTime());
  if (!rows.length) return [];
  const monthly = monthlySeries(rows, ["up","down"], 12, now);
  // Anchor to the platform totals, including older credits outside this window.
  let balance = Number(up || 0)-Number(down || 0)-monthly.reduce((n,r) => n+r.up-r.down,0);
  return monthly.map(row => ({ ...row, balance: balance += row.up-row.down }));
}
export function auditOutcomes(given, received, now = Date.now()) {
  return [given,received].map((rows,index) => {
    const result = { name: index ? "Received" : "Given", passed:0,failed:0,open:0,expired:0 };
    for (const row of rows) result[row.grade != null ? row.grade >= 1 ? "passed" : "failed"
      : row.endAt && Date.parse(row.endAt) < now ? "expired" : "open"]++;
    return result;
  });
}
