import React, { useMemo, useState } from "react";
import { xp, date } from "./data";
import { Readout } from "./DashboardPage";
import { auditState, skillRows, technicalSkills } from "./catalog";
import {
  ChartPanel,
  ExchangeChart,
  SkillRadar,
  SkillRanking,
  SkillHistory,
} from "./Charts";
export function AuditPage({ data }) {
  const [direction, setDirection] = useState("given"),
    [filter, setFilter] = useState("all"),
    [target, setTarget] = useState(1),
    [page, setPage] = useState(0);
  const given = data.auditsGiven.filter((r) => r.grade != null),
    received = data.auditsReceived.filter((r) => r.grade != null);
  const pending = data.auditsGiven.filter(
    (r) => r.grade == null && (!r.endAt || Date.parse(r.endAt) > Date.now()),
  ).length;
  const ratio = data.down ? data.up / data.down : null,
    required = Math.max(0, (data.down || 0) * target - (data.up || 0));
  const completed = [
    ...given.map((r) => ({ ...r, series: "given", amount: 1 })),
    ...received.map((r) => ({ ...r, series: "received", amount: 1 })),
  ];
  const records = useMemo(
    () =>
      (direction === "given" ? data.auditsGiven : data.auditsReceived)
        .filter(
          (r) =>
            filter === "all" ||
            (filter === "graded" ? r.grade != null : r.grade == null),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data, direction, filter],
  );
  return (
    <div className="status-grid">
      <div className="status-readouts span-full">
        <Readout
          label="Audit ratio"
          value={ratio == null ? "—" : ratio.toFixed(2)}
          detail="Given credit / received credit"
        />
        <Readout
          label="Reviews given"
          value={given.length}
          detail={`${xp(data.up)} credit`}
        />
        <Readout
          label="Reviews received"
          value={received.length}
          detail={`${xp(data.down)} credit`}
        />
        <Readout
          label="Awaiting your grade"
          value={pending}
          detail="Open assignments · deadline not elapsed"
        />
      </div>
      <ChartPanel
        title="Credit exchange"
        caption="Given & received credits · last twelve months"
        className="span-wide"
      >
        <ExchangeChart rows={data.audits} />
      </ChartPanel>
      <ChartPanel
        title="Balance target"
        caption="Personal calculation"
        className="span-narrow"
      >
        <div className="audit-balance">
          <label>
            Target ratio
            <select
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            >
              {[1, 1.2, 1.5, 2].map((n) => (
                <option key={n}>{n.toFixed(1)}</option>
              ))}
            </select>
          </label>
          <strong>{xp(required)}</strong>
          <p>
            Additional given credit to reach {target.toFixed(1)}, assuming
            received credit stays the same.
          </p>
          <div className="balance-track">
            <i
              style={{
                width: `${Math.min(100, ((data.up || 0) / Math.max(1, (data.down || 0) * target)) * 100)}%`,
              }}
            />
          </div>
          <div className="balance-legend">
            <span>Given {xp(data.up)}</span>
            <span>Received {xp(data.down)}</span>
          </div>
        </div>
      </ChartPanel>
      <ChartPanel
        title="Reviews over time"
        caption="Graded audits, grouped by assignment month"
        className="span-full"
      >
        <ExchangeChart rows={completed} counts />
      </ChartPanel>
      <ChartPanel
        title="Review history"
        caption="Assignment dates · grades from the audit record"
        className="span-full"
        controls={
          <div className="console-options">
            {["given", "received"].map((d) => (
              <button
                key={d}
                aria-pressed={direction === d}
                onClick={() => {
                  setDirection(d);
                  setPage(0);
                }}
              >
                {d === "given" ? "Given" : "Received"}
              </button>
            ))}
          </div>
        }
      >
        <div className="record-filter">
          <label>
            Status{" "}
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All records</option>
              <option value="graded">Graded</option>
              <option value="ungraded">No grade</option>
            </select>
          </label>
          <span>{records.length} records</span>
        </div>
        <div className="audit-table" role="table" aria-label="Audit history">
          <div role="row" className="audit-table-head">
            <span role="columnheader">Project</span>
            <span role="columnheader">Assigned</span>
            <span role="columnheader">Grade</span>
            <span role="columnheader">Status</span>
          </div>
          {records.slice(page * 8, page * 8 + 8).map((r) => (
            <div role="row" key={r.id}>
              <strong role="cell">
                {r.group?.path?.split("/").at(-1) || "Audit"}
              </strong>
              <span role="cell">{date(r.createdAt)}</span>
              <span role="cell">
                {r.grade == null ? "—" : `${Math.round(r.grade * 100)}%`}
              </span>
              <span role="cell" className={r.grade >= 1 ? "passed" : ""}>
                {auditState(r)}
              </span>
            </div>
          ))}
        </div>
        {!records.length && (
          <p className="status-empty">No matching audit records.</p>
        )}
        <div className="browser-pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span>
            {page + 1} / {Math.max(1, Math.ceil(records.length / 8))}
          </span>
          <button
            disabled={(page + 1) * 8 >= records.length}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      </ChartPanel>
    </div>
  );
}
export function SkillsPage({ data }) {
  const [category, setCategory] = useState("technology");
  const all = skillRows(data),
    rows = all.filter(
      (r) => technicalSkills.includes(r.key) === (category === "technical"),
    );
  return (
    <div className="status-grid">
      <div className="status-readouts span-full">
        <Readout
          label="Recorded skills"
          value={all.length}
          detail="Unique platform skill types"
        />
        <Readout
          label="Technologies"
          value={all.filter((r) => !technicalSkills.includes(r.key)).length}
          detail="Languages & tools"
        />
        <Readout
          label="Technical skills"
          value={all.filter((r) => technicalSkills.includes(r.key)).length}
          detail="Programming disciplines"
        />
        <Readout
          label="Strongest signal"
          value={all[0]?.name || "—"}
          detail={`${all[0]?.amount ?? "—"} · highest recorded score`}
        />
      </div>
      <div className="span-full console-options skill-categories">
        {["technology", "technical"].map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c === "technology" ? "Technologies" : "Technical skills"}
          </button>
        ))}
      </div>
      <ChartPanel
        title={category === "technology" ? "Your toolkit" : "How you build"}
        caption="Highest recorded score per skill"
        className="span-wide"
      >
        <SkillRanking rows={rows} />
      </ChartPanel>
      <ChartPanel
        title="Skill constellation"
        caption="Six strongest signals in this category"
        className="span-narrow"
      >
        <SkillRadar rows={rows} />
        <p className="status-footnote">
          Platform scores record curriculum progress. They do not measure
          professional proficiency.
        </p>
      </ChartPanel>
      <ChartPanel
        title="Skill progression"
        caption="Personal best scores · three strongest skills"
        className="span-full"
      >
        <SkillHistory transactions={data.allTransactions} skills={rows} />
      </ChartPanel>
    </div>
  );
}
