import { beforeEach, describe, expect, it, vi } from "vitest";
import { overloads, def, fallback } from "../authoring/overloads";
import { instanceOf, shape } from "../validators/composite";
import { boolean, typeOf } from "../validators/primitives";

class Invoice {
  constructor(readonly id: string, readonly total: number) {}
}

class Receipt {
  constructor(readonly id: string, readonly issued: boolean) {}
}

class Report {}

describe("Scenario: class routing", () => {
  const handler = vi.fn();

  const router = overloads(
    def("invoice", instanceOf(Invoice)).match((value) => {
      handler("invoice", value);
      const invoice = value as Invoice;
      return { route: "invoice", id: invoice.id, total: invoice.total };
    }),
    def(
      "receipt",
      instanceOf(Receipt, shape({ issued: boolean() }, { allowUnknownProperties: true }), { summary: "Receipt instance" })
    ).match((value) => {
      handler("receipt", value);
      const receipt = value as Receipt;
      return { route: "receipt", id: receipt.id, issued: receipt.issued };
    }),
    def("class reference", typeOf(Invoice)).match(() => {
      handler("type", Invoice);
      return { route: "type", id: "Invoice" };
    }),
    def("boolean flag", boolean()).match((flag) => {
      handler("flag", flag);
      return { route: "flag", enabled: flag as boolean };
    }),
    fallback("unknown class", (...args) => ({ route: "fallback", received: args })),
  );

  beforeEach(() => {
    handler.mockClear();
  });

  it("routes invoice instances", () => {
    const invoice = new Invoice("inv-1", 100);
    const result = router.use([invoice]);
    expect(handler).toHaveBeenCalledWith("invoice", invoice);
    expect(result).toEqual({ route: "invoice", id: "inv-1", total: 100 });
  });

  it("routes receipt instances", () => {
    const receipt = new Receipt("rec-1", true);
    const result = router.use([receipt]);
    expect(handler).toHaveBeenCalledWith("receipt", receipt);
    expect(result).toEqual({ route: "receipt", id: "rec-1", issued: true });
  });

  it("routes by class reference", () => {
    const result = router.use([Invoice]);
    expect(handler).toHaveBeenCalledWith("type", Invoice);
    expect(result).toEqual({ route: "type", id: "Invoice" });
  });

  it("routes boolean flags", () => {
    const result = router.use([false]);
    expect(handler).toHaveBeenCalledWith("flag", false);
    expect(result).toEqual({ route: "flag", enabled: false });
  });

  it("falls back for unhandled types", () => {
    const report = new Report();
    const result = router.use([report]);
    expect(result).toEqual({ route: "fallback", received: [report] });
  });
});
