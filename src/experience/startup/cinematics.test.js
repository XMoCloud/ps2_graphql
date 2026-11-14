import { describe, expect, it } from "vitest";
import { arrivalCamera, portalCamera, PORTAL_COMMIT_MS } from "./cinematics";

describe("camera choreography", () => {
  it("pulls out of the center after boot and settles its fast rotation", () => {
    const start=arrivalCamera(0), middle=arrivalCamera(.4), end=arrivalCamera(1.18);
    expect(start.reveal).toBe(0);
    expect(start.distance).toBeLessThan(middle.distance);
    expect(middle.distance).toBeLessThan(end.distance);
    expect(end.distance).toBeCloseTo(37);
    expect(middle.roll).toBeLessThan(start.roll);
    expect(end.roll).toBeCloseTo(0);
    expect(end.reveal).toBe(1);
  });
  it("commits the route in black and flies inward to the menu pose", () => {
    expect(portalCamera(PORTAL_COMMIT_MS/1000).black).toBe(1);
    const start=portalCamera(.52,false,0,"entering");
    const end=portalCamera(1.12,false,.6,"entering");
    expect(start.distance).toBeGreaterThan(end.distance);
    expect(end.distance).toBeCloseTo(30.6);
    expect(end.roll).toBeCloseTo(0);
  });
  it("holds the approach when a slow frame delays the route commit", () => {
    const delayed=portalCamera(2,false,-1,"leaving");
    expect(delayed.active).toBe(true);
    expect(delayed.approaching).toBe(true);
    expect(delayed.approach).toBe(1);
    // Entry uses time since the actual commit, even if wall time has advanced.
    expect(portalCamera(3,false,.1,"entering").distance).toBeGreaterThan(30.6);
    expect(portalCamera(3)).toMatchObject({active:false});
  });
});
