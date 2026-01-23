import React from "react";

const PS2Background = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,30%,4%)] via-[hsl(217,50%,8%)] to-[hsl(220,30%,2%)]" />

      <div className="absolute inset-0">
        <div
          className="absolute w-[800px] h-[800px] rounded-full animate-fog-drift opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, hsl(217 91% 40% / 0.4) 0%, transparent 70%)",
            top: "-200px",
            left: "-200px",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-fog-drift-slow opacity-25"
          style={{
            background: "radial-gradient(ellipse at center, hsl(217 91% 50% / 0.3) 0%, transparent 70%)",
            bottom: "-100px",
            right: "-100px",
            filter: "blur(80px)",
            animationDelay: "5s",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-fog-drift opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, hsl(217 91% 60% / 0.25) 0%, transparent 70%)",
            top: "30%",
            left: "50%",
            filter: "blur(70px)",
            animationDelay: "10s",
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-[300px]"
          style={{
            background: "linear-gradient(to top, hsl(217 91% 30% / 0.15) 0%, transparent 100%)",
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(217 91% 60% / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(217 91% 60% / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, hsl(220 30% 2% / 0.8) 100%)",
        }}
      />
    </div>
  );
};

export default PS2Background;
