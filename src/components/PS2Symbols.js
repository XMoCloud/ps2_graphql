import React from "react";

export const Triangle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 4L22 20H2L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const Circle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const Cross = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Square = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const FloatingSymbols = ({ variant = "default" }) => {
  const palette = variant === "death"
    ? {
        triangle: "text-red-500",
        circle: "text-red-400",
        cross: "text-red-600",
        square: "text-red-500",
      }
    : {
        triangle: "text-ps2-triangle",
        circle: "text-ps2-circle",
        cross: "text-ps2-cross",
        square: "text-ps2-square",
      };

  const symbols = [
    { Component: Triangle, type: "triangle", top: "10%", left: "5%", delay: "0s", size: 20 },
    { Component: Circle, type: "circle", top: "20%", right: "8%", delay: "1s", size: 18 },
    { Component: Cross, type: "cross", bottom: "30%", left: "3%", delay: "2s", size: 22 },
    { Component: Square, type: "square", top: "60%", right: "5%", delay: "0.5s", size: 16 },
    { Component: Triangle, type: "triangle", bottom: "15%", right: "12%", delay: "1.5s", size: 14 },
    { Component: Circle, type: "circle", top: "45%", left: "8%", delay: "2.5s", size: 12 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {symbols.map((item, index) => {
        const { Component, type, size, delay, ...position } = item;
        const color = palette[type];
        return (
          <div
            key={index}
            className={`absolute ${color} opacity-20 animate-float`}
            style={{
              ...position,
              animationDelay: delay,
              animationDuration: `${3 + index * 0.5}s`,
            }}
          >
            <Component size={size} />
          </div>
        );
      })}
    </div>
  );
};

export const SymbolRow = ({ className = "" }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <Triangle size={16} className="text-ps2-triangle" />
    <Circle size={16} className="text-ps2-circle" />
    <Cross size={16} className="text-ps2-cross" />
    <Square size={16} className="text-ps2-square" />
  </div>
);

export default { Triangle, Circle, Cross, Square, FloatingSymbols, SymbolRow };
