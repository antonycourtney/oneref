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

type Opaque<K, T> = T & { __TYPE__: K };

// This is our publicly visible interface
export type StateRef<T> = Opaque<'StateRef', {}>;

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
        // log.log("removeViewListener: removing listener id ", id)
        const listener = this.listeners[id];
        if (listener) {
            this.emitter.removeListener('change', listener);
        } else {
            console.warn('removeListener: No listener found for id ', id);
        }
        delete this.listeners[id];
    }
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

// ?? TODO: add optional cleanup handler:
// X<S> | [ X<S>, () => void]
export type InitialStateEffect<T> = (
    appState: T,
    stateRef: StateRef<T>
) => void | AsyncIterable<StateTransformer<T>>;
export type StateChangeEffect<T> = (appState: T, stateRef: StateRef<T>) => void;

async function stStreamReader<AS>(
    setState: StateUpdater<AS>,
    stream: AsyncIterable<StateTransformer<AS>>
): Promise<void> {
    for await (const st of stream) {
        setState(st);
    }
}

function isAsyncIterable<S>(
    val: void | AsyncIterable<StateTransformer<S>>
): val is AsyncIterable<StateTransformer<S>> {
    return typeof val !== 'undefined';
}

/*
 * An updated form of AppContainer that registers as a listener
 * on a free-standing StateRef
 */

export const refContainer = <AS extends {}, P extends {} = {}, B = {}>(
    stateRef: StateRef<AS>,
    Comp: React.ComponentType<P & StateRefProps<AS>>
): React.FunctionComponent<P> => props => {
    const ri = stateRef as StateRefImpl<AS>;
    const [appState, setAppState] = React.useState(ri.impl.getValue());
    React.useEffect(() => {
        ri.impl.addListener((st: AS) => {
            setAppState(st);
        });
    }, []);
    return <Comp {...props} appState={appState} stateRef={stateRef} />;
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
    view: ProjectFunc<OT, IT>,
    inject: InjectFunc<OT, IT>
): FocusFunc<OT, IT> => (o, outerRef) => {
    const ori = outerRef as StateRefImpl<OT>;
    const innerState = view(o);
    const innerRef = mkRef(innerState);
    const iri = innerRef as StateRefImpl<IT>;
    iri.impl.addListener((istate: IT) => {
        ori.impl.setValue(inject(ori.impl.getValue(), istate));
    });
    return [view(o), innerRef];
};

export { utils } from './utils';
