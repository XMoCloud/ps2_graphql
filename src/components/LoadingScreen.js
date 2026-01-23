import React from "react";
import { Triangle, Circle, Cross, Square } from "./PS2Symbols.js";

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin-slow" />
        <div
          className="absolute inset-2 rounded-full border-t-2 border-primary animate-spin"
          style={{ animationDuration: "1s" }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-2">
            <Triangle size={16} className="text-ps2-triangle animate-pulse" style={{ animationDelay: "0s" }} />
            <Circle size={16} className="text-ps2-circle animate-pulse" style={{ animationDelay: "0.2s" }} />
            <Cross size={16} className="text-ps2-cross animate-pulse" style={{ animationDelay: "0.4s" }} />
            <Square size={16} className="text-ps2-square animate-pulse" style={{ animationDelay: "0.6s" }} />
          </div>
        </div>
      </div>

      <p className="font-orbitron text-lg text-primary animate-pulse ps2-glow-text">{message}</p>
    </div>
  );
};

export default LoadingScreen;
