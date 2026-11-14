import React from "react";

export function ConsoleKey({children,small=false,decorative=false}) {
  return <kbd aria-hidden={decorative || undefined} className={`console-key ${small ? "key-arrow" : ""}`}>{children}</kbd>;
}
export function MenuPrompts() {
  return <div className="menu-prompts" aria-label="Keyboard controls">
    <span><ConsoleKey>ENTER</ConsoleKey> Select</span>
    <span><span className="direction-keys"><ConsoleKey small>←</ConsoleKey><ConsoleKey small>→</ConsoleKey></span> Navigate</span>
  </div>;
}
