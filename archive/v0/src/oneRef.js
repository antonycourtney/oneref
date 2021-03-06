'use strict';

import EventEmitter from 'events';

/**
 * A mutable ref cell (modeled on SML's ref type) that extends
 * EventEmitter to enable registration of listeners to be notified
 * when the ref cell is updated
 *
 */
export class Ref extends EventEmitter {
  /**
   * construct a new RefCell with initial value v
   */
  constructor(v) {
    super();
    this._value = v;
  }

  /**
   * get the current value of this ref cell
   */
  getValue() {
    return this._value;
  }

  /**
   * update contents of this ref cell and notify any listeners
   */
  setValue(v) {
    this._value = v;
    this.emit("change");
  }

  /**
   * convenience utility to apply a state => state function and save the result.
   * returns the updated state.
   */
  update(f) {
    this.setValue(f(this.getValue()));
    return this._value;
  }
}

/**
 * Given a Ref<A> returns an 'updater' function.
 *
 * An updater is a function that takes an ((A) => A) update function (uf),
 * applies it to the current value in ref and sets ref to the result (which
 * will notify registered listeners).
 *
 *     refUpdater: (ref: Ref<A>) => (uf: (A) => A) => A
 *
 * We use Currying here so that we can partially apply refUpdater
 * to obtain an updater function that can passed down to actions.
 * Returns: the updated state, to enable composition (chaining) of
 * update actions.
 */
export const refUpdater = (ref) => (uf) => {
  const prevState = ref.getValue();
  const nextState = uf(prevState);
  ref.setValue(nextState);
  return nextState;
};
