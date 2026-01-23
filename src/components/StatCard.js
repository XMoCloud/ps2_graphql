import React from "react";

const StatCard = ({ title, value, subtitle, icon: Icon, color = "primary", delay = 0 }) => {
  const colorClasses = {
    primary: "text-primary border-primary/30 bg-primary/5",
    success: "text-success border-success/30 bg-success/5",
    destructive: "text-destructive border-destructive/30 bg-destructive/5",
    triangle: "text-ps2-triangle border-ps2-triangle/30 bg-ps2-triangle/5",
    circle: "text-ps2-circle border-ps2-circle/30 bg-ps2-circle/5",
    cross: "text-ps2-cross border-ps2-cross/30 bg-ps2-cross/5",
    square: "text-ps2-square border-ps2-square/30 bg-ps2-square/5",
  };

  return (
    <div className="ps2-card p-6 opacity-0 animate-fade-in" style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="zrnic-font text-sm uppercase tracking-[0.25em] text-muted-foreground">{title}</h3>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <p className={`font-orbitron text-3xl font-bold ${colorClasses[color].split(" ")[0]}`}>{value}</p>
      {subtitle && <p className="font-rajdhani text-sm text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
