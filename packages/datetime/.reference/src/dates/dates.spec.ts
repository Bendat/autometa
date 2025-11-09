import { vi, describe, it, expect } from "vitest";
import { DatesObject } from "./dates";
vi.useFakeTimers().setSystemTime(new Date("2023-06-03"));
describe("Dates", () => {
  describe("IsoDateTransformer", () => {
    describe("fromPhrase", () => {
      it("should return the day before yesterday", () => {
        const sut = new DatesObject();
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - 2);
        const actual = sut.fromPhrase("before yesterday");
        const expected = expectedDate;
        expect(actual).toEqual(expected);
      });

      it("should return yesterday", () => {
        const sut = new DatesObject();
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - 1);
        const actual = sut.fromPhrase("yesterday");
        const expected = expectedDate;
        expect(actual).toEqual(expected);
      });
      it("should return today", () => {
        const sut = new DatesObject();
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate());
        const actual = sut.fromPhrase("today");
        const expected = expectedDate;
        expect(actual).toEqual(expected);
      });
      it("should return 1 day from now", () => {
        const sut = new DatesObject();
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 1);
        const actual = sut.fromPhrase("1 day from now");
        const expected = expectedDate;
        expect(actual).toEqual(expected);
      });
      it("should return 1 day ago", () => {
        const sut = new DatesObject();
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - 1);
        const actual = sut.fromPhrase("1 day ago");
        const expected = expectedDate;
        expect(actual).toEqual(expected);
      });
    });
  });
});
