import { observable, IObservableValue } from "mobx";
import { suspendableReaction, ISuspendableReactionDisposer } from "../src";

describe("suspendable-reaction", () => {
  let clearReaction: ISuspendableReactionDisposer;
  let value: IObservableValue<string>;
  let log: string[];
  beforeEach(() => {
    value = observable.box("initial");
    log = [];
    clearReaction = suspendableReaction(() => value.get(), v => log.push(v));
  });
  afterEach(() => {
    clearReaction();
  });
  it("should call action if watch changed and reaction is not suspended", () => {
    value.set("first");
    value.set("second");
    expect(log).toEqual(["first", "second"]);
  });
  it("should not call action if watch changed and reaction is suspended", () => {
    clearReaction.suspend();
    value.set("first");
    value.set("second");
    expect(log).toEqual([]);
  });
  it("should call action once per event if emitLastOnly is false", () => {
    clearReaction.suspend();
    value.set("first");
    value.set("second");
    expect(log).toEqual([]);
    clearReaction.unsuspend();
    expect(log).toEqual(["first", "second"]);
  });
  it("should call action only with last value if emitLastOnly is true", () => {
    clearReaction();
    clearReaction = suspendableReaction(() => value.get(), v => log.push(v), {
      emitLastOnly: true
    });
    clearReaction.suspend();
    value.set("first");
    value.set("second");
    expect(log).toEqual([]);
    clearReaction.unsuspend();
    expect(log).toEqual(["second"]);
  });
  it("should not emit reaction if value is the same", () => {
    value.set("first");
    value.set("first");
    value.set("first");
    expect(log).toEqual(["first"]);
  });
  it("should not emit reaction if value is the same while suspended", () => {
    clearReaction.suspend();
    value.set("first");
    value.set("first");
    value.set("first");
    clearReaction.unsuspend();
    expect(log).toEqual(["first"]);
  });
  it("should not emit changes if no changes occurred", () => {
    clearReaction.suspend();
    clearReaction.unsuspend();
    expect(log).toEqual([]);
  });
});
