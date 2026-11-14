import React, { useId } from "react";
import { date, xp } from "./data";
import { saveAppearance } from "./memoryMotion";

export function SaveIcon({ item, large = false }) {
  const id = useId().replace(/:/g, "");
  const { hue } = saveAppearance(item);
  const label = item.isQuest
    ? "Q" + (item.name.match(/\d+/)?.[0] || "")
    : item.name.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase();
  const type = item.isQuest ? 0
    : /sql|social|groupie|map|data/.test(item.name) ? 1
    : /web|html|css|dom|framework/.test(item.name) ? 2 : 3;
  const art = (side) => <svg viewBox="0 0 150 100" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-${side}`} x1="0" x2="1" y1="0" y2="1">
        <stop stopColor={`hsl(${hue} 48% 55%)`} />
        <stop offset="1" stopColor={`hsl(${hue} 55% 17%)`} />
      </linearGradient>
    </defs>
    <rect width="150" height="100" fill={`url(#${id}-${side})`} />
    <path d="M0 23H150M0 77H150M24 0V100M126 0V100" stroke="#ffffff12" />
    <path d="M10 66L50 8L103 92L140 23" stroke="#ffffff0e" strokeWidth="18" fill="none" />
    <g transform="translate(38 3) scale(.74)" stroke="#dde5e5" fill="none" strokeWidth="3">
      {type === 0 ? <path d="M24 13H76V77H24Z M34 27H66M34 39H59M34 51H63M34 64H58" />
        : type === 1 ? <><ellipse cx="50" cy="23" rx="27" ry="10" /><path d="M23 23V65C23 79 77 79 77 65V23M23 44C23 58 77 58 77 44" /></>
        : type === 2 ? <><rect x="18" y="14" width="64" height="59" /><path d="M18 28H82M28 21H32M38 21H42M48 21H52M29 40H56M29 51H70M29 62H63" /></>
        : <path strokeWidth="5" d="M37 19L17 40L37 61M63 19L83 40L63 61M57 12L43 68" />}
    </g>
    <text x="75" y="89" fill="#e1e5dc" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" letterSpacing="3">{label}</text>
    <path d="M1 1H149V99" stroke="#ffffff55" fill="none" />
  </svg>;
  return <span className={`save-object ${large ? "large" : ""}`} style={{ "--save-hue": hue }} aria-hidden="true">
    <span className="save-object-model">
      <span className="save-face save-object-front">{art("front")}</span>
      <span className="save-face save-object-back">{art("back")}</span>
      <span className="save-face save-object-left" />
      <span className="save-face save-object-right" />
      <span className="save-face save-object-top" />
      <span className="save-face save-object-bottom" />
    </span>
  </span>;
}

function Team({ team, userId }) {
  return <section className="save-team">
    <div className="save-team-heading">
      <span>{team.members.length === 1 ? "Individual project" : `Project team · ${team.members.length} members`}</span>
      <small>{team.status?.replace(/_/g, " ")}</small>
    </div>
    {team.members.length ? <ul>
      {team.members.map(member => <li key={member.id}>
        <span><strong>{member.name || member.login || `Member ${member.id}`}</strong>
          {member.login && <small>@{member.login}</small>}</span>
        <span className="save-member-role">{[String(member.id) === String(userId) ? "You" : "", member.captain ? "Captain" : ""].filter(Boolean).join(" · ")}</span>
      </li>)}
    </ul> : <p>Member names are unavailable for this team.</p>}
    {team.createdAt && <p className="save-team-date">Team formed {date(team.createdAt)}</p>}
  </section>;
}

export function SaveInformation({ item, userId }) {
  const grades = [
    ...item.history.map(r => ({ ...r, source: "Result" })),
    ...item.progress.filter(r => r.grade != null).map(r => ({ ...r, source: "Progression", createdAt: r.updatedAt || r.createdAt })),
  ].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const teams = item.teams || [];
  const attrs = teams[0]?.object?.attrs || {};
  const language = typeof attrs.language === "string" ? attrs.language : null;
  return <>
    <h3 id="save-detail-title">{item.name}</h3>
    <p className="save-detail-subtitle">{item.root ? "Piscine exercise" : "Module project"}{language ? ` · ${language}` : ""}</p>
    <p className="save-status">{item.status}</p>
    <dl className="save-facts">
      <div><dt>Earned XP</dt><dd>{xp(item.xp)}</dd></div>
      <div><dt>Latest grade</dt><dd>{item.grade == null ? "Ungraded" : `${Math.round(item.grade * 100)}%`}</dd></div>
      <div><dt>Last saved</dt><dd>{date(item.updatedAt || item.createdAt)}</dd></div>
      <div><dt>Saved grades</dt><dd>{grades.length}</dd></div>
    </dl>
    {teams.length ? <>
      <Team team={teams[0]} userId={userId} />
      {teams.length > 1 && <details className="save-records"><summary>Previous teams ({teams.length - 1})</summary>
        {teams.slice(1).map(team => <Team key={team.id} team={team} userId={userId} />)}
      </details>}
    </> : <p className="save-team-empty">No team membership record is available for this save.</p>}
    <details className="save-records">
      <summary>Grade history ({grades.length})</summary>
      <ol>{grades.map(r => <li key={`${r.source}-${r.id}`}><span>{date(r.createdAt)} · {r.source}</span><strong>{Math.round(r.grade * 100)}%</strong></li>)}</ol>
      {!grades.length && <p>No graded results recorded yet.</p>}
    </details>
  </>;
}
