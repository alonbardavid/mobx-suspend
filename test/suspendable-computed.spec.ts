import { observable, autorun, computed } from "mobx";
import { suspendableComputed } from "../src";

describe("suspendable-computed", () => {
  const myComputed = suspendableComputed();
  describe("basic usage", () => {
    class TestClass {
      @observable
      value = "initial";
      @myComputed
      get actual() {
        return `${this.value}-with-addition`;
      }
    }
    let instance: TestClass;
    let log: string[];
    let cleanAutorun: () => void;
    beforeEach(() => {
      instance = new TestClass();
      log = [];
      cleanAutorun = autorun(() => log.push(instance.actual));
    });
    afterEach(() => {
      cleanAutorun();
    });
    it("should react to changes in observable if not suspended", () => {
      expect(log).toEqual(["initial-with-addition"]);
      expect(instance.actual).toEqual("initial-with-addition");
      instance.value = "changed";
      expect(log).toEqual(["initial-with-addition", "changed-with-addition"]);
      expect(instance.actual).toEqual("changed-with-addition");
    });
    it("should not react to changes in observable if suspended", () => {
      myComputed.suspend();
      expect(instance.actual).toEqual("initial-with-addition");
      instance.value = "changed";
      expect(log).toEqual(["initial-with-addition"]);
      expect(instance.actual).toEqual("initial-with-addition");
    });
    it("should compute initial value even if computed was suspended on class initiation", () => {
      cleanAutorun();
      myComputed.suspend();
      instance = new TestClass();
      instance.value = "first";
      expect(instance.actual).toEqual("initial-with-addition");
      instance.value = "changed";
      expect(instance.actual).toEqual("initial-with-addition");
    });
    it("should emit last change to observable once reactivated", () => {
      myComputed.suspend();
      expect(instance.actual).toEqual("initial-with-addition");
      instance.value = "changed";
      expect(log).toEqual(["initial-with-addition"]);
      expect(instance.actual).toEqual("initial-with-addition");
      myComputed.unsuspend();
      expect(log).toEqual(["initial-with-addition", "changed-with-addition"]);
      expect(instance.actual).toEqual("changed-with-addition");
    });
  });
  describe("complex usage", () => {
    class ComplexTestClass {
      @observable
      value = "first";
      @observable
      value2 = "second";

      @computed
      get intermidiate() {
        return `${this.value}-${this.value2}`;
      }
      @myComputed
      get actual() {
        return `${this.intermidiate}-extra`;
      }
    }
    let instance: ComplexTestClass;
    let log: string[];
    let cleanAutorun: () => void;
    beforeEach(() => {
      instance = new ComplexTestClass();
      log = [];
      cleanAutorun = autorun(() => log.push(instance.actual));
    });
    afterEach(() => {
      cleanAutorun();
    });
    it("should react to changes in observable if not suspended", () => {
      expect(log).toEqual(["first-second-extra"]);
      expect(instance.actual).toEqual("first-second-extra");
      instance.value = "changed";
      expect(log).toEqual(["first-second-extra", "changed-second-extra"]);
      expect(instance.actual).toEqual("changed-second-extra");
    });
    it("should emit last change to observable once reactivated", () => {
      myComputed.suspend();
      expect(instance.actual).toEqual("first-second-extra");
      instance.value = "changed";
      expect(log).toEqual(["first-second-extra"]);
      expect(instance.actual).toEqual("first-second-extra");
      myComputed.unsuspend();
      expect(log).toEqual(["first-second-extra", "changed-second-extra"]);
      expect(instance.actual).toEqual("changed-second-extra");
    });
  });
});
