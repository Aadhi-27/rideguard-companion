import { describe, expect, it } from "vitest";
import { gesturesAllowed, isNearPoint, nextSafeRideStreak } from "./safety";

describe("parked gesture safety", () => {
  it("allows gestures only when GPS speed is available and at most 3 km/h", () => {
    expect(gesturesAllowed(3)).toBe(true);
    expect(gesturesAllowed(3.01)).toBe(false);
    expect(gesturesAllowed(null)).toBe(false);
    expect(gesturesAllowed(Number.NaN)).toBe(false);
  });
});

describe("safe ride streak", () => {
  it("increments a completed safe ride and resets when not completed", () => {
    expect(nextSafeRideStreak(4, true)).toBe(5);
    expect(nextSafeRideStreak(4, false)).toBe(0);
  });
});

describe("nearby hazard distance", () => {
  it("detects the same location inside a 0.3 km alert radius", () => {
    expect(isNearPoint({ lat: 13.0418, lng: 80.2341 }, { lat: 13.042, lng: 80.2342 }, 0.3)).toBe(true);
  });
});
