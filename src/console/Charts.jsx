import React, { useId, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { xp, date } from "./data";
import { byTime, monthlySeries } from "./catalog";
import { skillHistory } from "./analytics";
export const chartColors = ["#3b5fba", "#7350aa", "#5264a3", "#934f9e"];
const axis = {
  tick: { fill: "#b5bfd0", fontSize: 11, fontFamily: "Arial" },
  axisLine: false,
  tickLine: false,
};
const shortXP = (n) =>
  n >= 1e6
    ? `${(n / 1e6).toFixed(1)}M`
    : n >= 1000
      ? `${Math.round(n / 1000)}k`
      : n;
export function ChartPanel({
  title,
  caption,
  controls,
  children,
  className = "",
}) {
  return (
    <section className={`status-panel ${className}`}>
      <header>
        <div>
          <h2>{title}</h2>
          {caption && <p>{caption}</p>}
        </div>
        {controls}
      </header>
      {children}
    </section>
  );
}
export function ChartTip({ active, payload, label, format = xp }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ps2-chart-tooltip">
      <strong>
        {payload[0]?.payload?.fullLabel || label || payload[0]?.payload?.name}
      </strong>
      {payload
        .filter((p) => p.value != null)
        .map((p) => (
          <div key={p.dataKey || p.name}>
            <i style={{ background: p.color || p.fill }} />
            <span>{p.name}</span>
            <b>{format(p.value)}</b>
          </div>
        ))}
    </div>
  );
}
export function PeriodSwitch({ value, onChange }) {
  return (
    <div className="console-options" aria-label="Chart period">
      {[90, 365, 0].map((n) => (
        <button key={n} aria-pressed={value === n} onClick={() => onChange(n)}>
          {n === 0 ? "All time" : n === 365 ? "1 year" : "90 days"}
        </button>
      ))}
    </div>
  );
}
export function XPChart({ transactions, days = 0 }) {
  const id = useId().replace(/:/g, "");
  const [mode, setMode] = useState("total");
  const rows = useMemo(() => {
    const history = [...transactions]
      .filter((r) => Date.parse(r.createdAt) <= Date.now())
      .sort(byTime);
    if (!history.length) return [];
    const end = new Date(),
      start = days
        ? new Date(end.getTime() - days * 86400000)
        : new Date(history[0].createdAt);
    const monthly = days !== 90,
      startKey = start.toISOString().slice(0, monthly ? 7 : 10);
    const map = new Map();
    let total = 0;
    history.forEach((r) => {
      const key = r.createdAt.slice(0, monthly ? 7 : 10);
      if (key < startKey) total += r.amount;
      else map.set(key, (map.get(key) || 0) + r.amount);
    });
    const cursor = new Date(start);
    if (monthly) cursor.setUTCDate(1);
    cursor.setUTCHours(0, 0, 0, 0);
    const result = [];
    for (let i = 0; i < 600 && cursor <= end; i++) {
      const key = cursor.toISOString().slice(0, monthly ? 7 : 10),
        earned = map.get(key) || 0;
      total += earned;
      result.push({
        key,
        earned,
        total,
        label: cursor.toLocaleDateString(
          undefined,
          monthly
            ? { month: "short", year: "2-digit", timeZone: "UTC" }
            : { month: "short", day: "numeric", timeZone: "UTC" },
        ),
        fullLabel: key,
      });
      if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      else cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return result;
  }, [transactions, days]);
  return (
    <>
      <div className="chart-subnav">
        <button
          aria-pressed={mode === "total"}
          onClick={() => setMode("total")}
        >
          Cumulative XP
        </button>
        <button
          aria-pressed={mode === "earned"}
          onClick={() => setMode("earned")}
        >
          XP earned
        </button>
      </div>
      {rows.length ? (
        <div
          className="chart-frame"
          role="img"
          aria-label={`Interactive ${mode === "total" ? "cumulative" : "earned"} XP chart. ${rows.length} periods. Use arrow keys to inspect.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={rows}
              margin={{ top: 20, right: 12, bottom: 5, left: 4 }}
              accessibilityLayer
            >
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b5fba" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#3b5fba" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e6edff16" vertical={false} />
              <XAxis {...axis} dataKey="label" minTickGap={38} />
              <YAxis {...axis} tickFormatter={shortXP} width={42} />
              <Tooltip
                content={<ChartTip />}
                cursor={{ stroke: "#7350aa", strokeDasharray: "3 4" }}
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey={mode}
                name={mode === "total" ? "Module XP" : "Earned XP"}
                stroke="#4a6ec7"
                strokeWidth={2.5}
                fill={`url(#${id})`}
                activeDot={{
                  r: 5,
                  fill: "#d6d2ef",
                  stroke: "#000",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="status-empty">No XP records available.</p>
      )}
    </>
  );
}
export function ExchangeChart({ rows, counts = false }) {
  const keys = counts ? ["given", "received"] : ["up", "down"];
  const series = monthlySeries(rows, keys);
  return (
    <div
      className="chart-frame"
      role="img"
      aria-label={
        counts
          ? "Completed audits by assignment month"
          : "Given and received audit credits by month"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={series}
          margin={{ top: 18, right: 6, left: 0, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#e6edff16" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis
            {...axis}
            tickFormatter={counts ? undefined : shortXP}
            allowDecimals={false}
            width={42}
          />
          <Tooltip
            content={<ChartTip format={counts ? (n) => `${n} audits` : xp} />}
            cursor={{ fill: "#c7e8ff0b" }}
          />
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          />
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={i ? "Received" : "Given"}
              fill={chartColors[i]}
              radius={[1, 1, 0, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function OutcomeChart({ passed, failed }) {
  const rows = [
    { name: "Passed attempts", value: passed },
    { name: "Failed attempts", value: failed },
  ];
  return (
    <div className="outcome-chart">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {rows.map((r, i) => (
                <Cell key={r.name} fill={chartColors[i]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip format={(n) => `${n} attempt${n === 1 ? "" : "s"}`} />} />
          </PieChart>
        </ResponsiveContainer>
        <strong>
          {passed + failed
            ? `${Math.round((passed / (passed + failed)) * 100)}%`
            : "—"}
        </strong>
      </div>
      <div>
        {rows.map((r, i) => (
          <p key={r.name}>
            <i style={{ background: chartColors[i] }} />
            {r.name}
            <b>{r.value}</b>
          </p>
        ))}
      </div>
    </div>
  );
}
export function SkillHistory({ transactions, skills }) {
  const top = skills.slice(0, 3), rows = skillHistory(transactions, top);
  if (!rows.length)
    return (
      <p className="status-empty">No dated skill transactions available.</p>
    );
  if(rows.length===1) return <div className="skill-single-record" role="figure" aria-label="One recorded skill date">
    <div className="skill-snapshot-marker"/>
    <div><span className="status-overline">Recorded on {date(rows[0].date)}</span><h3>{top[0]?.name}</h3>
      <p>All available updates fall on this date. There are no earlier dated changes to plot.</p></div>
    <strong>{rows[0][top[0]?.type]}<small>points</small></strong>
  </div>;
  return (
    <div
      className="chart-frame"
      role="img"
      aria-label="Highest recorded skill scores over time"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ left: 0, top: 20, right: 10, bottom: 5 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#e6edff16" vertical={false} />
          <XAxis {...axis} dataKey="date" minTickGap={55} padding={{left:32,right:32}} interval="preserveStartEnd"/>
          <YAxis {...axis} width={35} domain={[0,Math.max(100,...top.map(s=>s.amount))]}/>
          <Tooltip content={<ChartTip format={(n) => `${n} points`} />} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          {top.map((s, i) => (
            <Line
              key={s.type}
              dataKey={s.type}
              name={s.name}
              stroke={chartColors[i]}
              strokeWidth={2.5}
              type="stepAfter"
              dot={{r:3,fill:"#b8cfff",stroke:"#17203c"}}
              activeDot={{r:6,fill:"#d5e8ff"}}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
