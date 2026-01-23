import React, { useMemo, useState } from "react";

const XPProgressGraph = ({ transactions = [], totalXP = 0 }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const chartData = useMemo(() => {
    if (!transactions.length) {
      return {
        points: totalXP ? [{ date: new Date(), xp: totalXP, name: "Total XP", amount: 0, isTotal: true }] : [],
        maxXP: totalXP,
      };
    }

    let cumulative = 0;
    const data = transactions.map((tx) => {
      cumulative += tx.amount;
      return {
        date: new Date(tx.createdAt),
        xp: cumulative,
        name: tx.object?.name || "Unknown",
        amount: tx.amount,
      };
    });

    const maxXP = totalXP > 0 ? totalXP : cumulative;

    if (totalXP > cumulative) {
      data.push({
        date: new Date(),
        xp: totalXP,
        name: "Total XP",
        amount: totalXP - cumulative,
        isTotal: true,
      });
    }

    return {
      points: data,
      maxXP,
    };
  }, [transactions, totalXP]);

  if (!chartData.points.length) {
    return (
      <div className="ps2-card p-6">
        <h3 className="zrnic-font text-lg mb-4 tracking-[0.25em] uppercase text-primary">XP Progress</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">No XP data available</div>
      </div>
    );
  }

  const width = 1100;
  const height = 320;
  const padding = { top: 20, right: 50, bottom: 70, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { points, maxXP } = chartData;
  const minDate = points[0].date.getTime();
  const maxDate = points[points.length - 1].date.getTime();
  const dateRange = maxDate - minDate || 1;

  const scaleX = (date) => padding.left + ((date.getTime() - minDate) / dateRange) * chartWidth;
  const scaleY = (xp) => padding.top + chartHeight - (xp / maxXP) * chartHeight;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.date)} ${scaleY(p.xp)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${scaleX(points[points.length - 1].date)} ${padding.top + chartHeight}` +
    ` L ${scaleX(points[0].date)} ${padding.top + chartHeight} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: Math.round(maxXP * t),
    y: scaleY(maxXP * t),
  }));

  const xTicks = [0, 0.33, 0.66, 1].map((t) => {
    const time = minDate + dateRange * t;
    return {
      value: new Date(time),
      x: scaleX(new Date(time)),
    };
  });

  const formatXP = (xp) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(0)}k`;
    return xp.toString();
  };

  return (
    <div className="ps2-card p-6 opacity-0 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
      <h3 className="zrnic-font text-lg mb-4 tracking-[0.25em] uppercase text-primary ps2-glow-text">XP Progress Timeline</h3>

      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          preserveAspectRatio="none"
          style={{ height: "400px" }}
        >
          <defs>
            <linearGradient id="xpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(217 91% 50%)" />
              <stop offset="100%" stopColor="hsl(217 91% 70%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="hsl(220 40% 18%)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fill="hsl(215 30% 55%)"
                fontSize="12"
                fontFamily="Rajdhani, sans-serif"
              >
                {formatXP(tick.value)}
              </text>
            </g>
          ))}

          {xTicks.map((tick, i) => (
            <g key={`x-${i}`}>
              <line
                x1={tick.x}
                y1={padding.top + chartHeight}
                x2={tick.x}
                y2={padding.top + chartHeight + 6}
                stroke="hsl(220 40% 18%)"
              />
              <text
                x={tick.x}
                y={padding.top + chartHeight + 25}
                textAnchor="middle"
                fill="hsl(215 30% 55%)"
                fontSize="11"
                fontFamily="Rajdhani, sans-serif"
              >
                {tick.value.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </text>
            </g>
          ))}

          <path d={areaD} fill="url(#xpGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={scaleX(point.date)}
                cy={scaleY(point.xp)}
                r={hoveredPoint === i ? 8 : 4}
                fill="hsl(217 91% 60%)"
                stroke="hsl(220 30% 6%)"
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {hoveredPoint === i && (
                <g>
                  {(() => {
                    const tooltipWidth = 140;
                    const tooltipHeight = 50;
                    const rawX = scaleX(point.date) - tooltipWidth / 2;
                    const rawY = scaleY(point.xp) - tooltipHeight - 15;
                    const x = Math.min(
                      Math.max(rawX, padding.left),
                      width - padding.right - tooltipWidth
                    );
                    const y = Math.min(
                      Math.max(rawY, padding.top),
                      padding.top + chartHeight - tooltipHeight
                    );
                    return (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={tooltipWidth}
                          height={tooltipHeight}
                          rx="4"
                          fill="hsl(220 30% 10%)"
                          stroke="hsl(217 91% 60%)"
                          strokeWidth="1"
                        />
                        <text
                          x={x + tooltipWidth / 2}
                          y={y + 18}
                          textAnchor="middle"
                          fill="hsl(217 91% 70%)"
                          fontSize="11"
                          fontFamily="Orbitron, sans-serif"
                          fontWeight="bold"
                        >
                          +{formatXP(point.amount)} XP
                        </text>
                        <text
                          x={x + tooltipWidth / 2}
                          y={y + 34}
                          textAnchor="middle"
                          fill="hsl(215 30% 55%)"
                          fontSize="10"
                          fontFamily="Rajdhani, sans-serif"
                        >
                          {point.name.substring(0, 18)}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </g>
          ))}

          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fill="hsl(215 30% 55%)"
            fontSize="12"
            fontFamily="Rajdhani, sans-serif"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            XP Earned
          </text>
        </svg>
      </div>
    </div>
  );
};

export default XPProgressGraph;
