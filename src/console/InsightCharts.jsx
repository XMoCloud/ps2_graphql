import React, { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LabelList, PieChart, Pie, Sector, AreaChart, Area, ReferenceLine, Legend } from "recharts";
import { ChartTip, chartColors } from "./Charts";
import { communityDistribution, projectXPBreakdown, preciseXP, exactXP,
  auditBalanceHistory, auditOutcomes, cohortOptions, studentCohort } from "./analytics";

const axis = { tick:{fill:"#b5bfd0",fontSize:12,fontFamily:"Arial"}, axisLine:false, tickLine:false };
const projectColors = ["#426fc7","#7957b3","#4c94ba","#a15d9c","#5865a8","#8f74bd","#4a80a0","#6c4b96"];

export function CommunityChart({ users = [], labels = [], userId, events = [], level, ratio }) {
  const [metric,setMetric] = useState("level"), [chartWidth,setChartWidth] = useState(0);
  const [population,setPopulation] = useState("all");
  const cohorts = useMemo(()=>cohortOptions(labels),[labels]);
  const mine = studentCohort(cohorts,users,userId,events);
  const selectedCohort = population === "mine" ? mine : null;
  const populationUsers = selectedCohort ? users.filter(r=>selectedCohort.eventIds.includes(Number(r.eventId))) : users;
  const compact = chartWidth > 0 && chartWidth < 420 && metric === "level";
  const rows = communityDistribution(populationUsers,metric,metric === "level" ? level : ratio);
  const total = rows.reduce((n,r) => n+r.count,0);
  const current = metric === "level" ? level : ratio;
  const tip = ({active,payload}) => {
    if (!active || !payload?.length) return null;
    const row=payload[0].payload;
    return <div className="ps2-chart-tooltip"><strong>{metric === "level" ? "Level" : "Audit ratio"} {row.name}</strong>
      <p>{row.count} students · {total ? (row.count/total*100).toFixed(1) : 0}% of this population</p>
      {row.isYou && <p className="chart-your-range">Your current range</p>}</div>;
  };
  return <>
    <div className="chart-subnav" aria-label="Distribution metric">
      {["level","ratio"].map(value => <button key={value} aria-pressed={metric===value} onClick={()=>setMetric(value)}>
        {value === "level" ? "Level" : "Audit ratio"}</button>)}
    </div>
    <div className="chart-subnav population-controls" aria-label="Student population">
      <button aria-pressed={!selectedCohort} onClick={()=>setPopulation("all")}>All Reboot01 students</button>
      <button aria-pressed={Boolean(selectedCohort)} disabled={!mine} onClick={()=>setPopulation("mine")}>My cohort{mine ? ` · ${mine.name}` : " · unavailable"}</button>
    </div>
    <p className="chart-context">{total} students · {selectedCohort?.name || "All Reboot01 main-curriculum cohorts"}{current != null && <span>Your {metric === "level" ? "level" : "ratio"}: {metric === "level" ? current : current.toFixed(2)}</span>}</p>
    {total ? <div className="chart-frame" role="img" aria-label={`${metric === "level" ? "Level" : "Audit ratio"} distribution among ${total} students. Your range is highlighted.`}>
      <ResponsiveContainer width="100%" height="100%" onResize={width=>setChartWidth(width)}><BarChart data={rows} margin={{top:30,right:12,left:0,bottom:10}} accessibilityLayer>
        <CartesianGrid stroke="#e6edff16" vertical={false}/><XAxis dataKey="name" {...axis} interval={0}
          tick={{...axis.tick,fontSize:compact ? 10 : 12}} angle={compact ? -35 : 0}
          textAnchor={compact ? "end" : "middle"} height={compact ? 48 : 30} tickMargin={compact ? 10 : 8}/>
        <YAxis {...axis} allowDecimals={false} width={35}/><Tooltip content={tip} cursor={{fill:"#b6c5ff0b"}}/>
        <Bar dataKey="count" name="Students" maxBarSize={44} radius={[3,3,0,0]} isAnimationActive={false}>
          {rows.map(row=><Cell key={row.name} fill={row.isYou ? "#8b65bf" : chartColors[0]} stroke={row.isYou ? "#baace0" : "none"}/>) }
          <LabelList dataKey="count" position="top" fill="#b9c6e8" fontSize={12}/>
        </Bar>
      </BarChart></ResponsiveContainer>
    </div> : <p className="status-empty">Community distribution is unavailable. Your personal statistics remain available.</p>}
    {total > 0 && <p className="status-footnote">Main-curriculum enrollments only. Each student is counted once. Highlighted bar = your range.</p>}
  </>;
}

export function ProjectXPChart({ transactions }) {
  const rows = useMemo(()=>projectXPBreakdown(transactions),[transactions]);
  const total=rows.reduce((n,r)=>n+r.amount,0), [active,setActive]=useState(null);
  const slices=rows.filter(r=>r.amount>0), positiveTotal=slices.reduce((n,r)=>n+r.amount,0);
  const hasCorrections=slices.length!==rows.length;
  if (!rows.length) return <p className="status-empty">No module XP awards yet.</p>;
  const selected=rows[active];
  const tip=({active:show,payload}) => {
    if(!show || !payload?.length) return null;
    const row=payload[0].payload;
    return <div className="ps2-chart-tooltip"><strong>{row.name}</strong><p>{preciseXP(row.amount)} · {exactXP(row.amount)}</p><p>{(row.amount/positiveTotal*100).toFixed(2)}% of {hasCorrections ? "positive net awards" : "module XP"}</p></div>;
  };
  return <div className="project-xp-breakdown">
    <div className="project-xp-donut">
      <ResponsiveContainer width="100%" height="100%"><PieChart>
        <Pie data={slices} dataKey="amount" nameKey="name" innerRadius="65%" outerRadius="88%" stroke="#080c18" strokeWidth={1.5}
          activeIndex={active ?? -1} activeShape={p=><Sector {...p} outerRadius={p.outerRadius+5}/>}
          isAnimationActive={false} onMouseEnter={(_,index)=>setActive(index)} onMouseLeave={()=>setActive(null)}>
          {slices.map((row,i)=><Cell key={row.key} fill={projectColors[i%projectColors.length]}/>)}
        </Pie><Tooltip content={tip}/>
      </PieChart></ResponsiveContainer>
      <div className="project-xp-center"><strong>{preciseXP(selected?.amount ?? total)}</strong><span>{selected ? "Selected award" : "Module XP"}</span><small>{exactXP(selected?.amount ?? total)}</small></div>
    </div>
    <div className="project-xp-legend" aria-label="Project XP awards">
      {rows.map((row,i)=><button key={row.key} aria-pressed={active===i} onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)}
        onFocus={()=>setActive(i)} onBlur={()=>setActive(null)} onClick={()=>setActive(active===i ? null : i)}
        title={`${row.name}: ${exactXP(row.amount)}`}>
        <i style={{background:projectColors[i%projectColors.length]}}/><span>{row.name}</span><b>{preciseXP(row.amount)}</b></button>)}
    </div>
    <p className="status-footnote">All module XP awards, including piscine completion bonuses.{hasCorrections ? " Negative corrections are included in the total and list; the donut shows positive net awards." : ""} Hover or focus a project for its exact XP.</p>
  </div>;
}

export function AuditBalanceChart({ transactions, up, down }) {
  const rows=useMemo(()=>auditBalanceHistory(transactions,up,down),[transactions,up,down]);
  if(!rows.length) return <p className="status-empty">No dated audit credits available.</p>;
  return <div className="chart-frame" role="img" aria-label="Audit credit balance over twelve months. Positive means more credit given than received.">
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{top:20,right:12,left:8,bottom:5}} accessibilityLayer>
      <CartesianGrid stroke="#e6edff16" vertical={false}/><XAxis dataKey="label" {...axis}/><YAxis {...axis} width={70} tickFormatter={preciseXP}/>
      <ReferenceLine y={0} stroke="#aaa8c1" strokeDasharray="4 4"/>
      <Tooltip content={<ChartTip format={n=>`${preciseXP(n)} · ${exactXP(n)}`}/>} cursor={{stroke:"#8b65bf"}}/>
      <Area dataKey="balance" name="Given minus received" type="linear" stroke="#8162b5" strokeWidth={2.5} fill="#7350aa24" isAnimationActive={false} activeDot={{r:5}}/>
    </AreaChart></ResponsiveContainer>
  </div>;
}
export function AuditOutcomeChart({ given, received }) {
  const rows=useMemo(()=>auditOutcomes(given,received),[given,received]);
  return <div className="chart-frame" role="img" aria-label="Review outcomes: passed, not passed, awaiting grade and expired without grade.">
    <ResponsiveContainer width="100%" height="100%"><BarChart data={rows} layout="vertical" margin={{top:20,right:10,left:0,bottom:10}} accessibilityLayer>
      <CartesianGrid stroke="#e6edff16" horizontal={false}/><XAxis type="number" {...axis} allowDecimals={false}/><YAxis dataKey="name" type="category" {...axis} width={68}/>
      <Tooltip content={<ChartTip format={n=>`${n} reviews`}/>} cursor={{fill:"#b6c5ff0b"}}/>
      <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:12,lineHeight:"24px"}}/>
      {[["passed","Passed","#426fc7"],["failed","Not passed","#a15d9c"],["open","Awaiting grade","#7957b3"],["expired","Closed without grade","#515d76"]].map(([key,name,fill])=><Bar key={key} stackId="outcomes" dataKey={key} name={name} fill={fill} maxBarSize={35} isAnimationActive={false}/>)}
    </BarChart></ResponsiveContainer>
  </div>;
}
