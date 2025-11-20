import { describe, expect, it, vi } from "vitest";

import {
  BufferedHierarchicalLog,
  ImmediateHierarchicalLog,
} from "./hierarchical-log";

describe("BufferedHierarchicalLog", () => {
  it("flushes buffered messages with indentation", () => {
    const sink = vi.fn();
    const log = new BufferedHierarchicalLog(sink, { indent: "  " });

    log.write("root");
    log.write("child", 1);
    log.write("grandchild", 2);
    log.flush();

    expect(sink).toHaveBeenCalledTimes(3);
    expect(sink).toHaveBeenNthCalledWith(1, "root");
    expect(sink).toHaveBeenNthCalledWith(2, "  child");
    expect(sink).toHaveBeenNthCalledWith(3, "    grandchild");
  });

  it("supports nested scoped logging", () => {
    const sink = vi.fn();
    const log = new BufferedHierarchicalLog(sink, { indent: "  " });

    const suiteScope = log.scoped(1);
    suiteScope.write("suite child");

    const testScope = suiteScope.scoped(1);
    testScope.write("test child");

    log.flush();

    expect(sink).toHaveBeenCalledTimes(2);
    expect(sink).toHaveBeenNthCalledWith(1, "  suite child");
    expect(sink).toHaveBeenNthCalledWith(2, "    test child");
  });
});

describe("ImmediateHierarchicalLog", () => {
  it("writes output without buffering", () => {
    const sink = vi.fn();
    const log = new ImmediateHierarchicalLog(sink, { indent: "  " });

    log.write("immediate", 2);

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith("    immediate");
  });
});
