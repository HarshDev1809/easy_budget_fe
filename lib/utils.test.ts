import { describe, it, expect } from "vitest";
import {
  cn,
  formatRenewCycle,
  formatNextRenewal,
  formatCategoryRenewCycle,
  formatCategoryNextReset,
  parseCronString,
} from "./utils";
import { Book, Category } from "./types";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
      expect(cn("bg-red-500", { "text-white": true, "hidden": false })).toBe("bg-red-500 text-white");
      expect(cn("p-4 p-8")).toBe("p-8"); // tailwind-merge test
    });
  });

  describe("parseCronString", () => {
    it("returns null for invalid or empty cron", () => {
      expect(parseCronString()).toBeNull();
      expect(parseCronString("")).toBeNull();
      expect(parseCronString("invalid")).toBeNull();
      expect(parseCronString("* * * *")).toBeNull(); // 4 parts instead of 5
    });

    it("parses monthly cron string (day of month set, day of week is *)", () => {
      const result = parseCronString("30 08 1,15 * *");
      expect(result).toEqual({
        customType: "month",
        customTime: "08:30",
        customDaysOfMonth: "1,15",
        customDaysOfWeek: [],
      });
    });

    it("parses weekly cron string (day of week set, day of month is *)", () => {
      const result = parseCronString("00 12 * * 1,5");
      expect(result).toEqual({
        customType: "week",
        customTime: "12:00",
        customDaysOfMonth: "",
        customDaysOfWeek: [1, 5],
      });
    });
  });

  describe("formatRenewCycle", () => {
    it("returns monthly default when no cycle is defined", () => {
      const book = {} as Book;
      expect(formatRenewCycle(book)).toBe("Renews: Monthly");
    });

    it("formats daily cycle", () => {
      const book = { renewCycle: "daily" } as Book;
      expect(formatRenewCycle(book)).toBe("Renews: Daily");
    });

    it("formats weekly cycle with renewDayOfWeek", () => {
      const book = { renewCycle: "weekly", renewDayOfWeek: 2 } as Book; // Tuesday
      expect(formatRenewCycle(book)).toBe("Renews: Weekly on Tuesdays");

      const bookDefault = { renewCycle: "weekly" } as Book;
      expect(formatRenewCycle(bookDefault)).toBe("Renews: Weekly on Mondays");
    });

    it("formats bi-weekly cycle with renewDayOfWeek", () => {
      const book = { renewCycle: "bi-weekly", renewDayOfWeek: 4 } as Book; // Thursday
      expect(formatRenewCycle(book)).toBe("Renews: Bi-weekly on Thursdays");
    });

    it("formats monthly cycle with suffixes", () => {
      const book1 = { renewCycle: "monthly", renewDayOfMonth: 1 } as Book;
      expect(formatRenewCycle(book1)).toBe("Renews: Monthly on the 1st");

      const book2 = { renewCycle: "monthly", renewDayOfMonth: 2 } as Book;
      expect(formatRenewCycle(book2)).toBe("Renews: Monthly on the 2nd");

      const book3 = { renewCycle: "monthly", renewDayOfMonth: 3 } as Book;
      expect(formatRenewCycle(book3)).toBe("Renews: Monthly on the 3rd");

      const book4 = { renewCycle: "monthly", renewDayOfMonth: 11 } as Book;
      expect(formatRenewCycle(book4)).toBe("Renews: Monthly on the 11th");

      const book5 = { renewCycle: "monthly", renewDayOfMonth: 22 } as Book;
      expect(formatRenewCycle(book5)).toBe("Renews: Monthly on the 22nd");
    });

    it("formats custom cron cycle", () => {
      const bookMonth = {
        renewCycle: "custom",
        renewCron: "30 9 1,15 * *",
      } as Book;
      expect(formatRenewCycle(bookMonth)).toBe("Renews: Custom (Monthly on the 1st, 15th at 09:30)");

      const bookWeek = {
        renewCycle: "custom",
        customCron: "0 18 * * 0,6",
      } as Book;
      expect(formatRenewCycle(bookWeek)).toBe("Renews: Custom (Weekly on Sunday, Saturday at 18:00)");

      const bookInvalid = {
        renewCycle: "custom",
        renewCron: "* * *",
      } as Book;
      expect(formatRenewCycle(bookInvalid)).toBe("Renews: Custom (* * *)");
    });
  });

  describe("formatNextRenewal", () => {
    it("returns empty string if no date provided", () => {
      expect(formatNextRenewal()).toBe("");
    });

    it("formats a valid date string", () => {
      const formatted = formatNextRenewal("2026-07-01T12:00:00Z");
      expect(formatted).toContain("Next Renewal:");
      expect(formatted).toContain("July 1, 2026");
    });

    it("returns empty string for invalid date format", () => {
      expect(formatNextRenewal("invalid-date")).toBe("");
    });
  });

  describe("formatCategoryRenewCycle", () => {
    it("returns monthly default when no cycle is defined", () => {
      const category = {} as Category;
      expect(formatCategoryRenewCycle(category)).toBe("Renews Monthly on the 1st");
    });

    it("formats daily category cycle", () => {
      const category = { renewCycle: "daily" } as Category;
      expect(formatCategoryRenewCycle(category)).toBe("Renews daily");
    });

    it("formats weekly category cycle", () => {
      const category = { renewCycle: "weekly", renewDayOfWeek: 3 } as Category; // Wednesday
      expect(formatCategoryRenewCycle(category)).toBe("Renews every Wednesday");
    });

    it("formats bi-weekly category cycle", () => {
      const category = { renewCycle: "bi-weekly", renewDayOfWeek: 5 } as Category; // Friday
      expect(formatCategoryRenewCycle(category)).toBe("Renews bi-weekly on Fridays");
    });

    it("formats monthly category cycle", () => {
      const category = { renewCycle: "monthly", renewDayOfMonth: 15 } as Category;
      expect(formatCategoryRenewCycle(category)).toBe("Renews Monthly on the 15th");
    });

    it("formats custom category cron cycle", () => {
      const catMonth = {
        renewCycle: "custom",
        renewCron: "0 0 1 * *",
      } as Category;
      expect(formatCategoryRenewCycle(catMonth)).toBe("Renews custom (Monthly on the 1st at 00:00)");

      const catWeek = {
        renewCycle: "custom",
        customCron: "0 10 * * 1",
      } as Category;
      expect(formatCategoryRenewCycle(catWeek)).toBe("Renews custom (Weekly on Monday at 10:00)");
    });
  });

  describe("formatCategoryNextReset", () => {
    it("returns empty string if no reset date provided", () => {
      expect(formatCategoryNextReset()).toBe("");
    });

    it("formats a valid reset date string", () => {
      const formatted = formatCategoryNextReset("2026-08-15T00:00:00Z");
      expect(formatted).toContain("Next Reset:");
      expect(formatted).toContain("August 15, 2026");
    });
  });
});
