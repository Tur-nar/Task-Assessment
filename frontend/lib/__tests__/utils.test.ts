import { describe, it, expect } from "vitest";
import { cn, formatSafeDate, formatRelativeTime } from "../utils";

describe("Frontend Utils", () => {
  describe("cn", () => {
    it("merges class names correctly with tailwind overrides", () => {
      expect(cn("px-2 py-1", "bg-red-500", "px-4")).toBe("py-1 bg-red-500 px-4");
      expect(cn("text-sm", false && "text-lg", "font-bold")).toBe("text-sm font-bold");
    });
  });

  describe("formatSafeDate", () => {
    it("formats ISO string date safely", () => {
      const formatted = formatSafeDate("2026-08-26T12:00:00.000Z", "yyyy-MM-dd");
      expect(formatted).toBe("2026-08-26");
    });

    it("returns empty string for null, undefined or empty input", () => {
      expect(formatSafeDate(null)).toBe("");
      expect(formatSafeDate(undefined)).toBe("");
      expect(formatSafeDate("")).toBe("");
    });

    it("handles Neo4j integer date objects", () => {
      const neoDate = {
        year: { low: 2026, high: 0 },
        month: { low: 8, high: 0 },
        day: { low: 15, high: 0 },
      };
      const formatted = formatSafeDate(neoDate, "yyyy-MM-dd");
      expect(formatted).toBe("2026-08-15");
    });

    it("returns empty string for invalid dates without throwing", () => {
      expect(formatSafeDate("not-a-valid-date")).toBe("");
    });
  });

  describe("formatRelativeTime", () => {
    it("returns relative time string for recent date", () => {
      const now = new Date();
      const formatted = formatRelativeTime(now.toISOString());
      expect(formatted).toContain("ago");
    });

    it("returns empty string for null or empty input", () => {
      expect(formatRelativeTime(null)).toBe("");
      expect(formatRelativeTime("")).toBe("");
    });

    it("handles Neo4j integer datetime objects safely", () => {
      const neoDateTime = {
        year: { low: 2026, high: 0 },
        month: { low: 8, high: 0 },
        day: { low: 15, high: 0 },
        hour: { low: 10, high: 0 },
        minute: { low: 30, high: 0 },
      };
      const formatted = formatRelativeTime(neoDateTime);
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});
