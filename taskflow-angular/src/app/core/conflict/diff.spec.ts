import {
  classifyThreeWay,
  classifyWithoutBase,
  dateEqual,
  defaultMergedValue,
  estimateEqual,
  setEqual,
  trimEqual,
} from "./diff";

describe("three-way field classification", () => {
  const eq = (a: string, b: string) => a === b;

  it("marks an unchanged field", () => {
    expect(classifyThreeWay("A", "A", "A", eq)).toBe("UNCHANGED");
  });

  it("marks a local-only change", () => {
    expect(classifyThreeWay("A", "B", "A", eq)).toBe("LOCAL_ONLY");
  });

  it("marks a server-only change", () => {
    expect(classifyThreeWay("A", "A", "C", eq)).toBe("SERVER_ONLY");
  });

  it("marks both sides making the same change", () => {
    expect(classifyThreeWay("A", "B", "B", eq)).toBe("BOTH_SAME");
  });

  it("marks a conflicting scalar change", () => {
    expect(classifyThreeWay("A", "B", "C", eq)).toBe("CONFLICTING");
  });

  it("treats normalized dates as equal", () => {
    expect(dateEqual("2026-12-01", "2026-12-01T00:00:00.000Z")).toBe(true);
    expect(dateEqual("", null)).toBe(true);
    expect(dateEqual("2026-12-01", "2026-12-02")).toBe(false);
  });

  it("compares labels independent of ordering", () => {
    expect(setEqual(["bug", "urgent"], ["urgent", "bug"])).toBe(true);
    expect(setEqual(["bug"], ["bug", "urgent"])).toBe(false);
  });

  it("compares assignees as a set, not array order", () => {
    expect(setEqual(["a", "b"], ["b", "a"])).toBe(true);
    expect(setEqual(["a"], ["a", "c"])).toBe(false);
  });
});

describe("queue classification without a base snapshot", () => {
  const eq = (a: string, b: string) => a === b;

  it("uses server for untouched fields", () => {
    expect(classifyWithoutBase(false, "local", "server", eq)).toBe("UNCHANGED");
  });

  it("treats a touched matching payload as both-same", () => {
    expect(classifyWithoutBase(true, "done", "done", eq)).toBe("BOTH_SAME");
  });

  it("requires a decision when the payload differs from latest", () => {
    expect(classifyWithoutBase(true, "done", "todo", eq)).toBe("CONFLICTING");
  });
});

describe("default merge", () => {
  it("uses local for local-only changes", () => {
    expect(defaultMergedValue("LOCAL_ONLY", "mine", "theirs")).toBe("mine");
  });

  it("uses server for server-only changes", () => {
    expect(defaultMergedValue("SERVER_ONLY", "mine", "theirs")).toBe("theirs");
  });

  it("uses the common value when both changed the same way", () => {
    expect(defaultMergedValue("BOTH_SAME", "shared", "shared")).toBe("shared");
  });

  it("requires a decision for conflicting fields", () => {
    expect(defaultMergedValue("CONFLICTING", "mine", "theirs")).toBeUndefined();
  });
});

describe("domain equality helpers", () => {
  it("trims titles before comparing", () => {
    expect(trimEqual("  Deploy  ", "Deploy")).toBe(true);
  });

  it("treats empty estimates as equal", () => {
    expect(estimateEqual(null, undefined)).toBe(true);
    expect(estimateEqual(8, "8")).toBe(true);
  });
});
