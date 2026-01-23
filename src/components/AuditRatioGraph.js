import React from "react";

const AuditRatioGraph = ({ up = 0, down = 0 }) => {
  const ratio = down > 0 ? (up / down).toFixed(2) : up > 0 ? "∞" : "0";
  const total = up + down;
  const upPercent = total > 0 ? (up / total) * 100 : 50;
  const downPercent = total > 0 ? (down / total) * 100 : 50;

  const formatBytes = (bytes) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(2)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const upArc = (upPercent / 100) * circumference;
  const downArc = (downPercent / 100) * circumference;

  return (
    <div className="ps2-card p-6 opacity-0 animate-slide-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
      <h3 className="zrnic-font text-lg mb-6 tracking-[0.25em] uppercase text-primary ps2-glow-text">Audit Ratio</h3>

      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <defs>
              <linearGradient id="upGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(217 91% 50%)" />
                <stop offset="100%" stopColor="hsl(217 91% 65%)" />
              </linearGradient>
              <linearGradient id="downGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsla(258, 20%, 20%, 1.00)" />
                <stop offset="100%" stopColor="hsla(293, 15%, 35%, 1.00)" />
              </linearGradient>
              <filter id="arcGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(220 30% 12%)"
              strokeWidth={strokeWidth}
            />

            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#downGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${downArc} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              filter="url(#arcGlow)"
            />

            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#upGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${upArc} ${circumference}`}
              strokeDashoffset={-downArc}
              strokeLinecap="round"
              filter="url(#arcGlow)"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-orbitron text-3xl font-bold text-primary">{ratio}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Ratio</span>
          </div>
        </div>

        <div className="w-full mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Done</span>
            </div>
            <span className="font-orbitron text-sm text-primary">{formatBytes(up)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsla(293, 15%, 35%, 1.00)" }} />
              <span className="text-sm text-muted-foreground">Received</span>
            </div>
            <span className="font-orbitron text-sm" style={{ color: "hsla(257, 20%, 31%, 1.00)" }}>{formatBytes(down)}</span>
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-l-full transition-all duration-1000"
                style={{
                  width: `${upPercent}%`,
                  background: "linear-gradient(90deg, hsl(217 91% 50%), hsl(217 91% 65%))",
                }}
              />
              <div
                className="h-full rounded-r-full transition-all duration-1000"
                style={{
                  width: `${downPercent}%`,
                  background: "linear-gradient(90deg, hsla(293, 15%, 35%, 1.00), hsla(258, 20%, 20%, 1.00))",
                  background: "linear-gradient(90deg, hsla(293, 15%, 35%, 1.00), hsla(258, 20%, 20%, 1.00))",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditRatioGraph;
