import { observable, computed } from "mobx";
export type suspendableComputedDecorator = PropertyDecorator & {
  suspend: () => void;
  unsuspend: () => void;
};

/**
 * creates a suspendable computed decorator.
 * this factory method create a decorator that functions identically to mobx's computed with two additional methods:
 *  - suspend: suspends the computation. When a computed getter is suspended it no longer updates when the watched
 *    observables change, and it returns the last known value. Reactions relying on this computed value, will not trigger.
 *  - unsuspend: restores a suspended computation. When a suspended computation is restored, and if watched observables
 *    changed, the computations will immediately update and trigger subscribed reactions with the most current computed
 *    value.
 *
 * Note that if you retrieve the value of a suspended computed getter for the first time, it will compute once to return
 * a real value, even though it was suspended.
 *
 **** EXAMPLE USAGE
 * ```js
 * import {observable,autorun,computed} from 'mobx';
 * import {suspendableComputed} from "mobx-suspend";
 *
 * const myComputed = suspendableComputed();
 *
 * class MyClass {
 *  @observable
 *  value = "initial";
 *  @myComputed
 *  get actual(){
 *    return `${this.value}-with-addition`
 *  }
 * }
 * const instance = new MyClass();
 * autorun(()=>console.log(instance.value))
 * myComputed.suspend();
 * instance.value = "first change";
 * // console.log is not called
 * instance.value = "second change";
 * //console.log is not called
 * myComputed.unsuspend();
 * //console.log is called once with "second change"
 * ```
 *
 * @returns a computed property decorator with suspend/unsuspend methods.
 */
export function suspendableComputed() {
  const suspended = observable.box(false);
  function computedWrapper(
    instance: any,
    propertyName: PropertyKey,
    descriptor: PropertyDescriptor,
    ...args: any[]
  ) {
    let cached: any;
    let calledOnce = false;
    const oldDescriptor = descriptor.get;
    descriptor.get = function() {
      if (!suspended.get() || !calledOnce) {
        calledOnce = true;
        //@ts-ignore
        cached = oldDescriptor.apply(this);
      }
      return cached;
    };
    //@ts-ignore
    return computed(instance, propertyName, descriptor, ...args);
  }
  computedWrapper.suspend = () => suspended.set(true);
  computedWrapper.unsuspend = () => suspended.set(false);
  return computedWrapper as suspendableComputedDecorator;
}
