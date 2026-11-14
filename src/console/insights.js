export function summarizeAccount(data, days = 30, now = new Date()) {
  const end = now.getTime(),
    span = days * 86400000;
  const inWindow = (row, start, finish) => {
    const time = Date.parse(row.createdAt);
    return time >= start && time < finish;
  };
  const recent = data.transactions.filter((t) =>
    inWindow(t, end - span, end + 1),
  );
  const previous = data.transactions.filter((t) =>
    inWindow(t, end - span * 2, end - span),
  );
  const sum = (rows) => rows.reduce((n, r) => n + Number(r.amount), 0);
  const earned = sum(recent),
    prior = sum(previous);
  const results = data.projects.filter((r) => r.grade != null);
  const passed = results.filter((r) => r.grade >= 1).length;
  const events = [
    ...data.transactions.map((t) => ({
      ...t,
      eventKey: `xp-${t.id}`,
      kind: "XP",
      title: t.object?.name || "Module experience",
      detail: `+${t.amount}`,
      amount: t.amount,
    })),
    ...data.audits.map((t) => ({
      ...t,
      eventKey: `audit-${t.id}`,
      kind: t.type === "up" ? "GIVEN" : "RECEIVED",
      title: t.object?.name || "Audit exchange",
      amount: t.amount,
    })),
    ...data.projects.map((r) => ({
      ...r,
      eventKey: `result-${r.id}`,
      kind: "RESULT",
      title: r.object?.name || "Project result",
      detail: r.grade == null ? "Ungraded" : `${Math.round(r.grade * 100)}%`,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    earned,
    prior,
    change: prior ? ((earned - prior) / prior) * 100 : null,
    activeDays: new Set(recent.map((t) => t.createdAt.slice(0, 10))).size,
    passed,
    failed: results.length - passed,
    graded: results.length,
    events,
    latest: events[0],
    topSkills: [...data.skills].sort((a, b) => b.amount - a.amount).slice(0, 3),
  };
}
