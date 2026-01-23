import React, { useMemo, useState } from "react";

const skillMapping = {
  skill_go: { name: "Go", category: "technology" },
  skill_js: { name: "JavaScript", category: "technology" },
  skill_html: { name: "HTML", category: "technology" },
  skill_sql: { name: "SQL", category: "technology" },
  skill_css: { name: "CSS", category: "technology" },
  skill_unix: { name: "Unix", category: "technology" },
  skill_docker: { name: "Docker", category: "technology" },
  skill_rust: { name: "Rust", category: "technology" },
  skill_java: { name: "Java", category: "technology" },
  skill_c: { name: "C", category: "technology" },
  skill_shell: { name: "Shell", category: "technology" },
  skill_php: { name: "PHP", category: "technology" },
  skill_python: { name: "Python", category: "technology" },
  skill_ruby: { name: "Ruby", category: "technology" },
  skill_cpp: { name: "C++", category: "technology" },
  skill_graphql: { name: "GraphQL", category: "technology" },
  skill_rails: { name: "Rails", category: "technology" },
  skill_laravel: { name: "Laravel", category: "technology" },
  skill_django: { name: "Django", category: "technology" },
  skill_electron: { name: "Electron", category: "technology" },
  skill_git: { name: "Git", category: "technology" },
  skill_prog: { name: "Prog", category: "technical" },
  "skill_front-end": { name: "Front-end", category: "technical" },
  "skill_back-end": { name: "Back-end", category: "technical" },
  skill_algo: { name: "Algo", category: "technical" },
  skill_tcp: { name: "TCP/IP", category: "technical" },
  skill_stats: { name: "Stats", category: "technical" },
  skill_ai: { name: "AI", category: "technical" },
  skill_game: { name: "Game", category: "technical" },
  "skill_sys-admin": { name: "Sys-Admin", category: "technical" },
  skill_blockchain: { name: "Blockchain", category: "technical" },
  skill_mobile: { name: "Mobile", category: "technical" },
  skill_cybersecurity: { name: "Security", category: "technical" },
  skill_cloud: { name: "Cloud", category: "technical" },
};

const SkillsRadar = ({ skills = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const technologySkills = useMemo(() => {
    if (!skills?.length) return [];

    const technologies = [];

    skills.forEach((skill) => {
      const mapping = skillMapping[skill.type];
      if (!mapping || mapping.category !== "technology") return;
      const percentage = Math.min(skill.amount || 0, 100);
      if (percentage <= 0) return;
      technologies.push({
        name: mapping.name,
        percentage,
      });
    });

    return technologies.sort((a, b) => b.percentage - a.percentage);
  }, [skills]);

  if (!technologySkills.length) {
    return (
      <div className="ps2-card p-6">
        <h3 className="zrnic-font text-lg mb-4 tracking-[0.25em] uppercase text-primary">Technology Skills Radar</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">No skills data available</div>
      </div>
    );
  }

  const size = 300;
  const center = size / 2;
  const maxRadius = 120;
  const levels = 5;
  const maxValue = 100;

  const angleStep = (Math.PI * 2) / technologySkills.length;

  const getPoint = (index, value) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (value / maxValue) * maxRadius;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  };

  const radarPoints = technologySkills.map((skill, i) => getPoint(i, skill.percentage));
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  let hoveredTooltip = null;
  if (hoveredIndex !== null && radarPoints[hoveredIndex]) {
    const point = radarPoints[hoveredIndex];
    const skill = technologySkills[hoveredIndex];
    const text = `${skill.name}: ${skill.percentage}%`;
    const width = Math.max(90, text.length * 6);
    const height = 26;
    const x = Math.min(Math.max(point.x - width / 2, 8), size - width - 8);
    const y = Math.max(point.y - height - 12, 8);
    hoveredTooltip = { text, x, y, width, height };
  }

  return (
    <div className="ps2-card p-6 opacity-0 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
      <h3 className="zrnic-font text-lg mb-4 tracking-[0.25em] uppercase text-primary ps2-glow-text">Technology Skills Radar</h3>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px]">
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsla(293, 15%, 35%, 1)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsla(258, 20%, 20%, 1)" stopOpacity="0.5" />
            </linearGradient>
            <filter id="radarGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[...Array(levels)].map((_, i) => {
            const radius = (maxRadius / levels) * (i + 1);
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="hsl(220 40% 18%)"
                strokeWidth="1"
                strokeDasharray={i === levels - 1 ? "0" : "4 4"}
              />
            );
          })}

          {technologySkills.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const endX = center + Math.cos(angle) * maxRadius;
            const endY = center + Math.sin(angle) * maxRadius;
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="hsl(220 40% 18%)"
                strokeWidth="1"
              />
            );
          })}

          <path
            d={radarPath}
            fill="url(#radarGradient)"
            stroke="hsl(217 91% 60%)"
            strokeWidth="2"
            filter="url(#radarGlow)"
          />

          {radarPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="hsl(217 91% 60%)"
              stroke="hsl(220 30% 6%)"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <title>{`${technologySkills[i].name}: ${technologySkills[i].percentage}%`}</title>
            </circle>
          ))}

          {hoveredTooltip && (
            <g className="pointer-events-none">
              <rect
                x={hoveredTooltip.x}
                y={hoveredTooltip.y}
                width={hoveredTooltip.width}
                height={hoveredTooltip.height}
                rx="6"
                ry="6"
                fill="rgba(6,14,40,0.9)"
                stroke="hsl(217 91% 60%)"
                strokeWidth="1"
                filter="url(#radarGlow)"
              />
              <text
                x={hoveredTooltip.x + hoveredTooltip.width / 2}
                y={hoveredTooltip.y + hoveredTooltip.height / 2 + 2}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontFamily="Rajdhani, sans-serif"
                className="uppercase"
              >
                {hoveredTooltip.text}
              </text>
            </g>
          )}

          {technologySkills.map((skill, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = maxRadius + 25;
            const x = center + Math.cos(angle) * labelRadius;
            const y = center + Math.sin(angle) * labelRadius;

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(215 30% 55%)"
                fontSize="10"
                fontFamily="Rajdhani, sans-serif"
                className="uppercase"
              >
                {skill.name.length > 10 ? skill.name.substring(0, 10) + "..." : skill.name}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {technologySkills.slice(0, 6).map((skill, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: i % 2 === 0 ? "hsl(217 91% 60%)" : "hsl(300 70% 60%)" }}
            />
            <span className="text-muted-foreground capitalize">
              {skill.name}: {skill.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsRadar;
