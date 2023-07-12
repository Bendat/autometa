import { vi, describe, it, expect } from "vitest";
import { IsoDateFactory } from "./iso-date-factory";
import { DateFactory } from "./date-factory";
vi.useFakeTimers().setSystemTime(new Date('2023-06-03'));

describe("IsoDateTransformer", () => {
  describe("fromPhrase", () => {
    it("should return the day before yesterday", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 2);
      const actual = sut.fromPhrase("before yesterday");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return yesterday", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 1);
      const actual = sut.fromPhrase("yesterday");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return today", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate());
      const actual = sut.fromPhrase("today");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return tomorrow", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 1);
      const actual = sut.fromPhrase("tomorrow");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return the day after tomorrow", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 2);
      const actual = sut.fromPhrase("after tomorrow");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return next week", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      const actual = sut.fromPhrase("next week");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return last week", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 7);
      const actual = sut.fromPhrase("last week");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return next fortnight", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 14);
      const actual = sut.fromPhrase("next fortnight");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
    it("should return last fortnight", () => {
      const sut = new IsoDateFactory(new DateFactory());
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 14);
      const actual = sut.fromPhrase("last fortnight");
      const expected = expectedDate.toISOString();
      expect(actual).toEqual(expected);
    });
  });
});
