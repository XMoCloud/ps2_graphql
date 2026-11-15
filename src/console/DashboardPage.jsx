import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { xp, date } from "./data";
import { memoryCards, skillRows, titleOf } from "./catalog";
import { completedPiscines, projectOutcomes } from "./analytics";
import { CommunityChart, ProjectXPChart } from "./InsightCharts";
import {
  ChartPanel,
  XPChart,
  PeriodSwitch,
  OutcomeChart,
} from "./Charts";
export function Readout({ label, value, detail }) {
  return (
    <div className="status-readout">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
export function ActivityCalendar({ records }) {
  const counts = useMemo(() => {
    const m = new Map();
    records.forEach((r) => {
      const key = r.createdAt?.slice(0, 10);
      if (key) m.set(key, (m.get(key) || 0) + 1);
    });
    return m;
  }, [records]);
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const days = Array.from({ length: 112 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - 111 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, count: counts.get(key) || 0 };
  });
  const [active, setActive] = useState(null);
  return (
    <>
      <div
        className="activity-calendar console-calendar"
        aria-label="XP activity over the last sixteen weeks"
      >
        {days.map((d) => (
          <button
            key={d.key}
            className={`activity-cell density-${Math.min(d.count, 3)}`}
            aria-label={`${d.key}: ${d.count} XP records`}
            onMouseEnter={() => setActive(d)}
            onFocus={() => setActive(d)}
            onMouseLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
          />
        ))}
      </div>
      <p className="calendar-description">
        {active
          ? `${date(active.key)} · ${active.count} XP records`
          : `${date(days[0].key)} — ${date(days.at(-1).key)}`}
        <span>
          Less <i /> <i /> <i /> More
        </span>
      </p>
    </>
  );
}
export default function DashboardPage({ data, base = "" }) {
  const [days, setDays] = useState(0);
  const cards = useMemo(() => memoryCards(data), [data]),
    projects = cards[0],
    skills = skillRows(data);
  const outcomes = projectOutcomes(projects.items);
  const given = data.auditsGiven.filter((r) => r.grade != null),
    received = data.auditsReceived.filter((r) => r.grade != null);
  const newest = [...projects.items]
    .sort((a, b) =>
      (b.updatedAt || b.createdAt || "").localeCompare(
        a.updatedAt || a.createdAt || "",
      ),
    )
    .slice(0, 4);
  const lastXP = data.transactions.at(-1),
    ratio = data.down ? data.up / data.down : null;
  const teams = [
    ...new Map(
      data.groups.filter((r) => r.group).map((r) => [r.group.id, r.group]),
    ).values(),
  ];
  return (
    <div className="status-grid overview-v2">
      <section className="status-identity">
        <div>
          <span className="status-overline">
            {data.user?.campus || "Reboot01"} · @{data.user?.login || "—"}
          </span>
          <h2>
            {data.user?.firstName
              ? `${data.user.firstName} ${data.user.lastName || ""}`
              : data.user?.login || "Your account"}
          </h2>
          <p>
            Joined {date(data.user?.createdAt)}
            <span>Latest XP {date(lastXP?.createdAt)}</span>
            {teams.length > 0 && (
              <span>
                {teams.length} teams ·{" "}
                {teams.filter((g) => g.captainId === data.user?.id).length} led
              </span>
            )}
          </p>
        </div>
        <div className="status-level">
          <small>LEVEL</small>
          <strong>{data.level ?? "—"}</strong>
        </div>
      </section>
      <div className="status-readouts span-full">
        <Readout
          label="Module experience"
          value={xp(data.totalXP)}
          detail={`${xp(data.allXP)} across all events`}
        />
        <Readout
          label="Skills Mastered"
          value={skills.length}
          detail="Distinct skills with platform records"
        />
        <Readout
          label="Piscines Completed"
          value={String(completedPiscines(data)).padStart(2, "0")}
          detail={`${cards.slice(1).reduce((n, c) => n + c.passed, 0)} exercises passed`}
        />
        <Readout
          label="Audit ratio"
          value={ratio == null ? "—" : ratio.toFixed(2)}
          detail={`${given.length} given · ${received.length} received`}
        />
      </div>
      <ChartPanel
        title="Experience"
        caption="Module XP · inspect each point"
        className="span-wide"
        controls={<PeriodSwitch value={days} onChange={setDays} />}
      >
        <XPChart transactions={data.transactions} days={days} />
      </ChartPanel>
      <ChartPanel
        title="Project results"
        caption="Graded module attempts · including past failures"
        className="span-narrow"
      >
        <OutcomeChart
          passed={outcomes.passed}
          failed={outcomes.failed}
        />
        <p className="status-footnote">{outcomes.projects} unique project{outcomes.projects === 1 ? "" : "s"}.</p>
        <p className="status-footnote">{outcomes.ungraded} ungraded project{outcomes.ungraded === 1 ? "" : "s"} excluded from this chart.</p>
        <Link className="ps2-text-link" to={`${base}/projects`}>
          Open memory cards <span>→</span>
        </Link>
      </ChartPanel>
      <ChartPanel
        title="User Distribution"
        caption="Your place in the main curriculum"
        className="span-wide community-panel"
      >
        <CommunityChart users={data.communityUsers} labels={data.communityCohorts} userId={data.user?.id} events={data.events} level={data.level} ratio={ratio}/>
      </ChartPanel>
      <ChartPanel
        title="Projects XP"
        caption="How each award contributes to your module XP"
        className="span-narrow"
      >
        <ProjectXPChart transactions={data.transactions}/>
      </ChartPanel>
      <ChartPanel
        title="Piscine records"
        caption="One memory card per piscine"
        className="span-wide"
      >
        <div className="piscine-summary-list">
          {cards.slice(1).map((c) => (
            <Link to={`${base}/projects`} state={{ card: c.id }} key={c.id}>
              <span
                className="mini-card-mark"
                style={{ "--card-accent": c.color }}
              />
              <div>
                <strong>{c.name}</strong>
                <small>
                  {c.passed} / {c.items.length} exercises passed
                </small>
              </div>
              <span>
                {xp(c.xp)}
                <small>Level {c.level ?? "—"}</small>
              </span>
            </Link>
          ))}
        </div>
        {cards.length === 1 && (
          <p className="status-empty">No piscine records yet.</p>
        )}
      </ChartPanel>
      <ChartPanel
        title="Recent saves"
        caption="Latest module records"
        className="span-narrow"
      >
        <div className="recent-saves">
          {newest.map((r) => (
            <Link
              to={`${base}/projects`}
              state={{ card: "module", item: r.key }}
              key={r.key}
            >
              <span>
                <strong>{titleOf(r)}</strong>
                <small>{date(r.updatedAt || r.createdAt)}</small>
              </span>
              <b className={r.passed ? "passed" : ""}>{r.status}</b>
            </Link>
          ))}
        </div>
      </ChartPanel>
      <ChartPanel
        title="Activity"
        caption="XP records · last sixteen weeks"
        className="span-full"
      >
        <ActivityCalendar
          records={data.allTransactions.filter((r) => r.type === "xp")}
        />
      </ChartPanel>
    </div>
  );
}
