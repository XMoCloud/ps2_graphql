import React, { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { date } from "./data";
import { skillGains } from "./analytics";

function labelLines(name) {
  const words=name.split(" "), lines=[""];
  for(const word of words){
    if((lines.at(-1)+" "+word).trim().length>18 && lines.at(-1)) lines.push(word);
    else lines[lines.length-1]=(lines.at(-1)+" "+word).trim();
  }
  return lines;
}
export default function SkillsConstellation({ rows, transactions, selectedType, onSelect }) {
  const id=useId().replace(/:/g,""), [hovered,setHovered]=useState(null);
  const host=useRef(null), [compact,setCompact]=useState(false);
  useLayoutEffect(()=>{
    const measure=()=>{const width=host.current?.getBoundingClientRect().width;setCompact(width>0 && width<680);};
    measure();
    if(typeof ResizeObserver==="undefined" || !host.current) return;
    const observer=new ResizeObserver(measure);observer.observe(host.current);
    return ()=>observer.disconnect();
  },[rows.length]);
  const selected=rows.find(row=>row.type===(hovered || selectedType)) || rows[0];
  const gains=useMemo(()=>skillGains(transactions,rows),[transactions,rows]);
  if(!rows.length) return <p className="status-empty">No recorded skills are available in this category.</p>;
  const cx=460,cy=340,radius=228,maximum=Math.max(100,...rows.map(r=>r.amount));
  const point=(index,r)=>{const angle=index*Math.PI*2/rows.length-Math.PI/2;return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];};
  const plot=rows.map((row,index)=>({row,index,point:point(index,radius*Math.max(0,row.amount)/maximum),label:point(index,radius+61)}));
  const history=transactions.filter(r=>r.type===selected.type && Date.parse(r.createdAt)<=Date.now()).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const gain=gains.find(r=>r.type===selected.type)?.gain || 0;
  return <div ref={host} className={`skills-constellation-layout ${compact ? "is-compact" : ""}`}>
    <div className="skills-starfield">
      <svg viewBox={compact ? "190 70 540 540" : "0 0 920 710"} role={compact ? "img" : "group"} aria-label={`Interactive skill constellation showing all ${rows.length} skills in this category`}>
        <defs><linearGradient id={id} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#448eff" stopOpacity=".28"/><stop offset="1" stopColor="#9970cd" stopOpacity=".16"/></linearGradient></defs>
        {[25,50,75,100].map(value=><g key={value} className="skill-orbit-grid">
          <polygon points={rows.map((_,i)=>point(i,radius*value/100).join(",")).join(" ")}/>
          <text x={cx+9} y={cy-radius*value/100-7}>{Math.round(maximum*value/100)}</text>
        </g>)}
        {plot.map(({row,index,label})=><line key={row.type} className="skill-axis-ray" x1={cx} y1={cy} x2={point(index,radius)[0]} y2={point(index,radius)[1]}/>)}
        <polygon className="skill-constellation-shape" points={plot.map(p=>p.point.join(",")).join(" ")} fill={`url(#${id})`}/>
        {plot.map(({row,point:[x,y],label:[lx,ly]})=>{
          const active=selected.type===row.type, lines=labelLines(row.name);
          const anchor=Math.abs(lx-cx)<40 ? "middle" : lx>cx ? "start" : "end";
          return <g key={row.type} className={`skill-star ${active ? "is-active" : ""}`} role={compact ? undefined : "button"} tabIndex={compact ? undefined : 0}
            aria-label={compact ? undefined : `${row.name}, ${row.amount} points`} aria-pressed={compact ? undefined : selectedType===row.type}
            onMouseEnter={()=>setHovered(row.type)} onMouseLeave={()=>setHovered(null)}
            onFocus={()=>setHovered(row.type)} onBlur={()=>setHovered(null)} onClick={()=>onSelect(row.type)}
            onKeyDown={event=>{if(["Enter"," "].includes(event.key)){event.preventDefault();onSelect(row.type);}}}>
            <title>{row.name}: {row.amount} points</title>
            <circle className="skill-star-hit" cx={x} cy={y} r="15"/>
            {active && <><circle className="skill-star-halo" cx={x} cy={y} r="19"/><circle className="skill-star-halo inner" cx={x} cy={y} r="12"/></>}
            <circle className="skill-star-point" cx={x} cy={y} r={active ? 5.5 : 3.5}/>
            <text x={lx} y={ly-(lines.length-1)*9} textAnchor={anchor} className="skill-star-label">
              {lines.map((line,i)=><tspan key={line} x={lx} dy={i ? 18 : 0}>{line}</tspan>)}
              <tspan className="skill-star-score" x={lx} dy="18">{row.amount}</tspan>
            </text>
          </g>;
        })}
        <circle cx={cx} cy={cy} r="3" fill="#88a4db"/>
      </svg>
    </div>
    {compact && <div className="skills-compact-keys" aria-label="Recorded skills">
      {rows.map(row=><button key={row.type} aria-pressed={selectedType===row.type} onClick={()=>onSelect(row.type)}><span>{row.name}</span><b>{row.amount}</b></button>)}
    </div>}
    <section className="skill-star-details" aria-label="Selected skill details">
      <span className="status-overline">Selected skill</span>
      <h3>{selected.name}</h3>
      <div className="skill-star-readout"><strong>{selected.amount}</strong><span>highest recorded score</span></div>
      <ol className="skill-score-milestones" aria-label="Recorded score milestones">
        {[25,50,75,100].map(n=><li key={n} className={selected.amount>=n ? "reached" : ""} aria-label={`${n} points ${selected.amount>=n ? "reached" : "not reached"}`}>{n}</li>)}
      </ol>
      <dl><div><dt>First recorded</dt><dd>{date(history[0]?.createdAt)}</dd></div>
        <div><dt>Latest update</dt><dd>{date(history.at(-1)?.createdAt)}</dd></div>
        <div><dt>Last 90 days</dt><dd>{gain ? `+${gain} points` : "No new personal best"}</dd></div>
        <div><dt>Recorded updates</dt><dd>{history.length}</dd></div></dl>
      <p>Select a star to open its timeline below. Platform scores describe recorded curriculum progress.</p>
    </section>
  </div>;
}
