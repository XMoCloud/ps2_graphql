import React from "react";
import { Triangle, Circle, Cross, Square } from "./PS2Symbols.js";

const ProjectCard = ({ name, grade, xp, createdAt, index = 0 }) => {
  const passed = grade >= 1;

  const formatXP = (rawXp) => {
    const value = passed ? rawXp : 0;
    if (!value) return "0kb";

    const kb = value / 1000;
    if (kb >= 10) return `${kb.toFixed(0)}kb`;
    return `${kb.toFixed(1)}kb`;
  };

  const xpColorClass = passed ? "text-primary" : "text-destructive";

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const symbols = [Triangle, Circle, Cross, Square];
  const SymbolIcon = symbols[index % 4];
  const symbolColors = ["text-ps2-triangle", "text-ps2-circle", "text-ps2-cross", "text-ps2-square"];

  return (
    <div
      className="ps2-card p-4 opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300 group"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-1 opacity-40 group-hover:opacity-70 transition-opacity ${symbolColors[index % 4]}`}>
            <SymbolIcon size={16} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-orbitron text-sm font-medium text-foreground truncate">{name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className={`font-orbitron text-sm ${xpColorClass}`}>+{formatXP(xp || 0)}</span>
            <span className="text-xs text-muted-foreground ml-1">XP</span>
          </div>

          <div className={passed ? "ps2-tag-pass" : "ps2-tag-fail"}>{passed ? "PASS" : "FAIL"}</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
