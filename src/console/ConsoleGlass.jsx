import React, { forwardRef } from "react";

// Keep native element/ref semantics without per-panel filters or render loops.
// Old optical props are consumed here while callers retain their layout.
export const GlassSurface=forwardRef(function GlassSurface({as: Tag="section",className="",children,radius,refract,aberration,bezel,blur,saturation,fallbackBlur,sheen,tone,profile,...props},ref) {
  return <Tag ref={ref} className={`console-surface ${className}`} {...props}>
    {children}
  </Tag>;
});

export function ConsoleButton({className="",children,...props}) {
  return <button className={`console-button ${className}`} {...props}>
    {children}
  </button>;
}
