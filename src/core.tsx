/*
 * Types and utilities for using the oneref pattern for state management
 */

import * as React from 'react';
import { utils } from './utils';

import * as events from 'events';

export type StateTransformer<T> = (s: T) => T;
// A StateTransformer with an additional calculated value:
export type StateTransformerAux<T, A> = (s: T) => [T, A];

export type StateUpdater<T> = (st: StateTransformer<T>) => void;
// This would also work:
//   type StateUpdater<T> = React.Dispatch<React.SetStateAction<T>>
// and is the type of setState returned from React's useState hook.
// But this also allows the dangerous form that just takes a new
// state; here we only accept a StateTransformer.

// a Promise resolution function for Promise<T>:
type Resolver<T> = (t: T) => void;

// We will make StateRef<T> opaque, using the intersection
// types technique described in:
// https://codemix.com/opaque-types-in-javascript/
//
type Opaque<K, T> = T & { __TYPE__: K };

// This is our publicly visible interface
// We'll also try to include an extra optional member, _inf,
// that is optional and always omitted, and is present
// just to help with type inference in client modules.
export type StateRef<T> = Opaque<'StateRef', { _inf?: T }>;

// A slightly more precise type for state change listener:
export type StateChangeListener<T> = (s: T) => void;

// hidden internal representation:
class RefImpl<T> {
    appState: T;
    emitter: events.EventEmitter;

    // We maintain our own array of listeners
    // to associate them with integer ids:
    listeners: StateChangeListener<T>[];

    constructor(v: T) {
        this.appState = v;
        this.emitter = new events.EventEmitter();
        this.listeners = [];
    }

    getValue(): T {
        return this.appState;
    }

    setValue(v: T) {
        this.appState = v;
        this.emitter.emit('change', v);
    }

    // convenience wrapper:
    updateValue(f: StateTransformer<T>) {
        this.setValue(f(this.getValue()));
    }

    addListener(listener: StateChangeListener<T>): number {
        // check to ensure this listener not yet registered:
        var idx = this.listeners.indexOf(listener);
        if (idx === -1) {
            idx = this.listeners.length;
            this.listeners.push(listener);
            this.emitter.on('change', listener);
        }

        return idx;
    }

    removeListener(id: number): void {
        const listener = this.listeners[id];
        if (listener) {
            this.emitter.removeListener('change', listener);
        } else {
            console.warn('removeListener: No listener found for id ', id);
        }
        delete this.listeners[id];
    }

    getListenerCount(): number {
        const count = this.listeners.reduce(x => x + 1, 0);
        return count;
    }
}

export function addStateChangeListener<T>(
    ref: StateRef<T>,
    listener: StateChangeListener<T>
): number {
    const ri = ref as StateRefImpl<T>;
    return ri.impl.addListener(listener);
}

export function removeStateChangeListener<T>(
    ref: StateRef<T>,
    listenerId: number
) {
    const ri = ref as StateRefImpl<T>;
    ri.impl.removeListener(listenerId);
}

// This is our private, internal only interface
// We could probably eliminate one level of indirection
// on the rhs of the intersection type, but the runtime cost should
// be negligible and it avoids confusion/ambiguity/collisions should
// we ever extend the public interface for StateRef<T>.
type StateRefImpl<T> = StateRef<T> & {
    impl: RefImpl<T>;
};

export function mkRef<T>(s0: T): StateRef<T> {
    let ref = { impl: new RefImpl<T>(s0) };
    return (ref as StateRefImpl<T>) as StateRef<T>;
}

// props passed in to a React app component by the
// OneRef appContainer:
export interface StateRefProps<T> {
    appState: T;
    stateRef: StateRef<T>;
}

/**
 * Get the current value of the state referred to by `ref`.
 * The name here is intended as a warning to the caller that this
 * will usually return different values when called on the same
 * ref cell. As such, this should never be called from pure / memoized
 * fucntions (such as React functional components); it should only
 * be called from side-effecting action handlers.
 * @param ref stateRef to be read
 */
export function mutableGet<T>(ref: StateRef<T>): T {
    const ri = ref as StateRefImpl<T>;
    return ri.impl.getValue();
}

/**
 *
 * Apply an update asynchronously to a stateRef.
 *
 * This function schedules an update to be applied to the given stateRef.
 * This will not result in any change to the state referenced by
 * stateRef within the current tick; this schedules an update to
 * apply on a subsequent tick.
 *
 * @param ref stateRef to update
 * @param tf `State => State` function to calculate new state from current state.
 *
 */
export function update<T>(ref: StateRef<T>, tf: StateTransformer<T>) {
    const ri = ref as StateRefImpl<T>;
    ri.impl.updateValue(tf);
}

export async function awaitableUpdate<T, A>(
    ref: StateRef<T>,
    tf: StateTransformerAux<T, A>
): Promise<[T, A]> {
    const ri = ref as StateRefImpl<T>;
    return new Promise(resolve => {
        const [nextState, aux] = tf(ri.impl.getValue());
        ri.impl.setValue(nextState);
        resolve([nextState, aux]);
    });
}

// A simple variant of awaitable update when we don't
// calculate an auxiliary value:
export async function awaitableUpdate_<T>(
    ref: StateRef<T>,
    tf: StateTransformer<T>
): Promise<T> {
    const [st, _] = await awaitableUpdate(ref, st => [tf(st), null]);
    return st;
}

/*
 * An updated form of AppContainer that registers as a listener
 * on a free-standing StateRef.
 * Returns pair of FunctionComponent and Listener id
 */

export const refContainer = <AS extends {}, P extends {} = {}>(
    stateRef: StateRef<AS>,
    Comp: React.ComponentType<P & StateRefProps<AS>>
): [React.FunctionComponent<P>, number] => {
    let innerListener: StateChangeListener<AS> | null = null;
    const listenerId = addStateChangeListener(stateRef, (st: AS) => {
        if (innerListener) {
            innerListener(st);
        }
    });
    const component: React.FunctionComponent<P> = (props: P) => {
        const ri = stateRef as StateRefImpl<AS>;
        const [appState, setAppState] = React.useState(ri.impl.getValue());
        React.useEffect(() => {
            innerListener = (st: AS) => {
                setAppState(st);
            };
        }, []);
        return <Comp {...props} appState={appState} stateRef={stateRef} />;
    };
    return [component, listenerId];
};

// ?? TODO: add optional cleanup handler:
// X<S> | [ X<S>, () => void]
export type AppStateEffect<T> = (appState: T, stateRef: StateRef<T>) => void;

/*
 * Simple helper for apps with a single top-level view:
 */
export const appContainer = <AS extends {}, P extends {} = {}>(
    initialState: AS,
    Comp: React.ComponentType<P & StateRefProps<AS>>,
    initEffect: AppStateEffect<AS> | null = null
): React.FunctionComponent<P> => {
    const ref = mkRef(initialState);
    if (initEffect != null) {
        initEffect(initialState, ref);
    }
    const [component, _] = refContainer<AS, P>(ref, Comp);
    return component;
};

/*
 * Helper for state composition:
 *
 * Given an Outer Type (OT) and Inner Type (IT), and functional setters/getters for how to project and inject the
 * inner type from/to the outer type, return a function that can be used in a Hooks context to obtain the
 * [current state, update] functions for the inner type from the outer type and its update function.
 */
type ProjectFunc<OT, IT> = (o: OT) => IT;
type InjectFunc<OT, IT> = (o: OT, i: IT) => OT; // i.e. functional update
type FocusFunc<OT, IT> = (o: OT, outerRef: StateRef<OT>) => [IT, StateRef<IT>];
export const focus = <OT extends {}, IT extends {}>(
    project: ProjectFunc<OT, IT>,
    inject: InjectFunc<OT, IT>
): FocusFunc<OT, IT> => (o, outerRef) => {
    const ori = outerRef as StateRefImpl<OT>;
    const innerState = project(o);
    const innerRef = mkRef(innerState);
    const iri = innerRef as StateRefImpl<IT>;
    iri.impl.addListener((istate: IT) => {
        ori.impl.setValue(inject(ori.impl.getValue(), istate));
    });
    return [project(o), innerRef];
};
