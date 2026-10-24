import { describe, expect, it } from "vitest";
import { jobDurationMinutes, slotsForDay, isValidWorkingHours } from "@/lib/availability";
import { estimatePence, formatPence, formatDateShort, formatTime } from "@/lib/format";
import { coversDistrict, districtFromSearch, normalisePostcode, parsePostcodeAreas } from "@/lib/postcode";
import { londonToInstant, isoWeekday, addDays, londonDate } from "@/lib/time";
import { normalisePhone, normaliseVehicleReg } from "@/lib/validation";

const weekdays = { "1": { start: "08:00", end: "17:00" }, "2": { start: "08:00", end: "17:00" } };
const longAgo = new Date("2020-01-01T00:00:00Z");

describe("prices", () => {
  it("estimate = call-out + hours × rate", () => {
    expect(estimatePence(3500, 6000, 1.5)).toBe(12500);
    expect(formatPence(12500)).toBe("£125");
    expect(formatPence(4550)).toBe("£45.50");
  });
});

describe("UK time", () => {
  it("formats in UK style and London time even if the server is elsewhere", () => {
    const summer = londonToInstant("2027-07-05", 9 * 60); // BST
    expect(summer.toISOString()).toBe("2027-07-05T08:00:00.000Z");
    const winter = londonToInstant("2027-01-04", 9 * 60); // GMT
    expect(winter.toISOString()).toBe("2027-01-04T09:00:00.000Z");
    expect(formatTime(summer)).toBe("09:00");
    expect(formatDateShort(summer)).toBe("05/07/2027");
    expect(londonDate(new Date("2027-07-05T23:30:00Z"))).toBe("2027-07-06");
  });
  it("weekday and date arithmetic", () => {
    expect(isoWeekday("2027-07-05")).toBe(1);
    expect(isoWeekday("2027-07-11")).toBe(7);
    expect(addDays("2027-12-31", 1)).toBe("2028-01-01");
  });
});

describe("slots", () => {
  it("rounds job length up to the half hour", () => {
    expect(jobDurationMinutes(1)).toBe(60);
    expect(jobDurationMinutes(1.2)).toBe(90);
    expect(jobDurationMinutes(0.5)).toBe(30);
  });
  it("offers hourly start times that finish within working hours", () => {
    const slots = slotsForDay({ date: "2027-07-05", workingHours: weekdays, durationMinutes: 120, busy: [], daysOff: new Set(), now: longAgo });
    expect(slots.map((s) => s.label)).toEqual(["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]);
  });
  it("hides taken slots, days off and non-working days", () => {
    const busy = [{ start: londonToInstant("2027-07-05", 10 * 60), end: londonToInstant("2027-07-05", 11 * 60 + 30) }];
    const slots = slotsForDay({ date: "2027-07-05", workingHours: weekdays, durationMinutes: 60, busy, daysOff: new Set(), now: longAgo });
    expect(slots.map((s) => s.label)).not.toContain("10:00");
    expect(slots.map((s) => s.label)).not.toContain("11:00");
    expect(slots.map((s) => s.label)).toContain("09:00");
    expect(slots.map((s) => s.label)).toContain("12:00");
    expect(slotsForDay({ date: "2027-07-05", workingHours: weekdays, durationMinutes: 60, busy: [], daysOff: new Set(["2027-07-05"]), now: longAgo })).toEqual([]);
    expect(slotsForDay({ date: "2027-07-11", workingHours: weekdays, durationMinutes: 60, busy: [], daysOff: new Set(), now: longAgo })).toEqual([]);
  });
  it("needs notice before a slot", () => {
    const now = londonToInstant("2027-07-05", 9 * 60 + 30);
    const slots = slotsForDay({ date: "2027-07-05", workingHours: weekdays, durationMinutes: 60, busy: [], daysOff: new Set(), now });
    expect(slots[0].label).toBe("12:00");
  });
  it("validates working hours", () => {
    expect(isValidWorkingHours(weekdays)).toBe(true);
    expect(isValidWorkingHours({ "8": { start: "08:00", end: "17:00" } })).toBe(false);
    expect(isValidWorkingHours({ "1": { start: "17:00", end: "08:00" } })).toBe(false);
  });
});

describe("postcodes", () => {
  it("normalises and validates", () => {
    expect(normalisePostcode("bs14dj")).toBe("BS1 4DJ");
    expect(normalisePostcode("SW1A 1AA")).toBe("SW1A 1AA");
    expect(normalisePostcode("M1 1AE")).toBe("M1 1AE");
    expect(normalisePostcode("12345")).toBeNull();
    expect(normalisePostcode("BS1")).toBeNull();
  });
  it("matches coverage without BS1 matching BS16", () => {
    expect(coversDistrict(["BS1", "BS2"], "BS1")).toBe(true);
    expect(coversDistrict(["BS1"], "BS16")).toBe(false);
    expect(coversDistrict(["BS"], "BS16")).toBe(true);
    expect(coversDistrict(["B"], "BS16")).toBe(false);
  });
  it("understands search input", () => {
    expect(districtFromSearch("bs16 2ab")).toBe("BS16");
    expect(districtFromSearch("BS16")).toBe("BS16");
    expect(districtFromSearch("Bristol")).toBeNull();
    expect(parsePostcodeAreas("bs1, bs2 BS16; nope1x")).toEqual({ areas: ["BS1", "BS2", "BS16"], invalid: ["NOPE1X"] });
  });
});

describe("contact details", () => {
  it("phone numbers", () => {
    expect(normalisePhone("07700 900123")).toBe("07700900123");
    expect(normalisePhone("+44 7700 900123")).toBe("07700900123");
    expect(normalisePhone("123")).toBeNull();
  });
  it("vehicle registrations", () => {
    expect(normaliseVehicleReg("ab12 cde")).toBe("AB12CDE");
    expect(normaliseVehicleReg("hello")).toBeNull();
  });
});
