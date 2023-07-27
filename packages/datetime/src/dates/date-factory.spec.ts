import { vi, describe, it, expect } from "vitest";
import { DateFactory } from "./date-factory";
vi.useFakeTimers().setSystemTime(new Date("2023-06-03"));

describe("DateFactory", () => {
  describe("fromPhrase", () => {
    it("should return the day before yesterday", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() - 2);
      const actual = sut.fromPhrase("before yesterday");
      expect(actual).toEqual(expected);
    });
    it("should return yesterday", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() - 1);
      const actual = sut.fromPhrase("yesterday");
      expect(actual).toEqual(expected);
    });
    it("should return today", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate());
      const actual = sut.fromPhrase("today");
      expect(actual).toEqual(expected);
    });
    it("should return tomorrow", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() + 1);
      const actual = sut.fromPhrase("tomorrow");
      expect(actual).toEqual(expected);
    });

    it("should return the day after tomorrow", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() + 2);
      const actual = sut.fromPhrase("after tomorrow");
      expect(actual).toEqual(expected);
    });
    it("should return next week", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() + 7);
      const actual = sut.fromPhrase("next week");
      expect(actual).toEqual(expected);
    });
    it("should return last week", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() - 7);
      const actual = sut.fromPhrase("last week");
      expect(actual).toEqual(expected);
    });
    it("should return next fortnight", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() + 14);
      const actual = sut.fromPhrase("next fortnight");
      expect(actual).toEqual(expected);
    });
    it("should return last fortnight", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() - 14);
      const actual = sut.fromPhrase("last fortnight");
      expect(actual).toEqual(expected);
    });
  });
  describe("make", () => {
    it("should make a date 1 day from now", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() + 1);
      const actual = sut.make(1, "days");
      expect(actual).toEqual(expected);
    });
    it("should make a date 1 day ago", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setDate(expected.getDate() - 1);
      const actual = sut.make(-1, "days");
      expect(actual).toEqual(expected);
    });
    it("should make a date 2 minutes from now", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setMinutes(expected.getMinutes() + 2);
      const actual = sut.make(2, "minutes");
      expect(actual).toEqual(expected);
    });
    it("should make a date 2 minutes ago", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setMinutes(expected.getMinutes() - 2);
      const actual = sut.make(-2, "minutes");
      expect(actual).toEqual(expected);
    });
    it("should make a date 2 hours from now", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setHours(expected.getHours() + 2);
      const actual = sut.make(2, "hours");
      expect(actual).toEqual(expected);
    });
    it("should make a date 2 hours ago", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setHours(expected.getHours() - 2);
      const actual = sut.make(-2, "hours");
      expect(actual).toEqual(expected);
    });
    it("should make a date 2 seconds from now", () => {
      const sut = new DateFactory();
      const expected = new Date();
      expected.setSeconds(expected.getSeconds() + 2);
      const actual = sut.make(2, "seconds");
      expect(actual).toEqual(expected);
    });
  });
});
