import {
  reaction,
  observable,
  IReactionPublic,
  IReactionDisposer,
  IReactionOptions
} from "mobx";

export interface ISuspendableReactionOptions extends IReactionOptions {
  /**
   * if true, a suspended reaction that is reactivated emits only the last value that changed.
   * otherwise all changes during suspension are sent in sequence
   * defaults to false
   */
  emitLastOnly?: boolean;
}
export type ISuspendableReactionDisposer = IReactionDisposer & {
  /**
   * suspend the reaction
   * calling this on an already suspended reaction has no effect
   */
  suspend: () => void;
  /**
   * unsuspend an existing reaction
   * calling this on an already working reaction has no effect
   */
  unsuspend: () => void;
};
const SUSPENDED = Symbol("SUSPENDED");
const UNSUSPENDED = Symbol("UNSUSPENDED");

/**
 * creates a suspendable reaction. Works the same as a regular reaction, however the disposer function that is returned
 * has two additional methods:
 *  - suspend: suspends the reaction. while suspended actions will not be called when watcher changes.
 *  - unsuspend: restores a suspended reaction. when a reaction is restored, the method calls the action callback
 *    with every change that occurred while the reaction was suspended. One call is made for each change in order of arrival.
 *
 ***EXAMPLE USAGE***
 * ```js
 * import {suspendableReaction} from "mobx-suspend";
 * import {observable} from "mobx";
 *
 * const value = observable.box("initial");
 * const reaction = suspendableReaction(()=>value.get(),v=>console.log(v))
 * reaction.suspend();
 * value.set("new value");
 * //the console.log action is not called
 * reaction.unsuspend()
 * //the console.log action is called with "new value"
 * ```
 *
 * CAUTION: Please note that due to the delayed nature of the callback when suspending, you need to return all relevant
 * data in the watch function, and use the argument inside the action function. Getting an observable value directly from
 * inside the action function will always return the most recent value and not the value at the time the event occurred.
 *
 * @param watch - same as the watch argument for mobx reaction
 * @param action - same as the action argument for mobx reaction
 * @param opts - same as the opts argument for mobx reaction with an additional options:
 *  -emitLastOnly - when set to true, only the last change is sent to the action when a suspended reaction is unsuspended
 */
export function suspendableReaction<T>(
  watch: (r: IReactionPublic) => T,
  action: (arg: T, r: IReactionPublic) => void,
  opts?: ISuspendableReactionOptions
) {
  //we use symbols here to make sure we can differentiate between a change caused by the watch function and
  // one caused by a change in the suspended observable.
  const suspended = observable.box<symbol>(UNSUSPENDED);
  opts = opts || {};
  let suspendedEvents: T[] = [];
  let prevSuspended = UNSUSPENDED;
  const disposer = reaction(
    r => {
      const result = watch(r);
      if (suspended.get() !== prevSuspended) {
        return suspended.get();
      }
      //we must return the result for the equality check to work
      return result;
    },
    (data, r) => {
      if (data === SUSPENDED || data === UNSUSPENDED) {
        prevSuspended = data;
        if (suspendedEvents.length > 0) {
          suspendedEvents.forEach(e => action(e, r));
          suspendedEvents = [];
        }
      } else {
        if (suspended.get() == SUSPENDED) {
          if (opts!.emitLastOnly) {
            suspendedEvents = [data as T];
          } else {
            suspendedEvents.push(data as T);
          }
        } else {
          action(data as T, r);
        }
      }
    },
    opts
  ) as ISuspendableReactionDisposer;
  disposer.suspend = () => suspended.set(SUSPENDED);
  disposer.unsuspend = () => suspended.set(UNSUSPENDED);
  return disposer;
}
