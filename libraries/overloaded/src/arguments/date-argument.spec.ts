import { describe, expect, it } from "vitest";
import { date } from "./date-argument";

describe("Date Argument", () => {
  describe("assertions", () => {
    describe("assertBefore", () => {
      it("should validate that the provided date comes before the expected", () => {
        const sut = date({ before: getDateDaysFromNow(0) });
        sut.assertBefore(getDateDaysFromNow(-1));
        expect(sut.accumulator).toHaveLength(0);
      });
      it("should validate that the provided date does not come before the expected", () => {
        const sut = date({ before: getDateDaysFromNow(0) });
        sut.assertBefore(getDateDaysFromNow(0));
        expect(sut.accumulator).toHaveLength(1);
      });
    });

    describe("assertAfter", () => {
      it("should validate that the provided date comes before the expected", () => {
        const sut = date({ after: getDateDaysFromNow(0) });
        sut.assertAfter(getDateDaysFromNow(1));
        expect(sut.accumulator).toHaveLength(0);
      });
      it("should validate that the provided date does not come before the expected", () => {
        const sut = date({ after: getDateDaysFromNow(0) });
        sut.assertAfter(getDateDaysFromNow(0));
        expect(sut.accumulator).toHaveLength(1);
      });
    });

    describe("assertEquals", () => {
      const now = getDateDaysFromNow(0);
      it("should validate that the provided dates are equal", () => {
        const equals = now;
        const sut = date({ equals });
        sut.assertEquals(now);
        expect(sut.accumulator).toHaveLength(0);
      });
      it("should validate that the provided dates are not equal", () => {
        const sut = date({ equals: getDateDaysFromNow(1) });
        sut.assertEquals(getDateDaysFromNow(0));
        expect(sut.accumulator).toHaveLength(1);
      });
    });
  });
});

function getDateDaysFromNow(nDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + nDays);
  return d;
}
